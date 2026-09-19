function jsonResponse(body, status, traceId) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-cbridge-trace-id": traceId,
    },
  });
}

async function readRequestContent(request, maxBytes) {
  const contentType = request.headers.get("content-type") || "";
  const clone = request.clone();
  if (contentType.includes("application/json")) {
    const text = await clone.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error("CONTENT_TOO_LARGE");
    }
    return text ? JSON.parse(text) : {};
  }
  if (contentType.startsWith("text/")) {
    const text = await clone.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new Error("CONTENT_TOO_LARGE");
    }
    return text;
  }
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    note: "Body не является JSON/text и не передан semantic evaluator.",
  };
}

async function readResponseContent(response, maxBytes) {
  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes("application/json") &&
    !contentType.startsWith("text/")
  ) {
    return null;
  }
  const text = await response.clone().text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new Error("CONTENT_TOO_LARGE");
  }
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

function defaultResolveRoute(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    return {
      certify: true,
      routeId: url.pathname,
      sensitivity: "unknown",
    };
  }
  return {
    certify: false,
    reason: "build-certified-static-asset",
  };
}

const ALWAYS_ENFORCED_CODES = new Set([
  "SECRET_EXPOSURE",
  "DIRECT_IDENTIFIER_EXPOSURE",
  "SECRET_DATA_NOT_ALLOWED",
  "CONTENT_TOO_LARGE",
]);

function mustEnforce(decision) {
  return (
    decision.verdict === "block" &&
    decision.reasonCodes.some((code) => ALWAYS_ENFORCED_CODES.has(code))
  );
}

export function createCertifiedHandler({
  certifier,
  handle,
  resolveRoute = defaultResolveRoute,
  mode = "observe",
  maxContentBytes = 64 * 1024,
  exposeDecisionHeaders = false,
}) {
  if (!certifier?.certify) throw new TypeError("certifier обязателен");
  if (typeof handle !== "function") throw new TypeError("handle обязателен");
  if (!["observe", "enforce"].includes(mode)) {
    throw new TypeError(`Неизвестный cBridge mode: ${mode}`);
  }

  return async function certifiedHandler(request, env, ctx) {
    const route = await resolveRoute(request, env);
    if (!route?.certify) return handle(request, env, ctx);

    let inboundContent;
    try {
      inboundContent = await readRequestContent(request, maxContentBytes);
    } catch {
      return jsonResponse(
        {
          error: "Запрос не прошёл техническую проверку.",
          code: "CBRIDGE_INVALID_REQUEST",
        },
        413,
        crypto.randomUUID(),
      );
    }

    const inbound = await certifier.certify({
      direction: "inbound",
      channel: route.channel || "api",
      content: {
        method: request.method,
        path: new URL(request.url).pathname,
        query: Object.fromEntries(new URL(request.url).searchParams),
        body: inboundContent,
      },
      metadata: {
        routeId: route.routeId,
        sensitivity: route.sensitivity || "standard",
        contentType: request.headers.get("content-type"),
      },
    });

    if (
      (mode === "enforce" &&
        ["block", "review"].includes(inbound.verdict)) ||
      mustEnforce(inbound)
    ) {
      return jsonResponse(
        {
          error:
            inbound.verdict === "review"
              ? "Запрос направлен на дополнительную проверку."
              : "Запрос не соответствует правилам безопасности.",
          code: `CBRIDGE_${inbound.verdict.toUpperCase()}`,
        },
        inbound.verdict === "review" ? 503 : 422,
        inbound.traceId,
      );
    }

    const response = await handle(request, env, ctx);
    let outboundContent;
    try {
      outboundContent = await readResponseContent(response, maxContentBytes);
    } catch {
      return jsonResponse(
        {
          error: "Ответ системы не прошёл проверку.",
          code: "CBRIDGE_RESPONSE_TOO_LARGE",
        },
        502,
        inbound.traceId,
      );
    }

    if (outboundContent === null) return response;

    const outbound = await certifier.certify({
      traceId: inbound.traceId,
      direction: "outbound",
      channel: route.channel || "api",
      content: outboundContent,
      metadata: {
        routeId: route.routeId,
        sensitivity: route.sensitivity || "standard",
        contentType: response.headers.get("content-type"),
      },
    });

    if (
      (mode === "enforce" &&
        ["block", "review"].includes(outbound.verdict)) ||
      mustEnforce(outbound)
    ) {
      return jsonResponse(
        {
          error: "Ответ системы остановлен контуром качества.",
          code: `CBRIDGE_${outbound.verdict.toUpperCase()}`,
        },
        502,
        outbound.traceId,
      );
    }

    if (
      mode === "enforce" &&
      outbound.verdict === "sanitize" &&
      outbound.sanitizedContent !== undefined
    ) {
      const isJson =
        response.headers.get("content-type")?.includes("application/json") &&
        typeof outbound.sanitizedContent !== "string";
      return new Response(
        isJson
          ? JSON.stringify(outbound.sanitizedContent)
          : String(outbound.sanitizedContent),
        {
          status: response.status,
          headers: response.headers,
        },
      );
    }

    const headers = new Headers(response.headers);
    headers.set("x-cbridge-trace-id", outbound.traceId);
    if (exposeDecisionHeaders) {
      headers.set("x-cbridge-verdict", outbound.verdict);
      headers.set("x-cbridge-inbound-verdict", inbound.verdict);
      headers.set("x-cbridge-outbound-verdict", outbound.verdict);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
