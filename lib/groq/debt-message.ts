import Groq from "groq-sdk";

const groq = new Groq({ 
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY 
});

export async function generateDebtFollowUp(
  customerName: string, 
  amount: number, 
  item: string
) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a polite but firm Nigerian business owner. Use a mix of English and light Pidgin (Abeg, How far). The goal is to get paid for a debt without being rude."
      },
      {
        role: "user",
        content: `Customer: ${customerName}. Amount Owed: ₦${amount.toLocaleString()}. Item: ${item}. Write a short WhatsApp nudge.`
      }
    ],
    model: "llama-3.3-70b-versatile",
  });

  return completion.choices[0]?.message?.content || "";
}