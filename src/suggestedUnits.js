export const SUGGESTED_UNITS = [
  "0-10 Scale",
  "0: No, 1: Yes",
  "0: Small, 1: Medium, 2: Large",
  "-1: Disagree, 0: Neutral, 1: Agree",
]

const SUGGESTED_UNIT_ANSWER_OPTIONS = {
  "0: no, 1: yes": [
    { label: "No", value: 0 },
    { label: "Yes", value: 1 },
  ],
  "0: small, 1: medium, 2: large": [
    { label: "Small", value: 0 },
    { label: "Medium", value: 1 },
    { label: "Large", value: 2 },
  ],
  "-1: disagree, 0: neutral, 1: agree": [
    { label: "Disagree", value: -1 },
    { label: "Neutral", value: 0 },
    { label: "Agree", value: 1 },
  ],
}

const SUGGESTED_UNIT_MIN_MAX = {
  "0-10 scale": [0, 10],
  "0: no, 1: yes": [0, 1],
  "0: small, 1: medium, 2: large": [0, 2],
  "-1: disagree, 0: neutral, 1: agree": [-1, 1],
}

function normalizeSuggestedUnit(unit) {
  return (unit ?? "").trim().replace(/\s+/g, " ").toLowerCase()
}

export function getSuggestedUnitAnswerOptions(unit) {
  return SUGGESTED_UNIT_ANSWER_OPTIONS[normalizeSuggestedUnit(unit)] ?? null
}

export function getSuggestedUnitMinMax(unit){
  console.log(unit)
  return SUGGESTED_UNIT_MIN_MAX[normalizeSuggestedUnit(unit)] ?? null
}
