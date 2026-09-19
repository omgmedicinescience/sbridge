const VERIFIED_SOURCE = Object.freeze({
  title: "«Путеводитель по симптомам»",
  publisher: "ООО «Айдадок»",
  year: 2021,
  sha256: "c5fb9e18830064372481981746ff7aefcb1e765f08f64a5838c61e69ee849659",
  status: "source-verified-demo",
});

const ref = (pdfPage, bookPage) => Object.freeze({ pdfPage, bookPage });

const severityForRoute = (route) => {
  if (route === "Немедленный вызов скорой помощи") return "emergency";
  if (route === "Срочный вызов врача") return "urgent";
  if (route === "Помощь в домашних условиях") return "self";
  return "planned";
};

const outcome = ({
  id,
  route,
  bookText,
  specialistOptions,
  pdfPage,
  bookPage,
  followUpAfterHours,
}) => Object.freeze({
  id,
  route,
  severity: severityForRoute(route),
  bookText,
  specialistOptions: Object.freeze(specialistOptions),
  ...(followUpAfterHours ? { followUpAfterHours } : {}),
  publishable: false,
  source: ref(pdfPage, bookPage),
});

const makeScheme = ({
  id,
  number,
  title,
  bookPages,
  pdfPages,
  entryText,
  topics,
  groups,
  results,
}) => {
  const topicList = topics.map((topic, index) => {
    const nextTopic = topics[index + 1];
    return Object.freeze({
      id: topic.id,
      ...(topic.factId ? { factId: topic.factId } : {}),
      text: topic.text,
      yes: Object.freeze(topic.yes),
      no: Object.freeze(nextTopic
        ? { kind: "next", target: nextTopic.id }
        : { kind: "result", target: `${id}-fallback` }),
      source: ref(topic.pdfPage, topic.bookPage),
    });
  });

  return Object.freeze({
    id,
    number,
    title,
    section: "general",
    source: Object.freeze({
      ...VERIFIED_SOURCE,
      bookPages,
      pdfPages: Object.freeze(pdfPages),
      verifiedAgainstImages: true,
    }),
    entryText,
    firstOrder: Object.freeze(topicList),
    groups: Object.freeze(Object.fromEntries(groups.map((group) => [
      group.id,
      Object.freeze({
        id: group.id,
        order: group.order || "first",
        threshold: group.threshold,
        result: group.result,
        otherwise: group.otherwise || topics.at(-1).id,
        label: group.label,
        source: ref(group.pdfPage, group.bookPage),
        members: Object.freeze(group.members.map((member) => Object.freeze(member))),
      }),
    ]))),
    results: Object.freeze(Object.fromEntries(results.map((item) => [
      item.id,
      item.source ? item : outcome(item),
    ]))),
  });
};

const groupTopic = (id, text, groupId, pdfPage, bookPage) => ({
  id,
  text,
  yes: { kind: "group", target: groupId },
  pdfPage,
  bookPage,
});

const resultTopic = (id, factId, text, resultId, pdfPage, bookPage) => ({
  id,
  factId,
  text,
  yes: { kind: "result", target: resultId },
  pdfPage,
  bookPage,
});

const transitionTopic = (id, factId, text, targetSchemeNumber, pdfPage, bookPage) => ({
  id,
  factId,
  text,
  yes: { kind: "transition", targetSchemeNumber },
  pdfPage,
  bookPage,
});

const member = (id, factId, text) => ({ id, factId, text });

export const ADDITIONAL_VERIFIED_SYMPTOM_GUIDE_SCHEMES = Object.freeze({
  "weight-loss": makeScheme({
    id: "weight-loss",
    number: 3,
    title: "Потеря веса",
    bookPages: "16-17",
    pdfPages: [10],
    entryText: "Потеря веса без каких-либо усилий является серьезным поводом провести полное обследование своего здоровья",
    topics: [
      groupTopic("appetite-unchanged", "Аппетит не изменился", "thyrotoxicosis-symptoms", 10, 16),
      groupTopic("diabetes-group", "Два и более из симптомов возможного сахарного диабета", "diabetes-symptoms", 10, 16),
      groupTopic("digestive-group", "Один и более из симптомов со стороны желудочно-кишечного тракта", "digestive-symptoms", 10, 17),
      groupTopic("lung-infection-group", "Два и более из симптомов возможной легочной инфекции", "lung-infection-symptoms", 10, 17),
      groupTopic("depression-group", "Два и более из симптомов снижения настроения", "depression-symptoms", 10, 17),
    ],
    groups: [
      {
        id: "thyrotoxicosis-symptoms", order: "second", threshold: 2,
        result: "thyrotoxicosis-appointment", label: "Два и более из симптомов", pdfPage: 10, bookPage: 16,
        members: [
          member("palpitations", "current.palpitations.increased", "усиленное сердцебиение"),
          member("irritability", "current.irritability_or_mood_swings.present", "раздражительность, перепады настроения"),
          member("hot-skin", "current.skin.hot", "горячая кожа"),
          member("tremor", "current.tremor.present", "дрожь"),
          member("muscle-weakness", "current.muscle_weakness.present", "мышечная слабость"),
          member("sleep-attention", "current.sleep_or_attention.disorder", "нарушения сна и/или внимания"),
        ],
      },
      {
        id: "diabetes-symptoms", threshold: 2, result: "diabetes-appointment",
        label: "Два и более из симптомов", pdfPage: 10, bookPage: 16,
        members: [
          member("dry-mouth", "current.dry_mouth.present", "сухость во рту"),
          member("frequent-urination", "current.urination.frequent", "учащенное мочеиспускание"),
          member("constant-thirst", "current.thirst.constant", "постоянная жажда"),
          member("unexplained-fatigue", "current.fatigue.unexplained", "беспричинная усталость"),
          member("skin-itch", "current.skin_or_perineum.itch", "кожный зуд или зуд промежности"),
          member("slow-healing", "current.wounds.slow_healing", "труднозаживающие ранки и язвы"),
        ],
      },
      {
        id: "digestive-symptoms", threshold: 1, result: "digestive-appointment",
        label: "Один и более из симптомов", pdfPage: 10, bookPage: 17,
        members: [
          member("alternating-constipation", "current.bowel.constipation_alternating", "чередующиеся запоры"),
          member("recurrent-diarrhea", "current.bowel.diarrhea_recurrent", "повторяющиеся приступы поноса"),
          member("abdominal-cramps", "current.abdominal.cramping_pain", "спастические боли в животе"),
          member("blood-in-stool", "current.stool.blood", "кровь в кале"),
        ],
      },
      {
        id: "lung-infection-symptoms", threshold: 2, result: "lung-infection-urgent",
        label: "Два и более из симптомов", pdfPage: 10, bookPage: 17,
        members: [
          member("night-sweats", "current.sweating.night_profuse", "обильная потливость по ночам"),
          member("high-temperature", "current.temperature.high", "высокая температура тела"),
          member("cough", "current.cough.present", "кашель"),
          member("blood-in-sputum", "current.sputum.blood", "кровь в мокроте"),
        ],
      },
      {
        id: "depression-symptoms", threshold: 2, result: "depression-appointment",
        label: "Два и более из симптомов", pdfPage: 10, bookPage: 17,
        members: [
          member("low-mood", "current.mood.low", "подавленное настроение"),
          member("poor-concentration", "current.concentration_or_decision.difficulty", "неспособность сосредоточиться или принять решение"),
          member("low-libido", "current.libido.decreased", "снижение полового влечения"),
          member("lost-interest", "current.interest.loss", "потеря интереса к ранее любимым занятиям"),
        ],
      },
    ],
    results: [
      outcome({ id: "thyrotoxicosis-appointment", route: "Запись на прием к врачу", bookText: "Так может проявляться заболевание щитовидной железы — тиреотоксикоз. Для уточнения диагноза нужно пройти обследование, которое назначит терапевт или эндокринолог.", specialistOptions: ["Терапевт", "Эндокринолог"], pdfPage: 10, bookPage: 16 }),
      outcome({ id: "diabetes-appointment", route: "Запись на прием к врачу", bookText: "Возможной причиной потери веса может быть аутоиммунное заболевание — сахарный диабет 1-го типа. Необходимое обследование назначит терапевт или эндокринолог.", specialistOptions: ["Терапевт", "Эндокринолог"], pdfPage: 10, bookPage: 16 }),
      outcome({ id: "digestive-appointment", route: "Запись на прием к врачу", bookText: "Причиной резкой потери веса часто являются заболевания желудочно-кишечного тракта. Кроме того, таким образом могут проявлять себя онкологические заболевания органов брюшной полости. Необходимое обследование назначит терапевт.", specialistOptions: ["Терапевт"], pdfPage: 10, bookPage: 17 }),
      outcome({ id: "lung-infection-urgent", route: "Срочный вызов врача", bookText: "Подобные симптомы говорят о легочной инфекции, возможно, о туберкулезе. Своевременно проведенное лечение способствует полному выздоровлению. Обратитесь к терапевту.", specialistOptions: ["Терапевт"], pdfPage: 10, bookPage: 17 }),
      outcome({ id: "depression-appointment", route: "Запись на прием к врачу", bookText: "Депрессия — психическое расстройство, которое требует комплексного лечения. Важно не затягивая обратиться за помощью к психотерапевту или психиатру.", specialistOptions: ["Психотерапевт", "Психиатр"], pdfPage: 10, bookPage: 17 }),
      outcome({ id: "weight-loss-fallback", route: "Необходима консультация врача", bookText: "Резкая потеря веса — всегда тревожный симптом. Если установить причину подобного состояния не удалось, в ближайшее время обязательно проконсультируйтесь с терапевтом.", specialistOptions: ["Терапевт"], pdfPage: 10, bookPage: 17 }),
    ],
  }),

  fever: makeScheme({
    id: "fever", number: 4, title: "Высокая температура тела", bookPages: "18-19", pdfPages: [11],
    entryText: "Температура тела выше 38,5 °C в течение 3 дней и более всегда сигнализирует о заболевании",
    topics: [
      groupTopic("respiratory-group", "Два и более из симптомов со стороны органов дыхания", "respiratory-symptoms", 11, 18),
      resultTopic("strong-abdominal-back-pain", "current.strong_abdominal_or_back_pain.present", "Сильная боль в животе или спине", "internal-emergency", 11, 18),
      groupTopic("strong-headache", "Сильная головная боль", "meningitis-symptoms", 11, 18),
      groupTopic("cold-season", "Холодное время года", "viral-symptoms", 11, 18),
      transitionTopic("sore-throat", "current.sore_throat.present", "Боль в горле", 11, 11, 19),
      transitionTopic("joint-pain", "current.joint_pain.present", "Боль в суставах", 22, 11, 19),
      resultTopic("foreign-travel", "history.travel_abroad.last_3_months", "Поездки за границу в последние три месяца", "tropical-emergency", 11, 19),
      resultTopic("recent-procedures", "history.medical_procedures.recent", "Недавно проведенные медицинские манипуляции", "post-procedure-emergency", 11, 19),
      resultTopic("age-over-60", "profile.age.over_60", "Возраст старше 60 лет", "older-person-urgent", 11, 19),
    ],
    groups: [
      { id: "respiratory-symptoms", threshold: 2, result: "respiratory-urgent", label: "Два и более из симптомов", pdfPage: 11, bookPage: 18, members: [member("productive-cough", "current.cough.productive", "кашель с мокротой"), member("pleuritic-pain", "current.chest_pain.on_breath_or_cough", "боль в груди при вдохе/кашле"), member("breathing-difficulty", "current.breathing_difficulty.present", "затрудненное дыхание")] },
      { id: "meningitis-symptoms", order: "second", threshold: 1, result: "meningitis-emergency", label: "Один и более из симптомов", pdfPage: 11, bookPage: 18, members: [member("neck-tension", "current.neck.muscle_tension", "мышечное напряжение шеи"), member("vision-photophobia", "current.vision_disorder_or_photophobia.present", "нарушения зрения / светобоязнь"), member("nausea", "current.nausea.present", "тошнота")] },
      { id: "viral-symptoms", order: "second", threshold: 2, result: "viral-urgent", label: "Два и более из симптомов", pdfPage: 11, bookPage: 18, members: [member("frontal-headache", "current.headache.frontal", "боль в лобной части головы"), member("muscle-joint-pain", "current.muscle_or_joint_pain.present", "боль в мышцах и суставах"), member("nasal-congestion", "current.nose.congestion_or_rhinitis", "заложенность носа / насморк"), member("cough", "current.cough.present", "кашель"), member("photophobia", "current.photophobia.present", "светобоязнь")] },
    ],
    results: [
      outcome({ id: "respiratory-urgent", route: "Срочный вызов врача", bookText: "Вероятность заболевания органов дыхания (пневмония, острый бронхит или ХОБЛ в стадии обострения). Такое состояние может возникнуть на фоне ослабленного иммунитета, в том числе как осложнение ОРВИ.", specialistOptions: ["Терапевт"], pdfPage: 11, bookPage: 18 }),
      outcome({ id: "internal-emergency", route: "Немедленный вызов скорой помощи", bookText: "Сильная, порой нестерпимая боль с подъемом температуры сигнализирует о развитии угрожающего жизни состояния или об обострении заболеваний внутренних органов.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 11, bookPage: 18 }),
      outcome({ id: "meningitis-emergency", route: "Немедленный вызов скорой помощи", bookText: "Вероятность развития менингита — воспаления оболочек головного и спинного мозга. Заболевание отличается стремительным развитием и большой вероятностью летального исхода. Требуется молниеносная госпитализация.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 11, bookPage: 18 }),
      outcome({ id: "viral-urgent", route: "Срочный вызов врача", bookText: "Скорее всего, простудное заболевание — ОРВИ (острое респираторно-вирусное заболевание). В первые 48 часов после появления симптомов нужно принять противовирусный препарат. Также показаны постельный режим, обильное питье и жаропонижающее средство при температуре тела выше 38,5 °C. Если в течение 3 дней состояние не улучшилось, нужно вызвать дежурного врача.", specialistOptions: ["Терапевт"], pdfPage: 11, bookPage: 18 }),
      outcome({ id: "tropical-emergency", route: "Немедленный вызов скорой помощи", bookText: "Возможно заражение редкими формами тропических заболеваний.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 11, bookPage: 19 }),
      outcome({ id: "post-procedure-emergency", route: "Немедленный вызов скорой помощи", bookText: "Температура тела до 38 °C после медицинских манипуляций — допустимый ответ организма. Если температура тела в течение 3 дней не пришла в норму или повысилась, то возможно развитие осложнений. Срочно обратитесь к лечащему врачу или, при невозможности, вызовите скорую помощь.", specialistOptions: ["Лечащий врач", "Скорая медицинская помощь"], pdfPage: 11, bookPage: 19 }),
      outcome({ id: "older-person-urgent", route: "Срочный вызов врача", bookText: "Высокая температура тела у пожилых людей — часто единственный симптом обострения заболеваний внутренних органов или инфекционно-воспалительных процессов.", specialistOptions: ["Терапевт"], pdfPage: 11, bookPage: 19 }),
      outcome({ id: "fever-fallback", route: "Необходима консультация врача", bookText: "Высокая температура — серьезный повод вызвать врача на дом.", specialistOptions: ["Терапевт"], pdfPage: 11, bookPage: 19 }),
    ],
  }),

  headache: makeScheme({
    id: "headache", number: 6, title: "Головная боль", bookPages: "24-25", pdfPages: [14],
    entryText: "Головную боль никогда нельзя лечить самостоятельно",
    topics: [
      resultTopic("head-trauma", "history.tbi.present", "Боли предшествовала черепно-мозговая травма", "post-trauma-emergency", 14, 24),
      transitionTopic("fever-38", "current.temperature.at_least_38", "Температура тела 38 °C и выше", 4, 14, 24),
      groupTopic("bursting-headache", "Сильная головная боль распирающего характера", "meningeal-symptoms", 14, 24),
      resultTopic("neck-pain", "current.neck.pain_on_turn", "Дискомфорт и/или боль в шее при поворотах головы", "neck-appointment", 14, 24),
      groupTopic("sinus-group", "Один и более из симптомов околоносовых пазух", "sinus-symptoms", 14, 25),
      resultTopic("tension", "current.headache.after_strain", "Головная боль появилась после физического или психоэмоционального напряжения", "tension-home-care", 14, 25),
      resultTopic("high-bp", "measurement.bp.at_least_140_90", "При измерении артериального давления зафиксированы показатели 140–160/90–95 мм рт. ст. и выше", "pressure-urgent", 14, 25),
      resultTopic("migraine", "current.headache.migraine_pattern", "Сильная пульсирующая боль половины головы длительностью от 4 до 72 часов с непереносимостью яркого света, громких звуков или насыщенных запахов", "migraine-appointment", 14, 25),
      resultTopic("medications", "history.medications.current", "В настоящее время прием каких-либо лекарственных препаратов", "medication-appointment", 14, 25),
    ],
    groups: [
      { id: "meningeal-symptoms", order: "second", threshold: 1, result: "meningitis-emergency", label: "Один и более из симптомов", pdfPage: 14, bookPage: 24, members: [member("neck-tension", "current.neck.muscle_tension", "мышечное напряжение шеи"), member("vision-photophobia", "current.vision_disorder_or_photophobia.present", "нарушения зрения и/или светобоязнь"), member("phonophobia", "current.phonophobia.present", "звукобоязнь")] },
      { id: "sinus-symptoms", threshold: 1, result: "sinus-appointment", label: "Один и более из симптомов", pdfPage: 14, bookPage: 25, members: [member("nasal-congestion", "current.nose.congestion", "заложенность носа"), member("face-pain", "current.face.pain", "боль в области лица"), member("position-pain", "current.headache.worse_with_position", "усиление боли при смене положения головы")] },
    ],
    results: [
      outcome({ id: "post-trauma-emergency", route: "Немедленный вызов скорой помощи", bookText: "Посттравматические головные боли могут сигнализировать о серьезном осложнении полученной травмы головы.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 14, bookPage: 24 }),
      outcome({ id: "meningitis-emergency", route: "Немедленный вызов скорой помощи", bookText: "Вероятность развития менингита — инфекционного воспаления оболочек головного и спинного мозга. Требуется немедленная госпитализация. При несвоевременном лечении болезнь приводит к инвалидизации или летальному исходу.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 14, bookPage: 24 }),
      outcome({ id: "neck-appointment", route: "Запись на прием к врачу", bookText: "Головная боль может развиться на фоне мышечно-тонического синдрома (напряжения мышц затылка и шеи). Тактику лечения определит терапевт или невролог.", specialistOptions: ["Терапевт", "Невролог"], pdfPage: 14, bookPage: 24 }),
      outcome({ id: "sinus-appointment", route: "Запись на прием к врачу", bookText: "Вероятной причиной головной боли является синусит — воспаление слизистых оболочек околоносовых пазух. Лечение назначит оториноларинголог.", specialistOptions: ["Оториноларинголог"], pdfPage: 14, bookPage: 25 }),
      outcome({ id: "tension-home-care", route: "Помощь в домашних условиях", bookText: "Головная боль напряжения может быть следствием тяжелой физической работы или стресса. При нормализации ситуации состояние улучшится. Если этого не произошло, нужно обратиться к терапевту или неврологу.", specialistOptions: ["Терапевт", "Невролог"], followUpAfterHours: 24, pdfPage: 14, bookPage: 25 }),
      outcome({ id: "pressure-urgent", route: "Срочный вызов врача", bookText: "Гипертонический криз — основной признак развивающейся гипертонической болезни. Без оказания срочной медикаментозной помощи может стать причиной серьезных осложнений. После купирования приступа пациенту важно как можно скорее записаться на прием к терапевту или кардиологу.", specialistOptions: ["Терапевт", "Кардиолог"], pdfPage: 14, bookPage: 25 }),
      outcome({ id: "migraine-appointment", route: "Запись на прием к врачу", bookText: "Такие симптомы характерны для приступа мигрени. Необходимое лечение назначит терапевт или невролог.", specialistOptions: ["Терапевт", "Невролог"], pdfPage: 14, bookPage: 25 }),
      outcome({ id: "medication-appointment", route: "Запись на прием к врачу", bookText: "Головная боль может быть побочным действием приема некоторых лекарственных средств. Обсудите схему лечения с лечащим врачом или терапевтом.", specialistOptions: ["Лечащий врач", "Терапевт"], pdfPage: 14, bookPage: 25 }),
      outcome({ id: "headache-fallback", route: "Необходима консультация врача", bookText: "Если установить предполагаемую причину головной боли не удалось, обратитесь к терапевту.", specialistOptions: ["Терапевт"], pdfPage: 14, bookPage: 25 }),
    ],
  }),

  dizziness: makeScheme({
    id: "dizziness", number: 7, title: "Головокружение", bookPages: "26-27", pdfPages: [15],
    entryText: "Головокружением называют патологическое состояние, связанное с нарушением равновесия",
    topics: [
      resultTopic("head-trauma", "history.tbi.present", "Головокружению предшествовала черепно-мозговая травма", "post-trauma-emergency", 15, 26),
      groupTopic("neuro-group", "Один и более из неврологических симптомов", "neuro-symptoms", 15, 26),
      resultTopic("symptoms-resolved", "current.neuro_symptoms.resolved", "В настоящий момент симптомы прошли", "tia-emergency", 15, 26),
      resultTopic("neck-pain", "current.neck_or_occiput.pain_on_turn", "Дискомфорт и/или боль в шее и/или затылочной области при поворотах головы", "neck-appointment", 15, 26),
      resultTopic("high-bp", "measurement.bp.at_least_140_90", "При измерении артериального давления зафиксированы показатели 140–160/90–95 мм рт. ст. и выше", "pressure-urgent", 15, 27),
      resultTopic("low-bp", "measurement.bp.at_most_100_60", "При измерении артериального давления зафиксированы показатели 100/60 мм рт. ст. и ниже", "low-pressure-home-care", 15, 27),
      groupTopic("anemia-group", "Один и более из симптомов возможной анемии", "anemia-symptoms", 15, 27),
      resultTopic("hearing", "current.hearing.partial_loss_or_tinnitus", "Частичная потеря слуха и/или сильный шум в ушах", "meniere-appointment", 15, 27),
    ],
    groups: [
      { id: "neuro-symptoms", threshold: 1, result: "stroke-emergency", label: "Один и более из симптомов", pdfPage: 15, bookPage: 26, members: [member("speech", "current.speech.disorder", "нарушение речи"), member("vision-loss", "current.vision.temporary_partial_or_total_loss", "временная частичная или полная потеря зрения"), member("hemibody", "current.hemibody.weakness_or_numbness", "слабость, онемение половины тела")] },
      { id: "anemia-symptoms", threshold: 1, result: "anemia-appointment", label: "Один и более из симптомов", pdfPage: 15, bookPage: 27, members: [member("pallor", "current.pallor.present", "бледность"), member("weakness", "current.weakness.present", "слабость"), member("minimal-dyspnea", "current.dyspnea.minimal_activity", "одышка при минимальной активности"), member("palpitations", "current.palpitations.increased", "усиленное сердцебиение")] },
    ],
    results: [
      outcome({ id: "post-trauma-emergency", route: "Немедленный вызов скорой помощи", bookText: "Посттравматические головокружения могут быть симптомом серьезного осложнения травмы головы.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 15, bookPage: 26 }),
      outcome({ id: "stroke-emergency", route: "Немедленный вызов скорой помощи", bookText: "Причиной подобного состояния может быть инсульт — необратимое нарушение кровообращения головного мозга, при котором требуется экстренная госпитализация. При звонке в службу скорой помощи важно сообщить о подозрении на инсульт. До приезда медиков нужно оставаться в горизонтальном положении.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 15, bookPage: 26 }),
      outcome({ id: "tia-emergency", route: "Немедленный вызов скорой помощи", bookText: "Скорее всего, транзиторная ишемическая атака — преходящее острое нарушение кровоснабжения головного мозга. Без медицинской помощи грозит быстрым развитием инсульта. При вызове скорой помощи следует сообщить о подозрении на инсульт.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 15, bookPage: 26 }),
      outcome({ id: "neck-appointment", route: "Запись на прием к врачу", bookText: "Головокружения могут развиться на фоне мышечно-тонического синдрома (напряжения мышц затылка и шеи). Тактику лечения определит терапевт или невролог.", specialistOptions: ["Терапевт", "Невролог"], pdfPage: 15, bookPage: 26 }),
      outcome({ id: "pressure-urgent", route: "Срочный вызов врача", bookText: "Вероятность развития гипертонического криза. Такое состояние требует срочной медикаментозной помощи. После купирования приступа пациенту нужно в кратчайший срок попасть на прием к терапевту или кардиологу для коррекции лечения.", specialistOptions: ["Терапевт", "Кардиолог"], pdfPage: 15, bookPage: 27 }),
      outcome({ id: "low-pressure-home-care", route: "Помощь в домашних условиях", bookText: "Вероятность артериальной гипотензии — эпизода пониженного давления, при котором бывает головокружение. Средством первой помощи является долька черного шоколада или чашка свежезаваренного крепкого чая или кофе. Если домашние меры не помогают, нужно проконсультироваться с терапевтом.", specialistOptions: ["Терапевт"], followUpAfterHours: 24, pdfPage: 15, bookPage: 27 }),
      outcome({ id: "anemia-appointment", route: "Запись на прием к врачу", bookText: "Такие симптомы характерны для анемии — состояния дефицита гемоглобина в крови. Анемия всегда является следствием серьезного заболевания или травмы. Необходимое обследование и лечение назначит терапевт.", specialistOptions: ["Терапевт"], pdfPage: 15, bookPage: 27 }),
      outcome({ id: "meniere-appointment", route: "Запись на прием к врачу", bookText: "Причиной головокружения может быть увеличение количества жидкости в ушном лабиринте — болезнь Меньера. Данное заболевание может стать причиной глухоты и требует лечения у отоневролога.", specialistOptions: ["Отоневролог"], pdfPage: 15, bookPage: 27 }),
      outcome({ id: "dizziness-fallback", route: "Необходима консультация врача", bookText: "Если предположить причину головокружения по данной схеме не удалось, обратитесь к терапевту.", specialistOptions: ["Терапевт"], pdfPage: 15, bookPage: 27 }),
    ],
  }),

  hoarseness: makeScheme({
    id: "hoarseness", number: 12, title: "Охриплость и потеря голоса", bookPages: "36-37", pdfPages: [20],
    entryText: "При возникновении таких симптомов, как потеря или охриплость голоса, нужно максимально быстро провести обследование",
    topics: [
      groupTopic("recent-onset", "Хрипота, осиплость или потеря голоса появились недавно", "stroke-symptoms", 20, 36),
      groupTopic("cold-symptoms-group", "В настоящее время или накануне простудное заболевание", "cold-symptoms", 20, 36),
      resultTopic("voice-overstrain", "history.voice.overstrain_yesterday", "Перенапряжение голоса накануне", "laryngitis-appointment", 20, 36),
      resultTopic("smoking-alcohol", "history.smoking_or_alcohol.heavy_yesterday", "Большое количество выкуриваемых сигарет и/или выпитого спиртного накануне", "chronic-laryngitis-appointment", 20, 37),
      groupTopic("thyroid-group", "Два или более из симптомов возможного гипотиреоза", "hypothyroid-symptoms", 20, 37),
    ],
    groups: [
      { id: "stroke-symptoms", order: "second", threshold: 1, result: "stroke-emergency", label: "Один и более из симптомов", pdfPage: 20, bookPage: 36, members: [member("choking", "current.choking.food_or_liquid", "поперхивание едой и/или речью"), member("slurred-speech", "current.speech.slurred", "речь звучит как с набитым ртом")] },
      { id: "cold-symptoms", threshold: 1, result: "laryngitis-appointment", label: "Один и более из симптомов", pdfPage: 20, bookPage: 36, members: [member("rhinitis", "current.rhinitis.present", "насморк"), member("dry-cough", "current.cough.dry", "сухой кашель"), member("dry-sore-throat", "current.throat.dry_or_sore", "чувство сухости, першения в горле")] },
      { id: "hypothyroid-symptoms", threshold: 2, result: "hypothyroid-appointment", label: "Два или более из симптомов", pdfPage: 20, bookPage: 37, members: [member("hair-loss", "current.hair_loss.present", "выпадение волос"), member("chilliness", "current.chilliness.present", "чувство зябкости"), member("dry-skin", "current.skin.dry_or_rough", "сухость и огрубение кожи"), member("fatigue", "current.lethargy_or_fatigue.present", "вялость, быстрая утомляемость"), member("weight-gain", "current.weight_gain.despite_diet", "увеличение веса при соблюдении диеты")] },
    ],
    results: [
      outcome({ id: "stroke-emergency", route: "Немедленный вызов скорой помощи", bookText: "Такими симптомами может проявляться острое нарушение мозгового кровообращения в стволе головного мозга. При звонке в скорую помощь необходимо сообщить о подозрении на инсульт.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 20, bookPage: 36 }),
      outcome({ id: "laryngitis-appointment", route: "Запись на прием к врачу", bookText: "Вероятнее всего, ларингит — воспаление слизистой оболочки гортани с вовлечением голосовых связок. Необходимо обеспечить полный покой для голосовых связок, не употреблять алкоголь и не курить. Если состояние не улучшается, нужно обратиться к оториноларингологу.", specialistOptions: ["Оториноларинголог"], pdfPage: 20, bookPage: 36 }),
      outcome({ id: "chronic-laryngitis-appointment", route: "Запись на прием к врачу", bookText: "К хроническому ларингиту — стойкому воспалению голосовых связок — могут привести курение и обильное употребление алкоголя. Стоит отказаться от пагубных привычек хотя бы на время лечения, которое назначит оториноларинголог. Однако стоит помнить, что при возобновлении курения и употребления алкоголя такое состояние может повториться и со временем приведет к постоянному повреждению голосовых связок.", specialistOptions: ["Оториноларинголог"], pdfPage: 20, bookPage: 37 }),
      outcome({ id: "hypothyroid-appointment", route: "Запись на прием к врачу", bookText: "Подобные симптомы характерны для гипотиреоза — заболевания щитовидной железы. Такое состояние требует обязательного лечения у эндокринолога. Также можно обратиться к терапевту.", specialistOptions: ["Эндокринолог", "Терапевт"], pdfPage: 20, bookPage: 37 }),
      outcome({ id: "hoarseness-fallback", route: "Необходима консультация врача", bookText: "Охриплость или потеря голоса, которые повторяются или длятся более двух недель, часто являются признаками серьезных заболеваний, в том числе новообразований. Обязательно проконсультируйтесь с терапевтом.", specialistOptions: ["Терапевт"], pdfPage: 20, bookPage: 37 }),
    ],
  }),

  breathing: makeScheme({
    id: "breathing", number: 13, title: "Нарушение дыхания", bookPages: "38-41", pdfPages: [21, 22],
    entryText: "Нарушения дыхания бывают как самостоятельным явлением, так и осложнением основного заболевания",
    topics: [
      resultTopic("foreign-body", "current.airway.foreign_body_suspected", "Подозрение на инородное тело в дыхательных путях", "foreign-body-emergency", 21, 38),
      resultTopic("angioedema", "current.face_or_airway.swelling", "Ощущение напряженного, увеличенного в размерах языка и/или отеки губ, век, у мужчин — мошонки", "angioedema-emergency", 21, 38),
      resultTopic("substances", "history.substances.before_breathing_disorder", "Нарушение дыхания наступило после приема наркотических средств, алкоголя или успокаивающих лекарственных препаратов", "substances-emergency", 21, 38),
      groupTopic("wheezing", "Хорошо слышное свистящее дыхание", "severe-wheeze-symptoms", 21, 38),
      resultTopic("exertional-orthopnea", "current.dyspnea.exertional_or_orthopnea", "Одышка при ранее привычной физической нагрузке и/или усиление одышки в горизонтальном положении (ортопноэ)", "cardiac-asthma-emergency", 21, 38),
      groupTopic("sudden-breathing", "Нарушение дыхания развилось внезапно", "acute-breathing-symptoms", 21, 39),
      transitionTopic("palpitations", "current.palpitations.increased", "Учащенное сердцебиение", 16, 21, 39),
      transitionTopic("chest-pain", "current.chest_pain.present", "Боль в груди", 17, 22, 40),
      groupTopic("infection-group", "Два и более из симптомов воспаления легочной ткани", "infection-symptoms", 22, 40),
      groupTopic("anemia-group", "Один и более из симптомов возможной анемии", "anemia-symptoms", 22, 40),
      groupTopic("embolism-risk-group", "Одна и более из ситуаций риска тромбоэмболии", "embolism-risk", 22, 40),
    ],
    groups: [
      { id: "severe-wheeze-symptoms", order: "second", threshold: 1, result: "bronchospasm-emergency", label: "Один и более из симптомов", pdfPage: 21, bookPage: 38, members: [member("harder-exhale", "current.exhalation.progressively_harder", "каждый новый выдох тяжелее предыдущего")] },
      { id: "acute-breathing-symptoms", order: "second", threshold: 1, result: "sudden-breathing-urgent", label: "Один и более из симптомов", pdfPage: 21, bookPage: 39, members: [member("tachypnea", "current.breathing.rapid", "учащенное дыхание"), member("air-hunger", "current.air_hunger.present", "чувство нехватки воздуха"), member("cannot-full-breath", "current.inhale.cannot_full", "невозможность вдохнуть полной грудью"), member("suffocation", "current.suffocation.present", "удушье")] },
      { id: "infection-symptoms", threshold: 2, result: "pneumonia-emergency", label: "Два и более из симптомов", pdfPage: 22, bookPage: 40, members: [member("cough", "current.cough.present", "кашель"), member("sputum", "current.sputum.present", "мокрота"), member("pleuritic-pain", "current.chest_pain.on_breath_or_cough", "боль в груди при вдохе/кашле"), member("fever", "current.temperature.high", "высокая температура тела")] },
      { id: "anemia-symptoms", threshold: 1, result: "anemia-appointment", label: "Один и более из симптомов", pdfPage: 22, bookPage: 40, members: [member("pallor", "current.pallor.present", "бледность"), member("weakness", "current.weakness.present", "слабость"), member("palpitations", "current.palpitations.increased", "усиленное сердцебиение")] },
      { id: "embolism-risk", threshold: 1, result: "embolism-emergency", label: "Одна и более из ситуаций", pdfPage: 22, bookPage: 40, members: [member("recent-surgery", "history.surgery.recent", "недавно проведенное хирургическое вмешательство"), member("recent-cardiovascular-hospitalization", "history.hospitalization.cardiovascular_last_3_months", "госпитализация в течение последних трех месяцев по поводу сердечно-сосудистых заболеваний"), member("vein-disease", "history.vein_disease.present", "диагностированные заболевания вен"), member("bed-rest", "history.bed_rest.prolonged", "длительный постельный режим")] },
    ],
    results: [
      outcome({ id: "foreign-body-emergency", route: "Немедленный вызов скорой помощи", bookText: "Механическая асфиксия — состояние, когда в трахею человека попало инородное тело. Если подавившийся не в состоянии откашляться, нужно немедленно применить прием Геймлиха и вызвать скорую помощь.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 21, bookPage: 38 }),
      outcome({ id: "angioedema-emergency", route: "Немедленный вызов скорой помощи", bookText: "Подобным образом развивается отек Квинке — острая аллергическая реакция, которая проявляется отеком гортани, языка, губ и прочих мягких тканей. Такое состояние является угрожающим жизни. До приезда медиков необходимо исключить контакт с аллергеном и принять антигистаминный препарат.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 21, bookPage: 38 }),
      outcome({ id: "substances-emergency", route: "Немедленный вызов скорой помощи", bookText: "Можно предположить угнетение деятельности дыхательного центра. Прием успокаивающих препаратов в высоких дозировках, некоторых наркотических веществ может приводить к резкому нарушению дыхания.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 21, bookPage: 38 }),
      outcome({ id: "bronchospasm-emergency", route: "Немедленный вызов скорой помощи", bookText: "Вероятность тяжелого приступа бронхоспазма — состояния, угрожающего жизни. До приезда медиков нужно расстегнуть тесную одежду и при наличии использовать ингалятор с бронхорасширяющим препаратом. Также важно сохранять спокойствие и обеспечить доступ свежего воздуха.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 21, bookPage: 38 }),
      outcome({ id: "cardiac-asthma-emergency", route: "Немедленный вызов скорой помощи", bookText: "Возможность развития состояния, угрожающего жизни, — кардиальной астмы (застоя жидкости в легких). До приезда медиков нужно обеспечить доступ свежего воздуха. Также важно сохранять спокойствие и принять сидячую позу с прямой спиной и опущенными на пол ногами.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 21, bookPage: 38 }),
      outcome({ id: "sudden-breathing-urgent", route: "Срочный вызов врача", bookText: "Внезапное нарушение дыхания требует неотложной медицинской помощи.", specialistOptions: ["Терапевт"], pdfPage: 22, bookPage: 40 }),
      outcome({ id: "pneumonia-emergency", route: "Немедленный вызов скорой помощи", bookText: "Можно предположить воспаление легочной ткани — пневмонию. Такое состояние может быть как осложнением ОРВИ, так и следствием более серьезных заболеваний.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 22, bookPage: 40 }),
      outcome({ id: "anemia-appointment", route: "Запись на прием к врачу", bookText: "Такие симптомы характерны для анемии — состояния дефицита гемоглобина в крови. Анемия является следствием серьезных заболеваний и требует обязательного комплексного лечения, которое назначит терапевт.", specialistOptions: ["Терапевт"], pdfPage: 22, bookPage: 40 }),
      outcome({ id: "embolism-emergency", route: "Немедленный вызов скорой помощи", bookText: "Наиболее вероятная причина нарушения дыхания — ТЭЛА (тромбоэмболия легочной артерии), состояние, которое является угрожающим жизни.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 22, bookPage: 40 }),
      outcome({ id: "breathing-fallback", route: "Необходима консультация врача", bookText: "При невозможности установить причину нарушенного дыхания срочно обратитесь к терапевту. Если симптомы нарастают, стоит вызвать скорую помощь.", specialistOptions: ["Терапевт"], pdfPage: 22, bookPage: 40 }),
    ],
  }),

  cough: makeScheme({
    id: "cough", number: 14, title: "Кашель", bookPages: "42-43", pdfPages: [22, 23],
    entryText: "Очень важно максимально быстро установить заболевание, симптомом которого является кашель",
    topics: [
      transitionTopic("hoarseness", "current.hoarseness_or_voice_loss.present", "Охриплость или потеря голоса", 12, 22, 41),
      resultTopic("dry-over-month", "current.cough.dry_over_month", "Сухой кашель беспокоит более месяца при отсутствии других жалоб", "long-dry-cough-appointment", 22, 41),
      transitionTopic("temperature-38", "current.temperature.at_least_38", "Температура тела 38 °C и выше", 4, 22, 41),
      groupTopic("cold-season", "Холодное время года", "viral-symptoms", 22, 41),
      resultTopic("productive-long", "current.cough.productive_long_morning", "Кашель с мокротой в течение длительного времени, особенно выражен по утрам", "bronchitis-appointment", 23, 42),
      transitionTopic("rest-dyspnea", "current.dyspnea.at_rest", "Одышка даже в спокойном состоянии, без физической нагрузки", 13, 23, 42),
      groupTopic("postnasal-group", "Кашель усиливается в горизонтальном положении", "postnasal-symptoms", 23, 42),
      resultTopic("heartburn", "current.reflux.heartburn_or_sour_burp", "Изжога и/или отрыжка кислым", "reflux-appointment", 23, 43),
      resultTopic("blood", "current.cough.blood", "Кашель с кровью", "bleeding-emergency", 23, 43),
      resultTopic("weekly-worse", "current.cough.worse_each_week", "С каждой неделей кашель усиливается", "progressive-cough-appointment", 23, 43),
      resultTopic("bp-medicines", "history.medications.antihypertensive", "Прием лекарственных препаратов, понижающих артериальное давление", "medication-appointment", 23, 43),
    ],
    groups: [
      { id: "viral-symptoms", order: "second", threshold: 2, result: "viral-urgent", label: "Два и более из симптомов", pdfPage: 23, bookPage: 42, members: [member("frontal-headache", "current.headache.frontal", "головная боль в лобной области"), member("muscle-joint-pain", "current.muscle_or_joint_pain.present", "боль в мышцах и суставах"), member("nasal-congestion", "current.nose.congestion_or_rhinitis", "заложенность носа и/или насморк"), member("photophobia", "current.photophobia.present", "светобоязнь")] },
      { id: "postnasal-symptoms", order: "second", threshold: 1, result: "postnasal-appointment", label: "Один и более из симптомов", pdfPage: 23, bookPage: 42, members: [member("nasal-congestion", "current.nose.congestion_or_rhinitis", "насморк / заложенность носа")] },
    ],
    results: [
      outcome({ id: "long-dry-cough-appointment", route: "Запись на прием к врачу", bookText: "Наиболее вероятная причина — ларингит (воспаление слизистой оболочки трахеи). Иногда длительный сухой кашель может быть симптомом новообразования, особенно при длительном стаже курения и возрасте старше 40 лет. Необходимое обследование назначит терапевт.", specialistOptions: ["Терапевт"], pdfPage: 22, bookPage: 41 }),
      outcome({ id: "viral-urgent", route: "Срочный вызов врача", bookText: "Предположительно, ОРВИ (острое респираторно-вирусное заболевание). В первые 48 часов после появления симптомов нужно принять любой противовирусный препарат. Также показаны постельный режим, обильное питье и жаропонижающие средства для снижения температуры тела выше 38 °C. Если состояние не улучшилось в течение 3 дней, стоит обратиться к терапевту.", specialistOptions: ["Терапевт"], pdfPage: 23, bookPage: 42 }),
      outcome({ id: "bronchitis-appointment", route: "Запись на прием к врачу", bookText: "Предположительно, хронический бронхит. Диагноз более вероятен, если имеется длительный стаж курения. Требуется консультация терапевта.", specialistOptions: ["Терапевт"], pdfPage: 23, bookPage: 42 }),
      outcome({ id: "postnasal-appointment", route: "Запись на прием к врачу", bookText: "Причиной кашля может быть постназальный затек, например вследствие синусита. Помощь окажет оториноларинголог.", specialistOptions: ["Оториноларинголог"], pdfPage: 23, bookPage: 42 }),
      outcome({ id: "reflux-appointment", route: "Запись на прием к врачу", bookText: "Скорее всего, ГЭРБ (гастроэзофагеальная рефлюксная болезнь) — хроническое заболевание верхних отделов желудочно-кишечного тракта. Развивается за счет обратного заброса кислого содержимого желудка в пищевод и без лечения может привести к онкологическим процессам пищевода. Лечение назначит терапевт или гастроэнтеролог.", specialistOptions: ["Терапевт", "Гастроэнтеролог"], pdfPage: 23, bookPage: 43 }),
      outcome({ id: "bleeding-emergency", route: "Немедленный вызов скорой помощи", bookText: "Угроза легочного кровотечения в результате бронхолегочных или сердечно-сосудистых заболеваний. До приезда медиков необходимо принять горизонтальное положение с приподнятой головой. Также следует сохранить образец мокроты с кровью.", specialistOptions: ["Скорая медицинская помощь"], pdfPage: 23, bookPage: 43 }),
      outcome({ id: "progressive-cough-appointment", route: "Запись на прием к врачу", bookText: "Длительный кашель без видимых причин может быть симптомом тяжелых заболеваний, в том числе туберкулеза или новообразований органов дыхания. Обратитесь за консультацией к терапевту.", specialistOptions: ["Терапевт"], pdfPage: 23, bookPage: 43 }),
      outcome({ id: "medication-appointment", route: "Запись на прием к врачу", bookText: "Побочное действие некоторых препаратов, понижающих артериальное давление, — сухой кашель. Обсудите с лечащим врачом или терапевтом схему лечения гипертонической болезни.", specialistOptions: ["Лечащий врач", "Терапевт"], pdfPage: 23, bookPage: 43 }),
      outcome({ id: "cough-fallback", route: "Необходима консультация врача", bookText: "Обратитесь к терапевту, если установить причину кашля по данной схеме не удалось.", specialistOptions: ["Терапевт"], pdfPage: 23, bookPage: 43 }),
    ],
  }),
});
