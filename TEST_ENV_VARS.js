// Quick test to verify environment variables are accessible
// Run this in your browser console at https://www.vnrscans.com/

console.log("=== ENVIRONMENT VARIABLE TEST ===");
console.log("Testing if Supabase env vars are accessible...\n");

// Check import.meta.env (Vite client-side)
if (typeof import !== 'undefined' && import.meta && import.meta.env) {
  console.log("✅ import.meta.env exists");
  console.log("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL ? "✅ SET" : "❌ MISSING");
  console.log("VITE_SUPABASE_PUBLISHABLE_KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✅ SET" : "❌ MISSING");
  console.log("VITE_SUPABASE_PROJECT_ID:", import.meta.env.VITE_SUPABASE_PROJECT_ID ? "✅ SET" : "❌ MISSING");
} else {
  console.log("❌ import.meta.env not accessible (normal in browser console)");
}

// Check if Supabase client is initialized
console.log("\n=== SUPABASE CLIENT TEST ===");
try {
  // Try to access the supabase client
  console.log("Attempting to import supabase client...");
  console.log("Note: This might fail in console - that's okay");
  console.log("The real test is whether the page loads without 500 errors");
} catch (e) {
  console.log("❌ Error:", e.message);
}

console.log("\n=== WHAT TO CHECK ===");
console.log("1. Does the page load without 500 errors? (Main indicator)");
console.log("2. Check Network tab - are there failed requests?");
console.log("3. Any red error messages in console?");
console.log("4. If you see 'Missing Supabase environment variable', env vars not deployed yet");

console.log("\n=== EXPECTED IN VERCEL ===");
console.log("Environment variables should be:");
console.log("- VITE_SUPABASE_URL = https://edvqhmvqbtujzcfqkrbe.supabase.co");
console.log("- VITE_SUPABASE_PUBLISHABLE_KEY = sb_publishable_...");
console.log("- VITE_SUPABASE_PROJECT_ID = edvqhmvqbtujzcfqkrbe");
console.log("\nAll 3 must have Production, Preview, and Development checked!");
