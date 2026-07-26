export function downloadedFilename(name, extension) {
  const sanitized = String(name || "decision")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .replace(/\s+/g, " ")
  return `${sanitized || "decision"}.${extension}`
}
