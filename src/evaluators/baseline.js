const INJECTION_PATTERNS = [
  /ignore (all|any|the|previous) (rules|instructions)/i,
  /игнорируй (все|предыдущие) (правила|инструкции)/i,
  /reveal (the )?(system prompt|policy|hidden instructions)/i,
  /покажи (системный промпт|скрытые инструкции|внутренние политики)/i,
];

const SECRET_PATTERNS = [
  /\[REDACTED_(?:BEARER_TOKEN|SECRET|PRIVATE_KEY|FIELD)\]/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const DIRECT_IDENTIFIER_PATTERNS = [
  /\[REDACTED_EMAIL\]/,
  /\[REDACTED_PHONE\]/,
];

function stringify(content) {
  return typeof content === "string" ? content : JSON.stringify(content);
}

function violation(policyId, code, severity, message) {
  return { policyId, code, severity, message };
}

export function createBaselineEvaluator() {
  return {
    provider: "cbridge-baseline",
    model: "deterministic-v1",
    capabilities: {
      medicalData: false,
    },
    async evaluate(envelope) {
      const content = stringify(envelope.content);
      if (!content.trim() || content === "{}" || content === "[]") {
        return {
          verdict: "block",
          riskScore: 0.8,
          qualityScore: 0,
          reasonCodes: ["EMPTY_CONTENT"],
          violations: [
            violation(
              "core-quality",
              "EMPTY_CONTENT",
              "high",
              "Контент пуст или не содержит полезных данных.",
            ),
          ],
        };
      }

      if (
        envelope.direction === "inbound" &&
        INJECTION_PATTERNS.some((pattern) => pattern.test(content))
      ) {
        return {
          verdict: "block",
          riskScore: 0.98,
          qualityScore: 0.1,
          reasonCodes: ["PROMPT_INJECTION"],
          violations: [
            violation(
              "inbound-user-content",
              "PROMPT_INJECTION",
              "critical",
              "Входящий контент пытается изменить системные инструкции.",
            ),
          ],
        };
      }

      if (SECRET_PATTERNS.some((pattern) => pattern.test(content))) {
        return {
          verdict: "block",
          riskScore: 1,
          qualityScore: 0,
          reasonCodes: ["SECRET_EXPOSURE"],
          violations: [
            violation(
              "privacy-secrets",
              "SECRET_EXPOSURE",
              "critical",
              "Контент содержит секрет или credential.",
            ),
          ],
        };
      }

      if (
        envelope.direction === "outbound" &&
        DIRECT_IDENTIFIER_PATTERNS.some((pattern) => pattern.test(content))
      ) {
        return {
          verdict: "block",
          riskScore: 0.95,
          qualityScore: 0.2,
          reasonCodes: ["DIRECT_IDENTIFIER_EXPOSURE"],
          violations: [
            violation(
              "privacy-secrets",
              "DIRECT_IDENTIFIER_EXPOSURE",
              "critical",
              "Исходящий контент содержит прямой идентификатор.",
            ),
          ],
        };
      }

      return {
        verdict: "allow",
        riskScore: 0.05,
        qualityScore: 0.9,
        reasonCodes: ["BASELINE_PASS"],
        violations: [],
      };
    },
  };
}
