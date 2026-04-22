import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

async function extractTextFromImage(imageBase64: string): Promise<string> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  const extractedText = data.responses?.[0]?.fullTextAnnotation?.text || "";

  if (!extractedText) throw new Error("No text found in image");
  return extractedText;
}

export async function scanAndVerifyReceipt(imageBase64: string) {
  // Step 1 — Extract all text from the image using Google Vision OCR
  let extractedText: string;
  try {
    extractedText = await extractTextFromImage(imageBase64);
  } catch (err) {
    throw new Error("Could not read text from this image. Please upload a clearer screenshot.");
  }

  // Step 2 — Send extracted text to Groq for fraud analysis
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are a fraud detection expert for Nigerian small business vendors.
You will receive raw text extracted from a bank transfer receipt or SMS alert screenshot.
Your job is to extract payment details and detect fake alerts.

NIGERIAN BANKING CONTEXT:
- Common legitimate banks: GTBank, Access Bank, Zenith Bank, UBA, First Bank, Kuda, OPay, Moniepoint, Palmpay, Sterling, Fidelity
- Legitimate SMS alerts come from short codes like GTB, ACCESSBANK, ZENITH, UBA, OPAY — not regular phone numbers like 08012345678
- Legitimate receipts always contain: an amount, a transaction reference, sender name, date and time
- Amounts in Nigerian receipts are written as: 5,000.00 or 5000 or NGN 5,000
- "k" in informal contexts means thousand but bank receipts show full numbers

EXTRACT these fields from the text:
- amount: the transaction amount as a number (digits only, no currency symbol, no commas)
- bankName: the name of the bank or payment platform
- sender: the person or account that sent the money
- recipient: the person or account that received the money
- date: the transaction date and time exactly as shown
- reference: the transaction reference or session ID

FRAUD DETECTION — check for these red flags in the extracted text:
- Bank name is misspelled (e.g. "Zenithh Bank", "O-Pay", "Accces Bank", "GTB ank")
- Amount in words does not match amount in digits (e.g. "Five thousand" but digits show 50,000)
- Sender and recipient have the same name
- Transaction reference is missing, all zeros, or suspiciously short (less than 6 characters)
- SMS came from a regular phone number (10-11 digits) instead of a bank short code
- Date is missing or in an unusual format
- Amount is 0 or negative
- Text contains grammatical errors typical of fake alerts (e.g. "Transcation" instead of "Transaction")
- Multiple different amounts appear in the text with no clear indication which is the real one

VERDICT RULES — be decisive:
- REAL: receipt text looks complete and legitimate, no red flags
- SUSPICIOUS: 1 to 2 minor issues found
- LIKELY_FAKE: 3 or more red flags, or any single severe red flag like mismatched amount in words vs digits

Return ONLY a valid JSON object with no markdown, no explanation, no extra text:
{
  "amount": number or null,
  "bankName": string or null,
  "sender": string or null,
  "recipient": string or null,
  "date": string or null,
  "reference": string or null,
  "verdict": "REAL" or "SUSPICIOUS" or "LIKELY_FAKE",
  "isFakeProbability": number between 0 and 100,
  "redFlags": array of strings describing each issue found,
  "rawTextSummary": one sentence summary of what the receipt shows
}`,
      },
      {
        role: "user",
        content: `Here is the raw text extracted from the receipt image. Analyze it:\n\n${extractedText}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) throw new Error("AI returned invalid response");

  const parsed = JSON.parse(jsonMatch[0]);

  // Safety check — if amount is 0 or null and no bank name, something went wrong
  if (!parsed.amount && !parsed.bankName) {
    parsed.verdict = "SUSPICIOUS";
    parsed.isFakeProbability = 60;
    if (!parsed.redFlags) parsed.redFlags = [];
    parsed.redFlags.push("Could not clearly read payment details from this image");
  }

  return parsed;
}