import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY });

export async function generateLeadFollowUp(
  customerName: string, 
  item: string,
  notes?: string
) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a high-energy, friendly Nigerian vendor. 
        Your goal is to follow up with a potential customer who showed interest in an item.
        - Use "Sabi" vendor vibes (e.g., "Blessings," "Top quality," "Don't miss out").
        - Keep it very short and conversational.
        - Use Nigerian English.
        - Make it  a standard follow up message style that speak to high income earning nigerian`
        
      },
      {
        role: "user",
        content: `Customer Name: ${customerName}. 
        Item they liked: ${item}. 
        Extra info: ${notes || 'No extra notes'}. 
        Write a WhatsApp nudge.`
      }
    ],
    model: "llama-3.3-70b-versatile",
  });

  return completion.choices[0]?.message?.content || "";
}