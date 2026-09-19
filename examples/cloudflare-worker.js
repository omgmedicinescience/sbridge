import contextBundle from "../generated/context-bundle.json";
import { CBridgeCertifier, createHttpEvaluator } from "../src/index.js";
import { createCertifiedHandler } from "../src/cloudflare.js";

export default {
  async fetch(request, env, ctx) {
    const evaluator = createHttpEvaluator({
      endpoint: env.CBRIDGE_AI_ENDPOINT,
      apiKey: env.CBRIDGE_AI_API_KEY,
      provider: "approved-internal-ai",
      model: env.CBRIDGE_AI_MODEL,
      capabilities: {
        medicalData: env.CBRIDGE_MEDICAL_DATA_APPROVED === "true",
      },
    });

    const certifier = new CBridgeCertifier({
      bundle: contextBundle,
      evaluator,
      audit: async (decision) => {
        // Сохранять только decision/hash/versions. Raw payload не сохранять.
        console.log(
          JSON.stringify({
            traceId: decision.traceId,
            verdict: decision.verdict,
            bundleHash: decision.bundleHash,
            reasonCodes: decision.reasonCodes,
          }),
        );
      },
    });

    const handle = createCertifiedHandler({
      certifier,
      mode: env.CBRIDGE_MODE || "observe",
      resolveRoute: (incomingRequest) => {
        const url = new URL(incomingRequest.url);
        return {
          certify: url.pathname.startsWith("/api/"),
          routeId: url.pathname,
          channel: "api",
          sensitivity: url.pathname.startsWith("/api/symptom")
            ? "medical"
            : "standard",
        };
      },
      handle: async (incomingRequest) => {
        const url = new URL(incomingRequest.url);
        if (url.pathname === "/api/health") {
          return Response.json({ ok: true });
        }
        return env.ASSETS.fetch(incomingRequest);
      },
    });

    return handle(request, env, ctx);
  },
};
