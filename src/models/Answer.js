import { nully } from "../utils/misc.js"

function discreteValuesFor(factor) {
  if (!factor || typeof factor.discreteValues !== "function")
    throw new TypeError("Answer serialization requires a factor")
  return factor.discreteValues()
}

function serializeValue(value, discreteValues) {
  return discreteValues.find(({ number }) => number === value)?.name ?? value
}

function deserializeValue(value, discreteValues) {
  if (typeof value !== "string") return value

  const discreteValue = discreteValues.find(
    ({ name }) => name.toLowerCase() === value.toLowerCase(),
  )
  if (!discreteValue)
    throw new Error(`Unknown discrete answer label: "${value}"`)
  return discreteValue.number
}

export default class Answer {
  static rangeModes = Object.freeze({
    MONTE_CARLO: "monteCarlo",
    BEST: "best",
    WORST: "worst",
    AVERAGE: "average",
    HIGH: "high",
    LOW: "low",
    MEDIAN: "median",
  })

  constructor(
    min = null,
    max = min,
    tentative = false,
    factor = null,
    option = null,
  ) {
    this.factor = factor
    this.option = option
    this._min = min
    this._max = max
    this.tentative = Boolean(tentative)
    // They're either always both null or both defined
    if (nully(min) || nully(max)) {
      this._min = null
      this._max = null
    }
  }

  set min(min) {
    this._min = min
    // If we're going from unanswered to answered
    if (this._max === null) this._max = min
    if (nully(min)) this.clear()
  }
  get min() {
    return this._min
  }

  set max(max) {
    this._max = max
    if (nully(max)) this.clear()
  }
  get max() {
    return this._max
  }

  isTentative() {
    const { min: factorMin, max: factorMax } = this.factor
    // It's tentative if the user has marked it as such, or if it has the maximum range possible (maximum uncertainty)
    return (
      this.isAnswered() &&
      (this.tentative ||
        (factorMin != null &&
          this.min == factorMin &&
          factorMax != null &&
          this.max == factorMax))
    )
  }

  // Returns an object, not a string
  serialize() {
    const discreteValues = discreteValuesFor(this.factor)
    const min = serializeValue(this.min, discreteValues)
    const max = serializeValue(this.max, discreteValues)
    return this.tentative ? [min, max, true] : [min, max]
  }

  static deserialize(data, factor, option) {
    const serialized = typeof data === "string" ? JSON.parse(data) : data
    if (!Array.isArray(serialized))
      throw new TypeError("Serialized answer must be an array")

    const discreteValues = discreteValuesFor(factor)
    return new Answer(
      deserializeValue(serialized[0], discreteValues),
      deserializeValue(serialized[1], discreteValues),
      serialized[2],
      factor,
      option,
    )
  }

  copy({
    min = this.min,
    max = this.max,
    tentative = this.tentative,
    factor = this.factor,
    option = this.option,
  } = {}) {
    return new Answer(min, max, tentative, factor, option)
  }

  clear() {
    this._min = null
    this._max = null
    this.tentative = false
  }

  // Returns null if it can't parse it (but "" -> empty answer)
  static parse(answer, factor = null, option = null) {
    if (Array.isArray(answer))
      return new Answer(answer[0], answer[1], answer[2], factor, option)
    if (answer instanceof Answer) {
      if (factor === null && option === null) return answer
      return answer.copy({
        factor: factor ?? answer.factor,
        option: option ?? answer.option,
      })
    }
    if (typeof answer === "number")
      return new Answer(answer, answer, false, factor, option)
    if (typeof answer === "string") {
      if (answer.trim() === "")
        return new Answer(null, null, false, factor, option)

      const trimmedAnswer = answer.trim()
      const tentative = trimmedAnswer.endsWith("?")
      const discreteAnswer =
        tentative ? trimmedAnswer.slice(0, -1).trim() : trimmedAnswer
      const normalizedDiscreteAnswer = discreteAnswer
        .toLowerCase()
        .replace(/\s*-\s*/g, "-")
      const discreteValues = factor?.discreteValues?.() ?? []
      const discreteValue = discreteValues.find(
        ({ name }) => name.toLowerCase() === normalizedDiscreteAnswer,
      )
      if (discreteValue)
        return new Answer(
          discreteValue.number,
          discreteValue.number,
          tentative,
          factor,
          option,
        )
      for (const min of discreteValues) {
        for (const max of discreteValues) {
          const range = `${min.name}-${max.name}`
            .toLowerCase()
            .replace(/\s*-\s*/g, "-")
          if (range === normalizedDiscreteAnswer)
            return new Answer(min.number, max.number, tentative, factor, option)
        }
      }

      const m = answer.match(
        // LLM translated version
        // /(([+-])?\d+(?:\.\d+)?)(?:\s?-\s?(([+-])?\d+(?:\.\d+)?))?/,
        // Python version
        // /((?:(?:-|\+))?\d+(?:\.\d+)?)(?:(?:\s+)?-(?:\s+)?((?:(?:-|\+))?\d+(?:\.\d+)?))?/
        // Hand made EZRegex Version
        // num = group(either(full_float, signed))
        // lineStart + ow + num + optional(ow + '-' + ow + num) + ow + lineEnd
        // /^(?:\s+)?((?:(?:(?:-|\+))?\d+\.(?:\d+)?(?:e(?:(?:-|\+))?\d+)?|(?:(?:-|\+))?\d+))(?:(?:\s+)?-(?:\s+)?((?:(?:(?:-|\+))?\d+\.(?:\d+)?(?:e(?:(?:-|\+))?\d+)?|(?:(?:-|\+))?\d+)))?(?:\s+)?$/,

        // EZRegex Version with tentative
        // num = group(either(full_float, signed))
        // pattern = lineStart + ow + num + optional(ow + '-' + ow + num) + ow + optional(group('?', name="tentative"))+lineEnd
        /^\s*((?:(?:(?:-|\+))?(?:\d*\.\d+|\d+\.\d*)(?:e(?:-|\+)\d+)?|(?:(?:-|\+))?\d+(?:e(?:-|\+)\d+)?))(?:\s*-\s*((?:(?:(?:-|\+))?(?:\d*\.\d+|\d+\.\d*)(?:e(?:-|\+)\d+)?|(?:(?:-|\+))?\d+(?:e(?:-|\+)\d+)?)))?\s*(?:(?<tentative>\?))?$/m,
      )
      if (m)
        return new Answer(
          parseFloat(m[1]),
          m[2] ? parseFloat(m[2]) : parseFloat(m[1]),
          Boolean(m.groups?.tentative),
          factor,
          option,
        )
      else return null
    }
    return null
  }

  toString() {
    if (!this.isAnswered()) return ""
    if (this.isRanged())
      return `${this.min} - ${this.max}` + (this.tentative ? "?" : "")
    return `${this.min}` + (this.tentative ? "?" : "")
  }

  isRanged() {
    if (this.isAnswered()) return this.min !== this.max
    return null
  }

  valueAt(position) {
    if (!this.isAnswered()) return null
    return this.min + (this.max - this.min) * position
  }

  midpoint() {
    return this.valueAt(0.5)
  }

  rangeRadius() {
    if (!this.isAnswered()) return null
    return (this.max - this.min) / 2
  }

  best(allowUnanswered = false) {
    if (!this.isAnswered()) return allowUnanswered ? this.factor.optimal : null
    if (!this.isRanged()) return this.min

    return Math.min(Math.max(this.factor.optimal, this.min), this.max)
  }

  worst() {
    if (!this.isAnswered()) return null
    if (!this.isRanged()) return this.min

    if (this.factor.optimal === -Infinity) return this.max
    if (this.factor.optimal === Infinity) return this.min

    const minDistance = Math.abs(this.min - this.factor.optimal)
    const maxDistance = Math.abs(this.max - this.factor.optimal)

    return minDistance >= maxDistance ? this.min : this.max
  }

  mean() {
    if (!this.isAnswered()) return null
    if (!this.isRanged()) return this.min
    const rtn = (this.best() + this.worst()) / 2
    if (rtn < this.min || rtn > this.max) throw new Error("Mean out of range")
    return rtn
  }

  // Resolve this answer's range to one value for a results calculation.
  // A range only states its bounds, not a more specific probability model, so
  // Monte Carlo treats every value inside it as equally likely.
  valueForRange(mode = Answer.rangeModes.MEDIAN, random = Math.random) {
    if (!this.isAnswered()) return null

    switch (mode) {
      case Answer.rangeModes.BEST:
        return this.best()
      case Answer.rangeModes.WORST:
        return this.worst()
      case Answer.rangeModes.AVERAGE:
        return this.mean()
      case Answer.rangeModes.LOW:
        return this.valueAt(0)
      case Answer.rangeModes.HIGH:
        return this.valueAt(1)
      case Answer.rangeModes.MEDIAN:
        return this.midpoint()
      case Answer.rangeModes.MONTE_CARLO:{
        const vals = this.factor.discreteValues()
            .map(({ number }) => number )
            .filter((answer) => answer.number >= this.min && answer.number <= this.max)

        if (vals.length > 0) return vals[Math.floor(random() * vals.length)]
        else return this.isRanged() ? this.valueAt(random()) : this.min
      }
      default:
        throw new Error(`Invalid range mode: ${mode}`)
    }
  }

  // TODO: is this still accurate, with the new non-finite min/max system? -- add tests for this
  isAnswered() {
    return Number.isFinite(this.min)
  }

  // Is the answer invalid for its factor
  isInvalid(allow_null = false) {
    if (!allow_null && !this.isAnswered()) return null

    const factorMin = this.factor.min
    const factorMax = this.factor.max

    if (this.min > this.max) return `Answer min is greater than max: ${this}`
    if (
      !(
        (factorMin == null || this.min >= factorMin) &&
        (factorMax == null || this.max <= factorMax)
      )
    )
      return `Answer out of bounds: ${this} (min: ${factorMin}, max: ${factorMax})`

    return null
  }
}
