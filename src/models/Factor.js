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
  } = {}) {
    this.name = name
    this.unit = unit
    this.optimal = optimal
    this.weight = weight
    this.min = min
    this.max = max
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

  isFinite() {
    return (
      Number.isFinite(this.min) &&
      Number.isFinite(this.max) &&
      this.min < this.max
    )
  }

  isDiscrete() {
    return this.discreteValues().length > 0
  }

  discreteValues() {
    if (typeof this.unit !== "string") return []
    return [...this.unit.matchAll(discreteRegex)].map(({ groups }) => ({
      number: parseFloat(groups.number),
      name: groups.name.trim(),
    }))
  }
}
