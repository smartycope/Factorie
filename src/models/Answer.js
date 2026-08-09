import {nully} from "../utils/misc.js"

function discreteValuesFor(factor) {
  if (!factor || typeof factor.discreteValues !== "function")
    throw new TypeError("Answer serialization requires a factor")
  return factor.discreteValues()
}

function serializeValue(value, discreteValues) {
  return discreteValues.find(({number}) => number === value)?.name ?? value
}

function deserializeValue(value, discreteValues) {
  if (typeof value !== "string") return value

  const discreteValue = discreteValues.find(({name}) => name.toLowerCase() === value.toLowerCase())
  if (!discreteValue)
    throw new Error(`Unknown discrete answer label: "${value}"`)
  return discreteValue.number
}

export default class Answer {
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
    const {min: factorMin, max: factorMax} = this.factor
    // It's tentative if the user has marked it as such, or if it has the maximum range possible (maximum uncertainty)
    return this.isAnswered() && (this.tentative || ((factorMin != null && this.min == factorMin) && (factorMax != null && this.max == factorMax)))
  }

  // Returns an object, not a string
  serialize() {
    const discreteValues = discreteValuesFor(this.factor)
    const min = serializeValue(this.min, discreteValues)
    const max = serializeValue(this.max, discreteValues)
    return this.tentative ?
        [min, max, true]
      : [min, max]
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
          factor,
          option,
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

  // Is the answer invalid for its factor
  isInvalid(allow_null=false) {
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
