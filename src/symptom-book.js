import {
  SYMPTOM_GUIDE_SCHEMES,
  SYMPTOM_GUIDE_SOURCE,
} from "./symptom-guide-data.js";
import { VERIFIED_SYMPTOM_GUIDE_SCHEMES } from "./symptom-guide-verified-data.js";

// Runtime index compiled from the semantic transcription in cBridge/data.
// It intentionally contains no medication advice from the archival source.
const SOURCE = SYMPTOM_GUIDE_SOURCE;

const CARDIO_SCHEMES = [
  {
    id: "dizziness",
    number: 1,
    title: "Головокружение",
    pages: "8–9",
    primaryTerms: [
      "головокружение",
      "кружится голова",
      "кружит голову",
      "ведет в сторону",
      "теряю равновесие",
      "потеря равновесия",
      "шаткость",
      "шатает",
    ],
    negativeTerms: [
      "голова не кружится",
      "головокружения нет",
      "без головокружения",
    ],
    signals: [
      {
        label: "дискомфорт или боль в шее/затылке",
        terms: ["боль в шее", "болит шея", "боль в затылке", "болит затылок"],
      },
      {
        label: "слабость или бледность",
        terms: ["слабость", "бледность", "побледнел", "побледнела"],
      },
      {
        label: "одышка или усиленное сердцебиение",
        terms: ["одышка", "сердцебиение", "сердце колотится"],
      },
      {
        label: "шум в ушах или снижение слуха",
        terms: [
          "шум в ушах",
          "шумит в ушах",
          "звон в ушах",
          "снижение слуха",
          "плохо слышу",
        ],
      },
    ],
    questions: [
      "Была ли перед этим травма головы?",
      "Есть ли нарушение речи или зрения, слабость либо онемение с одной стороны тела?",
      "Есть ли боль в шее или затылке при повороте головы?",
      "Какое сейчас артериальное давление, если можете безопасно измерить?",
      "Есть ли шум в ушах или снижение слуха?",
    ],
  },
  {
    id: "headache",
    number: 2,
    title: "Головная боль",
    pages: "10–11",
    primaryTerms: [
      "головная боль",
      "болит голова",
      "голова болит",
      "раскалывается голова",
      "боль в виске",
      "болит висок",
      "давит голову",
      "пульсирует в голове",
    ],
    negativeTerms: [
      "голова не болит",
      "головной боли нет",
      "без головной боли",
    ],
    signals: [
      {
        label: "пульсирующая или односторонняя боль",
        terms: [
          "пульсирующая боль",
          "пульсирует",
          "с одной стороны головы",
          "в половине головы",
          "односторонняя боль",
        ],
      },
      {
        label: "чувствительность к свету, звуку или запахам",
        terms: [
          "светобоязнь",
          "мешает свет",
          "раздражает свет",
          "мешают звуки",
          "раздражают звуки",
          "раздражают запахи",
        ],
      },
      {
        label: "заложенность носа или боль в лице",
        terms: ["заложен нос", "заложенность носа", "боль в лице", "болит лицо"],
      },
      {
        label: "связь с напряжением",
        terms: [
          "после стресса",
          "после нагрузки",
          "после напряжения",
          "нервничал",
          "нервничала",
        ],
      },
    ],
    questions: [
      "Была ли перед этим травма головы?",
      "Какая температура тела?",
      "Боль внезапная и очень сильная или нарастала постепенно?",
      "Есть ли нарушение зрения, светобоязнь, слабость или онемение с одной стороны?",
      "Есть ли заложенность носа, боль в лице или усиление боли при наклоне?",
    ],
  },
  {
    id: "chest-pain",
    number: 3,
    title: "Боль в груди",
    pages: "12–14",
    primaryTerms: [
      "боль в груди",
      "боли в груди",
      "болит грудь",
      "грудь болит",
      "давит в груди",
      "сжимает грудь",
      "жжет в груди",
      "жжение в груди",
      "боль за грудиной",
      "болит за грудиной",
    ],
    negativeTerms: [
      "грудь не болит",
      "боли в груди нет",
      "без боли в груди",
      "за грудиной не болит",
    ],
    signals: [
      {
        label: "давящая или сжимающая боль",
        terms: [
          "давящая боль",
          "сжимающая боль",
          "давит в груди",
          "сжимает грудь",
          "тяжесть в груди",
        ],
      },
      {
        label: "отдаёт в руку, лопатку, шею или челюсть",
        terms: [
          "отдает в руку",
          "отдает в левую руку",
          "отдает в лопатку",
          "отдает в шею",
          "отдает в челюсть",
          "отдает в нижнюю челюсть",
        ],
      },
      {
        label: "жжение и связь с едой или положением тела",
        terms: [
          "кислая отрыжка",
          "горькая отрыжка",
          "после еды",
          "после приема пищи",
          "когда ложусь",
          "при наклоне",
        ],
      },
      {
        label: "боль по ходу рёбер или сыпь",
        terms: [
          "между ребрами",
          "по ходу ребер",
          "сыпь между ребрами",
          "высыпания между ребрами",
        ],
      },
    ],
    questions: [
      "Боль давящая или сжимающая? Отдаёт ли она в руку, лопатку, шею или челюсть?",
      "Боль появилась впервые, внезапно или повторяется каждые несколько минут?",
      "Есть ли одышка, холодный пот, выраженная слабость или тошнота?",
      "Была ли травма грудной клетки?",
      "Связана ли боль с едой, наклоном или положением лёжа?",
    ],
  },
  {
    id: "breathing",
    number: 4,
    title: "Нарушение дыхания",
    pages: "15–17",
    primaryTerms: [
      "трудно дышать",
      "тяжело дышать",
      "не хватает воздуха",
      "задыхаюсь",
      "одышка",
      "удушье",
      "не могу вдохнуть",
      "не могу выдохнуть",
      "свистящее дыхание",
      "хрипы при дыхании",
    ],
    negativeTerms: [
      "дышать не трудно",
      "одышки нет",
      "без одышки",
      "воздуха хватает",
    ],
    signals: [
      {
        label: "кашель или боль при дыхании",
        terms: [
          "сухой кашель",
          "кашель с мокротой",
          "боль при вдохе",
          "боль при дыхании",
        ],
      },
      {
        label: "отёк губ, языка или век",
        terms: [
          "отек губ",
          "опухли губы",
          "отек языка",
          "опух язык",
          "отек век",
        ],
      },
      {
        label: "усиление в положении лёжа",
        terms: ["хуже лежа", "хуже когда лежу", "усиливается лежа"],
      },
    ],
    questions: [
      "Нарушение дыхания началось внезапно и усиливается?",
      "Есть ли отёк губ, языка или век?",
      "Есть ли боль в груди, кашель, мокрота или высокая температура?",
      "Есть ли свист при дыхании или стало труднее выдыхать?",
      "Были ли недавно операция, длительный постельный режим или заболевание вен?",
    ],
  },
  {
    id: "rhythm",
    number: 5,
    title: "Нарушение сердечного ритма",
    pages: "18–19",
    primaryTerms: [
      "сердце колотится",
      "сильное сердцебиение",
      "учащенное сердцебиение",
      "перебои в сердце",
      "сердце замирает",
      "неровный пульс",
      "нерегулярный пульс",
      "аритмия",
      "пульс высокий",
      "пульс низкий",
      "тахикардия",
      "брадикардия",
    ],
    negativeTerms: [
      "сердцебиения нет",
      "без сердцебиения",
      "пульс ровный",
      "перебоев нет",
    ],
    signals: [
      {
        label: "кофеин, энергетики или курение",
        terms: [
          "много кофе",
          "энергетик",
          "энергетики",
          "крепкий чай",
          "много курил",
          "много курила",
        ],
      },
      {
        label: "выраженная слабость, бледность или одышка",
        terms: ["слабость", "бледность", "одышка"],
      },
      {
        label: "снижение веса",
        terms: ["похудел", "похудела", "снижение веса", "теряю вес"],
      },
    ],
    questions: [
      "Какой сейчас пульс в минуту, если можете безопасно измерить?",
      "Ритм ощущается ровным или нерегулярным?",
      "Есть ли боль в груди, одышка, головокружение или потеря сознания?",
      "Были ли сегодня кофе, энергетики, алкоголь или другие стимуляторы?",
      "Есть ли диагностированные заболевания сердца, гипертония или диабет?",
    ],
  },
  {
    id: "syncope",
    number: 6,
    title: "Потеря сознания",
    pages: "20–23",
    primaryTerms: [
      "потерял сознание",
      "потеряла сознание",
      "терял сознание",
      "теряла сознание",
      "был обморок",
      "была в обмороке",
      "упал в обморок",
      "упала в обморок",
      "отключился",
      "отключилась",
    ],
    negativeTerms: [
      "сознание не терял",
      "сознание не теряла",
      "обморока не было",
      "без потери сознания",
    ],
    signals: [
      {
        label: "связь с резкой сменой положения",
        terms: [
          "резко встал",
          "резко встала",
          "когда встал",
          "когда встала",
          "сменил положение",
          "сменила положение",
        ],
      },
      {
        label: "судороги, прикус языка или спутанность",
        terms: [
          "судороги",
          "прикусил язык",
          "прикусила язык",
          "спутанность сознания",
          "ничего не помню",
        ],
      },
      {
        label: "тошнота, потливость или звон в ушах перед эпизодом",
        terms: [
          "тошнило перед",
          "холодный пот",
          "вспотел",
          "вспотела",
          "звон в ушах",
          "потемнело в глазах",
        ],
      },
    ],
    questions: [
      "Сколько примерно длилась потеря сознания?",
      "Были ли перед этим перебои в сердце или боль в груди?",
      "Была ли травма головы при падении?",
      "Есть ли сейчас нарушение речи или зрения, слабость либо онемение с одной стороны?",
      "Были ли судороги, прикус языка, спутанность или потеря памяти?",
    ],
  },
];

const SCHEMES = SYMPTOM_GUIDE_SCHEMES.map((guideScheme) => {
  const verifiedScheme = VERIFIED_SYMPTOM_GUIDE_SCHEMES[guideScheme.id];
  const detailedScheme = CARDIO_SCHEMES.find(
    (candidate) => candidate.id === guideScheme.id,
  );
  if (!detailedScheme && !verifiedScheme) {
    return Object.freeze({ ...guideScheme, questions: [] });
  }

  return Object.freeze({
    ...guideScheme,
    primaryTerms: dedupe([
      ...guideScheme.primaryTerms,
      ...(detailedScheme?.primaryTerms || []),
    ]),
    negativeTerms: detailedScheme?.negativeTerms || [],
    signals: detailedScheme?.signals || [],
    questions: dedupe([
      ...(verifiedScheme?.firstOrder.map((item) => item.text) || []),
      ...(detailedScheme?.questions || []),
    ]),
  });
});

const NEGATION_WORDS = new Set([
  "не",
  "нет",
  "без",
  "отрицаю",
  "отсутствует",
  "отсутствуют",
  "никакой",
  "никаких",
]);

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase("ru-RU")
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}/.,]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termState(text, term) {
  const needle = normalize(term);
  let index = text.indexOf(needle);
  let foundNegated = false;

  while (index !== -1) {
    const before = text
      .slice(Math.max(0, index - 42), index)
      .trim()
      .split(/\s+/)
      .slice(-4);
    const after = text
      .slice(index + needle.length, index + needle.length + 24)
      .trim()
      .split(/\s+/)
      .slice(0, 3);
    const negated =
      before.some((word) => NEGATION_WORDS.has(word)) ||
      NEGATION_WORDS.has(after[0]);

    if (!negated) return "positive";
    foundNegated = true;
    index = text.indexOf(needle, index + needle.length);
  }

  return foundNegated ? "negative" : "absent";
}

function listState(text, terms) {
  let negative = false;
  for (const term of terms) {
    const state = termState(text, term);
    if (state === "positive") return "positive";
    if (state === "negative") negative = true;
  }
  return negative ? "negative" : "absent";
}

function hasPositive(text, terms) {
  return listState(text, terms) === "positive";
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractVitals(text) {
  const pressureMatch = text.match(/\b(\d{2,3})\s*[/\\]\s*(\d{2,3})\b/);
  const temperatureMatch = text.match(
    /(?:температур\p{L}*\s*)?(\d{2}(?:[.,]\d)?)\s*(?:°|градус|c\b)/u,
  );
  const pulseMatch = text.match(
    /(?:пульс|чсс)\D{0,12}(\d{2,3})\s*(?:удар\p{L}*)?/u,
  );

  return {
    pressure: pressureMatch
      ? { systolic: Number(pressureMatch[1]), diastolic: Number(pressureMatch[2]) }
      : null,
    temperature: temperatureMatch
      ? Number(temperatureMatch[1].replace(",", "."))
      : null,
    pulse: pulseMatch ? Number(pulseMatch[1]) : null,
  };
}

function findRedFlags(text, matchedSchemeIds, vitals) {
  const flags = [];
  const hasScheme = (id) => matchedSchemeIds.includes(id);
  const add = (code, label, schemeIds) => {
    if (!flags.some((flag) => flag.code === code)) {
      flags.push({ code, label, urgency: "emergency", schemeIds });
    }
  };

  const neuroDeficit = hasPositive(text, [
    "нарушение речи",
    "не могу говорить",
    "речь стала невнятной",
    "перекосило лицо",
    "онемела половина тела",
    "онемение половины тела",
    "слабость в одной руке",
    "слабость с одной стороны",
    "потерял зрение",
    "потеряла зрение",
    "пропало зрение",
  ]);
  if (
    neuroDeficit &&
    (hasScheme("dizziness") || hasScheme("headache") || hasScheme("syncope"))
  ) {
    add(
      "NEUROLOGICAL_RED_FLAG",
      "Неврологический признак вместе с головокружением, головной болью или потерей сознания",
      ["dizziness", "headache", "syncope"],
    );
  }

  const chestPressure = hasPositive(text, [
    "давящая боль",
    "сжимающая боль",
    "давит в груди",
    "сжимает грудь",
    "тяжесть в груди",
  ]);
  const chestRadiation = hasPositive(text, [
    "отдает в руку",
    "отдает в левую руку",
    "отдает в лопатку",
    "отдает в шею",
    "отдает в челюсть",
    "отдает в нижнюю челюсть",
  ]);
  if (hasScheme("chest-pain") && chestPressure && chestRadiation) {
    add(
      "CHEST_PAIN_RADIATION",
      "Давящая или сжимающая боль в груди с распространением в руку, лопатку, шею или челюсть",
      ["chest-pain"],
    );
  }

  if (
    hasScheme("breathing") &&
    hasPositive(text, [
      "не могу дышать",
      "не могу вдохнуть",
      "не могу выдохнуть",
      "задыхаюсь",
      "удушье",
      "посинели губы",
    ])
  ) {
    add(
      "SEVERE_BREATHING_DIFFICULTY",
      "Выраженное нарушение дыхания",
      ["breathing"],
    );
  }

  const airwaySwelling = hasPositive(text, [
    "отек языка",
    "опух язык",
    "отек губ",
    "опухли губы",
  ]);
  if (hasScheme("breathing") && airwaySwelling) {
    add(
      "AIRWAY_SWELLING",
      "Нарушение дыхания с отёком языка или губ",
      ["breathing"],
    );
  }

  const headTrauma = hasPositive(text, [
    "травма головы",
    "ударился головой",
    "ударилась головой",
    "после удара головой",
  ]);
  if (
    headTrauma &&
    (hasScheme("dizziness") || hasScheme("headache") || hasScheme("syncope"))
  ) {
    add(
      "HEAD_TRAUMA_WITH_SYMPTOMS",
      "Симптомы после травмы головы",
      ["dizziness", "headache", "syncope"],
    );
  }

  const severeHeadache = hasPositive(text, [
    "сильная распирающая головная боль",
    "самая сильная головная боль",
    "внезапная сильная головная боль",
  ]);
  const meningism = hasPositive(text, [
    "не могу наклонить голову",
    "напряжение мышц шеи",
    "светобоязнь",
    "звукобоязнь",
  ]);
  if (hasScheme("headache") && severeHeadache && meningism) {
    add(
      "SEVERE_HEADACHE_WITH_NECK_OR_SENSORY_SIGNS",
      "Сильная головная боль с напряжением шеи, нарушением зрения или светобоязнью",
      ["headache"],
    );
  }

  if (
    hasScheme("syncope") &&
    hasPositive(text, [
      "без сознания больше минуты",
      "без сознания минуту",
      "не приходил в себя",
      "не приходила в себя",
    ])
  ) {
    add(
      "PROLONGED_LOSS_OF_CONSCIOUSNESS",
      "Продолжительная потеря сознания",
      ["syncope"],
    );
  }

  if (
    hasScheme("syncope") &&
    hasPositive(text, [
      "судороги",
      "прикусил язык",
      "прикусила язык",
      "спутанность сознания",
    ])
  ) {
    add(
      "LOSS_OF_CONSCIOUSNESS_WITH_SEIZURE_SIGNS",
      "Потеря сознания с судорогами, прикусом языка или спутанностью",
      ["syncope"],
    );
  }

  if (
    hasScheme("rhythm") &&
    Number.isFinite(vitals.pulse) &&
    (vitals.pulse > 180 || vitals.pulse < 40)
  ) {
    add(
      "EXTREME_PULSE_FROM_BOOK",
      "Пульс находится за экстренным порогом, указанным в архивной схеме",
      ["rhythm"],
    );
  }

  return flags;
}

function findPatterns(text, matchedSchemeIds, vitals) {
  const patterns = [];
  const hasScheme = (id) => matchedSchemeIds.includes(id);
  const add = (id, label, schemeId, rationale) => {
    if (!patterns.some((pattern) => pattern.id === id)) {
      patterns.push({ id, label, schemeId, rationale });
    }
  };

  if (
    hasScheme("headache") &&
    hasPositive(text, ["пульсирующая боль", "пульсирует"]) &&
    hasPositive(text, [
      "с одной стороны головы",
      "в половине головы",
      "односторонняя боль",
    ]) &&
    hasPositive(text, [
      "светобоязнь",
      "мешает свет",
      "раздражает свет",
      "мешают звуки",
      "раздражают звуки",
      "раздражают запахи",
    ])
  ) {
    add(
      "MIGRAINE_PATTERN",
      "Паттерн мигрени из книги",
      "headache",
      "Совпали пульсирующий характер, односторонняя боль и чувствительность к свету, звуку или запахам.",
    );
  }

  if (
    hasScheme("headache") &&
    hasPositive(text, ["заложен нос", "заложенность носа", "боль в лице"]) &&
    hasPositive(text, ["при наклоне", "когда наклоняюсь", "смене положения головы"])
  ) {
    add(
      "SINUS_PATTERN",
      "Паттерн синусита из книги",
      "headache",
      "Совпали головная боль, носовые или лицевые симптомы и связь с положением головы.",
    );
  }

  if (
    hasScheme("chest-pain") &&
    hasPositive(text, ["жжет в груди", "жжение в груди", "жгучая боль"]) &&
    hasPositive(text, [
      "кислая отрыжка",
      "горькая отрыжка",
      "после еды",
      "после приема пищи",
      "когда ложусь",
      "при наклоне",
    ])
  ) {
    add(
      "REFLUX_PATTERN",
      "Паттерн рефлюкса или диспепсии из книги",
      "chest-pain",
      "Совпали жжение в центре груди и связь с едой либо положением тела.",
    );
  }

  if (
    hasScheme("dizziness") &&
    hasPositive(text, [
      "шум в ушах",
      "шумит в ушах",
      "звон в ушах",
      "снижение слуха",
      "плохо слышу",
    ])
  ) {
    add(
      "VESTIBULAR_PATTERN",
      "Вестибулярный паттерн из книги",
      "dizziness",
      "Головокружение сочетается с шумом в ушах или снижением слуха.",
    );
  }

  if (
    (hasScheme("dizziness") || hasScheme("headache")) &&
    vitals.pressure &&
    (vitals.pressure.systolic >= 140 || vitals.pressure.diastolic >= 90)
  ) {
    add(
      "HIGH_PRESSURE_BRANCH",
      "Ветка повышенного давления из книги",
      hasScheme("headache") ? "headache" : "dizziness",
      `В тексте указано давление ${vitals.pressure.systolic}/${vitals.pressure.diastolic}. Порог относится к архивной схеме и не заменяет актуальную оценку врача.`,
    );
  }

  if (
    hasScheme("rhythm") &&
    hasPositive(text, [
      "много кофе",
      "энергетик",
      "энергетики",
      "крепкий чай",
      "много курил",
      "много курила",
    ])
  ) {
    add(
      "STIMULANT_RHYTHM_PATTERN",
      "Паттерн сердцебиения после стимуляторов из книги",
      "rhythm",
      "Нарушение ритма описано вместе с кофеином, энергетиками или курением.",
    );
  }

  if (
    hasScheme("syncope") &&
    hasPositive(text, [
      "резко встал",
      "резко встала",
      "когда встал",
      "когда встала",
    ])
  ) {
    add(
      "ORTHOSTATIC_PATTERN",
      "Ортостатический паттерн из книги",
      "syncope",
      "Потеря сознания связана с резкой сменой положения тела.",
    );
  }

  return patterns;
}

function findUrgentSignals(text, matchedSchemeIds, vitals) {
  const signals = [];
  const hasScheme = (id) => matchedSchemeIds.includes(id);
  if (
    vitals.temperature >= 38 &&
    (hasScheme("headache") || hasScheme("chest-pain") || hasScheme("breathing"))
  ) {
    signals.push("Температура 38 °C или выше вместе с совпавшей схемой.");
  }
  if (
    vitals.pressure &&
    (vitals.pressure.systolic >= 140 || vitals.pressure.diastolic >= 90) &&
    (hasScheme("headache") || hasScheme("dizziness"))
  ) {
    signals.push("Повышенное давление вместе с головной болью или головокружением.");
  }
  return signals;
}

export function analyzeSymptoms(content) {
  const text = normalize(content);
  const vitals = extractVitals(text);

  const matches = SCHEMES.map((scheme) => {
    const primaryState = listState(text, scheme.primaryTerms);
    const explicitlyNegative = scheme.negativeTerms.some((term) =>
      text.includes(normalize(term)),
    );
    const matchedSignals = [];
    const negatedSignals = [];

    if (primaryState === "positive" && !explicitlyNegative) {
      matchedSignals.push(scheme.title.toLocaleLowerCase("ru-RU"));
    } else if (primaryState === "negative" || explicitlyNegative) {
      negatedSignals.push(scheme.title.toLocaleLowerCase("ru-RU"));
    }

    for (const signal of scheme.signals) {
      const state = listState(text, signal.terms);
      if (state === "positive") matchedSignals.push(signal.label);
      if (state === "negative") negatedSignals.push(signal.label);
    }

    const primaryMatched = primaryState === "positive" && !explicitlyNegative;
    const matchCount = primaryMatched ? matchedSignals.length : 0;

    return {
      id: scheme.id,
      number: scheme.number,
      title: scheme.title,
      pages: scheme.pages,
      matchCount,
      primaryMatched,
      matchedSignals: dedupe(matchedSignals),
      negatedSignals: dedupe(negatedSignals),
      questions: scheme.questions,
    };
  });

  const matchedSchemes = matches
    .filter((scheme) => scheme.primaryMatched)
    .sort(
      (left, right) =>
        right.matchCount - left.matchCount || left.number - right.number,
    )
    .slice(0, 3);
  const matchedSchemeIds = matchedSchemes.map((scheme) => scheme.id);
  const redFlags = findRedFlags(text, matchedSchemeIds, vitals);
  const urgentSignals = findUrgentSignals(text, matchedSchemeIds, vitals);
  const possiblePatterns = redFlags.length
    ? []
    : findPatterns(text, matchedSchemeIds, vitals).slice(0, 3);
  const negatedSignals = dedupe(
    matches.flatMap((scheme) =>
      scheme.negatedSignals.map((signal) => `${scheme.title}: ${signal}`),
    ),
  ).slice(0, 6);

  let outcome = "needs_answers";
  let urgency = "routine";
  let summary;
  let nextStep;
  let followUpQuestions = dedupe(
    matchedSchemes.flatMap((scheme) => scheme.questions),
  ).slice(0, 5);

  if (redFlags.length) {
    outcome = "emergency";
    urgency = "emergency";
    summary =
      "В описании найдены признаки, которые в размеченной книге относятся к экстренной ветке. Онлайн-разбор нельзя продолжать как обычную консультацию.";
    nextStep =
      "Обратитесь за местной экстренной медицинской помощью сейчас. Если состояние угрожает жизни, не ждите ответа в чате.";
    followUpQuestions = [];
  } else if (!matchedSchemes.length) {
    outcome = "no_match";
    urgency = "unknown";
    summary =
      "Текст не совпал ни с одной из 49 симптомных схем книги. Это не означает, что медицинской проблемы нет: автоматическое сопоставление ограничено формулировками архивного источника.";
    nextStep =
      "Уточните основной симптом, длительность и что изменяет его, либо обратитесь к врачу для оценки.";
    followUpQuestions = [
      "Какой симптом беспокоит сильнее всего?",
      "Когда он начался и усиливается ли сейчас?",
      "Есть ли боль в груди, одышка, потеря сознания или внезапная слабость?",
    ];
  } else if (urgentSignals.length) {
    urgency = "urgent";
    summary = `Описание больше всего похоже на ${
      matchedSchemes.length > 1 ? "разделы" : "раздел"
    } книги: ${matchedSchemes.map((scheme) => `«${scheme.title}»`).join(", ")}. Также сработала срочная ветка архивной схемы.`;
    nextStep =
      "Нужна оперативная оценка медицинским специалистом. Не используйте этот результат для самостоятельного лечения.";
  } else {
    summary = `Описание больше всего похоже на ${
      matchedSchemes.length > 1 ? "разделы" : "раздел"
    } книги: ${matchedSchemes.map((scheme) => `«${scheme.title}»`).join(", ")}. Для выбора конкретной ветки данных пока недостаточно.`;
    nextStep =
      "Ответьте на уточняющие вопросы и передайте результат медицинскому специалисту. Не меняйте лечение по этому разбору.";
  }

  return {
    schemaVersion: 2,
    kind: "symptom-book-analysis",
    outcome,
    urgency,
    summary,
    matchedSchemes: matchedSchemes.map(({ questions, primaryMatched, ...scheme }) => scheme),
    possiblePatterns,
    redFlags,
    urgentSignals,
    negatedSignals,
    followUpQuestions,
    nextStep,
    source: SOURCE,
    safety: {
      medicalDataSentToExternalAI: false,
      medicationsOrDosagesGenerated: false,
      clinicalStatus: "archival-demo",
    },
    disclaimer:
      "Это предварительное сопоставление текста с архивной книгой, а не диагноз, назначение или замена консультации врача.",
  };
}

export { SOURCE as symptomBookSource };
