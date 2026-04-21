import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard Shadcn helper to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Your WhatsApp helper (keep this here so it's globally available)
 */
export * from "./whatsapp/deeplink";