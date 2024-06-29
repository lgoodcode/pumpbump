const requiredEnvList = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SERVER_URL',
  'AUTH_TOKEN',
];

if (process.env.NODE_ENV === 'production' && !process.env.CI) {
  requiredEnvList.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`${envVar} is not defined`);
    }

    console.log('✅', envVar, 'is defined');
  });
}
