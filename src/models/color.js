export function normalizeColor(color) {
  if (typeof color !== "string") return null
  const match = color.trim().match(/^#?([0-9a-f]{6})$/i)
  return match ? `#${match[1].toUpperCase()}` : null
}
