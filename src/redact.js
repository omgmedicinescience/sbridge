const REDACTIONS = [
  {
    label: "BEARER_TOKEN",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/gi,
  },
  {
    label: "EMAIL",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    label: "PHONE",
    pattern: /(?<!\d)(?:\+?\d[\s().-]*){10,15}(?!\d)/g,
  },
  {
    label: "SECRET",
    pattern:
      /\b(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{8,}["']?/gi,
  },
  {
    label: "PRIVATE_KEY",
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
];

export function redactString(value) {
  return REDACTIONS.reduce(
    (result, { label, pattern }) =>
      result.replace(pattern, `[REDACTED_${label}]`),
    value,
  );
}

export function redactValue(value, depth = 0) {
  if (depth > 12) return "[REDACTED_MAX_DEPTH]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|secret|token|cookie|authorization|api.?key/i.test(key)
          ? "[REDACTED_FIELD]"
          : redactValue(item, depth + 1),
      ]),
    );
  }
  return value;
}
