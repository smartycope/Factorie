import { useEffect, useState, useRef } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Plot from "react-plotly.js"
import { useDecisions } from "../contexts/UseDecisions"
import Decision from "../models/Decision"
import Paper from "@mui/material/Paper"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import MultiHandledSlider from "../components/MultiHandledSlider"
import { Checkbox, FormControlLabel, TextField } from "@mui/material"
import { reorderWeightsForSortedResult } from "../utils/weights.js"

// TODO: add a "back" button to change your previous answer in the quiz without resetting everything (difficult, possibly impossible)
// TODO: let factors that were answered as "about the same" have the same weight and be grouped together in the sorting
// TODO: Maybe somehting like, show what the optimal is for each factor when sorting weights

const linspace = (a, b, count) => {
  if (count === 1) return [a]
  return Array.from(
    { length: count },
    (_, i) => a + (b - a) * (i / (count - 1)),
  )
}

const cubicspace = (a, b, count, scale = 8) => {
  if (count === 1) return [a]

  const f = (x) => x ** 3
  const lo = f(-0.5 * scale)
  const hi = f(0.5 * scale)

  return Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1) - 0.5) * scale
    const y = (f(x) - lo) / (hi - lo)
    return a + (b - a) * y
  })
}

const expspace = (a, b, count, exponent = 4) => {
  if (count === 1) return [a]

  const denom = Math.exp(exponent) - 1

  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const u = (Math.exp(exponent * t) - 1) / denom
    return a + (b - a) * u
  })
}

const easespace = (a, b, count) => {
  if (count === 1) return [a]

  return Array.from({ length: count }, (_, i) => {
    // const t = i / (count - 1)
    // const u = (Math.exp(exponent * t) - 1) / denom
    // return 3*i**2 - 2*i**3
    const t = i / (count - 1)
    // const u = 3*t**2 - 2*t**3
    const u = 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3
    return a + (b - a) * u
  })
}

const WEIGHT_ARRANGEMENTS = [
  {
    label: "Ease",
    getWeights: (count) => easespace(0, 1, count),
  },
  {
    label: "Linear",
    getWeights: (count) => linspace(0, 1, count),
  },
  {
    label: "Cubic",
    getWeights: (count) => cubicspace(0, 1, count, 1),
  },
  {
    label: "Exponential",
    getWeights: (count) => expspace(0, 1, count, 3),
  },
]

const persistedValues = {
  decision: null,
  selectedIndex: null,
  handles: {},
  sortGenerator: null,
  pendingPair: null,
  quizFinished: false,
  sortStarted: false,
}

function handlesForDecision(decision, handles = {}) {
  if (!decision) return {}
  return decision.factors.reduce((validHandles, factor) => {
    validHandles[factor.name] = handles[factor.name] ?? factor.weight ?? 0
    return validHandles
  }, {})
}

function* mergeSortCoroutine(arr) {
  if (arr.length <= 1) return arr

  function* helper(sub) {
    if (sub.length <= 1) return sub
    const mid = Math.floor(sub.length / 2)
    const left = yield* helper(sub.slice(0, mid))
    const right = yield* helper(sub.slice(mid))
    const merged = []
    let i = 0,
      j = 0
    while (i < left.length && j < right.length) {
      const comparison = yield [left[i], right[j]]
      if (comparison === null) {
        merged.push(left[i++])
      } else if (comparison) {
        merged.push(left[i])
        i++
      } else {
        merged.push(right[j])
        j++
      }
    }
    while (i < left.length) {
      merged.push(left[i])
      i++
    }
    while (j < right.length) {
      merged.push(right[j])
      j++
    }
    return merged
  }

  const sorted = yield* helper(arr)
  return sorted
}

// This works a little better when the factors are already somewhat sorted. I make this assumption because
// 1. I can sort factor packs by what's most likely to be important first
// 2. People tend to think of and enter the most relevant factors first
// See the Jupyter notebook for testing these
function* modifiedTimSortCoroutine(arr) {
  if (arr.length <= 1) return arr

  function* compare(a, b) {
    return yield [a, b]
  }

  function* merge(left, right) {
    // Already in order?
    const boundary = yield* compare(left[left.length - 1], right[0])

    if (boundary === null || boundary) {
      return left.concat(right)
    }

    const merged = []
    let i = 0
    let j = 0

    while (i < left.length && j < right.length) {
      const c = yield* compare(left[i], right[j])

      if (c === null || c) {
        // left <= right
        merged.push(left[i++])
      } else {
        merged.push(right[j++])
      }
    }

    while (i < left.length) merged.push(left[i++])

    while (j < right.length) merged.push(right[j++])

    return merged
  }

  // -----------------------------
  // Detect natural runs
  // -----------------------------

  const runs = []
  let i = 0

  while (i < arr.length) {
    let end = i

    if (end + 1 < arr.length) {
      const firstCmp = yield* compare(arr[end], arr[end + 1])
      const ascending = firstCmp === null || firstCmp

      end++

      while (end < arr.length - 1) {
        const c = yield* compare(arr[end], arr[end + 1])

        if (ascending) {
          if (!(c === null || c)) break
        } else {
          if (c === null || c) break
        }

        end++
      }

      const run = arr.slice(i, end + 1)

      if (!ascending) run.reverse()

      runs.push(run)
    } else {
      runs.push([arr[i]])
    }

    i = end + 1
  }

  // -----------------------------
  // Merge runs
  // -----------------------------

  while (runs.length > 1) {
    // Find the adjacent pair with the smallest total length.
    let best = 0
    let bestSize = runs[0].length + runs[1].length

    for (let i = 1; i < runs.length - 1; i++) {
      const size = runs[i].length + runs[i + 1].length
      if (size < bestSize) {
        best = i
        bestSize = size
      }
    }

    const merged = yield* merge(runs[best], runs[best + 1])

    runs.splice(best, 2, merged)
  }

  return runs[0]
}

export default function Weights() {
  const { decisions, setDecisions, selectedIndex } = useDecisions()
  const decision = selectedIndex != null ? decisions[selectedIndex] : null
  const hasPersistedState =
    decision != null &&
    persistedValues.decision === decision &&
    persistedValues.selectedIndex === selectedIndex

  // positions state must be top-level (hooks cannot be conditional)
  const [handles, _setHandles] = useState(() =>
    hasPersistedState ? persistedValues.handles : {},
  )
  const [allowReordering, setAllowReordering] = useState(false)
  const [precise, setPrecise] = useState(false)
  const [arrangeMenuAnchorEl, setArrangeMenuAnchorEl] = useState(null)
  const [showRadar, setShowRadar] = useState(true)
  const [plotFactorLimit, setPlotFactorLimit] = useState(20)

  // Quiz hooks and handlers (kept at top-level so hooks order is stable)
  const sortGenRef = useRef(
    hasPersistedState ? persistedValues.sortGenerator : null,
  )
  const [pendingPair, _setPendingPair] = useState(() =>
    hasPersistedState ? persistedValues.pendingPair : null,
  )
  const [quizFinished, _setQuizFinished] = useState(() =>
    hasPersistedState ? persistedValues.quizFinished : false,
  )
  const [sortStarted, _setSortStarted] = useState(() =>
    hasPersistedState ? persistedValues.sortStarted : false,
  )

  function setHandles(update) {
    _setHandles((previous) => {
      const next = typeof update === "function" ? update(previous) : update
      persistedValues.handles = next
      return next
    })
  }

  function setPendingPair(next) {
    persistedValues.pendingPair = next
    _setPendingPair(next)
  }

  function setQuizFinished(next) {
    persistedValues.quizFinished = next
    _setQuizFinished(next)
  }

  function setSortStarted(next) {
    persistedValues.sortStarted = next
    _setSortStarted(next)
  }

  function setSortGenerator(next) {
    persistedValues.sortGenerator = next
    sortGenRef.current = next
  }

  // Sync positions from the selected decision only when the decision changes.
  // We intentionally do not include `positions` in the deps to avoid clobbering
  // user edits while they're moving the sliders.

  useEffect(() => {
    if (!decision) return
    if (
      persistedValues.decision === decision &&
      persistedValues.selectedIndex === selectedIndex
    )
      return

    const t = setTimeout(() => {
      persistedValues.decision = decision
      persistedValues.selectedIndex = selectedIndex
      setHandles(
        decision.factors.reduce((acc, factor) => {
          acc[factor.name] = factor.weight ?? 0
          return acc
        }, {}),
      )
      setSortGenerator(null)
      setPendingPair(null)
      setQuizFinished(false)
      setSortStarted(false)
    }, 0)
    return () => clearTimeout(t)
  }, [decision, selectedIndex])

  const factorHandles = handlesForDecision(decision, handles)

  function updateFactorHandles(update) {
    setHandles((previous) => {
      const validPrevious = handlesForDecision(decision, previous)
      const next =
        typeof update === "function" ? update(validPrevious) : update
      return handlesForDecision(decision, next)
    })
  }

  function startSort() {
    setQuizFinished(false)
    setSortStarted(true)
    if (!decision) return
    const g = modifiedTimSortCoroutine(
      decision.factors.map((factor) => factor.name),
    )
    setSortGenerator(g)
    const first = g.next()
    if (first.done) applySortedWeightsToPositions(first.value)
    else setPendingPair(first.value)
  }

  const handleNextComparison = (ans) => {
    if (!sortGenRef.current || !pendingPair) return
    const resp =
      ans === pendingPair[0] ? true
      : ans === pendingPair[1] ? false
      : null
    const res = sortGenRef.current.next(resp)
    if (res.done) {
      setPendingPair(null)
      applySortedWeightsToPositions(res.value || [])
    } else {
      setPendingPair(res.value)
    }
  }

  function applySortedWeightsToPositions(sortedResult) {
    setQuizFinished(true)
    if (!sortedResult || sortedResult.length === 0) return
    const orderedLabels = decision.factors.map((factor) => factor.name)
    setHandles(
      reorderWeightsForSortedResult(
        factorHandles,
        sortedResult,
        orderedLabels,
      ),
    )
  }

  function handleCancel() {
    if (!decision) return
    setHandles(
      decision.factors.reduce((acc, factor) => {
        acc[factor.name] = factor.weight ?? 0
        return acc
      }, {}),
    )
  }

  function arrangeWeights(getWeights) {
    const orderedLabels = Object.entries(factorHandles)
      .sort(([, a], [, b]) => a - b)
      .map(([label]) => label)
    const count = orderedLabels.length
    if (count === 0) return

    const arrangedWeights = getWeights(count)

    setHandles(
      orderedLabels.reduce((nextHandles, label, index) => {
        nextHandles[label] = arrangedWeights[index]
        return nextHandles
      }, {}),
    )
    setArrangeMenuAnchorEl(null)
  }

  function applyPositionsToWeights() {
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    d.factors.forEach((factor) => {
      factor.weight = factorHandles[factor.name]
    })
    copy[selectedIndex] = d
    setDecisions(copy)
  }

  const labels = Object.keys(factorHandles)
  const positions = labels.map((label) => factorHandles[label])

  const unsaved =
    decision != null &&
    decision.factors.some(
      (factor) => factorHandles[factor.name] !== factor.weight,
    )

  // Plotly visuals
  // sort bars by value (ascending)
  const pairs = labels.map((lab, i) => ({ lab, val: positions[i] ?? 0 }))
  pairs.sort((a, b) => a.val - b.val)
  const maxPlotFactorLimit =
    labels.length % 2 === 0 ? labels.length : labels.length - 1
  const normalizedPlotFactorLimit = Math.max(
    2,
    Math.min(plotFactorLimit, maxPlotFactorLimit || 2),
  )
  const limitedPairs =
    pairs.length > 20 ?
      [
        ...pairs.slice(0, normalizedPlotFactorLimit / 2),
        ...pairs.slice(-(normalizedPlotFactorLimit / 2)),
      ]
    : pairs
  const barX = limitedPairs.map((p) => p.lab)
  const barY = limitedPairs.map((p) => p.val)
  const barData = [{ x: barX, y: barY, type: "bar" }]
  const barLayout = {
    xaxis: { tickangle: 45, automargin: true },
    yaxis: { tickformat: ".0%", title: "Weight" },
    showlegend: false,
    width: "100%",
    height: "100%",
    margin: { b: 120 },
  }

  const radarData = [
    {
      type: "barpolar",
      r: barY,
      theta: barX,
      width: 0.8,
      opacity: 0.8,
    },
  ]
  const radarLayout = {
    width: "100%",
    height: "100%",
    polar: {
      radialaxis: {
        range: [0, 1],
        showticklabels: false,
        ticks: "",
      },
      angularaxis: {
        showticklabels: true,
        rotation: barX.length ? 180 / barX.length : 0,
        tickfont: { size: barX.length > 16 ? 10 : 12 },
      },
    },
    margin: { t: 80, b: 80, l: 80, r: 80 },
  }

  function handlePlotFactorLimitChange(e) {
    const nextValue = Number(e.target.value)
    if (!Number.isFinite(nextValue)) return
    const evenValue = nextValue % 2 === 0 ? nextValue : nextValue - 1
    setPlotFactorLimit(Math.max(2, Math.min(evenValue, maxPlotFactorLimit)))
  }

  return !decision ?
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Fine Tune Weights</Typography>
        <Typography>Please select or create a decision first.</Typography>
      </Box>
    : <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4">Fine Tune Weights</Typography>
        <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
          <Typography variant="h6">Sort Factors</Typography>
          {!sortStarted ?
            <Typography variant="body2">
              Press the button below to compare factors in order to sort them
              from least important to most important.
              <br />
              This uses an algorithm (a modified version of Timsort) which makes
              it much faster than sorting by hand.
              <br />
              It will ask for {decision.factors.length} -{" "}
              {Math.ceil(
                decision.factors.length * Math.log(decision.factors.length),
              )}{" "}
              comparisons, then the answers will appear in the slider below once
              finished.
            </Typography>
          : quizFinished ?
            <Typography variant="body1">
              Quiz finished! The results have been loaded into the slider below.
              You can fine tune your answers and save them when you're done, or
              just hit cancel if you changed your mind.
            </Typography>
          : <Typography variant="caption">Which is more important?</Typography>}
          <br />
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            {/* Keep the middle button in the same place horizontally */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                gap: 5,
                alignItems: "center",
              }}>
              {!sortStarted && (
                <Button variant="contained" onClick={startSort}>
                  Start Sorting
                </Button>
              )}
              {sortStarted && !quizFinished && pendingPair && (
                <>
                  <Button
                    sx={{ width: "30%" }}
                    variant="contained"
                    onClick={() => {
                      handleNextComparison(pendingPair[0])
                    }}>
                    {pendingPair[0]}
                  </Button>
                  <Button
                    sx={{ width: "30%" }}
                    variant="outlined"
                    onClick={() => {
                      handleNextComparison("About the same")
                    }}>
                    About the same
                  </Button>
                  <Button
                    sx={{ width: "30%" }}
                    variant="contained"
                    onClick={() => {
                      handleNextComparison(pendingPair[1])
                    }}>
                    {pendingPair[1]}
                  </Button>
                </>
              )}
            </Box>
          </Box>
          <br />
          {sortStarted && (
            <Button variant="outlined" onClick={startSort}>
              Start Over
            </Button>
          )}
        </Paper>

        <Paper sx={{ p: 2 }} elevation={3}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allowReordering}
                  onChange={(e) => setAllowReordering(e.target.checked)}
                />
              }
              label="Allow reordering"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={precise}
                  onChange={(e) => setPrecise(e.target.checked)}
                />
              }
              label="Precise"
            />
            <Button
              variant="outlined"
              onClick={(event) => setArrangeMenuAnchorEl(event.currentTarget)}
              sx={{ whiteSpace: "nowrap" }}>
              Arrange Weights
            </Button>
            <Menu
              anchorEl={arrangeMenuAnchorEl}
              open={Boolean(arrangeMenuAnchorEl)}
              onClose={() => setArrangeMenuAnchorEl(null)}>
              {WEIGHT_ARRANGEMENTS.map(({ label, getWeights }) => (
                <MenuItem
                  key={label}
                  onClick={() => arrangeWeights(getWeights)}>
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <MultiHandledSlider
            handles={factorHandles}
            overlap={allowReordering ? "free" : "block"}
            gradient={["#0024630f", "#002463"]}
            step={precise ? 0 : 0.01}
            digits={precise ? -1 : 2}
            onChange={updateFactorHandles}
          />
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button variant="contained" onClick={applyPositionsToWeights}>
                Set as new weights
              </Button>
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              {unsaved && (
                <Typography variant="body2" color="error">
                  Unsaved changes
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>
        {/* I don't think we really use this anymore */}
        {/*
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showRadar}
                onChange={() => setShowRadar(!showRadar)}
              />
            }
            label="Show Radar"
          />
          {labels.length > 20 && (
            <TextField
              label="Factors shown"
              type="number"
              size="small"
              value={normalizedPlotFactorLimit}
              onChange={handlePlotFactorLimitChange}
              slotProps={{
                htmlInput: {
                  min: 2,
                  max: maxPlotFactorLimit,
                  step: 2,
                },
              }}
              sx={{ width: 150 }}
            />
          )}
        </Box>
         {showRadar ?
          <Box>
            <Plot data={radarData} layout={radarLayout} />
          </Box>
        : <Box>
            <Plot data={barData} layout={barLayout} />
          </Box>
        } */}
      </Box>
}
