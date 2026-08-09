import assert from "node:assert/strict"
import test from "node:test"

import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Factor from "../src/models/Factor.js"
import Option from "../src/models/Option.js"

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

test("Factor detects and parses discrete units", () => {
  const factor = new Factor({
    unit: "2.5: Short, 7e+1: Long",
  })

  assert.equal(factor.isDiscrete(), true)
  assert.deepEqual(factor.discreteValues(), [
    { number: 2.5, name: "Short" },
    { number: 70, name: "Long" },
  ])
  assert.deepEqual(factor.discreteValues(), [
    { number: 2.5, name: "Short" },
    { number: 70, name: "Long" },
  ])

  for (const unit of [
    "0: No, 1: Yes",
    "0: Small, 1: Medium, 2: Large",
    "-1: Disagree, 0: Neutral, 1: Agree",
  ])
    assert.equal(new Factor({ unit }).isDiscrete(), true)
})

test("Factor leaves continuous and missing units non-discrete", () => {
  assert.equal(new Factor({ unit: "0-10 Scale" }).isDiscrete(), false)
  assert.equal(new Factor().isDiscrete(), false)
})

test("Answer serialization uses discrete labels and accepts legacy numbers", () => {
  const factor = new Factor({
    unit: "0: Small, 1: Medium, 2: Large",
  })
  const answer = new Answer(0, 2, true)

  assert.deepEqual(answer.serialize(factor), ["Small", "Large", true])
  assert.deepEqual(
    Answer.deserialize('["Small", "Large", true]', factor).serialize(factor),
    ["Small", "Large", true],
  )

  const legacyAnswer = Answer.deserialize([0, 2], factor)
  assert.equal(legacyAnswer.min, 0)
  assert.equal(legacyAnswer.max, 2)
})

test("Decision owns Factor and Answer instances", () => {
  const decision = createCompleteDecision()

  assert.ok(decision.factors.every((factor) => factor instanceof Factor))
  assert.ok(decision.options.every((option) => option instanceof Option))
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
    decision.factors.map((factor) => factor.weight),
    [0.5, 1],
  )
  assert.deepEqual(
    decision.answers.map((row) => row.map((answer) => answer.min)),
    [[8, 10], [4, 7]],
  )
})

test("option reordering keeps answer rows and notes aligned", () => {
  const decision = createCompleteDecision()
  decision.setOptionNote("Tacos", "Taco note")
  decision.setOptionNote("Soup", "Soup note")

  decision.reorderOptions([1, 0])

  assert.deepEqual(
    decision.options.map((option) => option.name),
    ["Soup", "Tacos"],
  )
  assert.deepEqual(
    decision.answers.map((row) => row.map((answer) => answer.min)),
    [
      [7, 4],
      [10, 8],
    ],
  )
  assert.deepEqual(
    decision.options.map((option) => option.notes),
    ["Soup note", "Taco note"],
  )
  assert.throws(
    () => decision.reorderOptions([0, 0]),
    /Option order must contain every option index exactly once/,
  )
})

test("Decision serialization uses Factor and Option objects and copy is independent", () => {
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
  assert.deepEqual(serialized.options[0], {
    name: "Tacos",
    notes: "Open late and has outdoor seating.",
    hidden: false,
  })

  const copy = decision.copy()
  assert.ok(copy.factors[0] instanceof Factor)
  assert.ok(copy.options[0] instanceof Option)
  assert.ok(copy.answers[0][0] instanceof Answer)
  copy.editFactor(0, { name: "Flavor" })
  copy.setAnswer(0, 0, 5)
  copy.setOptionNote("Tacos", "Different note")
  assert.equal(decision.factors[0].name, "Taste")
  assert.equal(decision.answers[0][0].min, 10)
  assert.equal(decision.options[0].notes, "Open late and has outdoor seating.")
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
  assert.equal(copy.getAnswer("Tacos", "Taste").tentative, true)
  assert.equal(copy.getAnswer("Tacos", "Cost").tentative, false)
  assert.equal(new Answer(null, null, true).tentative, true)
  copy.getAnswer("Tacos", "Taste").clear()
  assert.equal(copy.getAnswer("Tacos", "Taste").tentative, false)
})

test("Decision round-trips discrete answer labels", () => {
  const decision = new Decision("Sizes")
  decision.addFactor({
    name: "Size",
    unit: "0: Small, 1: Medium, 2: Large",
    optimal: 2,
    weight: 1,
    min: 0,
    max: 2,
  })
  decision.addOption("Choice")
  decision.setAnswer("Choice", "Size", new Answer(0, 2, true))

  const serialized = JSON.parse(decision.serialize())
  assert.deepEqual(serialized.answers, [[["Small", "Large", true]]])

  const copy = Decision.deserialize(serialized)
  assert.equal(copy.getAnswer("Choice", "Size").min, 0)
  assert.equal(copy.getAnswer("Choice", "Size").max, 2)
  assert.equal(copy.getAnswer("Choice", "Size").tentative, true)

  serialized.answers = [[[0, 1]]]
  const legacyCopy = Decision.deserialize(serialized)
  assert.equal(legacyCopy.getAnswer("Choice", "Size").min, 0)
  assert.equal(legacyCopy.getAnswer("Choice", "Size").max, 1)
})

test("option metadata follows renames and is removed with options", () => {
  const decision = createCompleteDecision()
  decision.setOptionNote(0, "Try the al pastor")

  decision.renameOption(0, "Street tacos")
  assert.equal(decision.options[0].name, "Street tacos")
  assert.equal(decision.options[0].notes, "Try the al pastor")

  decision.setOptionNote("Street tacos", "")
  assert.equal(decision.options[0].notes, "")

  decision.setOptionNote("Soup", "Good on cold days")
  decision.removeOption("Soup")
  assert.deepEqual(decision.options.map((option) => option.name), [
    "Street tacos",
  ])

  const legacy = Decision.deserialize(JSON.parse(decision.serialize()))
  assert.equal(legacy.options[0].notes, "")
})

test("legacy option names and notes migrate to Option objects", () => {
  const decision = Decision.deserialize({
    name: "Legacy options",
    factors: [],
    options: ["Shown", "Hidden later"],
    optionNotes: { Shown: "Legacy note", Extra: "Ignored" },
    answers: [[], []],
  })

  assert.ok(decision.options.every((option) => option instanceof Option))
  assert.deepEqual(
    decision.options.map((option) => option.serialize()),
    [
      { name: "Shown", notes: "Legacy note", hidden: false },
      { name: "Hidden later", notes: "", hidden: false },
    ],
  )
})

test("hidden options persist and are excluded from validation and calculations", () => {
  const decision = createCompleteDecision()
  decision.setOptionHidden("Soup", true)
  decision.setAnswer("Soup", "Taste", new Answer())
  decision.setAnswer("Soup", "Cost", new Answer())

  assert.deepEqual(
    decision.getVisibleOptions().map((option) => option.name),
    ["Tacos"],
  )
  assert.equal(decision.isInvalid(), null)

  const copy = decision.copy()
  assert.equal(copy.options[1].hidden, true)
  const calculation = copy.calculateAll({ numSamples: 1 })
  assert.equal(calculation.mean.normalized_answers.length, 1)
  assert.equal(calculation.best.is, "Tacos")
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

test("uncertain copies fill only unanswered cells and identify needed ranges", () => {
  const decision = new Decision("Partial")
  decision.addFactor({
    name: "Quality",
    optimal: 10,
    weight: 0.5,
    min: 0,
    max: 10,
  })
  decision.addFactor({
    name: "Cost",
    optimal: -Infinity,
    weight: 0.5,
    min: 0,
    max: null,
  })
  decision.addOption("Known")
  decision.addOption("Unknown")
  decision.setAnswer("Known", "Quality", 8)
  decision.setAnswer("Known", "Cost", 25)

  assert.deepEqual(
    decision.getPracticalNonFiniteFactors().map((factor) => factor.name),
    ["Cost"],
  )

  const simulated = decision.uncertainCopy({ Cost: [0, 100] })
  assert.deepEqual(
    simulated.getAnswer("Unknown", "Quality").serialize(simulated.factors[0]),
    [0, 10],
  )
  assert.deepEqual(
    simulated.getAnswer("Unknown", "Cost").serialize(simulated.factors[1]),
    [0, 100],
  )
  assert.deepEqual(
    simulated.getAnswer("Known", "Cost").serialize(simulated.factors[1]),
    [25, 25],
  )
  assert.equal(decision.getAnswer("Unknown", "Quality").isAnswered(), false)
  assert.equal(simulated.isInvalid(), null)

  decision.setAnswer("Unknown", "Cost", 40)
  assert.deepEqual(decision.getPracticalNonFiniteFactors(), [])
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
  assert.ok(decision.options.every((option) => option instanceof Option))
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

test("bestWorst supports extremes and threshold explanations", () => {
  const decision = new Decision("Explanations")
  for (const name of ["A", "B", "C"])
    decision.addFactor({ name, optimal: 1, weight: 1, min: 0, max: 1 })
  decision.addOption("Best")
  decision.addOption("Worst")

  const calc = {
    weighted_delta_magnitudes: [1, 2],
    delta_vectors_normalized: [
      [0, 0.1, 0.9],
      [0.8, 0.7, 0.2],
    ],
  }

  const extremes = decision.bestWorst(calc, "extremes", 0.25, 0.75)
  assert.deepEqual(extremes.best.because, ["A"])
  assert.deepEqual(extremes.best.despite, ["C"])

  const threshold = decision.bestWorst(calc, "threshold", 0.25, 0.75)
  assert.deepEqual(threshold.best.because, ["A", "B"])
  assert.deepEqual(threshold.best.despite, ["C"])
  assert.deepEqual(threshold.worst.because, ["A"])
  assert.deepEqual(threshold.worst.despite, ["C"])

  const fallback = decision.bestWorst(calc, "threshold", 0, 2)
  assert.deepEqual(fallback.best, extremes.best)
  assert.deepEqual(fallback.worst, extremes.worst)
  assert.throws(
    () => decision.bestWorst(calc, "unknown"),
    /Invalid method: unknown/,
  )
})
