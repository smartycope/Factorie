// Does NOT check for "" or 0
function nully(value) {
  return value === undefined || value === null || isNaN(value)
}
export default class Answer {
  constructor(min = null, max = min) {
    this._min = min
    this._max = max
    // They're either always both null or both defined
    if (nully(min) || nully(max)) this.clear()
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

  // Returns an object, not a string
  serialize() {
    return [this.min, this.max]
  }

  static deserialize(data) {
    return new Answer(...JSON.parse(data))
  }

  clear() {
    this._min = null
    this._max = null
  }

  // Retruns null if it can't parse it (but "" -> empty answer)
  static parse(answer) {
    if (Array.isArray(answer)) return new Answer(...answer)
    if (answer instanceof Answer) return answer
    if (typeof answer === "number") return new Answer(answer, answer)
    if (typeof answer === "string") {
      const m = answer.match(
        // LLM translated version
        // /(([+-])?\d+(?:\.\d+)?)(?:\s?-\s?(([+-])?\d+(?:\.\d+)?))?/,
        // Python version
        // /((?:(?:-|\+))?\d+(?:\.\d+)?)(?:(?:\s+)?-(?:\s+)?((?:(?:-|\+))?\d+(?:\.\d+)?))?/
        // Hand made EZRegex Version
        // num = group(either(full_float, signed))
        // lineStart + ow + num + optional(ow + '-' + ow + num) + ow + lineEnd
        /^(?:\s+)?((?:(?:(?:-|\+))?\d+\.(?:\d+)?(?:e(?:(?:-|\+))?\d+)?|(?:(?:-|\+))?\d+))(?:(?:\s+)?-(?:\s+)?((?:(?:(?:-|\+))?\d+\.(?:\d+)?(?:e(?:(?:-|\+))?\d+)?|(?:(?:-|\+))?\d+)))?(?:\s+)?$/,
      ) // simplified
      if (m)
        return new Answer(
          parseFloat(m[1]),
          m[3] ? parseFloat(m[3]) : parseFloat(m[1]),
        )
      else if (answer.trim() === "") return new Answer()
      else return null
    }
    return null
  }

  toString() {
    if (!this.isAnswered()) return ""
    if (this.isRanged()) return `${this.min} - ${this.max}`
    return `${this.min}`
  }

  isRanged() {
    if (this.isAnswered()) return this.min !== this.max
    return null
  }

  isAnswered() {
    return Number.isFinite(this.min)
  }

  // Is the answer invalid for this option and factor
  isInvalid(decision, factor, allow_null=false) {
    if (!allow_null && !this.isAnswered()) return null

    const factorIdx = decision._parseFactorParam(factor)

    const factorMin = decision.factors.mins[factorIdx]
    const factorMax = decision.factors.maxs[factorIdx]

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
