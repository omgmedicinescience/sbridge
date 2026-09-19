import assert from "node:assert/strict";
import test from "node:test";
import { createOpenAIResponsesEvaluator } from "../src/index.js";

const envelope = {
  task: "cbridge.certify.v1",
  policies: [{ id: "core-quality", content: "Проверяй качество." }],
  content: { message: "Обычный запрос" },
};

test("OpenAI adapter использует Responses API и строгую JSON Schema", async () => {
  let capturedRequest;
  const evaluator = createOpenAIResponsesEvaluator({
    apiKey: "test-key",
    model: "gpt-test",
    fetchImpl: async (endpoint, request) => {
      capturedRequest = { endpoint, request };
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  verdict: "allow",
                  riskScore: 0.1,
                  qualityScore: 0.9,
                  reasonCodes: ["CONTENT_ACCEPTABLE"],
                  violations: [],
                  sanitizedContent: null,
                }),
              },
            ],
          },
        ],
      });
    },
  });

  const decision = await evaluator.evaluate(envelope);
  const body = JSON.parse(capturedRequest.request.body);

  assert.equal(capturedRequest.endpoint, "https://api.openai.com/v1/responses");
  assert.equal(capturedRequest.request.headers.authorization, "Bearer test-key");
  assert.equal(body.model, "gpt-test");
  assert.equal(body.store, false);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.strict, true);
  assert.equal(decision.verdict, "allow");
});

test("OpenAI adapter переводит refusal в недоступность evaluator", async () => {
  const evaluator = createOpenAIResponsesEvaluator({
    apiKey: "test-key",
    fetchImpl: async () =>
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "Cannot comply" }],
          },
        ],
      }),
  });

  await assert.rejects(
    evaluator.evaluate(envelope),
    /OPENAI_EVALUATOR_REFUSAL/,
  );
});
