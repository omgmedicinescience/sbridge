export function createHttpEvaluator({
  endpoint,
  apiKey,
  provider = "internal-http",
  model = "configured-by-endpoint",
  capabilities = {},
  fetchImpl = fetch,
  headers = {},
}) {
  if (!endpoint) throw new TypeError("endpoint обязателен");

  return {
    provider,
    model,
    capabilities,
    async evaluate(envelope, { signal } = {}) {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
          ...headers,
        },
        body: JSON.stringify(envelope),
        signal,
      });

      if (!response.ok) {
        throw new Error(`AI evaluator вернул HTTP ${response.status}`);
      }
      return response.json();
    },
  };
}
