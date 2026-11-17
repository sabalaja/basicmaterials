
import fs from "node:fs";
import path from "node:path";

const inputFile = "./translations.tsv";
const outputDir = "./locales";

const normalizeHeader = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_]+/g, "")
    .toUpperCase();

function generateTranslations() {
  const tsv = fs.readFileSync(inputFile, "utf8")
    .replace(/^\uFEFF/, "");

  const lines = tsv.split(/\r?\n/).filter(line => line.trim());

  const headers = lines.shift()
    .split("\t")
    .map(normalizeHeader);

  const expected = [
    "TOKEN",
    "TLUMACZENIEPOLSKIE",
    "TLUMACZENIEANGIELSKIE"
  ];

  if (headers.length !== 3 ||
      headers.some((header, i) => header !== expected[i])) {
    throw new Error("Nieprawidłowe nagłówki TSV");
  }

  const pl = {};
  const en = {};

  lines.forEach((line, index) => {
    const columns = line.split("\t");

    if (columns.length !== 3) {
      throw new Error(`Nieprawidłowy wiersz: ${index + 2}`);
    }

    const [key, polish, english] = columns.map(v => v.trim());

    if (!key || !polish || !english) {
      throw new Error(`Brak danych w wierszu: ${index + 2}`);
    }

    if (Object.hasOwn(pl, key)) {
      throw new Error(`Zduplikowany token: ${key}`);
    }

    pl[key] = polish;
    en[key] = english;
  });

  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "pl.json"),
    JSON.stringify(pl, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(outputDir, "en.json"),
    JSON.stringify(en, null, 2) + "\n",
    "utf8"
  );

  console.log(`Generated ${Object.keys(pl).length} translations`);
}

generateTranslations();
