const VALID_DIRECTIONS = new Set(["inbound", "outbound"]);
const VALID_CHANNELS = new Set(["web", "api", "ai", "integration"]);

export function assertCertificationInput(input) {
  if (!input || typeof input !== "object") {
    throw new TypeError("Certification input должен быть объектом");
  }
  if (!VALID_DIRECTIONS.has(input.direction)) {
    throw new TypeError(`Неизвестный direction: ${input.direction}`);
  }
  if (!VALID_CHANNELS.has(input.channel)) {
    throw new TypeError(`Неизвестный channel: ${input.channel}`);
  }
  if (input.content === undefined) {
    throw new TypeError("Поле content обязательно");
  }
}

export function selectPolicies(bundle, direction, channel) {
  if (!bundle?.policies?.length) return [];
  return bundle.policies.filter((policy) => {
    const directionMatches =
      policy.direction === "both" || policy.direction === direction;
    const channelMatches =
      policy.channels.includes("*") || policy.channels.includes(channel);
    return directionMatches && channelMatches;
  });
}
