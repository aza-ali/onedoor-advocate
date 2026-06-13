/** @type {import('next').NextConfig} */
const nextConfig = {
  // The preserved engine reads config/rules.json + corpus/*.md + fixtures via fs at runtime.
  // Trace those into the server bundle so they ship to Cloud Run / Firebase App Hosting.
  outputFileTracingIncludes: {
    "/api/**": ["./config/**", "./corpus/**", "./schema/**", "./test/fixtures/**", "./src/**"],
    "/mcp": ["./config/**", "./schema/**", "./src/**"],
    "/healthz": ["./config/**", "./src/**"],
    "/.well-known/agent-card.json": ["./schema/**", "./src/**"],
  },
};
export default nextConfig;
