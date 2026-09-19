import { buildEvaluationEnvelope } from "./evaluation-envelope.js";
import { sha256, stableStringify } from "./hash.js";
import { assertCertificationInput, selectPolicies } from "./policies.js";
import { redactValue } from "./redact.js";

const VERDICTS = new Set(["allow", "block", "review", "sanitize"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function clampScore(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(1, Math.max(0, number))
    : fallback;
}

function cleanString(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, 500) : fallback;
}

function normalizeViolations(violations) {
  if (!Array.isArray(violations)) return [];
  return violations.slice(0, 50).map((item) => ({
    policyId: cleanString(item?.policyId, "unknown"),
    code: cleanString(item?.code, "UNSPECIFIED"),
    severity: SEVERITIES.has(item?.severity) ? item.severity : "medium",
    message: cleanString(item?.message, "Нарушение политики."),
  }));
}

function normalizeEvaluation(result) {
  const verdict = VERDICTS.has(result?.verdict) ? result.verdict : "review";
  const normalized = {
    verdict,
    riskScore: clampScore(result?.riskScore, 0.5),
    qualityScore: clampScore(result?.qualityScore, 0.5),
    reasonCodes: Array.isArray(result?.reasonCodes)
      ? result.reasonCodes.slice(0, 30).map((code) => cleanString(code))
      : ["MALFORMED_EVALUATOR_RESPONSE"],
    violations: normalizeViolations(result?.violations),
  };
  if (verdict === "sanitize" && result?.sanitizedContent !== undefined) {
    normalized.sanitizedContent = result.sanitizedContent;
  }
  if (verdict === "sanitize" && result?.sanitizedContent === undefined) {
    normalized.verdict = "review";
    normalized.reasonCodes.push("MISSING_SANITIZED_CONTENT");
  }
  return normalized;
}

function enforcePolicyModes(result, policies) {
  const policyModes = new Map(
    policies.map((policy) => [policy.id, policy.mode]),
  );
  const unknownPolicy = result.violations.some(
    (violation) =>
      violation.policyId !== "cbridge-runtime" &&
      !policyModes.has(violation.policyId),
  );
  const blockingViolation = result.violations.some(
    (violation) =>
      policyModes.get(violation.policyId) === "blocking" &&
      ["high", "critical"].includes(violation.severity),
  );

  if (blockingViolation) {
    result.verdict = "block";
    if (!result.reasonCodes.includes("BLOCKING_POLICY_VIOLATION")) {
      result.reasonCodes.push("BLOCKING_POLICY_VIOLATION");
    }
  } else if (unknownPolicy && result.verdict === "allow") {
    result.verdict = "review";
    result.reasonCodes.push("UNKNOWN_POLICY_REFERENCE");
  }
  return result;
}

function failVerdict(failMode) {
  if (failMode === "open") return "allow";
  if (failMode === "closed") return "block";
  return "review";
}

function withTimeout(promiseFactory, timeoutMs) {
  const controller = new AbortController();
  let timeout;
  const promise = Promise.resolve().then(() =>
    promiseFactory(controller.signal),
  );
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort("cBridge timeout");
      reject(new Error("CBRIDGE_EVALUATOR_TIMEOUT"));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() =>
    clearTimeout(timeout),
  );
}

export class CBridgeCertifier {
  constructor({
    bundle,
    evaluator,
    audit,
    timeoutMs = 4000,
    maxContentBytes = 64 * 1024,
    failModes = {},
  }) {
    if (!bundle?.bundleHash || !Array.isArray(bundle?.policies)) {
      throw new TypeError("Нужен валидный cBridge context bundle");
    }
    if (!evaluator?.evaluate) {
      throw new TypeError("Нужен evaluator");
    }
    this.bundle = bundle;
    this.evaluator = evaluator;
    this.audit = audit;
    this.timeoutMs = timeoutMs;
    this.maxContentBytes = maxContentBytes;
    this.failModes = {
      inbound: "review",
      outbound: "closed",
      ...failModes,
    };
  }

  async certify(input) {
    assertCertificationInput(input);
    const startedAt = Date.now();
    const createdAt = new Date().toISOString();
    const traceId = input.traceId || crypto.randomUUID();
    const policies = selectPolicies(
      this.bundle,
      input.direction,
      input.channel,
    );
    const serialized = stableStringify(input.content);
    const payloadHash = await sha256(serialized);
    const sensitivity = input.metadata?.sensitivity || "standard";

    const base = {
      schemaVersion: 1,
      traceId,
      direction: input.direction,
      channel: input.channel,
      policies: policies.map(({ id, version, hash }) => ({
        id,
        version,
        hash,
      })),
      bundleHash: this.bundle.bundleHash,
      payloadHash,
      evaluator: {
        provider: this.evaluator.provider || "unknown",
        model: this.evaluator.model || "unknown",
      },
      createdAt,
    };

    let result;
    let failModeUsed = false;
    let evaluatedByModel = false;

    if (!policies.length) {
      failModeUsed = true;
      result = {
        verdict: "block",
        riskScore: 1,
        qualityScore: 0,
        reasonCodes: ["NO_APPLICABLE_POLICY"],
        violations: [
          {
            policyId: "cbridge-runtime",
            code: "NO_APPLICABLE_POLICY",
            severity: "critical",
            message: "Для потока не найдена применимая политика.",
          },
        ],
      };
    } else if (new TextEncoder().encode(serialized).byteLength > this.maxContentBytes) {
      failModeUsed = true;
      result = {
        verdict: "block",
        riskScore: 1,
        qualityScore: 0,
        reasonCodes: ["CONTENT_TOO_LARGE"],
        violations: [
          {
            policyId: "cbridge-runtime",
            code: "CONTENT_TOO_LARGE",
            severity: "critical",
            message: "Контент превышает допустимый размер.",
          },
        ],
      };
    } else if (sensitivity === "unknown") {
      failModeUsed = true;
      result = {
        verdict: "review",
        riskScore: 0.8,
        qualityScore: 0.5,
        reasonCodes: ["UNCLASSIFIED_DATA_SENSITIVITY"],
        violations: [
          {
            policyId: "privacy-secrets",
            code: "UNCLASSIFIED_DATA_SENSITIVITY",
            severity: "high",
            message: "Для маршрута не определён класс чувствительности данных.",
          },
        ],
      };
    } else if (sensitivity === "secret") {
      failModeUsed = true;
      result = {
        verdict: "block",
        riskScore: 1,
        qualityScore: 0,
        reasonCodes: ["SECRET_DATA_NOT_ALLOWED"],
        violations: [
          {
            policyId: "privacy-secrets",
            code: "SECRET_DATA_NOT_ALLOWED",
            severity: "critical",
            message: "Секретные данные запрещено передавать semantic evaluator.",
          },
        ],
      };
    } else if (
      sensitivity === "personal" &&
      this.evaluator.capabilities?.personalData !== true
    ) {
      failModeUsed = true;
      result = {
        verdict: "review",
        riskScore: 0.85,
        qualityScore: 0.5,
        reasonCodes: ["EVALUATOR_NOT_APPROVED_FOR_PERSONAL_DATA"],
        violations: [
          {
            policyId: "privacy-secrets",
            code: "EVALUATOR_NOT_APPROVED_FOR_PERSONAL_DATA",
            severity: "high",
            message:
              "Evaluator не допущен к обработке персональных данных.",
          },
        ],
      };
    } else if (
      sensitivity === "medical" &&
      this.evaluator.capabilities?.medicalData !== true
    ) {
      failModeUsed = true;
      result = {
        verdict: "review",
        riskScore: 0.9,
        qualityScore: 0.5,
        reasonCodes: ["EVALUATOR_NOT_APPROVED_FOR_MEDICAL_DATA"],
        violations: [
          {
            policyId: "medical-safety",
            code: "EVALUATOR_NOT_APPROVED_FOR_MEDICAL_DATA",
            severity: "high",
            message:
              "Evaluator не допущен к обработке медицинских данных.",
          },
        ],
      };
    } else {
      const redactedContent = redactValue(input.content);
      const envelope = buildEvaluationEnvelope({
        direction: input.direction,
        channel: input.channel,
        content: redactedContent,
        metadata: {
          sensitivity,
          routeId: input.metadata?.routeId,
          contentType: input.metadata?.contentType,
        },
        policies,
      });

      try {
        result = await withTimeout(
          (signal) => this.evaluator.evaluate(envelope, { signal }),
          this.timeoutMs,
        );
        evaluatedByModel = true;
      } catch {
        failModeUsed = true;
        const failMode =
          this.failModes[`${input.direction}:${input.channel}`] ||
          this.failModes[input.direction] ||
          "closed";
        result = {
          verdict: failVerdict(failMode),
          riskScore: failMode === "open" ? 0.5 : 1,
          qualityScore: 0,
          reasonCodes: ["EVALUATOR_UNAVAILABLE"],
          violations: [
            {
              policyId: "cbridge-runtime",
              code: "EVALUATOR_UNAVAILABLE",
              severity: failMode === "open" ? "medium" : "critical",
              message: "AI evaluator недоступен; применён fail-mode.",
            },
          ],
        };
      }
    }

    const normalizedEvaluation = normalizeEvaluation(result);
    const normalizedResult = evaluatedByModel
      ? enforcePolicyModes(normalizedEvaluation, policies)
      : normalizedEvaluation;
    const decision = {
      ...base,
      ...normalizedResult,
      durationMs: Date.now() - startedAt,
      failModeUsed,
    };

    if (this.audit) {
      await this.audit(decision);
    }
    return decision;
  }
}
