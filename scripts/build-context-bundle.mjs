import {
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const contextsRoot = resolve(projectRoot, "contexts");
const manifest = JSON.parse(
  readFileSync(resolve(contextsRoot, "manifest.json"), "utf8"),
);

const requiredFields = [
  "id",
  "version",
  "direction",
  "channels",
  "priority",
  "mode",
  "owner",
];
const directions = new Set(["inbound", "outbound", "both"]);
const channels = new Set(["*", "web", "api", "ai", "integration"]);
const modes = new Set(["blocking", "advisory"]);

function listMarkdownFiles(directory) {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = resolve(directory, entry);
      if (statSync(path).isDirectory()) return listMarkdownFiles(path);
      return entry.endsWith(".md") && entry !== "README.md" ? [path] : [];
    })
    .sort();
}

function parseFrontmatter(source, path) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${path}: отсутствует frontmatter`);

  const metadata = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`${path}: неверная строка "${line}"`);
    metadata[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim();
  }

  for (const field of requiredFields) {
    if (!metadata[field]) throw new Error(`${path}: отсутствует ${field}`);
  }

  metadata.channels = metadata.channels
    .split(",")
    .map((channel) => channel.trim());
  metadata.priority = Number(metadata.priority);

  if (!directions.has(metadata.direction)) {
    throw new Error(`${path}: неизвестный direction ${metadata.direction}`);
  }
  if (metadata.channels.some((channel) => !channels.has(channel))) {
    throw new Error(`${path}: неизвестный channel`);
  }
  if (!Number.isInteger(metadata.priority)) {
    throw new Error(`${path}: priority должен быть целым числом`);
  }
  if (!modes.has(metadata.mode)) {
    throw new Error(`${path}: неизвестный mode ${metadata.mode}`);
  }

  const content = match[2].trim();
  for (const heading of ["# ", "## "]) {
    if (!content.includes(heading)) {
      throw new Error(`${path}: политика должна содержать ${heading.trim()}`);
    }
  }

  return { metadata, content };
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const ids = new Set();
const policies = listMarkdownFiles(contextsRoot)
  .map((path) => {
    const source = readFileSync(path, "utf8");
    const { metadata, content } = parseFrontmatter(source, path);
    if (ids.has(metadata.id)) {
      throw new Error(`Повторяющийся policy id: ${metadata.id}`);
    }
    ids.add(metadata.id);
    return {
      ...metadata,
      path: relative(contextsRoot, path),
      content,
      hash: sha256(JSON.stringify({ metadata, content })),
    };
  })
  .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));

const hashInput = JSON.stringify({
  schemaVersion: manifest.schemaVersion,
  bundleVersion: manifest.bundleVersion,
  policies,
});
const bundle = {
  ...manifest,
  bundleHash: sha256(hashInput),
  policies,
};

const outputDirectory = resolve(projectRoot, "generated");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  resolve(outputDirectory, "context-bundle.json"),
  `${JSON.stringify(bundle, null, 2)}\n`,
  "utf8",
);

console.log(
  `cBridge: собрано ${policies.length} политик, bundle ${bundle.bundleVersion}, hash ${bundle.bundleHash.slice(0, 12)}…`,
);
