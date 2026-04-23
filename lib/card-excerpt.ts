const SECTION_HEADING_RE = /^(?:main features|features|key features|highlights|benefits|overview|details|summary|notes)\s*:?$/i;
const SECTION_PREFIX_RE = /^(?:main features|features|key features|highlights|benefits|overview|details|summary|notes)\s*:\s*/i;
const BULLET_LINE_RE = /^(?:[-–—•*·]+|\d+[.)])\s+/;

function isNoiseLine(line: string) {
  const trimmed = line.trim();

  if (!trimmed) return true;
  if (BULLET_LINE_RE.test(trimmed)) return true;
  if (SECTION_HEADING_RE.test(trimmed)) return true;
  if (/^[\s\-–—•*·:,.!?]+$/.test(trimmed)) return true;

  return false;
}

function normalizeCardDescription(description: string) {
  return description
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !isNoiseLine(line))
    .filter((line) => !SECTION_PREFIX_RE.test(line))
    .join(" ")
    .replace(/[•·●▪◦*]+/g, " ")
    .replace(/[-–—]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCardExcerpt(description: string): string {
  const cleaned = normalizeCardDescription(description);

  if (!cleaned) return "";

  const firstSentence = cleaned.split(".")[0]?.trim() ?? "";

  if (firstSentence.length >= 40 && firstSentence.length <= 140) {
    return firstSentence;
  }

  if (cleaned.length <= 140) {
    return cleaned;
  }

  return `${cleaned.slice(0, 140).trimEnd()}…`;
}
