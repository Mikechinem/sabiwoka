import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPageUI from "@/components/shared/LandingPageUI";

export default async function RootPage() {
  const supabase = await createClient();
  
  // 1. Check if the user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If logged in, skip the landing page and go to the app
  if (user) {
    redirect("/dashboard");
  }

  // 3. If NOT logged in, show the landing page component
  return <LandingPageUI />;
}