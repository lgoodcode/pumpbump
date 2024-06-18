import bundleAnalyzer from '@next/bundle-analyzer';
import { withSentryConfig } from '@sentry/nextjs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        // Proxy tunnel the Sentry requests through nextjs server to avoid ad-blockers
        source: '/sentry-tunnel/:path*',
        // If in CI, use a placeholder URL
        destination: process.env.CI
          ? '/sentry-tunnel'
          : `https://${
              process.env.NEXT_PUBLIC_SENTRY_DSN.split('@')[1].split('/')[0]
            }/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: 'lgood',
    project: 'pumpbump',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Route the sentry requests to the /sentry proxy route to avoid ad-blockers
    tunnelRoute: '/sentry-tunnel',

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    // tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  })
);
