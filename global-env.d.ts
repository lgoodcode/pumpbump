import type { User as SupabaseUser } from "@supabase/supabase-js";

export declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      /**
       * To determine if the build is happneing in the CI to prevent errors when
       * some env variables are not set
       */
      // CIRCLECI: string;
      // NEXT_PUBLIC_SUPABASE_URL: string;
      // NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      // SUPABASE_SERVICE_ROLE_KEY: string;
      // SUPABASE_PROJECT_ID: string;
      // SENTRY_PROJECT: string;
      // SENTRY_ORG: string;
      // NEXT_PUBLIC_SENTRY_DSN: string;
      // SENTRY_AUTH_TOKEN: string;
      // PLAID_ENV: string;
      // PLAID_CLIENT_NAME: string;
      // PLAID_CLIENT_ID: string;
      // PLAID_URL: string;
      // PLAID_SECRET: string;
      // PLAID_VERSION: string;
      // PLAID_REDIRECT_URI: string;
      // PLAID_WEBHOOK_URI: string;
      // SMTP2GO_API_KEY: string;
      // SMTP2GO_API_URL: string;
    }
  }

  export type User = SupabaseUser;

  export interface ErrorBoundaryProps {
    error: Error & { digest?: string };
    reset: () => void;
  }
}
