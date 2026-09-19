export function createCallbackEvaluator({
  provider,
  model,
  capabilities = {},
  evaluate,
}) {
  if (typeof evaluate !== "function") {
    throw new TypeError("evaluate должен быть функцией");
  }
  return {
    provider,
    model,
    capabilities,
    evaluate,
  };
}
