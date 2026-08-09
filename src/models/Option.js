import { normalizeColor } from "./color.js"

export default class Option {
  constructor({ name = "", notes = "", hidden = false, color = null } = {}) {
    this.name = name
    this.notes = notes
    this.hidden = Boolean(hidden)
    this.color = normalizeColor(color)
  }

  serialize() {
    return {
      name: this.name,
      notes: this.notes,
      hidden: this.hidden,
      ...(this.color ? { color: this.color } : {}),
    }
  }

  static deserialize(data) {
    if (typeof data === "string") return new Option({ name: data })
    return new Option(data)
  }
}
