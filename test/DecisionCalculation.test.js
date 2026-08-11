import { describe, expect, test } from "vitest"

import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"

const FULL_RANGES = Object.freeze({
  Taste: [0, 10],
  Cost: [0, 15],
  Healthiness: [0, 10],
  "Time to Make": [0, 30],
  Leftovers: [0, 5],
})

const DETERMINISTIC_RANGE_MODES = Object.values(Answer.rangeModes).filter(
  (mode) => mode !== Answer.rangeModes.MONTE_CARLO,
)

function createMaximallyUncertainExampleDecision() {
  const decision = new Decision("What should I eat for dinner?")

  for (const factor of [
    {
      name: "Taste",
      unit: "0-10",
      optimal: 10,
      weight: 0.9,
      min: 0,
      max: 10,
    },
    {
      name: "Cost",
      unit: "$",
      optimal: 0,
      weight: 1,
      min: 0,
      max: null,
    },
    {
      name: "Healthiness",
      unit: "0-10",
      optimal: 10,
      weight: 0.85,
      min: 0,
      max: 10,
    },
    {
      name: "Time to Make",
      unit: "minutes",
      optimal: 0,
      weight: 0.6,
      min: null,
      max: null,
    },
    {
      name: "Leftovers",
      unit: "portions",
      optimal: Infinity,
      weight: 0.2,
      min: 0,
      max: null,
    },
  ])
    decision.addFactor(factor)

  for (const option of [
    "Taco Bell",
    "Spaghetti",
    "Tacos",
    "Leftovers",
    "Chicken noodle soup",
  ])
    decision.addOption(option)

  expect(decision.answers.flat().every((answer) => !answer.isAnswered())).toBe(
    true,
  )

  return decision.uncertainCopy(FULL_RANGES)
}

function calculateRangeMode(decision, rangeMode) {
  return decision._calculate(decision.answerValues(rangeMode))
}

function worstPossibleNormalized(decision) {
  return decision
    .optimalNormalized()
    .map((optimal) => (Math.round(optimal) === 0 ? 1 : 0))
}

function expectEveryRowToEqual(rows, expectedRow) {
  for (const row of rows) expect(row).toEqual(expectedRow)
}

describe("Decision._calculate", () => {
  test("the maximum-uncertainty fixture fills every answer with its full range", () => {
    const decision = createMaximallyUncertainExampleDecision()

    expect(decision.isInvalid()).toBeNull()
    for (const row of decision.answers) {
      for (const [factorIndex, answer] of row.entries()) {
        expect([answer.min, answer.max]).toEqual(
          FULL_RANGES[decision.factors[factorIndex].name],
        )
      }
    }
  })

  test("the worst-possible distance uses the same factor weights as option distances", () => {
    const decision = createMaximallyUncertainExampleDecision()
    const expectedDistance = Math.sqrt(
      decision.factors.reduce(
        (sum, factor) => sum + factor.weight * factor.weight,
        0,
      ),
    )

    expect(decision.worstPossibleDistance()).toBeCloseTo(expectedDistance)
  })

  test.each([
    [Answer.rangeModes.BEST, 1],
    [Answer.rangeModes.WORST, 0],
    [Answer.rangeModes.AVERAGE, 0.5],
  ])(
    "%s resolves maximum uncertainty to %s goodness for every option",
    (rangeMode, expectedGoodness) => {
      const decision = createMaximallyUncertainExampleDecision()
      const calculation = calculateRangeMode(decision, rangeMode)

      for (const goodness of calculation.goodness)
        expect(goodness).toBeCloseTo(expectedGoodness)
    },
  )

  test("Best gives every option the factor-wise normalized optimum", () => {
    const decision = createMaximallyUncertainExampleDecision()
    const calculation = calculateRangeMode(decision, Answer.rangeModes.BEST)

    expectEveryRowToEqual(
      calculation.normalized_answers,
      decision.optimalNormalized(),
    )
    expectEveryRowToEqual(
      calculation.delta_vectors_normalized,
      Array(decision.factors.length).fill(0),
    )
    expect(calculation.weighted_delta_magnitudes).toEqual(
      Array(decision.options.length).fill(0),
    )
    expect(calculation.badness).toEqual(
      Array(decision.options.length).fill(0),
    )
  })

  test("Worst gives every option the factor-wise normalized worst possibility", () => {
    const decision = createMaximallyUncertainExampleDecision()
    const calculation = calculateRangeMode(decision, Answer.rangeModes.WORST)

    expectEveryRowToEqual(
      calculation.normalized_answers,
      worstPossibleNormalized(decision),
    )
  })

  test.each(DETERMINISTIC_RANGE_MODES)(
    "%s has zero entropy and usefulness at maximum uncertainty",
    (rangeMode) => {
      const decision = createMaximallyUncertainExampleDecision()
      const calculation = calculateRangeMode(decision, rangeMode)
      const zeroes = Array(decision.factors.length).fill(0)

      expect(calculation.entropy).toEqual(zeroes)
      expect(calculation.usefulness).toEqual(zeroes)
    },
  )

  test.each(DETERMINISTIC_RANGE_MODES)(
    "%s returns consistently shaped finite results",
    (rangeMode) => {
      const decision = createMaximallyUncertainExampleDecision()
      const calculation = calculateRangeMode(decision, rangeMode)
      const optionCount = decision.options.length
      const factorCount = decision.factors.length

      for (const matrix of [
        calculation.normalized_answers,
        calculation.delta_vectors_normalized,
        calculation.weighted_delta_vectors_normalized,
        calculation.per_option_contributions,
        calculation.objective_contributions,
      ]) {
        expect(matrix).toHaveLength(optionCount)
        for (const row of matrix) {
          expect(row).toHaveLength(factorCount)
          expect(row.every(Number.isFinite)).toBe(true)
        }
      }

      for (const values of [
        calculation.weighted_delta_magnitudes,
        calculation.badness,
        calculation.goodness,
      ]) {
        expect(values).toHaveLength(optionCount)
        expect(values.every(Number.isFinite)).toBe(true)
      }

      for (const values of [
        calculation.entropy,
        calculation.usefulness,
        calculation.mean_factor_relevances,
      ]) {
        expect(values).toHaveLength(factorCount)
        expect(values.every(Number.isFinite)).toBe(true)
      }

      for (let optionIndex = 0; optionIndex < optionCount; optionIndex += 1)
        expect(
          calculation.goodness[optionIndex] +
            calculation.badness[optionIndex],
        ).toBeCloseTo(1)

      for (let factorIndex = 0; factorIndex < factorCount; factorIndex += 1)
        expect(calculation.usefulness[factorIndex]).toBeCloseTo(
          calculation.entropy[factorIndex] *
            decision.factors[factorIndex].weight,
        )
    },
  )

  test("does not mutate the raw answer matrix", () => {
    const decision = createMaximallyUncertainExampleDecision()
    const answers = decision.answerValues(Answer.rangeModes.HIGH)
    const originalAnswers = answers.map((row) => row.slice())

    decision._calculate(answers)

    expect(answers).toEqual(originalAnswers)
  })
})
