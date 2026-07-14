/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Keep the Swiss Ephemeris WASM package out of the webpack server bundle so
  // it's require()'d at runtime from node_modules (its Emscripten loader and
  // .wasm binary don't survive bundling).
  serverExternalPackages: ["sweph-wasm"],

  // Trace the WASM binary AND the Swiss `.se1` data files into the serverless
  // function. We read them with fs at runtime, which the tracer can't detect
  // statically. We ship only the two files covering 1800–2400 AD (main planets
  // + Moon, ~1.8 MB) — not the full multi-hundred-MB ephemeris set.
  outputFileTracingIncludes: {
    "/api/readings": [
      "./node_modules/sweph-wasm/dist/wasm/swisseph.wasm",
      "./node_modules/sweph-wasm/dist/ephe/sepl_18.se1",
      "./node_modules/sweph-wasm/dist/ephe/semo_18.se1",
    ],
  },
};

export default nextConfig;
