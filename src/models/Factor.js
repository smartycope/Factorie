import { normalizeColor } from "./color.js"

// pattern = options("global") + group(int_or_float, name="number") + ow + ":" + group(at_least_one(any_char_except(",")), name="name")
const discreteRegex = /(?<number>(?:(?:(?:-|\+))?(?:\d*\.\d+|\d+\.\d*)(?:e(?:-|\+)\d+)?|(?:(?:-|\+))?\d+(?:e(?:-|\+)\d+)?))\s*:(?<name>(?:[^,])+)/g

export default class Factor {
  constructor({
    name = "",
    unit = null,
    optimal = null,
    weight = null,
    min = null,
    max = null,
    color = null,
  } = {}) {
    this.name = name
    this.unit = unit
    this.optimal = optimal
    this.weight = weight
    this.min = min
    this.max = max
    this.color = normalizeColor(color)
  }

  serialize() {
    return {
      name: this.name,
      unit: this.unit,
      optimal:
        this.optimal === Infinity ? "Infinity"
        : this.optimal === -Infinity ? "-Infinity"
        : this.optimal,
      weight: this.weight,
      min: this.min,
      max: this.max,
      ...(this.color ? { color: this.color } : {}),
    }
  }

  static deserialize(data) {
    const factor = typeof data === "string" ? JSON.parse(data) : data
    const optimal =
      factor.optimal === "Infinity" ? Infinity
      : factor.optimal === "-Infinity" ? -Infinity
      : factor.optimal
    return new Factor({ ...factor, optimal })
  }

  practicalRange(answers = []) {
    const answerMins = answers
      .map((answer) => answer?.min)
      .filter(Number.isFinite)
    const answerMaxs = answers
      .map((answer) => answer?.max)
      .filter(Number.isFinite)

    if (Number.isFinite(this.optimal)) {
      answerMins.push(this.optimal)
      answerMaxs.push(this.optimal)
    }

    const min =
      Number.isFinite(this.min) ? this.min
      : answerMins.length ? Math.min(...answerMins)
      : null
    const max =
      Number.isFinite(this.max) ? this.max
      : answerMaxs.length ? Math.max(...answerMaxs)
      : null

    return [min, max]
  }

  isFinite(answers = []) {
    const [min, max] = this.practicalRange(answers)
    return (
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      min < max
    )
  }

  isDiscrete() {
    return this.discreteValues().length > 0
  }

  discreteValues() {
    if (typeof this.unit !== "string") return []
    const rtn = [...this.unit.matchAll(discreteRegex)].map(({ groups }) => ({
      number: parseFloat(groups.number),
      name: groups.name.trim(),
    }))
    // Check for duplicate numbers
    if (rtn.length && new Set(rtn.map(({ number }) => number)).size !== rtn.length)
      throw new Error("Discrete units must have unique numbers: " + this.unit)
    return rtn
  }
}
