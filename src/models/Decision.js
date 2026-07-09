import Answer from "./Answer.js"

// TODO: some sort of way to indicate that the optimal value is the min or max (even if the min or max is calculated)

export default class Decision {
  static numSamples = 100

  constructor(name) {
    this.name = name
    this.factors = {
      names: [],
      units: [],
      optimals: [],
      weights: [],
      mins: [],
      maxs: [],
    }
    this.options = []
    // answers: array of shape [numOptions][numFactors] initialized as empty, filled with Answers
    this.answers = []
    this.threshold = 0
    this.factorPacks = new Set()
  }

  // Returns an index is index=true, otherwise returns the name
  _parseOptionParam(name_or_index, index = true) {
    let rtn
    if (typeof name_or_index === "string") {
      rtn = index ? this.options.indexOf(name_or_index) : name_or_index
    } else if (typeof name_or_index === "number") {
      rtn = index ? name_or_index : this.options[name_or_index]
    } else throw new Error(`Invalid option type: ${typeof name_or_index}`)
    // Verify the option is valid
    if (index == false && !this.options.includes(name_or_index))
      throw new Error(
        `Option not found: "${name_or_index}". Valid options are: "${this.options.join('", "')}"`,
      )
    if (index == true && (rtn < 0 || rtn >= this.options.length))
      throw new Error(
        `Option not found: "${name_or_index}". Valid options are: "${this.options.join('", "')}"`,
      )
    return rtn
  }

  // Returns an index is index=true, otherwise returns the name
  _parseFactorParam(name_or_index, index = true) {
    let rtn
    if (typeof name_or_index === "string") {
      rtn = index ? this.factors.names.indexOf(name_or_index) : name_or_index
    } else if (typeof name_or_index === "number") {
      rtn = index ? name_or_index : this.factors.names[name_or_index]
    } else throw new Error(`Invalid factor type: ${typeof name_or_index}`)
    // Verify the factor is valid
    if (index == false && !this.factors.names.includes(name_or_index))
      throw new Error(
        `Factor not found: "${name_or_index}". Valid factors are: "${this.factors.names.join('", "')}"`,
      )
    if (index == true && (rtn < 0 || rtn >= this.factors.names.length))
      throw new Error(
        `Factor not found: "${name_or_index}". Valid factors are: "${this.factors.names.join('", "')}"`,
      )
    return rtn
  }

  isInvalid(allowUnanswered = false) {
    if (this.factors.names.length === 0) return "No factors added"
    if (this.options.length === 0) return "No options added"
    if (this.answers.length !== this.options.length)
      return `Answers length (${this.answers.length}) does not match options length (${this.options.length})`
    if (this.answers.some((row) => row.length !== this.factors.names.length))
      return `Answers length (likely ${this.answers[0].length}) does not match factors length (${this.factors.names.length})`
    if (
      this.answers.some((row) =>
        row.some((ans, i) => ans.isInvalid(this, i, true)),
      )
    )
      return "Not all answers are valid"

    if (
      !allowUnanswered &&
      this.answers.some((row) => row.some((ans) => !ans.isAnswered()))
    )
      return `Not all answers are filled: ${this.answers.filter((row) => row.some((ans) => !ans.isAnswered())).length} answers are not filled`

    if (this.factors.names.some((_, i) => !this.isFactorValid(i)))
      return "Invalid factors: " + this.factors.names.filter((_, i) =>this.isFactorValid(i)).join(", ")
    return null
  }

  isFactorValid(factor) {
    const idx = this._parseFactorParam(factor)
    if (
      this.factors.optimals[idx] === null ||
      this.factors.weights[idx] === null
    )
      return `Factor ${this.factors.names[idx]} must have an optimal and weight`
    // check mins < maxs when both present
    const mn = this.factors.mins[idx]
    const mx = this.factors.maxs[idx]
    if (mn != null && mx != null && mn >= mx)
      return `Factor ${this.factors.names[idx]} must have a min less than their max`
    const w = this.factors.weights[idx]
    if (w < 0 || w > 1)
      return `Factor ${this.factors.names[idx]} must have a weight between 0 and 1`
    return null
  }

  addFactor({
    name,
    unit = null,
    optimal = null,
    weight = null,
    min = null,
    max = null,
  }) {
    // hopefully removing this doesn't mess things up...
    // if (this.factors.names.includes(name))
    //   throw new Error(`Factor ${name} already exists`);
    this.factors.names.push(name)
    this.factors.units.push(unit)
    this.factors.optimals.push(optimal)
    this.factors.weights.push(weight)
    this.factors.mins.push(min)
    this.factors.maxs.push(max)
    for (let i = 0; i < this.answers.length; i++) {
      this.answers[i].push(new Answer())
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
    } = {},
  ) {
    const idx = this._parseFactorParam(factor)
    if (idx === -1) throw new Error("Factor not found")
    if (name !== undefined) this.factors.names[idx] = name
    if (unit !== undefined) this.factors.units[idx] = unit
    if (optimal !== undefined) this.factors.optimals[idx] = optimal
    if (weight !== undefined) this.factors.weights[idx] = weight
    if (min !== undefined) this.factors.mins[idx] = min
    if (max !== undefined) this.factors.maxs[idx] = max
  }

  removeFactor(factor) {
    let idx
    try{
    idx = this._parseFactorParam(factor)
    }catch(e){
        // If it's not a valid factor, good, we don't need to do anything
        return
    }
    this.factors.names.splice(idx, 1)
    this.factors.units.splice(idx, 1)
    this.factors.optimals.splice(idx, 1)
    this.factors.weights.splice(idx, 1)
    this.factors.mins.splice(idx, 1)
    this.factors.maxs.splice(idx, 1)
    for (const row of this.answers) {
      row.splice(idx, 1)
    }
  }

  addOption(name) {
    this.options.push(name)
    const row = []
    for (let i = 0; i < this.factors.names.length; i++) row.push(new Answer())
    this.answers.push(row)
  }

  removeOption(option) {
    const idx = this._parseOptionParam(option)
    if (idx === -1) return
    this.options.splice(idx, 1)
    this.answers.splice(idx, 1)
  }

  renameOption(option, name) {
    const idx = this._parseOptionParam(option)
    this.options[idx] = name
  }

  // Throws an error if it fails
  setAnswer(option, factor, answer) {
    answer = Answer.parse(answer)
    // if (answer === null) throw new Error(`Unable to parse answer ${answer}`)
    if (answer === null) throw new Error(`Unable to parse answer`)
    const err = answer.isInvalid(this, factor, true)
    if (err) throw new Error(err)
    this.answers[this._parseOptionParam(option)][
      this._parseFactorParam(factor)
    ] = answer
  }

  // Throws an error if it fails
  getAnswer(option, factor) {
    // try {
    //   option = this._parseOptionParam(option)
    //   factor = this._parseFactorParam(factor)
    // } catch (e) {
    //   return null
    // }
    // return this.answers[option][factor]
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
    // console.log('added factor pack', pack)
    for (const factor of pack.factors) {
      // if (this.factors.names.includes(factor.name))
      // throw new Error(`Factor ${factor.name} already exists`)
      // console.log(factor)
      this.addFactor(factor)
    }
  }

  removeFactorPack(pack) {
    if (this.factorPacks.delete(pack.name))
      // console.log('removed factor pack', pack)
      for (const factor of pack.factors) this.removeFactor(factor.name)
  }

  serialize() {
    return JSON.stringify({
      name: this.name,
      factors: this.factors,
      options: this.options,
      answers: this.answers.map((row) => row.map((ans) => ans.serialize())),
      threshold: this.threshold,
      factorPacks: Array.from(this.factorPacks),
    })
  }

  static deserialize(data) {
    const obj = typeof data === "string" ? JSON.parse(data) : data
    const d = new Decision(obj.name)
    d.factors = obj.factors
    d.options = obj.options
    d.answers = obj.answers.map((row) => row.map((ans) => new Answer(...ans)))
    d.threshold = obj.threshold
    d.factorPacks = new Set(obj.factorPacks || [])
    return d
  }

  copy() {
    return Decision.deserialize(this.serialize())
  }

  // ---- Calculation methods ----
  _arrayCopy(a) {
    return JSON.parse(JSON.stringify(a))
  }

  weightedAnswers(optimism = 0.5) {
    // returns [numOptions][numFactors]
    const mins = this.minAnswers()
    const maxs = this.maxAnswers()
    const res = mins.map((row, i) =>
      row.map((mn, j) => mn + (maxs[i][j] - mn) * optimism),
    )
    return res
  }

  stdAnswers() {
    const mins = this.minAnswers()
    const maxs = this.maxAnswers()
    return mins.map((row, i) => row.map((mn, j) => (maxs[i][j] - mn) / 2))
  }
  minAnswers() {
    return this.answers.map((row) => row.map((ans) => ans.min))
  }

  maxAnswers() {
    return this.answers.map((row) => row.map((ans) => ans.max))
  }

  mins() {
    const res = []
    for (let i = 0; i < this.factors.names.length; i++) {
      const specified = this.factors.mins[i]
      if (specified != null) {
        res.push(specified)
        continue
      }
      // compute min from answers or optimal
      let minVal = Infinity
      for (let r = 0; r < this.answers.length; r++) {
        const v = this.answers[r][i].min
        if (!Number.isNaN(v)) minVal = Math.min(minVal, v)
      }
      const opt = this.factors.optimals[i]
      res.push(Math.min(minVal === Infinity ? opt : minVal, opt))
    }
    return res
  }

  maxs() {
    const res = []
    for (let i = 0; i < this.factors.names.length; i++) {
      const specified = this.factors.maxs[i]
      if (specified != null) {
        res.push(specified)
        continue
      }
      let maxVal = -Infinity
      for (let r = 0; r < this.answers.length; r++) {
        const v = this.answers[r][i].max
        if (!Number.isNaN(v)) maxVal = Math.max(maxVal, v)
      }
      const opt = this.factors.optimals[i]
      res.push(Math.max(maxVal === -Infinity ? opt : maxVal, opt))
    }
    return res
  }

  optimalNormalized() {
    const mins = this.mins()
    const maxs = this.maxs()
    return this.factors.optimals.map(
      (opt, i) => (opt - mins[i]) / (maxs[i] - mins[i] + Number.EPSILON),
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
    const numFactors = this.factors.names.length
    const weights = this.factors.weights.slice()
    const tiledWeights = Array.from({ length: numOptions }, () =>
      weights.slice(),
    )
    const optNorm = this.optimalNormalized()
    const tiledOptimal = Array.from({ length: numOptions }, () =>
      optNorm.slice(),
    )

    const minsA = this.mins()
    const maxsA = this.maxs()

    // normalized answers
    const normalizedAnswers = answers.map((row) =>
      row.map(
        (v, j) => (v - minsA[j]) / (maxsA[j] - minsA[j] + Number.EPSILON),
      ),
    )

    const deltaVectorsNormalized = normalizedAnswers.map((row) =>
      row.map((v, j) => v - tiledOptimal[0][j]),
    )
    const weightedDeltaVectorsNormalized = deltaVectorsNormalized.map(
      (row, i) => row.map((v, j) => v * tiledWeights[i][j]),
    )

    const weightedDeltaMagnitudes = weightedDeltaVectorsNormalized.map((row) =>
      Math.sqrt(row.reduce((s, x) => s + x * x, 0)),
    )

    const worstDist = this.worstPossibleDistance() || 1
    const normalizedWeightedDists = weightedDeltaMagnitudes.map(
      (m) => m / worstDist,
    )
    const invertedNormalized = normalizedWeightedDists.map((v) => 1 - v)

    // per option contributions = normalizedAnswers * tiledWeights
    const perOptionContributions = normalizedAnswers.map((row, i) =>
      row.map((v, j) => v * tiledWeights[i][j]),
    )

    // objective_contributions = perOptionContributions / weightedDeltaMagnitudes[:, None]
    const objectiveContributions = perOptionContributions.map((row, i) => {
      const denom = weightedDeltaMagnitudes[i] || 1
      return row.map((x) => x / denom)
    })

    const meanFactorRelevances = (() => {
      const sums = Array(numFactors).fill(0)
      for (let i = 0; i < numOptions; i++)
        for (let j = 0; j < numFactors; j++)
          sums[j] += perOptionContributions[i][j]
      return sums.map((s) => s / numOptions)
    })()

    return {
      normalized_answers: normalizedAnswers,
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
    options = { numSamples: Decision.numSamples, method: "extremes" },
  ) {
    const numSamples = options.numSamples || Decision.numSamples
    const method = options.method || "extremes"
    const results = {
      normalized_answers: [],
      delta_vectors_normalized: [],
      weighted_delta_vectors_normalized: [],
      weighted_delta_magnitudes: [],
      per_option_contributions: [],
      objective_contributions: [],
      mean_factor_relevances: [],
      badness: [],
      goodness: [],
    }

    const wa = this.weightedAnswers(0.5)
    const sd = this.stdAnswers()
    const numOptions = wa.length

    function randn() {
      let u = 0,
        v = 0
      while (u === 0) u = Math.random()
      while (v === 0) v = Math.random()
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    }

    for (let s = 0; s < numSamples; s++) {
      // generate sample answers
      const sample = []
      for (let i = 0; i < numOptions; i++) {
        const row = []
        for (let j = 0; j < wa[i].length; j++) {
          const mean = wa[i][j]
          const st = sd[i][j]
          const val = mean + randn() * st
          row.push(val)
        }
        sample.push(row)
      }
      const calc = this._calculate(sample)
      for (const k of Object.keys(results)) results[k].push(calc[k])
    }

    const rtn = { std: {}, mean: {} }
    for (const key of Object.keys(results)) {
      // compute mean and std over samples; results[key] is array of length numSamples of arrays
      const arr = results[key]
      // mean
      const mean = (() => {
        if (!arr.length) return null
        const first = arr[0]
        if (Array.isArray(first)) {
          // assume nested arrays numeric; compute element-wise mean
          if (Array.isArray(first[0])) {
            const rows = first.length
            const cols = first[0].length
            const sums = Array.from({ length: rows }, () => Array(cols).fill(0))
            for (let i = 0; i < arr.length; i++)
              for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++) sums[r][c] += arr[i][r][c]
            return sums.map((row) => row.map((v) => v / arr.length))
          }
          // 1D arrays
          const n = first.length
          const sums1 = Array(n).fill(0)
          for (let i = 0; i < arr.length; i++)
            for (let j = 0; j < n; j++) sums1[j] += arr[i][j]
          return sums1.map((v) => v / arr.length)
        }
        return null
      })()

      const stdv = (() => {
        if (!arr.length) return null
        const first = arr[0]
        if (Array.isArray(first)) {
          if (Array.isArray(first[0])) {
            const rows = first.length
            const cols = first[0].length
            const sums = Array.from({ length: rows }, () => Array(cols).fill(0))
            const means = mean
            for (let i = 0; i < arr.length; i++)
              for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                  sums[r][c] += Math.pow(arr[i][r][c] - means[r][c], 2)
            return sums.map((row) => row.map((v) => Math.sqrt(v / arr.length)))
          }
          const n = first.length
          const sums1 = Array(n).fill(0)
          for (let i = 0; i < arr.length; i++)
            for (let j = 0; j < n; j++)
              sums1[j] += Math.pow(arr[i][j] - mean[j], 2)
          return sums1.map((v) => Math.sqrt(v / arr.length))
        }
        return null
      })()

      rtn.mean[key] = mean
      rtn.std[key] = stdv
    }

    const bestWorst = this.bestWorst(rtn.mean, method)
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
    const options = this.options.slice()
    const contrib = calc.delta_vectors_normalized.map((row) =>
      row.map((v) => Math.abs(v)),
    )
    if (min_thresh == null) min_thresh = percentile(contrib.flat(), 20)
    if (max_thresh == null) max_thresh = percentile(contrib.flat(), 80)
    const tiledWeights = Array.from({ length: options.length }, () =>
      this.factors.weights.slice(),
    )
    const badnessVectors = contrib.map((row, i) =>
      row.map((v, j) => v * tiledWeights[i][j]),
    )
    const goodnessVectors = contrib.map((row, i) =>
      row.map((v, j) => (1 - v) * tiledWeights[i][j]),
    )
    const argmax = (arr) => arr.reduce((m, v, i) => (v > arr[m] ? i : m), 0)
    const best_because = [this.factors.names[argmax(goodnessVectors[bestIdx])]]
    const best_despite = [this.factors.names[argmax(badnessVectors[bestIdx])]]
    const worst_because = [this.factors.names[argmax(badnessVectors[worstIdx])]]
    const worst_despite = [
      this.factors.names[argmax(goodnessVectors[worstIdx])],
    ]
    const best = {
      is: options[bestIdx],
      because: best_because,
      despite: best_despite,
    }
    const worst = {
      is: options[worstIdx],
      because: worst_because,
      despite: worst_despite,
    }
    return { best, worst }
  }
}

function percentile(arr, p) {
  const a = arr.slice().sort((x, y) => x - y)
  const idx = Math.floor((p / 100) * a.length)
  return a[Math.max(0, Math.min(a.length - 1, idx))]
}
