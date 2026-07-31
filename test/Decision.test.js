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

test("Decision serialization uses Factor objects and copy is independent", () => {
  const decision = createCompleteDecision()
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

  const copy = decision.copy()
  assert.ok(copy.factors[0] instanceof Factor)
  assert.ok(copy.answers[0][0] instanceof Answer)
  copy.editFactor(0, { name: "Flavor" })
  copy.setAnswer(0, 0, 5)
  assert.equal(decision.factors[0].name, "Taste")
  assert.equal(decision.answers[0][0].min, 10)
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
