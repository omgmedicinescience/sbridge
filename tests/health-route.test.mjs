import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";
import {
  buildDemoHealthRoute,
  CBridgeCertifier,
  createHealthRouteEvaluator,
} from "../src/index.js";

const bundle = JSON.parse(
  readFileSync(resolve("generated/context-bundle.json"), "utf8"),
);

test("формирует базовый маршрут сразу после профиля", () => {
  const route = buildDemoHealthRoute({
    profile: {
      birthDate: "1984-04-18",
      sex: "м",
    },
  });

  assert.equal(route.kind, "demo-health-route");
  assert.equal(route.items[0].id, "base-checkup");
  assert.equal(route.completion, 0);
  assert.equal(route.processing.medicalDataSentToExternalAI, false);
});

test("формирует маршрут при частично заполненной анкете", () => {
  const route = buildDemoHealthRoute({
    profile: {
      birthDate: "1984-04-18",
      sex: "м",
    },
    completedBlocks: ["metrics", "lifestyle"],
    answers: {
      metrics: {
        height: "180",
        weight: "90",
        waist: "100",
        pressureKnown: "yes",
        systolic: "135",
        diastolic: "85",
      },
      lifestyle: {
        occupation: "Инженер",
        sport: "sometimes",
        nutrition: "mixed",
      },
    },
  });

  assert.equal(route.completion, 25);
  assert.equal(route.computed.bmi, 27.8);
  assert.ok(route.items.some((item) => item.id === "metrics-summary"));
  assert.ok(route.items.every((item) => item.source));
});

test("локальный cBridge допускает безопасный демонстрационный маршрут", async () => {
  const certifier = new CBridgeCertifier({
    bundle,
    evaluator: createHealthRouteEvaluator(),
  });
  const route = buildDemoHealthRoute({
    profile: {
      birthDate: "1984-04-18",
      sex: "м",
    },
    completedBlocks: ["metrics"],
  });
  const decision = await certifier.certify({
    direction: "outbound",
    channel: "web",
    content: route,
    metadata: {
      sensitivity: "medical",
      routeId: "demo://health-route",
      contentType: "application/json",
    },
  });

  assert.equal(decision.verdict, "allow");
  assert.ok(decision.reasonCodes.includes("LOCAL_SAFETY_CHECK_PASSED"));
});

test("локальный cBridge блокирует совет изменить лекарство", async () => {
  const certifier = new CBridgeCertifier({
    bundle,
    evaluator: createHealthRouteEvaluator(),
  });
  const route = buildDemoHealthRoute();
  route.items.push({
    id: "unsafe",
    title: "Отмените препарат",
    meta: "Небезопасный тест",
    source: "Нет",
    action: "Отменить",
  });
  const decision = await certifier.certify({
    direction: "outbound",
    channel: "web",
    content: route,
    metadata: {
      sensitivity: "medical",
      routeId: "demo://health-route",
      contentType: "application/json",
    },
  });

  assert.equal(decision.verdict, "block");
  assert.ok(decision.reasonCodes.includes("UNAPPROVED_MEDICATION_ADVICE"));
});
