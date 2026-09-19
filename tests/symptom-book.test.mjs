import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSymptoms } from "../src/symptom-book.js";
import { SYMPTOM_GUIDE_SCHEMES } from "../src/symptom-guide-data.js";

test("каталог новой книги содержит все 49 схем и три раздела", () => {
  assert.equal(SYMPTOM_GUIDE_SCHEMES.length, 49);
  assert.equal(
    SYMPTOM_GUIDE_SCHEMES.filter((scheme) => scheme.section === "general").length,
    23,
  );
  assert.equal(
    SYMPTOM_GUIDE_SCHEMES.filter((scheme) => scheme.section === "male").length,
    12,
  );
  assert.equal(
    SYMPTOM_GUIDE_SCHEMES.filter((scheme) => scheme.section === "female").length,
    14,
  );
});

test("сопоставляет головную боль со схемой и задаёт уточняющие вопросы", () => {
  const result = analyzeSymptoms(
    "Второй день болит голова, давление сегодня было 150/95.",
  );

  assert.equal(result.kind, "symptom-book-analysis");
  assert.equal(result.matchedSchemes[0].id, "headache");
  assert.equal(result.urgency, "urgent");
  assert.ok(result.followUpQuestions.length > 0);
  assert.equal(result.safety.medicalDataSentToExternalAI, false);
});

test("учитывает явное отрицание симптома", () => {
  const result = analyzeSymptoms(
    "Грудь не болит, одышки нет, но сильно кружится голова и шумит в ушах.",
  );

  assert.equal(result.matchedSchemes[0].id, "dizziness");
  assert.equal(
    result.matchedSchemes.some((scheme) => scheme.id === "chest-pain"),
    false,
  );
  assert.ok(result.negatedSignals.some((signal) => signal.includes("Боль в груди")));
  assert.ok(
    result.possiblePatterns.some((pattern) => pattern.id === "VESTIBULAR_PATTERN"),
  );
});

test("выделяет экстренную ветку при давящей боли с иррадиацией", () => {
  const result = analyzeSymptoms(
    "Внезапно давит в груди, боль отдает в левую руку и появилась одышка.",
  );

  assert.equal(result.outcome, "emergency");
  assert.equal(result.urgency, "emergency");
  assert.ok(
    result.redFlags.some((flag) => flag.code === "CHEST_PAIN_RADIATION"),
  );
  assert.equal(result.followUpQuestions.length, 0);
});

test("не выдумывает совпадение вне охвата книги", () => {
  const result = analyzeSymptoms("Чешется кожа на предплечье после нового крема.");

  assert.equal(result.outcome, "no_match");
  assert.equal(result.matchedSchemes.length, 0);
  assert.equal(result.possiblePatterns.length, 0);
});

test("называет источник архивным и не генерирует назначения", () => {
  const result = analyzeSymptoms("Сердце колотится после двух энергетиков.");

  assert.equal(result.source.status, "archival-demo");
  assert.equal(result.safety.medicationsOrDosagesGenerated, false);
  assert.match(result.disclaimer, /не диагноз/i);
});

test("сопоставляет общий симптом из новой книги", () => {
  const result = analyzeSymptoms(
    "Вторую неделю болит поясница, травмы не было.",
  );

  assert.equal(result.matchedSchemes[0].id, "back-pain");
  assert.equal(result.source.id, "aidadoc-symptom-guide-2021");
  assert.equal(result.followUpQuestions.length, 0);
});

test("не предлагает придуманные вопросы для ещё не сверенной схемы", () => {
  const result = analyzeSymptoms("Вторую неделю болит поясница.");

  assert.equal(result.matchedSchemes[0].id, "back-pain");
  assert.deepEqual(result.followUpQuestions, []);
});

test("для сверенной схемы использует вопросы первого порядка из PDF", () => {
  const result = analyzeSymptoms("Беспокоит слабость.");

  assert.equal(result.matchedSchemes[0].id, "weakness");
  assert.equal(
    result.followUpQuestions[0],
    "Беспричинное чувство страха/тревоги",
  );
});

test("сопоставляет женский симптом из новой книги", () => {
  const result = analyzeSymptoms(
    "Задержка месячных уже десять дней, тест пока не делала.",
  );

  assert.equal(result.matchedSchemes[0].id, "female-amenorrhea");
  assert.equal(result.matchedSchemes[0].number, 37);
});

test("сопоставляет мужской симптом из новой книги", () => {
  const result = analyzeSymptoms(
    "У мужчины внезапно опухла мошонка и болит яичко.",
  );

  assert.equal(result.matchedSchemes[0].id, "male-scrotum");
  assert.equal(result.matchedSchemes[0].number, 25);
});
