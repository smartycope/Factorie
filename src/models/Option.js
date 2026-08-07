export default class Option {
  constructor({ name = "", notes = "", hidden = false } = {}) {
    this.name = name
    this.notes = notes
    this.hidden = Boolean(hidden)
  }

  serialize() {
    return {
      name: this.name,
      notes: this.notes,
      hidden: this.hidden,
    }
  }

  static deserialize(data) {
    if (typeof data === "string") return new Option({ name: data })
    return new Option(data)
  }
}
