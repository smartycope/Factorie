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

function createBestWorstDecision() {
  const decision = new Decision("Best and worst explanations")
  for (const name of ["A", "B", "C"])
    decision.addFactor({ name, optimal: 1, weight: 1, min: 0, max: 1 })

  // Put the farthest option first so selection cannot pass by always using
  // the first option as Best and the last option as Worst.
  decision.addOption("Farthest")
  decision.addOption("Closest")
  for (const [option, values] of [
    ["Farthest", [0.2, 0.3, 0.8]],
    ["Closest", [1, 0.9, 0.1]],
  ])
    values.forEach((value, factorIndex) =>
      decision.setAnswer(option, factorIndex, value),
    )

  return decision
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
        calculation.factor_badness,
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

  test("normalization remains exact for very small non-zero ranges", () => {
    const decision = new Decision("Tiny scale")
    decision.addFactor({
      name: "Tiny",
      optimal: 1e-20,
      weight: 1,
      min: 0,
      max: 1e-20,
    })
    decision.addOption("Best")
    decision.addOption("Worst")
    decision.setAnswer("Best", "Tiny", 1e-20)
    decision.setAnswer("Worst", "Tiny", 0)

    const calculation = calculateRangeMode(
      decision,
      Answer.rangeModes.MEDIAN,
    )

    expect(decision.optimalNormalized()).toEqual([1])
    expect(calculation.normalized_answers).toEqual([[1], [0]])
    expect(calculation.goodness).toEqual([1, 0])
  })

  test("constant factors do not enlarge the worst-possible distance", () => {
    const decision = new Decision("Constant factor")
    decision.addFactor({
      name: "Constant",
      optimal: 5,
      weight: 1,
      min: null,
      max: null,
    })
    decision.addFactor({
      name: "Variable",
      optimal: 1,
      weight: 0.5,
      min: 0,
      max: 1,
    })
    decision.addOption("Option")
    decision.setAnswer("Option", "Constant", 5)
    decision.setAnswer("Option", "Variable", 0)

    expect(decision.worstPossibleDeltasNormalized()).toEqual([0, 1])
    expect(decision.worstPossibleDistance()).toBeCloseTo(0.5)
    expect(
      calculateRangeMode(decision, Answer.rangeModes.MEDIAN).goodness[0],
    ).toBeCloseTo(0)
  })

  test("objective contributions are additive shares of squared distance", () => {
    const decision = new Decision("Contributions")
    decision.addFactor({
      name: "X",
      optimal: 1,
      weight: 0.6,
      min: 0,
      max: 1,
    })
    decision.addFactor({
      name: "Y",
      optimal: 0,
      weight: 0.8,
      min: 0,
      max: 1,
    })
    decision.addOption("Mixed")
    decision.setAnswer("Mixed", "X", 0.5)
    decision.setAnswer("Mixed", "Y", 0.5)

    const calculation = calculateRangeMode(
      decision,
      Answer.rangeModes.MEDIAN,
    )

    expect(calculation.per_option_contributions[0]).toEqual([-0.6, 0.8])
    expect(calculation.objective_contributions[0][0]).toBeCloseTo(0.36)
    expect(calculation.objective_contributions[0][1]).toBeCloseTo(0.64)
    expect(
      calculation.objective_contributions[0].reduce((a, b) => a + b),
    ).toBeCloseTo(1)
    expect(calculation.mean_factor_relevances).toEqual(
      calculation.objective_contributions[0],
    )
  })

  test("Monte Carlo explanations do not cancel deviations across an interior optimum", () => {
    const decision = new Decision("Uncertain explanation")
    decision.addFactor({
      name: "Uncertain",
      optimal: 0.5,
      weight: 1,
      min: 0,
      max: 1,
    })
    decision.addFactor({
      name: "Known shortfall",
      optimal: 1,
      weight: 1,
      min: 0,
      max: 1,
    })
    decision.addOption("Only option")
    decision.setAnswer("Only option", "Uncertain", [0, 1])
    decision.setAnswer("Only option", "Known shortfall", 0.8)

    const randomValues = [0, 1]
    const calculation = decision.calculateAll({
      rangeMode: Answer.rangeModes.MONTE_CARLO,
      numSamples: 2,
      random: () => randomValues.shift(),
    })

    expect(calculation.mean.delta_vectors_normalized[0][0]).toBe(0)
    expect(calculation.mean.factor_badness[0][0]).toBe(1)
    expect(calculation.best.despite).toEqual(["Uncertain"])
    expect(randomValues).toEqual([])
  })

  test("Monte Carlo rejects a non-positive or fractional sample count", () => {
    const decision = createMaximallyUncertainExampleDecision()

    for (const numSamples of [0, -1, 1.5])
      expect(() =>
        decision.calculateAll({
          rangeMode: Answer.rangeModes.MONTE_CARLO,
          numSamples,
        }),
      ).toThrow("Monte Carlo numSamples must be a positive integer")
  })
})

describe("Decision best/worst calculation", () => {
  test.each(["extremes", "threshold"])(
    "%s ranks options by their weighted distance from the optimum",
    (method) => {
      const decision = createBestWorstDecision()
      const calculation = decision.calculateAll({
        rangeMode: Answer.rangeModes.MEDIAN,
        method,
        minThresh: 0.25,
        maxThresh: 0.75,
      })

      expect(calculation.best.is).toBe("Closest")
      expect(calculation.worst.is).toBe("Farthest")
    },
  )

  test("extremes returns the strongest because and despite factor", () => {
    const decision = createBestWorstDecision()
    const calculation = decision.calculateAll({
      rangeMode: Answer.rangeModes.MEDIAN,
      method: "extremes",
      minThresh: 0.25,
      maxThresh: 0.75,
    })

    expect(calculation.best).toEqual({
      is: "Closest",
      because: ["A"],
      despite: ["C"],
    })
    expect(calculation.worst).toEqual({
      is: "Farthest",
      because: ["A"],
      despite: ["C"],
    })
  })

  test("threshold returns every explanation above the threshold", () => {
    const decision = createBestWorstDecision()
    const calculation = decision.calculateAll({
      rangeMode: Answer.rangeModes.MEDIAN,
      method: "threshold",
      minThresh: 0.25,
      maxThresh: 0.75,
    })

    expect(calculation.best).toEqual({
      is: "Closest",
      because: ["A", "B"],
      despite: ["C"],
    })
    expect(calculation.worst).toEqual({
      is: "Farthest",
      because: ["A"],
      despite: ["C"],
    })
  })

  test("threshold falls back to the strongest factor when none qualify", () => {
    const decision = createBestWorstDecision()
    const extremes = decision.calculateAll({
      rangeMode: Answer.rangeModes.MEDIAN,
      method: "extremes",
    })
    const threshold = decision.calculateAll({
      rangeMode: Answer.rangeModes.MEDIAN,
      method: "threshold",
      maxThresh: 2,
    })

    expect(threshold.best).toEqual(extremes.best)
    expect(threshold.worst).toEqual(extremes.worst)
  })

  test.each(["extremes", "threshold"])(
    "%s handles ties consistently at maximum uncertainty",
    (method) => {
      const decision = createMaximallyUncertainExampleDecision()
      const firstOption = decision.options[0].name

      for (const rangeMode of [
        Answer.rangeModes.BEST,
        Answer.rangeModes.WORST,
        Answer.rangeModes.AVERAGE,
      ]) {
        const calculation = decision.calculateAll({ rangeMode, method })

        expect(calculation.best.is).toBe(firstOption)
        expect(calculation.worst.is).toBe(firstOption)
        expect(calculation.best.because.length).toBeGreaterThan(0)
        expect(calculation.best.despite.length).toBeGreaterThan(0)
        expect(calculation.worst.because.length).toBeGreaterThan(0)
        expect(calculation.worst.despite.length).toBeGreaterThan(0)
      }
    },
  )
})
