import { useEffect, useMemo, useState } from "react"
import { useDecisions } from "../contexts/UseDecisions"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Autocomplete from "@mui/material/Autocomplete"
import TextField from "@mui/material/TextField"
import Chip from "@mui/material/Chip"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Collapse from "@mui/material/Collapse"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { useTheme, darken } from "@mui/material/styles"
import Plot from "react-plotly.js"
import * as PCAImport from "pca-js"
import texts from "../assets/texts.json"
import HelpOverlay from "../components/HelpOverlay"
import Link from "@mui/material/Link"
import MenuItem from "@mui/material/MenuItem"
import { Link as RouterLink } from "react-router-dom"
import { Tooltip } from "@mui/material"
import Answer from "../models/Answer.js"
import Decision from "../models/Decision.js"

const PCA = PCAImport.default ?? PCAImport

const persistedValues = {
  useSimulatedValues: false,
  simulationRanges: {},
  rangeMode: Answer.rangeModes.MONTE_CARLO,
}

const RANGE_MODE_OPTIONS = [
  {
    value: Answer.rangeModes.MONTE_CARLO,
    label: "Monte Carlo simulation",
    description: `Average ${Decision.numSamples} random samples from each range.`,
  },
  {
    value: Answer.rangeModes.BEST,
    label: "Best",
    description:
      "Use the value in each range closest to that factor's optimal.",
  },
  {
    value: Answer.rangeModes.WORST,
    label: "Worst",
    description:
      "Use the value in each range farthest from that factor's optimal.",
  },
  {
    value: Answer.rangeModes.AVERAGE,
    label: "Average",
    description: "Use the mean of the best and worst values in each range.",
  },
  {
    value: Answer.rangeModes.HIGH,
    label: "High",
    description: "Use the highest value from every range.",
  },
  {
    value: Answer.rangeModes.LOW,
    label: "Low",
    description: "Use the lowest value from every range.",
  },
  {
    value: Answer.rangeModes.MEDIAN,
    label: "Median",
    description: "Use the midpoint of every range.",
  },
]

function rangeModeOption(mode) {
  return RANGE_MODE_OPTIONS.find((option) => option.value === mode)
}

// function joinAnd(items, { oxford = false, ampersand = false } = {}) {
// const andToken = ampersand ? " & " : " and "
// if (!items || items.length === 0) return ""
// if (items.length === 1) return items[0]
// if (items.length === 2) return items.join(andToken)
// const sep = oxford ? `,${andToken}` : andToken
// return `${items.slice(0, -1).join(", ")}${sep}${items[items.length - 1]}`
// }

function rangeInputValue(factor, ranges, endpoint) {
  const range = ranges[factor.name]
  if (range && Object.hasOwn(range, endpoint)) return range[endpoint]
  return Number.isFinite(factor[endpoint]) ? factor[endpoint] : ""
}

function resolvedRange(factor, ranges) {
  const minValue = rangeInputValue(factor, ranges, "min")
  const maxValue = rangeInputValue(factor, ranges, "max")
  const min = minValue === "" ? NaN : Number(minValue)
  const max = maxValue === "" ? NaN : Number(maxValue)
  return {
    min,
    max,
    valid: Number.isFinite(min) && Number.isFinite(max) && min < max,
  }
}

function SimulationControls({
  enabled,
  onEnabledChange,
  requiresUnansweredRanges,
  factors,
  ranges,
  onRangeChange,
  rangeMode,
  activeRangeMode,
  onRangeModeChange,
  canRerunSimulation,
  canRun,
  onRun,
}) {
  const [expanded, setExpanded] = useState(true)
  const selectedMode = rangeModeOption(rangeMode)
  // const activeMode = rangeModeOption(activeRangeMode)

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
      <Button
        color="inherit"
        fullWidth
        onClick={() => setExpanded((current) => !current)}
        endIcon={
          <ExpandMoreIcon
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms",
            }}
          />
        }
        sx={{ justifyContent: "space-between" }}>
        How to deal with uncertainty {/* ({activeMode.label}) */}
      </Button>
      <Collapse in={expanded}>
        {requiresUnansweredRanges && (
          <>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enabled}
                  onChange={(event) => onEnabledChange(event.target.checked)}
                />
              }
              label="Fill unanswered entries from their full possible ranges"
            />
            <br />
          </>
        )}
        <TextField
          select
          fullWidth
          size="small"
          label="Range calculation"
          value={rangeMode}
          onChange={(event) => onRangeModeChange(event.target.value)}
          helperText={selectedMode.description}
          sx={{ mt: 2, maxWidth: 440 }}>
          {RANGE_MODE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {rangeMode !== activeRangeMode && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            Run the calculation to apply this setting to the results.
          </Typography>
        )}
        {(!requiresUnansweredRanges || enabled) && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {requiresUnansweredRanges && (
              <Typography variant="body2">
                Unanswered entries will use the full possible range,
                representing maximum uncertainty.
              </Typography>
            )}
            {factors.map((factor) => {
              const range = resolvedRange(factor, ranges)
              const minValue = rangeInputValue(factor, ranges, "min")
              const maxValue = rangeInputValue(factor, ranges, "max")
              const hasBothValues = minValue !== "" && maxValue !== ""
              return (
                <Box
                  key={factor.name}
                  sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Typography sx={{ minWidth: 160, pt: 1 }}>
                    {factor.name}
                  </Typography>
                  <TextField
                    label="Finite minimum"
                    type="number"
                    size="small"
                    value={minValue}
                    disabled={Number.isFinite(factor.min)}
                    onChange={(event) =>
                      onRangeChange(factor.name, "min", event.target.value)
                    }
                  />
                  <TextField
                    label="Finite maximum"
                    type="number"
                    size="small"
                    value={maxValue}
                    disabled={Number.isFinite(factor.max)}
                    error={hasBothValues && !range.valid}
                    helperText={
                      hasBothValues && !range.valid ?
                        "Maximum must be greater than minimum"
                      : ""
                    }
                    onChange={(event) =>
                      onRangeChange(factor.name, "max", event.target.value)
                    }
                  />
                  <Typography sx={{ pt: 1, color: "text.secondary" }}>
                    <i>{factor.unit ? `${factor.unit}` : ""}</i>
                  </Typography>
                </Box>
              )
            })}
            <Button
              variant="contained"
              disabled={!canRun}
              onClick={() => {
                onRun()
              }}
              sx={{ alignSelf: "flex-start" }}>
              {rangeMode === Answer.rangeModes.MONTE_CARLO ?
                canRerunSimulation ?
                  "Rerun simulation"
                : "Run simulation"
              : "Calculate results"}
            </Button>
          </Stack>
        )}
      </Collapse>
    </Paper>
  )
}

// TODO: Weights.jsx also uses this, move it into a utils file or something
function linspace(start, stop, n) {
  if (n <= 1) return [start]
  const step = (stop - start) / (n - 1)
  return Array.from({ length: n }, (_, i) => start + step * i)
}

function interpolateColor(c1, c2, t) {
  const toRgba = (color) => {
    if (color.startsWith("rgb")) {
      const values = color.match(/[\d.]+/g)?.map(Number) ?? []
      return [values[0], values[1], values[2], values[3] ?? 1]
    }

    const h = color.replace("#", "")
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ]
  }
  const a = toRgba(c1)
  const b = toRgba(c2)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t))
  const alpha = a[3] + (b[3] - a[3]) * t
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`
}

function sampleColorscale(colors, t) {
  if (t <= 0) return colors[0]
  if (t >= 1) return colors[colors.length - 1]
  const seg = (colors.length - 1) * t
  const i = Math.floor(seg)
  const local = seg - i
  return interpolateColor(colors[i], colors[i + 1], local)
}

function saturateColor(color, amount = 0.6) {
  const hex = color.replace("#", "")
  const normalizedHex =
    hex.length === 3 ?
      hex
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : hex
  if (!/^[\da-f]{6}$/i.test(normalizedHex)) return color

  const rgb = [0, 2, 4].map(
    (offset) => parseInt(normalizedHex.slice(offset, offset + 2), 16) / 255,
  )
  const max = Math.max(...rgb)
  const min = Math.min(...rgb)
  const lightness = (max + min) / 2
  const delta = max - min
  if (delta === 0) return color

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue
  if (max === rgb[0]) hue = ((rgb[1] - rgb[2]) / delta) % 6
  else if (max === rgb[1]) hue = (rgb[2] - rgb[0]) / delta + 2
  else hue = (rgb[0] - rgb[1]) / delta + 4
  hue = Math.round(hue * 60)
  if (hue < 0) hue += 360

  const increasedSaturation = saturation + (1 - saturation) * amount
  return `hsl(${hue} ${Math.round(increasedSaturation * 100)}% ${Math.round(
    lightness * 100,
  )}%)`
}

function coloredPlotLabel(label, color) {
  if (!color) return label
  return `<span style="color:${saturateColor(darken(color, 0.15), 0.9)}">${label}</span>`
}

function radarColorForLabel(label) {
  // LLM generated
  // Reserve green/red for the theoretical bounds so they are always unique.
  if (label === "Theoretical Best") {
    return {
      line: "rgb(46, 125, 50)",
      fill: "rgba(46, 125, 50, 0.32)",
    }
  }

  if (label === "Theoretical Worst") {
    return {
      line: "rgb(198, 40, 40)",
      fill: "rgba(198, 40, 40, 0.32)",
    }
  }

  // Hash labels into deterministic pseudo-random hues, skipping red and green.
  let hash = 0
  for (let i = 0; i < label.length; i++) {
    hash = (hash ^ label.charCodeAt(i)) >>> 0
    hash = Math.imul(hash, 2654435761) >>> 0
  }
  const hueBands = [
    [25, 90],
    [170, 335],
  ]
  const band = hueBands[hash % hueBands.length]
  const hue = Math.round(
    band[0] + ((hash * 0.618033988749895) % 1) * (band[1] - band[0]),
  )
  return {
    line: `hsl(${hue}, 78%, 42%)`,
    fill: `hsla(${hue}, 78%, 42%, 0.32)`,
  }
}

function computePca2D(X) {
  try {
    const eigenVectors = PCA.getEigenVectors(X)
    if (!eigenVectors || eigenVectors.length < 2) return null
    const adjusted = PCA.computeAdjustedData(
      X,
      eigenVectors[0],
      eigenVectors[1],
    )
    return adjusted
  } catch (e) {
    console.warn("PCA failed, falling back to zeros", e)
    return null
  }
}

// "How good each option is"
function GoodnessPlot({ decision, goodness, goodnessConf }) {
  const theme = useTheme()
  const plot = useMemo(() => {
    if (!decision) return null
    const rows = decision.options.map((option, i) => ({
      option: option.name,
      value: goodness[i],
      conf: goodnessConf[i],
      color: option.color,
    }))
    rows.sort((a, b) => b.value - a.value)
    const [rangeMin, rangeMax] = rows.reduce(
      ([min, max], row) => {
        const uncertainty = Number.isFinite(row.conf) ? Math.abs(row.conf) : 0
        return [
          Math.max(Math.min(min, row.value - uncertainty) - 0.01, 0),
          Math.min(Math.max(max, row.value + uncertainty) + 0.01, 1),
        ]
      },
      [0.5, 0.5],
    )
    const valueRange =
      rangeMin === rangeMax ?
        [rangeMin - 0.01, rangeMax + 0.01]
      : [rangeMin, rangeMax]
    return {
      data: [
        {
          type: "bar",
          x: rows.map((r) => r.option),
          y: rows.map((r) => r.value - 0.5),
          base: 0.5,
          error_y: {
            type: "data",
            array: rows.map((r) => r.conf),
            arrayminus: rows.map((r) => r.conf),
            visible: true,
          },
          text: rows.map((r) => r.value),
          texttemplate: "%{text:.0%}",
          marker: {
            color: rows.map((r) => r.color ?? theme.palette.primary.main),
          },
          customdata: rows.map((r) => [r.option, r.value, r.conf]),
          hovertemplate:
            "%{customdata[0]}<br>Goodness: %{customdata[1]:.0%}<br>Uncertainty: ±%{customdata[2]:.0%}<extra></extra>",
        },
      ],
      layout: {
        title: { text: "How good each option is" },
        yaxis: {
          range: valueRange,
          tickformat: ".0%",
        },
        shapes: [
          {
            type: "line",
            xref: "paper",
            x0: 0,
            x1: 1,
            yref: "y",
            y0: 0.5,
            y1: 0.5,
            line: {
              color: theme.palette.text.primary,
              width: 2,
            },
          },
        ],
        margin: { t: 60, b: 100, l: 50, r: 20 },
      },
    }
  }, [decision, goodness, goodnessConf, theme])

  if (!plot) return null
  return (
    <HelpOverlay helpText={texts.results.goodness_bar}>
      <Paper sx={{ p: 2 }}>
        <Plot
          data={plot.data}
          layout={plot.layout}
          style={{ width: "100%", height: 400 }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </Paper>
    </HelpOverlay>
  )
}

// "Usefulness of each factor"
function EntropyPlot({ decision, factorNames, entropy, usefulness, weights }) {
  const theme = useTheme()
  const [topCount, setTopCount] = useState(10)
  const visibleCount =
    topCount === "" ?
      factorNames.length
    : Math.min(
        factorNames.length,
        Math.max(1, Math.floor(Number(topCount) || 1)),
      )
  const plot = useMemo(() => {
    const rows = factorNames
      .map((factor, factorIndex) => ({
        factor,
        entropy: entropy[factorIndex],
        usefulness: usefulness[factorIndex],
        weight: weights[factorIndex],
        color: decision?.factors[factorIndex]?.color,
      }))
      .sort((a, b) => b.usefulness - a.usefulness)
      .slice(0, visibleCount)

    return {
      data: [
        {
          type: "bar",
          x: rows.map((row) => row.factor),
          y: rows.map((row) => row.entropy),
          width: rows.map((row) => row.weight),
          marker: {
            color: rows.map((row) => row.color ?? theme.palette.primary.main),
            line: {
              color: theme.palette.background.paper,
              width: 2,
            },
          },
          customdata: rows.map((row) => [
            row.factor,
            row.usefulness,
            row.weight,
          ]),
          hovertemplate:
            "%{customdata[0]}<br>Std. Dev: %{y:.2f}<br>Weight: %{customdata[2]:.0%}<br>Usefulness: %{customdata[1]:.2f}<extra></extra>",
        },
      ],
      layout: {
        title: { text: "Usefulness of each factor" },
        xaxis: {
          showticklabels: true,
          showgrid: true,
          title: { text: "Factors (width = weight)" },
        },
        yaxis: {
          title: { text: "How much each factor was different for each option" },
          showticklabels: false,
        },
        margin: { t: 60, b: 100, l: 50, r: 20 },
      },
    }
  }, [decision, entropy, factorNames, usefulness, weights, theme, visibleCount])

  return (
    <HelpOverlay helpText={texts.results.entropy}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Show the top:</Typography>
          <TextField
            type="number"
            size="small"
            value={topCount}
            onChange={(event) => setTopCount(event.target.value)}
            slotProps={{
              htmlInput: { min: 1, max: factorNames.length, step: 1 },
            }}
            sx={{ width: 100 }}
          />
        </Box>
        <Plot
          data={plot.data}
          layout={plot.layout}
          style={{ width: "100%", height: 400 }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </Paper>
    </HelpOverlay>
  )
}

// "How good each option is" - the variable sized heatmap
function HeatmapPlot({
  normalizedAnswers,
  factorNames,
  weights,
  decision,
  answers,
  calc,
}) {
  const theme = useTheme()
  const [showText, setShowText] = useState(false)
  // () => (decision?.factors.length ?? 0) < 20,
  const [square, setSquare] = useState(true)
  const [topCount, setTopCount] = useState(10)
  const visibleCount =
    topCount === "" ?
      factorNames.length
    : Math.min(
        factorNames.length,
        Math.max(1, Math.floor(Number(topCount) || 1)),
      )
  const plot = useMemo(() => {
    const colorscale = ["#9B1127", "rgba(255, 255, 191, 0)", "#195695"]
    const nRows = normalizedAnswers.length
    const usefulness = calc.mean.usefulness ?? []
    const factorIndexes = factorNames
      .map((_, factorIndex) => ({
        factorIndex,
        usefulness: usefulness[factorIndex] ?? 0,
      }))
      .sort((a, b) => b.usefulness - a.usefulness)
      .slice(0, visibleCount)
      .map(({ factorIndex }) => factorIndex)
    const visibleFactorNames = factorIndexes.map(
      (factorIndex) => factorNames[factorIndex],
    )
    const nCols = factorIndexes.length
    const leftMargin = Math.min(
      260,
      Math.max(
        90,
        Math.max(...visibleFactorNames.map((factor) => factor.length)) * 8,
      ),
    )
    const shapes = []
    const textX = []
    const textY = []
    const textLabels = []
    const textColors = []
    const hoverData = []
    const maxs = decision.maxs()
    for (let i = 0; i < nRows; i++) {
      for (let factorPosition = 0; factorPosition < nCols; factorPosition++) {
        const factorIndex = factorIndexes[factorPosition]
        const factorBadness =
          calc.mean.factor_badness?.[i]?.[factorIndex] ??
          Math.abs(calc.mean.delta_vectors_normalized[i][factorIndex])
        const value = 1 - factorBadness
        const weight = weights[factorIndex]
        const color = sampleColorscale(colorscale, value)
        const halfW = (1 * weight) / 2
        const halfH = (1 * weight) / 2
        shapes.push({
          type: "rect",
          x0: i - halfW,
          y0: factorPosition - halfH,
          x1: i + halfW,
          y1: factorPosition + halfH,
          line: { width: 0 },
          fillcolor: color,
          layer: "below",
        })
        const answer = answers[i][factorIndex]
        const maxVal = maxs[factorIndex]
        textX.push(i)
        textY.push(factorPosition)
        textLabels.push(
          `${Math.round(value * 100)}%<br>(${Math.round(answer)}/${Math.round(
            maxVal,
          )})`,
        )
        textColors.push(weight > 0.3 ? "black" : theme.palette.text.primary)
        hoverData.push([
          decision.options[i].name,
          factorNames[factorIndex],
          value,
          answer,
          maxVal,
          weight,
        ])
      }
    }

    return {
      data: [
        {
          type: "scatter",
          mode: "text",
          x: textX,
          y: textY,
          // Why we have to make the text invisible instead of not drawing it, I don't know.
          // But it solves both problems of it being out of sync with the checkbox, and
          // not showing the additional text in the hover.
          // text: showText ? textLabels : undefined,
          text: textLabels,
          textfont: { color: showText ? textColors : "#00000000", size: 12 },
          customdata: hoverData,
          hovertemplate:
            "%{customdata[0]}<br>%{customdata[1]}: %{customdata[2]:.0%} good<br>Answer: %{customdata[3]:.1f} / %{customdata[4]:.0f}<br>Weight: %{customdata[5]:.0%}<extra></extra>",
          showlegend: false,
        },
      ],
      layout: {
        xaxis: {
          tickvals: Array.from({ length: nRows }, (_, i) => i),
          ticktext: decision?.options.map((option) =>
            coloredPlotLabel(option.name, option.color),
          ),
          showgrid: false,
          zeroline: false,
          scaleanchor: square ? "y" : undefined,
        },
        yaxis: {
          tickvals: Array.from({ length: nCols }, (_, i) => i),
          ticktext: factorIndexes.map((factorIndex) =>
            coloredPlotLabel(
              factorNames[factorIndex],
              decision?.factors[factorIndex]?.color,
            ),
          ),
          showgrid: false,
          zeroline: false,
          autorange: "reversed",
          automargin: true,
          //   scaleanchor: "x",
        },
        margin: { t: 60, b: 100, l: leftMargin, r: 20 },
        title: { text: "How good each option is" },
        title_x: 0.2,
        title_font_size: 20,
        shapes,
      },
    }
  }, [
    normalizedAnswers,
    factorNames,
    weights,
    theme,
    decision,
    answers,
    calc,
    showText,
    visibleCount,
    square,
  ])

  return (
    <HelpOverlay helpText={texts.results.contributions_var_size}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography>Show the top most useful:</Typography>
            <TextField
              type="number"
              size="small"
              value={topCount}
              onChange={(event) => setTopCount(event.target.value)}
              slotProps={{
                htmlInput: { min: 1, max: factorNames.length, step: 1 },
              }}
              sx={{ width: 100 }}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={showText}
                onChange={(event) => setShowText(event.target.checked)}
              />
            }
            label="Show text"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={square}
                onChange={(event) => setSquare(event.target.checked)}
              />
            }
            label="Square"
          />
        </Box>
        <Plot
          data={plot.data}
          layout={plot.layout}
          style={{ width: "100%", height: 500 }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </Paper>
    </HelpOverlay>
  )
}

// "Deciding factors for {option}" plot
function FactorContributionPlot({ decision, best, contributions }) {
  const theme = useTheme()
  const optionNames = decision.options.map((option) => option.name)
  const bestOptionIndex = Math.max(
    0,
    optionNames.findIndex((option) => option === best?.is),
  )
  const [selectedOptionIndex, setSelectedOptionIndex] =
    useState(bestOptionIndex)
  const maximumFactorCount = decision.factors.length
  const [factorCount, setFactorCount] = useState(
    Math.min(10, maximumFactorCount),
  )

  const selectedOption = optionNames[selectedOptionIndex] ?? optionNames[0]
  const visibleCount = Math.min(
    maximumFactorCount,
    factorCount === "" ? maximumFactorCount : (
      Math.max(1, Math.floor(Number(factorCount) || 1))
    ),
  )
  const rows = decision.factors
    .map((factor, factorIndex) => ({
      factor: factor.name,
      contribution: contributions[selectedOptionIndex]?.[factorIndex] ?? 0,
      color: factor.color,
      weight: factor.weight,
    }))
    .sort((a, b) => b.contribution - a.contribution)
  const visibleRows = rows.slice(0, visibleCount)
  const plot = {
    data: [
      {
        type: "bar",
        name: "Bad",
        x: visibleRows.map(({ factor }) => factor),
        y: visibleRows.map(({ contribution }) => contribution),
        width: visibleRows.map(({ weight }) => weight),
        customdata: visibleRows.map(({ factor }) => factor),
        hovertemplate: "%{customdata}: %{y:.0%} bad<extra></extra>",
        marker: {
          color: theme.palette.error.main,
          line: {
            color: theme.palette.background.paper,
            width: 2,
          },
        },
      },
      {
        type: "bar",
        name: "Good",
        x: visibleRows.map(({ factor }) => factor),
        y: visibleRows.map(({ contribution }) => 1 - contribution),
        width: visibleRows.map(({ weight }) => weight),
        customdata: visibleRows.map(({ factor }) => factor),
        hovertemplate: "%{customdata}: %{y:.0%} good<extra></extra>",
        marker: {
          color: theme.palette.success.main,
          line: {
            color: theme.palette.background.paper,
            width: 2,
          },
        },
      },
    ],
    layout: {
      barmode: "stack",
      title: {
        text: `Deciding Factors for ${selectedOption}`,
      },
      xaxis: {
        tickmode: "array",
        tickvals: visibleRows.map(({ factor }) => factor),
        ticktext: visibleRows.map(({ factor, color }) =>
          coloredPlotLabel(factor, color),
        ),
        tickangle: "auto",
        automargin: true,
      },
      yaxis: {
        range: [0, 1.08],
        tickformat: ".0%",
        title: { text: "Objective contribution" },
        rangemode: "nonnegative",
      },
      margin: { t: 60, b: 60, l: 60, r: 20 },
    },
  }

  return (
    <HelpOverlay helpText={texts.results.factor_contributions}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            select
            label="Option"
            size="small"
            value={selectedOptionIndex}
            onChange={(event) =>
              setSelectedOptionIndex(Number(event.target.value))
            }
            sx={{ minWidth: 200 }}>
            {optionNames.map((option, optionIndex) => (
              <MenuItem key={optionIndex} value={optionIndex}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Factors shown"
            type="number"
            size="small"
            value={factorCount}
            onChange={(event) => setFactorCount(event.target.value)}
            slotProps={{
              htmlInput: { min: 1, max: maximumFactorCount, step: 1 },
            }}
            sx={{ width: 130 }}
          />
        </Box>
        <Plot
          data={plot.data}
          layout={plot.layout}
          style={{ width: "100%", height: 450 }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </Paper>
    </HelpOverlay>
  )
}

// "Relative Distance of Each Option"
function SingleLinePlot({ results }) {
  const theme = useTheme()
  const plot = useMemo(() => {
    const t = linspace(0, 100, 1000)
    const annotations = results.map((r, index) => {
      const isAbove = index % 2 === 0
      return {
        x: r.percentage,
        y: isAbove ? 0.08 : -0.08,
        text: `${r.option} (${r.percentage.toFixed(1)}%)`,
        showarrow: false,
        font: {
        //   color: r.color ? coloredPlotLabel(r.color) : theme.palette.text.primary,
          size: 15,
        },
        xanchor: "left",
        yanchor: isAbove ? "bottom" : "top",
        textangle: isAbove ? -45 : 45,
      }
    })
    annotations.push(
      {
        x: 0,
        y: 0.1,
        text: "Best option",
        showarrow: false,
        font: { color: theme.palette.text.primary, size: 15 },
        textangle: 270,
      },
      {
        x: 100,
        y: 0,
        text: "Worst option",
        showarrow: false,
        font: { color: theme.palette.text.primary, size: 15 },
        textangle: 270,
      },
    )
    return {
      data: [
        {
          type: "scatter",
          mode: "markers",
          x: t,
          y: t.map(() => 0),
          marker: {
            size: 3,
            color: t,
            colorscale: "Reds",
          },
          hoverinfo: "skip",
        },
        {
          type: "scatter",
          mode: "markers",
          x: results.map((r) => r.percentage),
          y: results.map(() => 0),
          text: results.map((r) => r.option),
          marker: {
            size: 10,
            color: results.map((r) => r.color ? r.color : theme.palette.text.primary),
            line: { color: results.map((r) => r.percentage), width: 2 },
            colorscale: "Reds",
            cmin: 0,
            cmax: 100,
            showscale: false,
          },
          hovertemplate: "%{text}<br>Badness: %{x:.1f}%<extra></extra>",
        },
      ],
      layout: {
        xaxis: {
          range: [0, 100],
          tickvals: linspace(0, 100, 11),
          ticktext: linspace(0, 100, 11).map((v) => `${v}%`),
        },
        yaxis: { range: [-1, 1], visible: false },
        height: 300,
        showlegend: false,
        annotations,
        margin: { t: 50, b: 40, l: 30, r: 30 },
      },
    }
  }, [results, theme])

  return (
    <>
      <Typography variant="h6" align="center">
        Relative Distance of Each Option
      </Typography>
      <HelpOverlay helpText={texts.results.line1d}>
        <Paper sx={{ p: 2, width: "100%" }}>
          <Plot
            data={plot.data}
            layout={plot.layout}
            style={{ width: "100%", height: 350 }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </Paper>
      </HelpOverlay>
    </>
  )
}

// Currently not implemented
function PcaPlot({
  normalizedAnswers,
  optimalNormalized,
  worstPossibleOptionNormalized,
  labels,
}) {
  const plot = useMemo(() => {
    const enabled = false
    if (!enabled) {
      //   console.warn("TODO: PCA plot")
      return null
    }
    const data = [...normalizedAnswers]
    data.push(optimalNormalized, worstPossibleOptionNormalized)
    const adjusted = computePca2D(data) || data.map(() => [0, 0])
    const xs = adjusted.map((row) => row[0])
    const ys = adjusted.map((row) => row[1])
    return {
      data: [
        {
          type: "scatter",
          mode: "markers+text",
          x: xs,
          y: ys,
          text: labels,
          textposition: "top center",
          hovertemplate:
            "%{text}<br>Component 1: %{x:.2f}<br>Component 2: %{y:.2f}<extra></extra>",
        },
      ],
      layout: {
        title: "Visualizing the options",
        showlegend: false,
        xaxis: { visible: false, showgrid: false, zeroline: false },
        yaxis: { visible: false, showgrid: false, zeroline: false },
        shapes: [
          {
            type: "line",
            x0: xs[xs.length - 1],
            y0: ys[ys.length - 1],
            x1: xs[xs.length - 2],
            y1: ys[ys.length - 2],
            line: { color: "blue" },
          },
        ],
        margin: { t: 60, b: 20, l: 20, r: 20 },
      },
    }
  }, [
    normalizedAnswers,
    optimalNormalized,
    worstPossibleOptionNormalized,
    labels,
  ])

  if (!plot) return null
  return (
    <HelpOverlay helpText={texts.results.PCA}>
      <Paper sx={{ p: 2 }}>
        <Plot
          data={plot.data}
          layout={plot.layout}
          style={{ width: "100%", height: 450 }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </Paper>
    </HelpOverlay>
  )
}

// "Radar Selection"
function RadarPlot({
  normalizedAnswers,
  optimalNormalized,
  worstPossibleOptionNormalized,
  factorNames,
  includedRadar,
  labels,
  best,
  setIncludedRadar,
  factorColors,
  optionColors,
}) {
  useEffect(() => {
    if (!best || !labels.length) return
    const bestIdx = labels.indexOf(best.is)
    const defaultIncluded = []
    if (bestIdx !== -1) defaultIncluded.push(labels[bestIdx])
    if (labels.length >= 2) defaultIncluded.push(labels[labels.length - 2])
    setIncludedRadar(defaultIncluded)
  }, [best, labels, setIncludedRadar])

  const plot = useMemo(() => {
    const data = [...normalizedAnswers]
    data.push(optimalNormalized, worstPossibleOptionNormalized)
    const optimal = data[data.length - 2]
    const sortedIndices = optimal
      .map((v, i) => [v, i])
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1])
    const sortedDimLabels = sortedIndices.map((i) =>
      coloredPlotLabel(factorNames[i], factorColors[i]),
    )
    const sortedFactorNames = sortedIndices.map((i) => factorNames[i])
    const sortedData = data.map((row) => sortedIndices.map((i) => row[i]))
    const traces = []
    for (let i = 0; i < sortedData.length; i++) {
      const label = labels[i]
      if (!includedRadar.includes(label)) continue
      const r = sortedData[i]
      const color = radarColorForLabel(label)
      traces.push({
        type: "scatterpolar",
        r: [...r, r[0]],
        theta: [...sortedDimLabels, sortedDimLabels[0]],
        fill: "toself",
        fillcolor: color.fill,
        line: { color: color.line },
        name: coloredPlotLabel(label, optionColors[i]),
        customdata: [...sortedFactorNames, sortedFactorNames[0]].map(
          (factor) => [label, factor],
        ),
        hovertemplate:
          "%{customdata[0]}<br>%{customdata[1]}: %{r:.0%}<extra></extra>",
      })
    }
    return {
      data: traces,
      layout: {
        polar: { radialaxis: { visible: true, range: [0, 1] } },
        showlegend: true,
        margin: { t: 40, b: 40, l: 40, r: 40 },
      },
    }
  }, [
    normalizedAnswers,
    optimalNormalized,
    worstPossibleOptionNormalized,
    factorNames,
    factorColors,
    includedRadar,
    labels,
    optionColors,
  ])

  return (
    <HelpOverlay helpText={texts.results.radar}>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Radar Selection</Typography>
          <Autocomplete
            multiple
            options={labels}
            value={includedRadar}
            onChange={(e, value) => setIncludedRadar(value)}
            renderValue={(value, getTagProps) =>
              value.map((option, index) => {
                let props = getTagProps({ index })
                delete props.key
                return (
                  <Chip
                    variant="outlined"
                    label={option}
                    key={`${option}-${index}-radar`}
                    {...props}
                  />
                )
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="Options" size="small" />
            )}
          />
          <Plot
            data={plot.data}
            layout={plot.layout}
            style={{ width: "100%", height: 500 }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </Stack>
      </Paper>
    </HelpOverlay>
  )
}

function Summary({ results, best, worst }) {
  const chipProps = {
    variant: "outlined",
    size: "small",
    sx: { ml: 0.5, mr: 0.5 },
  }

  const formatChipList = (list, color) => {
    return (
      <Stack
        direction="column"
        spacing={0.5}
        flexwrap="wrap"
        sx={{ display: "inline-flex", gap: 0.5, ml: 0.5, mr: 0.5 }}>
        {list.map((reason, index) => (
          <Chip
            key={`chip-${index}`}
            label={reason}
            color={color}
            {...chipProps}
          />
        ))}
      </Stack>
    )
  }

  return (
    <Box>
      <Box sx={{ mt: 1, whiteSpace: "pre-line" }}>
        The best option is
        <Tooltip
          title={
            results
              .filter((r) => r.option === best.is)[0]
              .percentage.toFixed(1) + "% badness"
          }>
          <Chip label={best.is} color="success" {...chipProps} />
        </Tooltip>
        because of
        {formatChipList(best.because, "success")}
        even though
        {formatChipList(best.despite, "error")}
        isn't what you want.
        <br />
        <br />
        The worst option is
        <Tooltip
          title={
            results
              .filter((r) => r.option === worst.is)[0]
              .percentage.toFixed(1) + "% badness"
          }>
          <Chip label={worst.is} color="error" {...chipProps} />
        </Tooltip>
        because of
        {formatChipList(worst.because, "error")}
        even though
        {formatChipList(worst.despite, "success")}
        is what you want.
      </Box>
    </Box>
  )
}

export default function Results() {
  const { decision } = useDecisions()

  const [includedRadar, setIncludedRadar] = useState([])
  const [useSimulatedValues, _setUseSimulatedValues] = useState(
    persistedValues.useSimulatedValues,
  )
  const [simulationRanges, _setSimulationRanges] = useState(
    persistedValues.simulationRanges,
  )
  const [rangeMode, _setRangeMode] = useState(persistedValues.rangeMode)
  const [activeRangeMode, setActiveRangeMode] = useState(
    persistedValues.rangeMode,
  )
  const [submittedSimulationRanges, setSubmittedSimulationRanges] =
    useState(null)
  const setUseSimulatedValues = (to) => {
    if (to instanceof Function) to = to(useSimulatedValues)
    persistedValues.useSimulatedValues = to
    _setUseSimulatedValues(to)
  }
  const setSimulationRanges = (to) => {
    if (to instanceof Function) to = to(simulationRanges)
    persistedValues.simulationRanges = to
    _setSimulationRanges(to)
  }
  const setRangeMode = (to) => {
    persistedValues.rangeMode = to
    _setRangeMode(to)
  }
  const [simulationRun, setSimulationRun] = useState(0)
  const visibleDecision = useMemo(() => {
    if (!decision) return null
    const copy = decision.copy()
    for (let index = copy.options.length - 1; index >= 0; index -= 1)
      if (copy.options[index].hidden) copy.removeOption(index)
    return copy
  }, [decision])
  const invalid = visibleDecision?.isInvalid() || ""
  const hasUnansweredAnswers = invalid.startsWith("Not all answers are filled")
  const canUseSimulatedValues =
    Boolean(visibleDecision) &&
    hasUnansweredAnswers &&
    visibleDecision.isInvalid(true) === null
  const canConfigureCalculation =
    Boolean(visibleDecision) && visibleDecision.isInvalid(true) === null

  const nonFiniteFactors = useMemo(
    () =>
      canUseSimulatedValues ?
        visibleDecision.getPracticalNonFiniteFactors()
      : [],
    [canUseSimulatedValues, visibleDecision],
  )

  const pendingOverrideFactorRanges = useMemo(
    () =>
      Object.fromEntries(
        nonFiniteFactors.map((factor) => {
          const range = resolvedRange(factor, simulationRanges)
          return [factor.name, [range.min, range.max]]
        }),
      ),
    [nonFiniteFactors, simulationRanges],
  )

  const simulationRangesAreValid = nonFiniteFactors.every(
    (factor) => resolvedRange(factor, simulationRanges).valid,
  )
  const simulationReady =
    canUseSimulatedValues &&
    useSimulatedValues &&
    submittedSimulationRanges !== null

  const calculationDecision = useMemo(() => {
    if (!visibleDecision) return null
    if (simulationReady)
      return visibleDecision.uncertainCopy(submittedSimulationRanges)
    return invalid ? null : visibleDecision
  }, [visibleDecision, invalid, submittedSimulationRanges, simulationReady])

  const calc = useMemo(() => {
    if (!calculationDecision || calculationDecision.isInvalid()) return null
    return calculationDecision.calculateAll({
      method: "extremes",
      rangeMode: activeRangeMode,
      run: simulationRun,
    })
  }, [activeRangeMode, calculationDecision, simulationRun])

  const labels = useMemo(() => {
    if (!visibleDecision) return []
    return [
      ...visibleDecision.options.map((option) => option.name),
      "Theoretical Best",
      "Theoretical Worst",
    ]
  }, [visibleDecision])

  const {
    results,
    optimalNormalized,
    worstPossibleOptionNormalized,
    objectiveContributions,
    normalizedAnswers,
    goodness,
    goodnessConf,
    best,
    worst,
    weights,
    factorNames,
    answers,
  } = useMemo(() => {
    if (!calculationDecision || !calc) {
      return {
        results: [],
        optimalNormalized: [],
        worstPossibleOptionNormalized: [],
        objectiveContributions: [],
        normalizedAnswers: [],
        goodness: [],
        goodnessConf: [],
        best: null,
        worst: null,
        weights: [],
        factorNames: [],
        answers: [],
      }
    }
    // Resolve Min/Max optimal sentinels from the completed answer set before
    // sending the theoretical best to Plotly.
    const optimal = calculationDecision.optimalNormalized()
    const worstOpt = optimal.map((v) => (Math.round(v) === 0 ? 1 : 0))
    const normalized_weighted_dists = calc.mean.badness || []
    const resultsRows = calculationDecision.options.map((option, i) => ({
      score: normalized_weighted_dists[i],
      option: option.name,
      percentage: (normalized_weighted_dists[i] || 0) * 100,
      color: option.color,
    }))
    resultsRows.sort((a, b) => a.score - b.score)
    return {
      results: resultsRows,
      optimalNormalized: optimal,
      worstPossibleOptionNormalized: worstOpt,
      objectiveContributions: calc.mean.objective_contributions || [],
      normalizedAnswers: calc.mean.normalized_answers || [],
      goodness: calc.mean.goodness || [],
      goodnessConf: calc.std.goodness || [],
      best: calc.best || null,
      worst: calc.worst || null,
      weights: calculationDecision.factors.map((factor) => factor.weight),
      factorNames: calculationDecision.factors.map((factor) => factor.name),
      answers:
        calculationDecision.answerValues(
          activeRangeMode === Answer.rangeModes.MONTE_CARLO ?
            Answer.rangeModes.MEDIAN
          : activeRangeMode,
        ) || [],
    }
  }, [activeRangeMode, calculationDecision, calc])

  function handleSimulationRangeChange(factorName, endpoint, value) {
    setSubmittedSimulationRanges(null)
    setSimulationRanges((current) => ({
      ...current,
      [factorName]: {
        ...current[factorName],
        [endpoint]: value,
      },
    }))
  }

  function handleUseSimulatedValuesChange(enabled) {
    setUseSimulatedValues(enabled)
    if (!enabled) setSubmittedSimulationRanges(null)
  }

  function handleRangeModeChange(mode) {
    setRangeMode(mode)
    if (canUseSimulatedValues) setSubmittedSimulationRanges(null)
  }

  function handleRunCalculation() {
    if (canUseSimulatedValues && !simulationRangesAreValid) return
    if (canUseSimulatedValues)
      setSubmittedSimulationRanges(pendingOverrideFactorRanges)
    setActiveRangeMode(rangeMode)
    setSimulationRun((run) => run + 1)
  }

  const simulationControls =
    canConfigureCalculation ?
      <SimulationControls
        enabled={useSimulatedValues}
        onEnabledChange={handleUseSimulatedValuesChange}
        requiresUnansweredRanges={canUseSimulatedValues}
        factors={nonFiniteFactors}
        ranges={simulationRanges}
        onRangeChange={handleSimulationRangeChange}
        rangeMode={rangeMode}
        activeRangeMode={activeRangeMode}
        onRangeModeChange={handleRangeModeChange}
        canRerunSimulation={
          Boolean(calc) &&
          rangeMode === Answer.rangeModes.MONTE_CARLO &&
          activeRangeMode === Answer.rangeModes.MONTE_CARLO
        }
        canRun={
          !canUseSimulatedValues ||
          (useSimulatedValues && simulationRangesAreValid)
        }
        onRun={handleRunCalculation}
      />
    : null

  if (!decision) {
    return (
      <Typography variant="h6">Select a decision to view results.</Typography>
    )
  }

  let err
  if (invalid === "No factors added")
    err = (
      <Typography variant="body2">
        No factors added! Head over to the{" "}
        <Link component={RouterLink} to="/factors">
          Factors
        </Link>{" "}
        page to add some.
      </Typography>
    )
  else if (invalid === "No options added")
    err = (
      <Typography variant="body2">
        {decision.options.length ?
          "All options are hidden!"
        : "No options added!"}{" "}
        Head over to the{" "}
        <Link component={RouterLink} to="/options">
          Options
        </Link>{" "}
        page to add some.
      </Typography>
    )
  else if (invalid.startsWith("Answers length"))
    err = (
      <Typography variant="body2">
        Internal Error! Let Cope know about this. <br />
        {invalid}
      </Typography>
    )
  else if (invalid.startsWith("Not all answers are valid"))
    err = (
      <Typography variant="body2">
        Not all answers are valid! Either you haven't answered some questions
        yet, or you have an answer that's out of range of the min/max of it's
        factor. Head over to the{" "}
        <Link component={RouterLink} to="/quiz?answer=invalid">
          Quiz
        </Link>{" "}
        page and fill in any red you see.
      </Typography>
    )
  else if (invalid.startsWith("Not all answers are filled"))
    err = (
      <Typography variant="body2">
        Not all answers are filled! Head over to the{" "}
        {/* <Link component={RouterLink} to="/decisions">
          Overview
        </Link>{" "} */}
        {/* page or the{" "} */}
        <Link component={RouterLink} to="/quiz">
          Quiz
        </Link>{" "}
        page to add them, or simulate the unanswered values below.
      </Typography>
    )
  else if (invalid.startsWith("Invalid factors:"))
    err = (
      <Typography variant="body2">
        Some factors are invalid. Head over to the{" "}
        <Link component={RouterLink} to="/factors">
          Factors
        </Link>{" "}
        page to fix them. {invalid}
      </Typography>
    )

  if (invalid && !calc) {
    return (
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6">Results unavailable</Typography>
        {err}
        {simulationControls}
        {canUseSimulatedValues &&
          useSimulatedValues &&
          !simulationRangesAreValid && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              Enter a finite minimum and maximum for every factor in order to
              run the simulation.
            </Typography>
          )}
        <br />
        <Box sx={{ color: "#00000010" }}>{invalid}</Box>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>
      <Stack spacing={3}>
        <Typography variant="h5">Results</Typography>
        {simulationControls}

        <Summary results={results} best={best} worst={worst} />

        <Divider />

        <GoodnessPlot
          decision={calculationDecision}
          goodness={goodness}
          goodnessConf={goodnessConf}
        />

        <EntropyPlot
          decision={calculationDecision}
          factorNames={factorNames}
          entropy={calc.mean.entropy}
          usefulness={calc.mean.usefulness}
          weights={weights}
        />

        <HeatmapPlot
          normalizedAnswers={normalizedAnswers}
          factorNames={factorNames}
          weights={weights}
          decision={calculationDecision}
          answers={answers}
          calc={calc}
        />

        <FactorContributionPlot
          key={`${calculationDecision.name}:${best?.is}:${calculationDecision.options.map((option) => option.name).join("|")}`}
          decision={calculationDecision}
          best={best}
          contributions={objectiveContributions}
        />

        <SingleLinePlot results={results} />

        <PcaPlot
          normalizedAnswers={normalizedAnswers}
          optimalNormalized={optimalNormalized}
          worstPossibleOptionNormalized={worstPossibleOptionNormalized}
          labels={labels}
        />

        <RadarPlot
          normalizedAnswers={normalizedAnswers}
          optimalNormalized={optimalNormalized}
          worstPossibleOptionNormalized={worstPossibleOptionNormalized}
          factorNames={factorNames}
          labels={labels}
          best={best}
          includedRadar={includedRadar}
          setIncludedRadar={setIncludedRadar}
          factorColors={calculationDecision.factors.map(
            (factor) => factor.color,
          )}
          optionColors={calculationDecision.options.map(
            (option) => option.color,
          )}
        />
      </Stack>
    </Box>
  )
}
