export function normalizeText(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^\w\s]/gi, "") // remove punctuation safely
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

export function tokenizeNormalized(normalizedText: string): Set<string> {
  return new Set(normalizedText.split(" ").filter((w) => w.length >= 2));
}
