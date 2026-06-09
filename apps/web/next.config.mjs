/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workout-pro/shared'],
  // Ensure Vercel's output file tracer includes the compiled shared package
  outputFileTracingIncludes: {
    '/**': ['../../packages/shared/dist/**/*'],
  },
};

export default nextConfig;
