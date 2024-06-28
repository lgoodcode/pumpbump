const requiredEnvList = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

// Skip checking environment variables if in local development or running on CI
if (
  process.env.NODE_ENV && process.env.NODE_ENV !== "development" &&
  !process.env.CI
) {
  requiredEnvList.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is not defined`);
    }

    console.log("✅", envVar, "is defined");
  });
}
