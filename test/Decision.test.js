import assert from "node:assert/strict"
import test from "node:test"

import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Factor from "../src/models/Factor.js"

function createCompleteDecision() {
  const decision = new Decision("Dinner")
  decision.addFactor({
    name: "Taste",
    unit: "0-10",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addFactor({
    name: "Cost",
    unit: "$",
    optimal: 0,
    weight: 0.5,
    min: 0,
    max: null,
  })
  decision.addOption("Tacos")
  decision.addOption("Soup")
  decision.setAnswer("Tacos", "Taste", 10)
  decision.setAnswer("Tacos", "Cost", 8)
  decision.setAnswer("Soup", "Taste", 7)
  decision.setAnswer("Soup", "Cost", 4)
  return decision
}

test("Factor serializes and deserializes all factor properties", () => {
  const data = {
    name: "Cost",
    unit: "$",
    optimal: 0,
    weight: 0.75,
    min: 0,
    max: null,
  }
  const factor = Factor.deserialize(JSON.stringify(data))

  assert.ok(factor instanceof Factor)
  assert.deepEqual(factor.serialize(), data)
})

test("Decision owns Factor and Answer instances", () => {
  const decision = createCompleteDecision()

  assert.ok(decision.factors.every((factor) => factor instanceof Factor))
  assert.ok(
    decision.answers.every((row) =>
      row.every((answer) => answer instanceof Answer),
    ),
  )
  assert.equal(decision.isInvalid(), null)
})

test("factor edits and removal keep the answer matrix aligned", () => {
  const decision = createCompleteDecision()

  decision.editFactor("Taste", { name: "Flavor", weight: 0.8 })
  assert.equal(decision.factors[0].name, "Flavor")
  assert.equal(decision.factors[0].weight, 0.8)
  assert.equal(decision.getAnswer("Tacos", "Flavor").min, 10)

  decision.removeFactor("Flavor")
  assert.deepEqual(decision.factors.map((factor) => factor.name), ["Cost"])
  assert.deepEqual(
    decision.answers.map((row) => row.map((answer) => answer.min)),
    [[8], [4]],
  )
})

test("factor reordering keeps answer columns aligned", () => {
  const decision = createCompleteDecision()

  decision.reorderFactors([1, 0])

  assert.deepEqual(
    decision.factors.map((factor) => factor.name),
    ["Cost", "Taste"],
  )
  assert.deepEqual(
    decision.answers.map((row) => row.map((answer) => answer.min)),
    [[8, 10], [4, 7]],
  )
})

test("Decision serialization uses Factor objects and copy is independent", () => {
  const decision = createCompleteDecision()
  decision.setOptionNote("Tacos", "Open late and has outdoor seating.")
  const serialized = JSON.parse(decision.serialize())

  assert.ok(Array.isArray(serialized.factors))
  assert.deepEqual(serialized.factors[0], {
    name: "Taste",
    unit: "0-10",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  assert.deepEqual(serialized.optionNotes, {
    Tacos: "Open late and has outdoor seating.",
  })

  const copy = decision.copy()
  assert.ok(copy.factors[0] instanceof Factor)
  assert.ok(copy.answers[0][0] instanceof Answer)
  copy.editFactor(0, { name: "Flavor" })
  copy.setAnswer(0, 0, 5)
  copy.setOptionNote("Tacos", "Different note")
  assert.equal(decision.factors[0].name, "Taste")
  assert.equal(decision.answers[0][0].min, 10)
  assert.equal(decision.optionNotes.Tacos, "Open late and has outdoor seating.")
})

test("clearing a factor's answers preserves the other answer columns", () => {
  const decision = createCompleteDecision()

  decision.clearFactorAnswers("Taste")

  assert.equal(decision.getAnswer("Tacos", "Taste").isAnswered(), false)
  assert.equal(decision.getAnswer("Soup", "Taste").isAnswered(), false)
  assert.equal(decision.getAnswer("Tacos", "Cost").min, 8)
  assert.equal(decision.getAnswer("Soup", "Cost").min, 4)
})

test("tentative answers survive serialization without changing legacy answers", () => {
  const decision = createCompleteDecision()
  decision.setAnswer("Tacos", "Taste", new Answer(9, 10, true))

  const serialized = JSON.parse(decision.serialize())
  assert.deepEqual(serialized.answers[0][0], [9, 10, true])
  assert.deepEqual(serialized.answers[0][1], [8, 8])

  const copy = Decision.deserialize(serialized)
  assert.equal(copy.getAnswer("Tacos", "Taste").isTentative, true)
  assert.equal(copy.getAnswer("Tacos", "Cost").isTentative, false)
  assert.equal(new Answer(null, null, true).isTentative, true)
  copy.getAnswer("Tacos", "Taste").clear()
  assert.equal(copy.getAnswer("Tacos", "Taste").isTentative, false)
})

test("option notes follow renames, are removed with options, and migrate safely", () => {
  const decision = createCompleteDecision()
  decision.setOptionNote(0, "Try the al pastor")

  decision.renameOption(0, "Street tacos")
  assert.deepEqual(decision.optionNotes, {
    "Street tacos": "Try the al pastor",
  })

  decision.setOptionNote("Street tacos", "")
  assert.deepEqual(decision.optionNotes, {})

  decision.setOptionNote("Soup", "Good on cold days")
  decision.removeOption("Soup")
  assert.deepEqual(decision.optionNotes, {})

  const legacy = Decision.deserialize(JSON.parse(decision.serialize()))
  assert.deepEqual(legacy.optionNotes, {})
})

test("Min and Max optimals serialize and resolve from answers", () => {
  const decision = new Decision("Open-ended")
  decision.addFactor({
    name: "Cost",
    optimal: -Infinity,
    weight: 1,
    min: 0,
    max: null,
  })
  decision.addFactor({
    name: "Quality",
    optimal: Infinity,
    weight: 1,
    min: null,
    max: 10,
  })
  decision.addOption("A")
  decision.addOption("B")
  decision.setAnswer("A", "Cost", 8)
  decision.setAnswer("A", "Quality", 4)
  decision.setAnswer("B", "Cost", 3)
  decision.setAnswer("B", "Quality", 9)

  assert.deepEqual(decision.optimals(), [3, 9])
  assert.deepEqual(decision.mins(), [0, 4])
  assert.deepEqual(decision.maxs(), [8, 10])
  assert.deepEqual(decision.optimalNormalized(), [3 / 8, 5 / 6])

  const serialized = decision.serialize()
  assert.equal(JSON.parse(serialized).factors[0].optimal, "-Infinity")
  assert.equal(JSON.parse(serialized).factors[1].optimal, "Infinity")

  const copy = Decision.deserialize(serialized)
  assert.equal(copy.factors[0].optimal, -Infinity)
  assert.equal(copy.factors[1].optimal, Infinity)
  assert.deepEqual(copy.optimals(), [3, 9])
})

test("an unfinished optimal does not resolve to an answer extreme", () => {
  const decision = new Decision("Unfinished")
  decision.addFactor({ name: "Unknown", optimal: null, weight: 1 })
  decision.addOption("A")
  decision.setAnswer("A", "Unknown", 4)

  assert.deepEqual(decision.optimals(), [null])
})

test("Min and Max optimals rank the lowest and highest answers as best", () => {
  const decision = new Decision("Directions")
  decision.addFactor({
    name: "Cost",
    optimal: -Infinity,
    weight: 1,
    min: null,
    max: null,
  })
  decision.addFactor({
    name: "Quality",
    optimal: Infinity,
    weight: 1,
    min: null,
    max: null,
  })
  decision.addOption("Best directions")
  decision.addOption("Worst directions")
  decision.setAnswer("Best directions", "Cost", 1)
  decision.setAnswer("Best directions", "Quality", 10)
  decision.setAnswer("Worst directions", "Cost", 10)
  decision.setAnswer("Worst directions", "Quality", 1)

  assert.deepEqual(decision.optimalNormalized(), [0, 1])
  const calculation = decision.calculateAll({ numSamples: 1 })
  assert.ok(calculation.mean.goodness.every(Number.isFinite))
  assert.equal(calculation.best.is, "Best directions")
  assert.equal(calculation.worst.is, "Worst directions")
})

test("legacy object-of-arrays decisions migrate to Factor objects", () => {
  const decision = Decision.deserialize({
    name: "Legacy",
    factors: {
      names: ["Taste", "Cost"],
      units: ["0-10", "$"],
      optimals: [10, 0],
      weights: [1, 0.5],
      mins: [0, 0],
      maxs: [10, null],
    },
    options: ["Tacos"],
    answers: [[[9, 9], [7, 8]]],
    threshold: 0,
    factorPacks: ["Choosing Dinner"],
  })

  assert.ok(decision.factors.every((factor) => factor instanceof Factor))
  assert.deepEqual(
    decision.factors.map((factor) => factor.serialize()),
    [
      {
        name: "Taste",
        unit: "0-10",
        optimal: 10,
        weight: 1,
        min: 0,
        max: 10,
      },
      {
        name: "Cost",
        unit: "$",
        optimal: 0,
        weight: 0.5,
        min: 0,
        max: null,
      },
    ],
  )
  assert.equal(decision.getAnswer("Tacos", "Cost").toString(), "7 - 8")
  assert.deepEqual([...decision.factorPacks], ["Choosing Dinner"])
  assert.deepEqual(decision.optionNotes, {})
  assert.ok(Array.isArray(JSON.parse(decision.serialize()).factors))
})

test("calculation and factor-pack flows continue to use factor values", () => {
  const decision = new Decision("Simple")
  const pack = {
    name: "Simple pack",
    factors: [
      {
        name: "Quality",
        unit: "0-10",
        optimal: 10,
        weight: 1,
        min: 0,
        max: 10,
      },
    ],
  }
  decision.addFactorPack(pack)
  decision.addOption("Good")
  decision.addOption("Bad")
  decision.setAnswer("Good", "Quality", 10)
  decision.setAnswer("Bad", "Quality", 0)

  const calculation = decision.calculateAll({ numSamples: 2 })
  assert.equal(calculation.best.is, "Good")
  assert.equal(calculation.worst.is, "Bad")

  decision.removeFactorPack(pack)
  assert.deepEqual(decision.factors, [])
  assert.deepEqual(decision.answers, [[], []])
})
