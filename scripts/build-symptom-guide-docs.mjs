import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  SYMPTOM_GUIDE_SCHEMES,
  SYMPTOM_GUIDE_SOURCE,
} from "../src/symptom-guide-data.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
  scriptDirectory,
  "../data/aidadoc-symptoms/flowcharts.md",
);

const expectedSections = { general: 23, male: 12, female: 14 };
const labels = {
  general: "Общие симптомы",
  male: "Мужские симптомы",
  female: "Женские симптомы",
};

if (SYMPTOM_GUIDE_SCHEMES.length !== 49) {
  throw new Error(`Ожидалось 49 схем, получено ${SYMPTOM_GUIDE_SCHEMES.length}`);
}

for (let index = 0; index < SYMPTOM_GUIDE_SCHEMES.length; index += 1) {
  if (SYMPTOM_GUIDE_SCHEMES[index].number !== index + 1) {
    throw new Error(`Нарушена нумерация у позиции ${index + 1}`);
  }
}

for (const [section, expected] of Object.entries(expectedSections)) {
  const actual = SYMPTOM_GUIDE_SCHEMES.filter(
    (scheme) => scheme.section === section,
  ).length;
  if (actual !== expected) {
    throw new Error(`${labels[section]}: ожидалось ${expected}, получено ${actual}`);
  }
}

const lines = [
  `# ${SYMPTOM_GUIDE_SOURCE.title}: каталог диагностических схем`,
  "",
  "Это входная смысловая разметка архивной книги 2021 года, а не клинически",
  "валидированный алгоритм. Здесь зафиксированы все 49 точек входа и вопросы,",
  "которые безопасно использовать для демонстрационного уточнения жалобы.",
  "Полная топология стрелок и книжные заключения не активируются без отдельного",
  "медицинского ревью.",
  "",
  "Общий стоп для каждой схемы: если человек не приходит в себя, не может",
  "нормально дышать, есть сильное кровотечение, судороги или резкое ухудшение,",
  "обычный опрос прекращается и показывается экстренный маршрут.",
  "",
];

for (const section of ["general", "male", "female"]) {
  lines.push(`## ${labels[section]}`, "");
  for (const scheme of SYMPTOM_GUIDE_SCHEMES.filter(
    (candidate) => candidate.section === section,
  )) {
    lines.push(
      `### Схема № ${scheme.number}. ${scheme.title}`,
      "",
      `Источник: книжные страницы ${scheme.pages}; PDF-страницы ${scheme.pdfPages}.`,
      "",
      scheme.description,
      "",
      "Входные формулировки:",
      "",
      ...scheme.primaryTerms.map((term) => `- ${term}`),
      "",
      "Уточняющие вопросы демонстрационного контура:",
      "",
      ...scheme.questions.map((question) => `- ${question}`),
      "",
      "Безопасный запасной конец: передать собранные ответы врачу; не ставить",
      "диагноз и не формировать лекарственное назначение по архивной разметке.",
      "",
    );
  }
}

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Создан ${outputPath}`);
