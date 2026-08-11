import Answer from "./Answer.js"
import Factor from "./Factor.js"
import Option from "./Option.js"
import { normalizeColor } from "./color.js"
import { percentile } from "../utils/misc.js"

// TODO: remove the threshold member (it doesn't do anything anymore)

function elementwiseMean(values) {
  if (!values.length) return null
  if (Array.isArray(values[0]))
    return values[0].map((_, index) =>
      elementwiseMean(values.map((value) => value[index])),
    )
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function elementwiseStd(values, mean = elementwiseMean(values)) {
  if (!values.length) return null
  if (Array.isArray(values[0]))
    return values[0].map((_, index) =>
      elementwiseStd(
        values.map((value) => value[index]),
        mean[index],
      ),
    )
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length
  return Math.sqrt(variance)
}

export default class Decision {
  static numSamples = 100

  constructor(name) {
    this.name = name
    this.googleDriveFileId = null
    this.factors = []
    this.options = []
    // answers: array of shape [numOptions][numFactors] initialized as empty, filled with Answers
    this.answers = []
    this.threshold = 0
    this.factorPacks = new Set()
  }

  // Returns an index is index=true, otherwise returns the name
  _parseOptionParam(name_or_index, index = true) {
    const optionNames = this.options.map((option) => option.name)
    let rtn
    if (typeof name_or_index === "string") {
      rtn = index ? optionNames.indexOf(name_or_index) : name_or_index
    } else if (typeof name_or_index === "number") {
      rtn = index ? name_or_index : this.options[name_or_index]?.name
    } else throw new Error(`Invalid option type: ${typeof name_or_index}`)
    // Verify the option is valid
    if (index == false && !optionNames.includes(rtn))
      throw new Error(
        `Option not found: "${name_or_index}". Valid options are: "${optionNames.join('", "')}"`,
      )
    if (index == true && (rtn < 0 || rtn >= this.options.length))
      throw new Error(
        `Option not found: "${name_or_index}". Valid options are: "${optionNames.join('", "')}"`,
      )
    return rtn
  }

  // Returns an index is index=true, otherwise returns the name
  _parseFactorParam(name_or_index, index = true) {
    const factorNames = this.factors.map((factor) => factor.name)
    let rtn
    if (typeof name_or_index === "string") {
      rtn = index ? factorNames.indexOf(name_or_index) : name_or_index
    } else if (typeof name_or_index === "number") {
      rtn = index ? name_or_index : this.factors[name_or_index]?.name
    } else throw new Error(`Invalid factor type: ${typeof name_or_index}`)
    // Verify the factor is valid
    if (index == false && !factorNames.includes(name_or_index))
      throw new Error(
        `Factor not found: "${name_or_index}". Valid factors are: "${factorNames.join('", "')}"`,
      )
    if (index == true && (rtn < 0 || rtn >= this.factors.length))
      throw new Error(
        `Factor not found: "${name_or_index}". Valid factors are: "${factorNames.join('", "')}"`,
      )
    return rtn
  }

  isInvalid(allowUnanswered = false) {
    if (this.factors.length === 0) return "No factors added"
    if (this.options.length === 0) return "No options added"
    if (this.answers.length !== this.options.length)
      return `Answers length (${this.answers.length}) does not match options length (${this.options.length})`
    if (this.answers.some((row) => row.length !== this.factors.length))
      return `Answers length (likely ${this.answers[0].length}) does not match factors length (${this.factors.length})`
    const visibleOptionIndexes = this.options
      .map((option, index) => (option.hidden ? null : index))
      .filter((index) => index !== null)
    if (visibleOptionIndexes.length === 0) return "No visible options"
    let invalidAnswers = []
    for (let i = 0; i < this.factors.length; i++) {
      for (const j of visibleOptionIndexes) {
        const ans = this.answers[j][i]
        if (ans.isInvalid()) invalidAnswers.push(ans)
      }
    }
    if (invalidAnswers.length)
      return `Not all answers are valid:
        ${invalidAnswers.map((answer) => answer.serialize().join(", ")).join("\n")}`

    if (
      !allowUnanswered &&
      visibleOptionIndexes.some((index) =>
        this.answers[index].some((ans) => !ans.isAnswered()),
      )
    )
      return `Not all answers are filled: ${visibleOptionIndexes.filter((index) => this.answers[index].some((ans) => !ans.isAnswered())).length} answers are not filled`

    if (this.factors.some((_, i) => !!this.isFactorValid(i)))
      return (
        "Invalid factors: " +
        this.factors
          .filter((_, i) => this.isFactorValid(i))
          .map((factor) => factor.name)
          .join(", ")
      )
    return null
  }

  isFactorValid(factor) {
    const idx = this._parseFactorParam(factor)
    const currentFactor = this.factors[idx]
    if (currentFactor.optimal === null || currentFactor.weight === null)
      return `Factor ${currentFactor.name} must have an optimal and weight`
    // check mins < maxs when both present
    const mn = currentFactor.min
    const mx = currentFactor.max
    if (mn != null && mx != null && mn >= mx)
      return `Factor ${currentFactor.name} must have a min less than their max`
    const w = currentFactor.weight
    if (w < 0 || w > 1)
      return `Factor ${currentFactor.name} must have a weight between 0 and 1`
    return null
  }

  addFactor(factor) {
    // hopefully removing this doesn't mess things up...
    // if (this.factors.some(({ name }) => name === factor.name))
    //   throw new Error(`Factor ${factor.name} already exists`);
    const newFactor = Factor.deserialize(factor)
    this.factors.push(newFactor)
    for (let i = 0; i < this.answers.length; i++) {
      this.answers[i].push(
        new Answer(null, null, false, newFactor, this.options[i]),
      )
    }
  }

  editFactor(
    factor,
    {
      name = undefined,
      unit = undefined,
      optimal = undefined,
      weight = undefined,
      min = undefined,
      max = undefined,
      color = undefined,
    } = {},
  ) {
    const idx = this._parseFactorParam(factor)
    if (idx === -1) throw new Error("Factor not found")
    const currentFactor = this.factors[idx]
    if (name !== undefined) currentFactor.name = name
    if (unit !== undefined) currentFactor.unit = unit
    if (optimal !== undefined) currentFactor.optimal = optimal
    if (weight !== undefined) currentFactor.weight = weight
    if (min !== undefined) currentFactor.min = min
    if (max !== undefined) currentFactor.max = max
    if (color !== undefined) currentFactor.color = normalizeColor(color)
  }

  clearFactorAnswers(factor) {
    const idx = this._parseFactorParam(factor)
    for (const row of this.answers) row[idx].clear()
  }

  markFactorAnswersTentative(factor) {
    const idx = this._parseFactorParam(factor)
    for (const row of this.answers)
      if (row[idx].isAnswered()) row[idx].tentative = true
  }

  removeFactor(factor) {
    let idx
    try {
      idx = this._parseFactorParam(factor)
    } catch {
      // If it's not a valid factor, good, we don't need to do anything
      return
    }
    this.factors.splice(idx, 1)
    for (const row of this.answers) {
      row.splice(idx, 1)
    }
  }

  reorderFactors(order) {
    const expectedOrder = this.factors.map((_, index) => index)
    if (
      !Array.isArray(order) ||
      order.length !== expectedOrder.length ||
      [...order].sort((a, b) => a - b).some((value, index) => value !== index)
    ) {
      throw new Error(
        "Factor order must contain every factor index exactly once",
      )
    }

    this.factors = order.map((index) => this.factors[index])
    this.answers = this.answers.map((row) => order.map((index) => row[index]))
  }

  addOption(option) {
    const newOption = Option.deserialize(option)
    this.options.push(newOption)
    const row = this.factors.map(
      (factor) => new Answer(null, null, false, factor, newOption),
    )
    this.answers.push(row)
  }

  reorderOptions(order) {
    const expectedOrder = this.options.map((_, index) => index)
    if (
      !Array.isArray(order) ||
      order.length !== expectedOrder.length ||
      [...order].sort((a, b) => a - b).some((value, index) => value !== index)
    )
      throw new Error(
        "Option order must contain every option index exactly once",
      )

    this.options = order.map((index) => this.options[index])
    this.answers = order.map((index) => this.answers[index])
  }

  removeOption(option) {
    const idx = this._parseOptionParam(option)
    if (idx === -1) return
    this.options.splice(idx, 1)
    this.answers.splice(idx, 1)
  }

  renameOption(option, name) {
    const idx = this._parseOptionParam(option)
    this.options[idx].name = name
  }

  setOptionNote(option, note) {
    this.options[this._parseOptionParam(option)].notes = note ?? ""
  }

  setOptionHidden(option, hidden) {
    this.options[this._parseOptionParam(option)].hidden = Boolean(hidden)
  }

  setOptionColor(option, color) {
    this.options[this._parseOptionParam(option)].color = normalizeColor(color)
  }

  getVisibleOptions() {
    return this.options.filter((option) => !option.hidden)
  }

  // Throws an error if it fails
  setAnswer(option, factor, answer) {
    const optionIdx = this._parseOptionParam(option)
    const factorIdx = this._parseFactorParam(factor)
    answer = Answer.parse(
      answer,
      this.factors[factorIdx],
      this.options[optionIdx],
    )
    if (answer === null) throw new Error(`Unable to parse answer`)
    // If they didn't answer it, that's fine
    if (answer.isAnswered()) {
      const err = answer.isInvalid(true)
      if (err) throw new Error(err)
    }
    this.answers[optionIdx][factorIdx] = answer
  }

  // Throws an error if it fails
  getAnswer(option, factor) {
    return this.answers[this._parseOptionParam(option)][
      this._parseFactorParam(factor)
    ]
  }

  clearAllAnswers() {
    for (let i = 0; i < this.answers.length; i++)
      for (let j = 0; j < this.answers[i].length; j++)
        this.answers[i][j].clear()
  }

  addFactorPack(pack) {
    this.factorPacks.add(pack.name)
    for (const factor of pack.factors) {
      this.addFactor(factor)
    }
  }

  removeFactorPack(pack) {
    if (this.factorPacks.delete(pack.name))
      for (const factor of pack.factors) this.removeFactor(factor.name)
  }

  serialize({ includeLocalMetadata = false } = {}) {
    const serialized = {
      name: this.name,
      factors: this.factors.map((factor) => factor.serialize()),
      options: this.options.map((option) => option.serialize()),
      answers: this.answers.map((row) =>
        row.map((answer) => answer.serialize()),
      ),
      threshold: this.threshold,
      factorPacks: Array.from(this.factorPacks),
    }
    if (includeLocalMetadata && this.googleDriveFileId)
      serialized.localMetadata = {
        googleDriveFileId: this.googleDriveFileId,
      }
    return JSON.stringify(serialized)
  }

  static deserialize(data) {
    const obj = typeof data === "string" ? JSON.parse(data) : data
    const d = new Decision(obj.name)
    d.googleDriveFileId =
      typeof obj.localMetadata?.googleDriveFileId === "string" ?
        obj.localMetadata.googleDriveFileId
      : null
    if (Array.isArray(obj.factors)) {
      d.factors = obj.factors.map((factor) => Factor.deserialize(factor))
    } else {
      const legacyFactors = obj.factors ?? {}
      d.factors = (legacyFactors.names ?? []).map((name, index) =>
        Factor.deserialize({
          name,
          unit: legacyFactors.units?.[index] ?? null,
          optimal: legacyFactors.optimals?.[index] ?? null,
          weight: legacyFactors.weights?.[index] ?? null,
          min: legacyFactors.mins?.[index] ?? null,
          max: legacyFactors.maxs?.[index] ?? null,
        }),
      )
    }
    const legacyOptionNotes = obj.optionNotes ?? {}
    d.options = (obj.options ?? []).map((option) => {
      const parsed = Option.deserialize(option)
      const hasEmbeddedNotes =
        option && typeof option === "object" && Object.hasOwn(option, "notes")
      if (
        !hasEmbeddedNotes &&
        typeof legacyOptionNotes?.[parsed.name] === "string"
      )
        parsed.notes = legacyOptionNotes[parsed.name]
      return parsed
    })
    d.answers = obj.answers.map((row, optionIndex) =>
      row.map((answer, factorIndex) =>
        Answer.deserialize(
          answer,
          d.factors[factorIndex],
          d.options[optionIndex],
        ),
      ),
    )
    d.threshold = obj.threshold
    d.factorPacks = new Set(obj.factorPacks || [])
    return d
  }

  copy() {
    return Decision.deserialize(this.serialize({ includeLocalMetadata: true }))
  }

  // Returns an array of factors that have non-finite ranges, given the currently answered answers.
  // For example, if there's a non-finite factor, but all answers are finite, it won't be returned
  getPracticalNonFiniteFactors() {
    const visibleOptionIndexes = this.options
      .map((option, index) => (option.hidden ? null : index))
      .filter((index) => index !== null)
    return this.factors.filter(
      (factor, factorIndex) => {
        const answers = visibleOptionIndexes.map(
          (optionIndex) => this.answers[optionIndex][factorIndex],
        )
        return (
          !factor.isFinite(answers) &&
          answers.some((answer) => !answer.isAnswered())
        )
      },
    )
  }

  // Return a copy of the current decision, but with any unanswered answers replaced with maximally
  // uncertain answers (their mins and maxs equal their factors' mins and maxs)
  // Because factors can have non-finite ranges, overrideFactorRanges can be used to override the ranges
  // of specific factors. Format looks like {factorName: [min, max]}
  uncertainCopy(overrideFactorRanges = {}) {
    const copy = this.copy()

    // Override the ranges of specific factors
    copy.factors.forEach((factor, factorIndex) => {
      const [overrideMin, overrideMax] = overrideFactorRanges[factor.name] ?? []
      const visibleAnswers = copy.answers
        .filter((_, optionIndex) => !copy.options[optionIndex].hidden)
        .map((row) => row[factorIndex])
      const [practicalMin, practicalMax] =
        factor.practicalRange(visibleAnswers)
      const min = overrideMin ?? practicalMin
      const max = overrideMax ?? practicalMax
      copy.answers.forEach((row, optionIndex) => {
        if (copy.options[optionIndex].hidden) return
        const ans = row[factorIndex]
        if (ans.isAnswered()) return
        ans.min = min
        ans.max = max
      })
    })

    return copy
  }

  // ---- Calculation methods ----
  _arrayCopy(a) {
    return JSON.parse(JSON.stringify(a))
  }

  // TODO: there's a reason this isn't used. "optimism" isn't really accurate, because valueAt() uses
  // naive range interpolation, while what's "best" or "worst" depends on what the optimal for each
  // factor is. That could be done, but isn't implemented yet, and is more complicated.
  weightedAnswers(optimism = 0.5) {
    return this.answers.map((row) =>
      row.map((answer) => answer.valueAt(optimism)),
    )
  }

  stdAnswers() {
    return this.answers.map((row) =>
      row.map((answer) => answer.rangeRadius()),
    )
  }

  answerValues(rangeMode = Answer.rangeModes.MEDIAN, random = Math.random) {
    return this.answers.map((row) =>
      row.map((answer) => answer.valueForRange(rangeMode, random)),
    )
  }

  minAnswers() {
    return this.answers.map((row) => row.map((ans) => ans.min))
  }

  maxAnswers() {
    return this.answers.map((row) => row.map((ans) => ans.max))
  }

  optimals() {
    return this.factors.map((factor, factorIndex) => {
      if (Number.isFinite(factor.optimal)) return factor.optimal
      if (factor.optimal !== -Infinity && factor.optimal !== Infinity)
        return factor.optimal

      const answerValues = this.answers
        .map((row) => {
          const answer = row[factorIndex]
          return factor.optimal === -Infinity ? answer?.min : answer?.max
        })
        .filter(Number.isFinite)

      if (!answerValues.length) return null
      return factor.optimal === -Infinity ?
          Math.min(...answerValues)
        : Math.max(...answerValues)
    })
  }

  mins() {
    return this.factors.map(
      (factor, factorIndex) =>
        factor.practicalRange(this.answers.map((row) => row[factorIndex]))[0],
    )
  }

  maxs() {
    return this.factors.map(
      (factor, factorIndex) =>
        factor.practicalRange(this.answers.map((row) => row[factorIndex]))[1],
    )
  }

  optimalNormalized() {
    const mins = this.mins()
    const maxs = this.maxs()
    return this.optimals().map(
      (optimal, i) =>
        (optimal - mins[i]) / (maxs[i] - mins[i] + Number.EPSILON),
    )
  }

  worstPossibleDistance() {
    const optNorm = this.optimalNormalized()
    const worst = optNorm.map((v) => (Math.round(v) === 0 ? 1 : 0))
    const sumSq = worst.reduce(
      (s, val, i) => s + Math.pow(val - optNorm[i], 2),
      0,
    )
    return Math.sqrt(sumSq)
  }

  _calculate(answers) {
    // answers: [numOptions][numFactors]
    const numOptions = answers.length
    const numFactors = this.factors.length
    const weights = this.factors.map((factor) => factor.weight)
    // Tile weights to match the shape of options
    const tiledWeights = Array.from({ length: numOptions }, () =>
      weights.slice(),
    )
    const optNorm = this.optimalNormalized()
    // Tile normalized optimal values to match the shape of options
    const tiledOptimal = Array.from({ length: numOptions }, () =>
      optNorm.slice(),
    )

    const minsA = this.mins()
    const maxsA = this.maxs()

    // The answers normalized to the range [0, 1]
    const normalizedAnswers = answers.map((row) =>
      row.map(
        (v, j) => (v - minsA[j]) / (maxsA[j] - minsA[j] + Number.EPSILON),
      ),
    )
    const entropy = Array.from({ length: numFactors }, (_, factorIndex) =>
      elementwiseStd(
        normalizedAnswers.map((row) => row[factorIndex]),
      ) ?? 0,
    )
    const usefulness = entropy.map(
      (factorEntropy, factorIndex) =>
        factorEntropy * weights[factorIndex],
    )

    // The distance between each option and the optimal
    const deltaVectorsNormalized = normalizedAnswers.map((row) =>
      row.map((v, j) => v - tiledOptimal[0][j]),
    )
    // The weighted delta vector between each option and the optimal
    const weightedDeltaVectorsNormalized = deltaVectorsNormalized.map(
      (row, i) => row.map((v, j) => v * tiledWeights[i][j]),
    )

    // The magnitudes of the weighted delta vectors between each option and the optimal
    const weightedDeltaMagnitudes = weightedDeltaVectorsNormalized.map((row) =>
      Math.sqrt(row.reduce((s, x) => s + x * x, 0)),
    )

    const worstDist = this.worstPossibleDistance() || 1
    // The normalized weighted distances between each option and the optimal
    const normalizedWeightedDists = weightedDeltaMagnitudes.map(
      (m) => m / worstDist,
    )
    const invertedNormalized = normalizedWeightedDists.map((v) => 1 - v)

    // per option contributions = normalizedAnswers * tiledWeights
    // A percentage of how much each factor contributed to the total distance between the optimal and each option
    // This is really num_options seperate vectors, but they're together for convenience
    // The sign indicates whether it was towrds or away from the optimal. Take the absolute value for the plain contribution
    // per_option_contributions = weighted_delta_vectors_normalized / weighted_delta_magnitudes[:, None]
    const perOptionContributions = weightedDeltaVectorsNormalized.map(
      (row, optionIndex) => {
        const magnitude = weightedDeltaMagnitudes[optionIndex] || 1
        return row.map((value) => value / magnitude)
      },
    )

    // The original way of calculating it. This may not be accurate to the comment above, however.
    // It may be what I actually want though. Honestly not sure.
    // const perOptionContributions = normalizedAnswers.map((row, i) =>
    //   row.map((v, j) => v * tiledWeights[i][j]),
    // )

    // objective_contributions = perOptionContributions / weightedDeltaMagnitudes[:, None]
    // A percentage of how much each factor contributed to the distance from the optimal, divided by each option's distance
    // I'm not sure how useful this is: probably just use per_option_contributions or weighted_delta_vectors instead
    const objectiveContributions = perOptionContributions.map((row, i) => {
      const denom = weightedDeltaMagnitudes[i] || 1
      return row.map((x) => x / denom)
    })

    // The average percentage of how much each factor deviates from the optimal
    // I'm about 85% sure this is correct
    const meanFactorRelevances = (() => {
      const sums = Array(numFactors).fill(0)
      for (let i = 0; i < numOptions; i++)
        for (let j = 0; j < numFactors; j++)
          sums[j] += perOptionContributions[i][j]
      return sums.map((s) => s / numOptions)
    })()

    return {
      normalized_answers: normalizedAnswers,
      entropy,
      usefulness,
      delta_vectors_normalized: deltaVectorsNormalized,
      weighted_delta_vectors_normalized: weightedDeltaVectorsNormalized,
      weighted_delta_magnitudes: weightedDeltaMagnitudes,
      per_option_contributions: perOptionContributions,
      objective_contributions: objectiveContributions,
      mean_factor_relevances: meanFactorRelevances,
      badness: normalizedWeightedDists,
      goodness: invertedNormalized,
    }
  }

  calculateAll(
    options = { numSamples: Decision.numSamples, method: "extremes", minThresh: null, maxThresh: null },
  ) {
    if (this.options.some((option) => option.hidden)) {
      const visibleCopy = this.copy()
      for (let index = visibleCopy.options.length - 1; index >= 0; index -= 1)
        if (visibleCopy.options[index].hidden) visibleCopy.removeOption(index)
      return visibleCopy.calculateAll(options)
    }
    const numSamples = options.numSamples || Decision.numSamples
    const method = options.method || "extremes"
    const minThresh = options.minThresh
    const maxThresh = options.maxThresh
    const rangeMode = options.rangeMode || Answer.rangeModes.MONTE_CARLO
    const random = options.random || Math.random
    if (!Object.values(Answer.rangeModes).includes(rangeMode))
      throw new Error(`Invalid range mode: ${rangeMode}`)

    const sampleCount =
      rangeMode === Answer.rangeModes.MONTE_CARLO ? numSamples : 1
    const calculations = Array.from({ length: sampleCount }, () =>
      this._calculate(this.answerValues(rangeMode, random)),
    )
    const resultKeys = Object.keys(calculations[0])

    const rtn = { std: {}, mean: {} }
    for (const key of resultKeys) {
      // Compute element-wise mean and standard deviation over calculations.
      const values = calculations.map((calculation) => calculation[key])
      rtn.mean[key] = elementwiseMean(values)
      rtn.std[key] = elementwiseStd(values, rtn.mean[key])
    }

    const bestWorst = this.bestWorst(
      rtn.mean,
      method,
      minThresh,
      maxThresh,
    )
    rtn.best = bestWorst.best
    rtn.worst = bestWorst.worst
    return rtn
  }

  bestWorst(calc, method = "extremes", min_thresh = null, max_thresh = null) {
    // calc is mean results
    const weighted = calc.weighted_delta_magnitudes
    let bestIdx = 0,
      worstIdx = 0
    for (let i = 0; i < weighted.length; i++) {
      if (weighted[i] < weighted[bestIdx]) bestIdx = i
      if (weighted[i] > weighted[worstIdx]) worstIdx = i
    }
    const options = this.getVisibleOptions().map((option) => option.name)
    // The abs is because 0 is the best, and if it's non-zero in either direction, + or -, it's still
    // further away from the optimal.
    const contrib = calc.delta_vectors_normalized.map((row) =>
      row.map((v) => Math.abs(v)),
    )
    if (min_thresh == null) min_thresh = percentile(contrib.flat(), 20)
    if (max_thresh == null) max_thresh = percentile(contrib.flat(), 80)
    // These need to be seperate, so that the weights actually apply to each
    // (.9 * 0 is still 0)
    const tiledWeights = Array.from({ length: options.length }, () =>
      this.factors.map((factor) => factor.weight),
    )
    const badnessVectors = contrib.map((row, i) =>
      row.map((v, j) => v * tiledWeights[i][j]),
    )
    const goodnessVectors = contrib.map((row, i) =>
      row.map((v, j) => (1 - v) * tiledWeights[i][j]),
    )
    const argmax = (arr) => arr.reduce((m, v, i) => (v > arr[m] ? i : m), 0)
    const best_because = [this.factors[argmax(goodnessVectors[bestIdx])].name]
    const best_despite = [this.factors[argmax(badnessVectors[bestIdx])].name]
    const worst_because = [this.factors[argmax(badnessVectors[worstIdx])].name]
    const worst_despite = [this.factors[argmax(goodnessVectors[worstIdx])].name]
    const factorNames = this.factors.map((factor) => factor.name)
    const aboveThreshold = (vector) =>
      factorNames.filter((_, factorIndex) => vector[factorIndex] > max_thresh)
    const best_because_thresh = aboveThreshold(goodnessVectors[bestIdx])
    const best_despite_thresh = aboveThreshold(badnessVectors[bestIdx])
    const worst_because_thresh = aboveThreshold(badnessVectors[worstIdx])
    const worst_despite_thresh = aboveThreshold(goodnessVectors[worstIdx])

    if (method !== "extremes" && method !== "threshold")
      throw new Error(`Invalid method: ${method}`)

    const thresholdOrExtreme = (thresholdFactors, extremeFactors) =>
      method === "threshold" && thresholdFactors.length ?
        thresholdFactors
      : extremeFactors
    const best = {
      is: options[bestIdx],
      because: thresholdOrExtreme(best_because_thresh, best_because),
      despite: thresholdOrExtreme(best_despite_thresh, best_despite),
    }
    const worst = {
      is: options[worstIdx],
      because: thresholdOrExtreme(worst_because_thresh, worst_because),
      despite: thresholdOrExtreme(worst_despite_thresh, worst_despite),
    }
    return { best, worst }
  }
}
