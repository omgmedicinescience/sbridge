import assert from "node:assert/strict";
import test from "node:test";

import {
  SYMPTOM_GUIDE_VERIFIED_SOURCE,
  VERIFIED_SYMPTOM_GUIDE_SCHEMES,
} from "../src/symptom-guide-verified-data.js";

const allowedTargets = new Set(["group", "next", "result", "transition"]);

test("verified-каталог привязан к контрольной сумме исходного PDF", () => {
  assert.equal(
    SYMPTOM_GUIDE_VERIFIED_SOURCE.sha256,
    "c5fb9e18830064372481981746ff7aefcb1e765f08f64a5838c61e69ee849659",
  );
});

test("каждый проверенный узел имеет страницу источника и существующий переход", () => {
  for (const scheme of Object.values(VERIFIED_SYMPTOM_GUIDE_SCHEMES)) {
    const firstOrderIds = new Set(scheme.firstOrder.map((item) => item.id));
    const groupIds = new Set(Object.keys(scheme.groups));
    const resultIds = new Set(Object.keys(scheme.results));

    for (const node of scheme.firstOrder) {
      assert.ok(node.source?.pdfPage, `${scheme.id}/${node.id}: PDF-страница`);
      assert.ok(node.source?.bookPage, `${scheme.id}/${node.id}: книжная страница`);
      for (const edge of [node.yes, node.no]) {
        assert.ok(allowedTargets.has(edge.kind), `${scheme.id}/${node.id}: тип перехода`);
        if (edge.kind === "group") assert.ok(groupIds.has(edge.target), edge.target);
        if (edge.kind === "next") assert.ok(firstOrderIds.has(edge.target), edge.target);
        if (edge.kind === "result") assert.ok(resultIds.has(edge.target), edge.target);
        if (edge.kind === "transition") assert.ok(edge.targetSchemeNumber > 0);
      }
    }

    for (const group of Object.values(scheme.groups)) {
      assert.ok(group.source?.pdfPage, `${scheme.id}/${group.id}: PDF-страница`);
      assert.ok(group.threshold >= 1 && group.threshold <= group.members.length);
      assert.ok(resultIds.has(group.result), group.result);
      assert.ok(firstOrderIds.has(group.otherwise), group.otherwise);
      for (const member of group.members) {
        assert.ok(member.id);
        assert.ok(member.factId);
        assert.ok(member.text);
      }
    }

    for (const outcome of Object.values(scheme.results)) {
      assert.equal(outcome.publishable, false);
      assert.ok(outcome.source?.pdfPage, `${scheme.id}/${outcome.id}: PDF-страница`);
      assert.ok(outcome.source?.bookPage, `${scheme.id}/${outcome.id}: книжная страница`);
      assert.ok(outcome.bookText);
      assert.ok(outcome.specialistOptions.length > 0);
    }
  }
});

test("схема № 1 сохраняет книжные пороги групп", () => {
  const weakness = VERIFIED_SYMPTOM_GUIDE_SCHEMES.weakness;
  assert.equal(weakness.groups["panic-symptoms"].threshold, 2);
  assert.equal(weakness.groups["sleep-disorder-symptoms"].threshold, 1);
  assert.equal(weakness.groups["hypothyroidism-symptoms"].threshold, 2);
  assert.equal(weakness.groups["anemia-symptoms"].threshold, 1);
});

test("схема № 1 разделяет группы первого и второго порядка", () => {
  const groups = VERIFIED_SYMPTOM_GUIDE_SCHEMES.weakness.groups;
  assert.equal(groups["panic-symptoms"].order, "second");
  assert.equal(groups["sleep-disorder-symptoms"].order, "first");
  assert.equal(groups["hypothyroidism-symptoms"].order, "first");
  assert.equal(groups["anemia-symptoms"].order, "first");
});

test("заключения схемы № 1 сохраняют книжный текст и специалистов", () => {
  const results = VERIFIED_SYMPTOM_GUIDE_SCHEMES.weakness.results;
  assert.match(results["panic-home-care"].bookText, /Вероятная причина — паническая атака/);
  assert.deepEqual(
    [...results["hypothyroidism-appointment"].specialistOptions],
    ["Терапевт", "Эндокринолог"],
  );
  assert.deepEqual(
    [...results["sleep-home-care"].specialistOptions],
    ["Сомнолог"],
  );
});

test("в демо проверены ровно восемь выбранных книжных схем", () => {
  assert.deepEqual(
    Object.keys(VERIFIED_SYMPTOM_GUIDE_SCHEMES).sort(),
    [
      "breathing",
      "cough",
      "dizziness",
      "fever",
      "headache",
      "hoarseness",
      "weakness",
      "weight-loss",
    ],
  );
});

test("все книжные заключения имеют вычисленную срочность", () => {
  const allowedSeverities = new Set(["emergency", "urgent", "planned", "self"]);
  for (const scheme of Object.values(VERIFIED_SYMPTOM_GUIDE_SCHEMES)) {
    for (const item of Object.values(scheme.results)) {
      assert.ok(allowedSeverities.has(item.severity), `${scheme.id}/${item.id}`);
      if (item.route === "Немедленный вызов скорой помощи") {
        assert.equal(item.severity, "emergency", `${scheme.id}/${item.id}`);
      }
      if (item.route === "Срочный вызов врача") {
        assert.equal(item.severity, "urgent", `${scheme.id}/${item.id}`);
      }
      if (item.route === "Помощь в домашних условиях") {
        assert.equal(item.severity, "self", `${scheme.id}/${item.id}`);
      }
    }
  }
});

test("переходы между выбранными демо-схемами сохранены", () => {
  const transitions = Object.fromEntries(
    Object.values(VERIFIED_SYMPTOM_GUIDE_SCHEMES).map((scheme) => [
      scheme.number,
      scheme.firstOrder
        .filter((item) => item.yes.kind === "transition")
        .map((item) => item.yes.targetSchemeNumber),
    ]),
  );
  assert.deepEqual(transitions[1].sort((a, b) => a - b), [3, 4]);
  assert.deepEqual(transitions[6], [4]);
  assert.deepEqual(transitions[14].sort((a, b) => a - b), [4, 12, 13]);
});
