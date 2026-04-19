import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safety check for Vercel Build process
  if (!url || !anonKey) {
    // We return a 'mock' client during build time so Next.js doesn't crash.
    // In production, the environment variables will be there.
    console.warn("Supabase URL or Anon Key is missing. Check Vercel Environment Variables.");
  }

  return createBrowserClient(
    url ?? "", 
    anonKey ?? ""
  );
}