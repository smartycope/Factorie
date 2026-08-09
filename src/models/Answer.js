import {nully} from "../utils/misc"

export default class Answer {
  constructor(min = null, max = min, tentative = false) {
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

  isTentative(decision, factor) {
    const factorIdx = decision._parseFactorParam(factor)

    const {min: factorMin, max: factorMax} = decision.factors[factorIdx]
    // It's tentative if the user has marked it as such, or if it has the maximum range possible (maximum uncertainty)
    return this.isAnswered() && (this.tentative || ((factorMin != null && this.min == factorMin) && (factorMax != null && this.max == factorMax)))
  }

  // Returns an object, not a string
  serialize() {
    return this.tentative ?
        [this.min, this.max, true]
      : [this.min, this.max]
  }

  static deserialize(data) {
    return new Answer(...JSON.parse(data))
  }

  clear() {
    this._min = null
    this._max = null
    this.tentative = false
  }

  // Retruns null if it can't parse it (but "" -> empty answer)
  static parse(answer) {
    if (Array.isArray(answer)) return new Answer(...answer)
    if (answer instanceof Answer) return answer
    if (typeof answer === "number") return new Answer(answer, answer)
    if (typeof answer === "string") {
      if (answer.trim() === "") return new Answer()

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
        /^\s*((?:(?:(?:-|\+))?(?:\d*\.\d+|\d+\.\d*)(?:e(?:-|\+)\d+)?|(?:(?:-|\+))?\d+(?:e(?:-|\+)\d+)?))(?:\s*-\s*((?:(?:(?:-|\+))?(?:\d*\.\d+|\d+\.\d*)(?:e(?:-|\+)\d+)?|(?:(?:-|\+))?\d+(?:e(?:-|\+)\d+)?)))?\s*(?:(?<tentative>\?))?$/m
      )
      if (m)
        return new Answer(
          parseFloat(m[1]),
          m[3] ? parseFloat(m[3]) : parseFloat(m[1]),
          Boolean(m.groups?.tentative),
        )
      else return null
    }
    return null
  }

  toString() {
    if (!this.isAnswered()) return ""
    if (this.isRanged()) return `${this.min} - ${this.max}` + (this.tentative ? "?" : "")
    return `${this.min}` + (this.tentative ? "?" : "")
  }

  isRanged() {
    if (this.isAnswered()) return this.min !== this.max
    return null
  }

  // TODO: is this still accurate, with the new non-finite min/max system?
  isAnswered() {
    return Number.isFinite(this.min)
  }

  // Is the answer invalid for this option and factor
  isInvalid(decision, factor, allow_null=false) {
    if (!allow_null && !this.isAnswered()) return null

    const factorIdx = decision._parseFactorParam(factor)

    const factorMin = decision.factors[factorIdx].min
    const factorMax = decision.factors[factorIdx].max

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
