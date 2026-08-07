export const SUGGESTED_UNITS = [
  "0-10 Scale",
  "0: No, 1: Yes",
  "0: Small, 1: Medium, 2: Large",
  "-1: Disagree, 0: Neutral, 1: Agree",
]

const SUGGESTED_UNIT_MIN_MAX = {
  "0-10 scale": [0, 10],
  "0: no, 1: yes": [0, 1],
  "0: small, 1: medium, 2: large": [0, 2],
  "-1: disagree, 0: neutral, 1: agree": [-1, 1],
}

function normalizeSuggestedUnit(unit) {
  return (unit ?? "").trim().replace(/\s+/g, " ").toLowerCase()
}

export function getSuggestedUnitMinMax(unit) {
  return SUGGESTED_UNIT_MIN_MAX[normalizeSuggestedUnit(unit)] ?? null
}
