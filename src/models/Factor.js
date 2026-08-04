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
}
