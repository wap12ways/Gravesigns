/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Claude prompts live in src/prompts/*.md and are read from disk at
  // runtime so they can be edited without touching code. Vercel's file
  // tracing does not see fs.readFileSync paths built at runtime, so name
  // them explicitly here.
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/prompts/**/*"],
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
