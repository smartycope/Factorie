export function downloadedFilename(name, extension) {
  const sanitized = String(name || "decision")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim()
    .replace(/\s+/g, " ")
  return `${sanitized || "decision"}.${extension}`
}

// Does NOT check for "" or 0
export function nully(value) {
  return value === undefined || value === null || isNaN(value)
}

export function percentile(arr, p) {
  const a = arr.slice().sort((x, y) => x - y)
  const idx = Math.floor((p / 100) * a.length)
  return a[Math.max(0, Math.min(a.length - 1, idx))]
}
