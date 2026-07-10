import { useEffect, useState, useRef } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import Plot from "react-plotly.js"
import { useDecisions } from "../contexts/UseDecisions"
import Decision from "../models/Decision"
import Paper from "@mui/material/Paper"
import MultiHandledSlider from "../components/MultiHandledSlider"
import { Checkbox, FormControlLabel, TextField } from "@mui/material"

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

  // positions state must be top-level (hooks cannot be conditional)
  const [handles, setHandles] = useState({})
  const [allowReordering, setAllowReordering] = useState(false)
  const [showRadar, setShowRadar] = useState(true)
  const [plotFactorLimit, setPlotFactorLimit] = useState(20)

  // Quiz hooks and handlers (kept at top-level so hooks order is stable)
  const sortGenRef = useRef(null)
  const [pendingPair, setPendingPair] = useState(null)
  const [quizFinished, setQuizFinished] = useState(false)
  const [sortStarted, setSortStarted] = useState(false)

  // Sync positions from the selected decision only when the decision changes.
  // We intentionally do not include `positions` in the deps to avoid clobbering
  // user edits while they're moving the sliders.

  useEffect(() => {
    if (!decision) return
    const t = setTimeout(() => {
      setHandles(
        decision.factors.names.reduce((acc, label, i) => {
          acc[label] = decision.factors.weights[i] ?? 0
          return acc
        }, {}),
      )
      sortGenRef.current = null
      setPendingPair(null)
      setQuizFinished(false)
      setSortStarted(false)
    }, 0)
    return () => {
      clearTimeout(t)
      sortGenRef.current = null
    }
  }, [decision, selectedIndex])

  function startSort() {
    setQuizFinished(false)
    setSortStarted(true)
    if (!decision) return
    const g = modifiedTimSortCoroutine(decision.factors.names.slice())
    sortGenRef.current = g
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
    const n = sortedResult.length

    const newWeightsSeq = linspace(1, 1 / n, n)
    const orderedLabels = decision.factors.names.slice()
    const orderedWeights = Array(orderedLabels.length).fill(0)
    for (let i = 0; i < sortedResult.length; i++) {
      const label = sortedResult[i]
      const value = newWeightsSeq[i]
      const idx = orderedLabels.indexOf(label)
      if (idx !== -1) orderedWeights[idx] = value
    }
    setHandles(
      orderedLabels.reduce((acc, label, i) => {
        acc[label] = orderedWeights[i] ?? 0
        return acc
      }, {}),
    )
  }

  function handleCancel() {
    if (!decision) return
    setHandles(
      decision.factors.names.reduce((acc, label, i) => {
        acc[label] = decision.factors.weights[i] ?? 0
        return acc
      }, {}),
    )
  }

  function applyPositionsToWeights() {
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    d.factors.weights = Object.values(handles).sort(
      (a, b) => d.factors.names.indexOf(a) - d.factors.names.indexOf(b),
    ) // sort the weights so they stay in sync with the labels
    copy[selectedIndex] = d
    setDecisions(copy)
  }

  const labels = Object.keys(handles)
  const positions = labels.map((label) => handles[label] ?? 0)

  let unsaved
  if (decision != null)
    unsaved = positions.some((p, i) => p !== decision.factors.weights[i])

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
              Press the button below to compare factors in order to sort
              them from least important to most important.<br/>This uses an
              algorithm (a modified version of Timsort) which makes it much faster
              than sorting by hand.
              <br />
              It will ask for {decision.factors.names.length} -{" "}
              {Math.ceil(
                decision.factors.names.length *
                  Math.log(decision.factors.names.length),
              )}{" "}
              comparisons, then the answers will appear in the slider below once finished.
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
          <Checkbox
            checked={allowReordering}
            onChange={(e) => setAllowReordering(e.target.checked)}
          />
          Allow reordering
          <MultiHandledSlider
            handles={handles}
            overlap={allowReordering ? "free" : "block"}
            gradient={["#C1CBD6", "#002463"]}
            step={0.01}
            onChange={setHandles}
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
        }
      </Box>
}
