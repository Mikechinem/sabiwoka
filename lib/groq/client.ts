import Groq from "groq-sdk";

// Initialize the Groq client
export const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY 
});

// Set the global model here so you only change it once for the whole app
export const GROQ_MODEL = "llama-3.3-70b-versatile";