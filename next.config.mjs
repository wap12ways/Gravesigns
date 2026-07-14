/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep the Swiss Ephemeris WASM package out of the webpack server bundle so
  // it's require()'d at runtime from node_modules (its Emscripten loader and
  // .wasm binary don't survive bundling).
  serverExternalPackages: ["sweph-wasm"],

  // Ensure the .wasm binary is traced into the serverless function. We read it
  // with fs at runtime, which the tracer can't detect statically. We do NOT
  // ship the multi-hundred-MB `.se1` data files — Moshier mode needs none.
  outputFileTracingIncludes: {
    "/api/readings": ["./node_modules/sweph-wasm/dist/wasm/swisseph.wasm"],
  },
  outputFileTracingExcludes: {
    "*": ["./node_modules/sweph-wasm/dist/ephe/**"],
  },
};

export default nextConfig;
