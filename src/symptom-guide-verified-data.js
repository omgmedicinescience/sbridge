import { ADDITIONAL_VERIFIED_SYMPTOM_GUIDE_SCHEMES } from "./symptom-guide-demo-data.js";

export const SYMPTOM_GUIDE_VERIFIED_SOURCE = Object.freeze({
  title: "«Путеводитель по симптомам»",
  publisher: "ООО «Айдадок»",
  year: 2021,
  sha256: "c5fb9e18830064372481981746ff7aefcb1e765f08f64a5838c61e69ee849659",
  status: "source-verified-demo",
});

const ref = (pdfPage, bookPage) => Object.freeze({ pdfPage, bookPage });

const result = ({
  id,
  route,
  severity,
  bookText,
  specialistOptions,
  followUpAfterHours,
  pdfPage,
  bookPage,
}) => Object.freeze({
  id,
  route,
  severity: severity || (
    route === "Немедленный вызов скорой помощи" ? "emergency"
      : route === "Срочный вызов врача" ? "urgent"
        : route === "Помощь в домашних условиях" ? "self"
          : "planned"
  ),
  bookText,
  specialistOptions: Object.freeze(specialistOptions),
  ...(followUpAfterHours ? { followUpAfterHours } : {}),
  publishable: false,
  source: ref(pdfPage, bookPage),
});

/**
 * Строго проверенные по PDF графы «Путеводителя по симптомам».
 *
 * Правила данных:
 * - firstOrder содержит только белые блоки первого порядка из книги;
 * - secondOrder содержит только признаки вложенных книжных групп;
 * - threshold переносится дословно из «один и более», «два и более»;
 * - transition хранит книжную ссылку «См. схему № ...»;
 * - result.bookText является транскрипцией книжного заключения, а не новым
 *   медицинским текстом;
 * - узел без визуально проверенной стрелки не добавляется в этот файл.
 */
export const VERIFIED_SYMPTOM_GUIDE_SCHEMES = Object.freeze({
  weakness: Object.freeze({
    id: "weakness",
    number: 1,
    title: "Слабость",
    section: "general",
    source: Object.freeze({
      ...SYMPTOM_GUIDE_VERIFIED_SOURCE,
      bookPages: "10-12",
      pdfPages: Object.freeze([7, 8]),
      verifiedAgainstImages: true,
    }),
    entryText:
      "Чувство беспричинной слабости без особых причин всегда сигнализирует о развитии заболевания",
    firstOrder: Object.freeze([
      Object.freeze({
        id: "unexplained-anxiety",
        factId: "current.unexplained_anxiety.present",
        text: "Беспричинное чувство страха/тревоги",
        yes: Object.freeze({ kind: "group", target: "panic-symptoms" }),
        no: Object.freeze({ kind: "next", target: "sleep-symptoms" }),
        source: ref(7, 10),
      }),
      Object.freeze({
        id: "sleep-symptoms",
        text: "Один и более из симптомов нарушения сна",
        yes: Object.freeze({ kind: "group", target: "sleep-disorder-symptoms" }),
        no: Object.freeze({ kind: "next", target: "busy-work-schedule" }),
        source: ref(7, 10),
      }),
      Object.freeze({
        id: "busy-work-schedule",
        factId: "current.work_schedule.strained",
        text: "В настоящее время напряженный график работы",
        yes: Object.freeze({ kind: "result", target: "overstrain-home-care" }),
        no: Object.freeze({ kind: "next", target: "fever-38" }),
        source: ref(7, 10),
      }),
      Object.freeze({
        id: "fever-38",
        factId: "current.temperature.at_least_38",
        text: "Температура тела 38 °С и выше",
        yes: Object.freeze({ kind: "transition", targetSchemeNumber: 4 }),
        no: Object.freeze({ kind: "next", target: "recent-infection" }),
        source: ref(7, 11),
      }),
      Object.freeze({
        id: "recent-infection",
        factId: "history.recent_infectious_disease.present",
        text: "Недавно перенесенное инфекционное заболевание",
        yes: Object.freeze({ kind: "result", target: "post-infection-appointment" }),
        no: Object.freeze({ kind: "group", target: "hypothyroidism-symptoms" }),
        source: ref(7, 11),
      }),
      Object.freeze({
        id: "hypothyroidism-group",
        text: "Два и более из симптомов",
        yes: Object.freeze({ kind: "group", target: "hypothyroidism-symptoms" }),
        no: Object.freeze({ kind: "group", target: "anemia-symptoms" }),
        source: ref(7, 11),
      }),
      Object.freeze({
        id: "anemia-group",
        text: "Один и более из симптомов",
        yes: Object.freeze({ kind: "group", target: "anemia-symptoms" }),
        no: Object.freeze({ kind: "next", target: "long-smoking-history" }),
        source: ref(7, 11),
      }),
      Object.freeze({
        id: "long-smoking-history",
        factId: "history.smoking.long_term",
        text: "Длительный стаж курения",
        yes: Object.freeze({ kind: "result", target: "smoking-home-care" }),
        no: Object.freeze({ kind: "next", target: "rapid-weight-loss" }),
        source: ref(8, 12),
      }),
      Object.freeze({
        id: "rapid-weight-loss",
        factId: "current.weight_loss.rapid_3kg_or_more",
        text: "Беспричинное снижение веса на 3 кг и более за короткий промежуток времени",
        yes: Object.freeze({ kind: "transition", targetSchemeNumber: 3 }),
        no: Object.freeze({ kind: "next", target: "alcohol-two-days" }),
        source: ref(8, 12),
      }),
      Object.freeze({
        id: "alcohol-two-days",
        factId: "current.alcohol.two_or_more_days",
        text: "Употребление алкоголя 2 и более дней",
        yes: Object.freeze({ kind: "result", target: "alcohol-home-care" }),
        no: Object.freeze({ kind: "next", target: "current-medications" }),
        source: ref(8, 12),
      }),
      Object.freeze({
        id: "current-medications",
        factId: "history.medications.current",
        text: "В настоящее время прием лекарственных препаратов",
        yes: Object.freeze({ kind: "result", target: "medication-appointment" }),
        no: Object.freeze({ kind: "result", target: "weakness-fallback" }),
        source: ref(8, 12),
      }),
    ]),
    groups: Object.freeze({
      "panic-symptoms": Object.freeze({
        id: "panic-symptoms",
        order: "second",
        threshold: 2,
        result: "panic-home-care",
        otherwise: "busy-work-schedule",
        label: "Спонтанно возникшие два или более из симптомов",
        source: ref(7, 10),
        members: Object.freeze([
          Object.freeze({ id: "rapid-heartbeat", factId: "current.palpitations.present", text: "учащенное сердцебиение" }),
          Object.freeze({ id: "sweating-tremor", factId: "current.sweating_or_tremor.present", text: "потливость, тремор" }),
          Object.freeze({ id: "breathing-difficulty", factId: "current.breathing_difficulty.present", text: "затруднение дыхания" }),
          Object.freeze({ id: "chest-discomfort", factId: "current.chest_discomfort.present", text: "дискомфорт в груди" }),
          Object.freeze({ id: "nausea-abdominal-discomfort", factId: "current.nausea_or_abdominal_discomfort.present", text: "тошнота или дискомфорт в животе" }),
        ]),
      }),
      "sleep-disorder-symptoms": Object.freeze({
        id: "sleep-disorder-symptoms",
        order: "first",
        threshold: 1,
        result: "sleep-home-care",
        otherwise: "busy-work-schedule",
        label: "Один и более из симптомов",
        source: ref(7, 10),
        members: Object.freeze([
          Object.freeze({ id: "poor-sleep-onset", factId: "current.sleep.poor_onset", text: "плохое засыпание" }),
          Object.freeze({ id: "poor-sleep-maintenance", factId: "current.sleep.poor_maintenance", text: "трудность сохранения сна" }),
          Object.freeze({ id: "poor-sleep-quality", factId: "current.sleep.poor_quality", text: "плохое качество сна" }),
        ]),
      }),
      "hypothyroidism-symptoms": Object.freeze({
        id: "hypothyroidism-symptoms",
        order: "first",
        threshold: 2,
        result: "hypothyroidism-appointment",
        otherwise: "anemia-group",
        label: "Два и более из симптомов",
        source: ref(7, 11),
        members: Object.freeze([
          Object.freeze({ id: "hair-loss", factId: "current.hair_loss.present", text: "выпадение волос" }),
          Object.freeze({ id: "chilliness", factId: "current.chilliness.present", text: "чувство зябкости" }),
          Object.freeze({ id: "dry-rough-skin", factId: "current.skin.dry_or_rough", text: "сухость и/или огрубение кожи" }),
          Object.freeze({ id: "lethargy-fatigue", factId: "current.lethargy_or_fatigue.present", text: "вялость, быстрая утомляемость" }),
          Object.freeze({ id: "unexplained-weight-gain", factId: "current.weight_gain.unexplained", text: "необъяснимое увеличение веса при привычном режиме питания" }),
        ]),
      }),
      "anemia-symptoms": Object.freeze({
        id: "anemia-symptoms",
        order: "first",
        threshold: 1,
        result: "anemia-appointment",
        otherwise: "long-smoking-history",
        label: "Один и более из симптомов",
        source: ref(7, 11),
        members: Object.freeze([
          Object.freeze({ id: "pallor", factId: "current.pallor.present", text: "бледность" }),
          Object.freeze({ id: "fatigue", factId: "current.fatigue.present", text: "повышенная утомляемость" }),
          Object.freeze({ id: "unexplained-dyspnea", factId: "current.dyspnea.unexplained", text: "одышка без причины" }),
          Object.freeze({ id: "increased-heartbeat", factId: "current.palpitations.increased", text: "усиленное сердцебиение" }),
        ]),
      }),
    }),
    results: Object.freeze({
      "panic-home-care": result({
        id: "panic-home-care",
        route: "Помощь в домашних условиях",
        bookText: "Вероятная причина — паническая атака. Аутотренинг и прием успокаивающих средств помогут справиться с приступом. Если такое состояние повторяется часто, проконсультируйтесь с психиатром или психотерапевтом.",
        specialistOptions: ["Психиатр", "Психотерапевт"],
        followUpAfterHours: 24,
        pdfPage: 7,
        bookPage: 10,
      }),
      "sleep-home-care": result({
        id: "sleep-home-care",
        route: "Помощь в домашних условиях",
        bookText: "Нарушение сна на протяжении нескольких ночей может быть причиной плохого самочувствия. Необходимо отрегулировать режим труда и отдыха. При невозможности самостоятельно справиться с бессонницей стоит обратиться к сомнологу.",
        specialistOptions: ["Сомнолог"],
        followUpAfterHours: 24,
        pdfPage: 7,
        bookPage: 10,
      }),
      "overstrain-home-care": result({
        id: "overstrain-home-care",
        route: "Помощь в домашних условиях",
        bookText: "Причиной слабости может быть перенапряжение. Необходимо отрегулировать режим труда и отдыха. Также может помочь психотерапевт.",
        specialistOptions: ["Психотерапевт"],
        followUpAfterHours: 24,
        pdfPage: 7,
        bookPage: 10,
      }),
      "post-infection-appointment": result({
        id: "post-infection-appointment",
        route: "Запись на прием к врачу",
        bookText: "Реабилитационный период после перенесенных инфекционных заболеваний длится до трех недель и может сопровождаться слабостью. Если симптомы не проходят более месяца, обратитесь к лечащему врачу, терапевту.",
        specialistOptions: ["Терапевт"],
        pdfPage: 7,
        bookPage: 11,
      }),
      "hypothyroidism-appointment": result({
        id: "hypothyroidism-appointment",
        route: "Запись на прием к врачу",
        bookText: "Подобными симптомами обычно проявляет себя заболевание щитовидной железы — гипотиреоз. Эта болезнь требует обязательного лечения. Обратитесь к терапевту или эндокринологу.",
        specialistOptions: ["Терапевт", "Эндокринолог"],
        pdfPage: 7,
        bookPage: 11,
      }),
      "anemia-appointment": result({
        id: "anemia-appointment",
        route: "Запись на прием к врачу",
        bookText: "Такие симптомы характерны для анемии — состояния дефицита гемоглобина в крови. Такое состояние является следствием серьезных нарушений в работе организма человека и требует обязательного обследования, которое назначит терапевт.",
        specialistOptions: ["Терапевт"],
        pdfPage: 7,
        bookPage: 11,
      }),
      "smoking-home-care": result({
        id: "smoking-home-care",
        route: "Помощь в домашних условиях",
        bookText: "У курильщиков с длительным стажем курения развивается хроническая интоксикация угарным газом. При отказе от курения состояние нормализуется. При невозможности самостоятельно бросить курить следует прибегнуть к помощи терапевта или психиатра-нарколога.",
        specialistOptions: ["Терапевт", "Психиатр-нарколог"],
        followUpAfterHours: 24,
        pdfPage: 8,
        bookPage: 12,
      }),
      "alcohol-home-care": result({
        id: "alcohol-home-care",
        route: "Помощь в домашних условиях",
        bookText: "Регулярный прием алкоголя, даже в небольших дозах, может быть причиной состояния слабости. Отказ от алкоголя нормализует состояние. Важно помнить, что чрезмерное употребление спиртных напитков может вызвать алкогольную зависимость. Если самостоятельный отказ от употребления алкоголя затруднителен, стоит обратиться за помощью к психиатру-наркологу.",
        specialistOptions: ["Психиатр-нарколог"],
        followUpAfterHours: 24,
        pdfPage: 8,
        bookPage: 12,
      }),
      "medication-appointment": result({
        id: "medication-appointment",
        route: "Запись на прием к врачу",
        bookText: "Общее недомогание может быть побочным действием приема некоторых лекарственных препаратов. Лечащий врач или терапевт помогут откорректировать схему лечения.",
        specialistOptions: ["Терапевт"],
        pdfPage: 8,
        bookPage: 12,
      }),
      "weakness-fallback": result({
        id: "weakness-fallback",
        route: "Необходима консультация врача",
        bookText: "Если состояние здоровья по данной схеме оценить не удалось, обратитесь к терапевту.",
        specialistOptions: ["Терапевт"],
        pdfPage: 8,
        bookPage: 12,
      }),
    }),
  }),
  ...ADDITIONAL_VERIFIED_SYMPTOM_GUIDE_SCHEMES,
});
