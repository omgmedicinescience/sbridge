const ROUTE_VERSION = "demo-health-route-v1";

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function number(value) {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function ageFromBirthDate(value, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const month = now.getUTCMonth() - date.getUTCMonth();
  if (month < 0 || (month === 0 && now.getUTCDate() < date.getUTCDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? age : null;
}

function calculateBmi(height, weight) {
  const heightCm = number(height);
  const weightKg = number(weight);
  if (
    heightCm === null ||
    weightKg === null ||
    heightCm < 100 ||
    heightCm > 230 ||
    weightKg < 30 ||
    weightKg > 300
  ) {
    return null;
  }
  return Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;
}

function item(id, type, title, meta, source, action, priority = "planned") {
  return {
    id,
    type,
    title,
    meta,
    source,
    action,
    priority,
    status: "ready",
  };
}

function hasAnyValue(value) {
  if (Array.isArray(value)) return value.some(hasAnyValue);
  if (value && typeof value === "object") {
    return Object.values(value).some(hasAnyValue);
  }
  return value === true || text(value).length > 0;
}

export function buildDemoHealthRoute({
  profile = {},
  answers = {},
  completedBlocks = [],
} = {}) {
  const age = ageFromBirthDate(profile.birthDate);
  const sexLabel =
    profile.sex === "ж"
      ? "женщина"
      : profile.sex === "м"
        ? "мужчина"
        : "пол не указан";
  const completed = new Set(completedBlocks);
  const totalBlocks = 8;
  const completion = Math.min(
    100,
    Math.round((completed.size / totalBlocks) * 100),
  );
  const bmi = calculateBmi(answers.metrics?.height, answers.metrics?.weight);
  const items = [];

  items.push(
    item(
      "base-checkup",
      "checkup",
      "Записаться на базовый чекап",
      age === null
        ? "План уточнится после даты рождения"
        : `Базовый план: ${sexLabel}, ${age} лет`,
      "Пол и возраст",
      "Выбрать время",
      "planned",
    ),
  );

  if (completed.size > 0) {
    items.push(
      item(
        "personal-checkup",
        "checkup",
        completion === 100
          ? "Записаться на персональный чекап"
          : "Продолжить персонализацию чекапа",
        completion === 100
          ? "Анкетирование завершено"
          : `Заполнено ${completion}% · маршрут уже доступен`,
        "Расширенное анкетирование",
        completion === 100 ? "Выбрать время" : "Продолжить анкету",
        "planned",
      ),
    );
  }

  if (completed.has("metrics") || hasAnyValue(answers.metrics)) {
    const facts = [];
    if (bmi !== null) facts.push(`ИМТ рассчитан: ${bmi}`);
    if (text(answers.metrics?.waist)) {
      facts.push(`окружность талии: ${text(answers.metrics.waist)} см`);
    }
    if (answers.metrics?.pressureKnown === "yes") {
      const systolic = text(answers.metrics?.systolic);
      const diastolic = text(answers.metrics?.diastolic);
      if (systolic && diastolic) facts.push(`давление: ${systolic}/${diastolic}`);
    }
    if (answers.metrics?.glucoseKnown === "yes" && text(answers.metrics?.glucose)) {
      facts.push(`глюкоза: ${text(answers.metrics.glucose)} ммоль/л`);
    }
    items.push(
      item(
        "metrics-summary",
        "summary",
        "Проверить показатели перед чекапом",
        facts.length ? facts.join(" · ") : "Данные сохранены в анкете",
        "Анкетирование · Показатели",
        "Проверить данные",
        "soon",
      ),
    );
  }

  if (completed.has("lifestyle")) {
    items.push(
      item(
        "lifestyle-summary",
        "summary",
        "Обсудить образ жизни на профилактическом приёме",
        "Профессия, активность и питание собраны в предвизитной сводке",
        "Анкетирование · Образ жизни",
        "Открыть сводку",
      ),
    );
  }

  const chronic = Array.isArray(answers.chronic?.selected)
    ? answers.chronic.selected.filter((value) => value !== "none")
    : [];
  if (completed.has("chronic") && chronic.length) {
    items.push(
      item(
        "chronic-summary",
        "summary",
        "Проверить сведения о хронических состояниях",
        `Отмечено: ${chronic.length} · уточнения сохранены для врача`,
        "Анкетирование · Хронические болезни",
        "Проверить данные",
        "soon",
      ),
    );
  }

  if (
    (completed.has("operations") || completed.has("trauma")) &&
    (hasAnyValue(answers.operations) || hasAnyValue(answers.trauma))
  ) {
    items.push(
      item(
        "history-summary",
        "summary",
        "Передать врачу сведения об операциях и травмах",
        "Информация добавлена в предвизитную сводку",
        "Анкетирование · Операции и травмы",
        "Открыть сводку",
      ),
    );
  }

  if (completed.has("allergies") && hasAnyValue(answers.allergies)) {
    items.push(
      item(
        "allergy-summary",
        "summary",
        "Проверить сведения об аллергиях",
        "Аллерген и тип реакции сохранены для врача",
        "Анкетирование · Аллергии",
        "Проверить данные",
        "soon",
      ),
    );
  }

  if (completed.has("infections") && hasAnyValue(answers.infections)) {
    items.push(
      item(
        "infection-summary",
        "summary",
        "Уточнить инфекционный анамнез на приёме",
        "Отмеченные сведения войдут в предвизитную сводку",
        "Анкетирование · Инфекции",
        "Открыть сводку",
      ),
    );
  }

  if (completed.has("vaccination")) {
    items.push(
      item(
        "vaccination-summary",
        "consult",
        "Уточнить календарь вакцинации с врачом",
        "Статус ВПЧ и гепатита B сохранён в анкете",
        "Анкетирование · Вакцинация",
        "Обсудить на приёме",
      ),
    );
  }

  return {
    kind: "demo-health-route",
    version: ROUTE_VERSION,
    demo: true,
    generatedAt: new Date().toISOString(),
    completion,
    completedBlocks: [...completed],
    profileSummary: {
      age,
      sex: profile.sex || null,
    },
    computed: {
      bmi,
    },
    items,
    disclaimer:
      "Маршрут является демонстрационным планом навигации, не диагнозом и не назначением лечения. Состав медицинских услуг утверждает клиника.",
    processing: {
      medicalDataSentToExternalAI: false,
      engine: ROUTE_VERSION,
    },
  };
}

function violation(code, severity, message) {
  return {
    policyId: "medical-safety",
    code,
    severity,
    message,
  };
}

const MEDICATION_PATTERNS = [
  /(принимайте|начните принимать|отмените|замените препарат|увеличьте дозу|снизьте дозу)/iu,
  /дозировк[аи]/iu,
];
const FALSE_CERTAINTY_PATTERNS = [
  /(точный диагноз|диагноз подтвержд[её]н|у вас диагностирован[аоы]?|клинически проверен[аоы]?)/iu,
];

export function createHealthRouteEvaluator() {
  return {
    provider: "cbridge-local",
    model: "health-route-guard-v1",
    capabilities: {
      medicalData: true,
      personalData: false,
    },
    async evaluate(envelope) {
      const route = envelope.content;
      const serialized = JSON.stringify(route);
      const violations = [];

      if (!route?.demo || route?.kind !== "demo-health-route") {
        violations.push(
          violation(
            "DEMO_STATUS_MISSING",
            "critical",
            "Маршрут не помечен как демонстрационный.",
          ),
        );
      }
      if (!text(route?.disclaimer)) {
        violations.push(
          violation(
            "MEDICAL_DISCLAIMER_MISSING",
            "critical",
            "В маршруте отсутствует медицинский дисклеймер.",
          ),
        );
      }
      if (
        !Array.isArray(route?.items) ||
        route.items.some((routeItem) => !text(routeItem?.source))
      ) {
        violations.push(
          violation(
            "RECOMMENDATION_SOURCE_MISSING",
            "high",
            "Для одного или нескольких пунктов не указан источник.",
          ),
        );
      }
      if (MEDICATION_PATTERNS.some((pattern) => pattern.test(serialized))) {
        violations.push(
          violation(
            "UNAPPROVED_MEDICATION_ADVICE",
            "critical",
            "Обнаружена неутверждённая рекомендация по лекарственной терапии.",
          ),
        );
      }
      if (FALSE_CERTAINTY_PATTERNS.some((pattern) => pattern.test(serialized))) {
        violations.push(
          violation(
            "FALSE_MEDICAL_CERTAINTY",
            "critical",
            "Обнаружена недопустимая медицинская определённость.",
          ),
        );
      }

      if (violations.length) {
        return {
          verdict: "block",
          riskScore: 1,
          qualityScore: 0.2,
          reasonCodes: violations.map((item) => item.code),
          violations,
        };
      }

      return {
        verdict: "allow",
        riskScore: 0.08,
        qualityScore: 0.92,
        reasonCodes: [
          "LOCAL_SAFETY_CHECK_PASSED",
          "RECOMMENDATION_SOURCES_PRESENT",
          "NO_EXTERNAL_AI_PROCESSING",
        ],
        violations: [],
      };
    },
  };
}
