import React, { useEffect, useMemo, useState } from "react";
import { useDecisions } from "../contexts/DecisionsContext";
import DecisionList from "../components/DecisionList";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import Plot from "react-plotly.js";
import ExplanationSidebar from "../components/ExplanationSidebar";
import * as PCAImport from "pca-js";
import texts from "../assets/texts.json";
import HelpOverlay from "../components/HelpOverlay";

const PCA = PCAImport.default ?? PCAImport;

function joinAnd(items, { oxford = false, ampersand = false } = {}) {
  const andToken = ampersand ? " & " : " and ";
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items.join(andToken);
  const sep = oxford ? `,${andToken}` : andToken;
  return `${items.slice(0, -1).join(", ")}${sep}${items[items.length - 1]}`;
}

function linspace(start, stop, n) {
  if (n <= 1) return [start];
  const step = (stop - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + step * i);
}

function stdDev(arr) {
  if (!arr.length) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function interpolateColor(c1, c2, t) {
  const toRgb = (hex) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const a = toRgb(c1);
  const b = toRgb(c2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function sampleColorscale(colors, t) {
  if (t <= 0) return colors[0];
  if (t >= 1) return colors[colors.length - 1];
  const seg = (colors.length - 1) * t;
  const i = Math.floor(seg);
  const local = seg - i;
  return interpolateColor(colors[i], colors[i + 1], local);
}

function computePca2D(X) {
  try {
    const eigenVectors = PCA.getEigenVectors(X);
    if (!eigenVectors || eigenVectors.length < 2) return null;
    const adjusted = PCA.computeAdjustedData(
      X,
      eigenVectors[0],
      eigenVectors[1],
    );
    return adjusted;
  } catch (e) {
    console.warn("PCA failed, falling back to zeros", e);
    return null;
  }
}

export default function Results() {
  const { decisions, selectedIndex } = useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null;
  const theme = useTheme();

  const [includedRadar, setIncludedRadar] = useState([]);

  const calc = useMemo(() => {
    if (!decision) return null;
    return decision.calculateAll({ method: "threshold" });
  }, [decision]);

  const {
    results,
    optimalNormalized,
    worstPossibleOptionNormalized,
    normalizedAnswers,
    goodness,
    goodnessConf,
    best,
    worst,
    weights,
    factorNames,
    answers,
  } = useMemo(() => {
    if (!decision || !calc) {
      return {
        results: [],
        optimalNormalized: [],
        worstPossibleOptionNormalized: [],
        normalizedAnswers: [],
        goodness: [],
        goodnessConf: [],
        best: null,
        worst: null,
        weights: [],
        factorNames: [],
        answers: [],
      };
    }
    const optimal = decision.optimalNormalized();
    const worstOpt = optimal.map((v) => (Math.round(v) === 0 ? 1 : 0));
    const normalized_weighted_dists = calc.mean.badness || [];
    const resultsRows = decision.options.map((opt, i) => ({
      score: normalized_weighted_dists[i],
      option: opt,
      percentage: (normalized_weighted_dists[i] || 0) * 100,
    }));
    resultsRows.sort((a, b) => a.score - b.score);
    return {
      results: resultsRows,
      optimalNormalized: optimal,
      worstPossibleOptionNormalized: worstOpt,
      normalizedAnswers: calc.mean.normalized_answers || [],
      goodness: calc.mean.goodness || [],
      goodnessConf: calc.std.goodness || [],
      best: calc.best || null,
      worst: calc.worst || null,
      weights: decision.factors.weights || [],
      factorNames: decision.factors.names || [],
      answers: decision.weightedAnswers(0.5) || [],
    };
  }, [decision, calc]);

  const labels = useMemo(() => {
    if (!decision) return [];
    return [...decision.options, "Best", "Worst"];
  }, [decision]);

  useEffect(() => {
    if (!best || !labels.length) return;
    const bestIdx = labels.indexOf(best.is);
    const defaultIncluded = [];
    if (bestIdx !== -1) defaultIncluded.push(labels[bestIdx]);
    if (labels.length >= 2) defaultIncluded.push(labels[labels.length - 2]);
    setIncludedRadar(defaultIncluded);
  }, [best, labels]);

  const singleLinePlot = useMemo(() => {
    const t = linspace(0, 100, 1000);
    const annotations = results.map((r) => ({
      x: r.percentage,
      y: 0,
      text: `${r.option} (${r.percentage.toFixed(1)}%)`,
      showarrow: false,
      font: { color: theme.palette.text.primary, size: 15 },
      xanchor: "left",
      yanchor: "bottom",
      textangle: -45,
    }));
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
    );
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
          hovertemplate: null,
        },
        {
          type: "scatter",
          mode: "markers",
          x: results.map((r) => r.percentage),
          y: results.map(() => 0),
          text: results.map((r) => r.option),
          marker: {
            size: 10,
            color: results.map((r) => r.percentage),
            colorscale: "Reds",
            cmin: 0,
            cmax: 100,
            showscale: false,
          },
          hovertemplate: "%{text}<br>Badness: %{x:.1f}%",
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
        // title: {text:"Relative distance of each option"},
        showlegend: false,
        annotations,
        margin: { t: 50, b: 40, l: 30, r: 30 },
      },
    };
  }, [results, theme]);

  // The variable sizes one
  const heatmapPlot = useMemo(() => {
    const colorscale = ["#9B1127", "#FFFFBF", "#195695"];
    const nRows = normalizedAnswers.length;
    const nCols = factorNames.length;
    const shapes = [];
    const textX = [];
    const textY = [];
    const textLabels = [];
    const textColors = [];
    for (let i = 0; i < nRows; i++) {
      for (let j = 0; j < nCols; j++) {
        const value = 1 - Math.abs(calc.mean.delta_vectors_normalized[i][j]);
        const weight = weights[j];
        const color = sampleColorscale(colorscale, value);
        const halfW = (1 * weight) / 2;
        const halfH = (1 * weight) / 2;
        shapes.push({
          type: "rect",
          x0: j - halfW,
          y0: i - halfH,
          x1: j + halfW,
          y1: i + halfH,
          line: { width: 0 },
          fillcolor: color,
          layer: "below",
        });
        const maxs = decision.maxs();
        const answer = answers[i][j];
        const maxVal = maxs[j];
        textX.push(j);
        textY.push(i);
        textLabels.push(
          `${Math.round(value * 100)}%<br>(${Math.round(answer)}/${Math.round(
            maxVal,
          )})`,
        );
        textColors.push(weight > 0.3 ? "black" : theme.palette.text.primary);
      }
    }
    return {
      data: [
        {
          type: "scatter",
          mode: "text",
          x: textX,
          y: textY,
          text: textLabels,
          textfont: { color: textColors, size: 12 },
          hoverinfo: "skip",
          showlegend: false,
        },
      ],
      layout: {
        xaxis: {
          tickvals: Array.from({ length: nCols }, (_, i) => i),
          ticktext: factorNames,
          showgrid: false,
          zeroline: false,
          scaleanchor: "y",
        },
        yaxis: {
          tickvals: Array.from({ length: nRows }, (_, i) => i),
          ticktext: decision?.options,
          showgrid: false,
          zeroline: false,
          autorange: "reversed",
        },
        // plot_bgcolor: theme.palette.primary.main,
        margin: { t: 60, b: 20, l: 20, r: 20 },
        title: { text: "How good each option is" },
        title_x: 0.2,
        title_font_size: 20,
        shapes,
      },
    };
  }, [normalizedAnswers, factorNames, weights, theme, decision, answers, calc]);

  // Multi color bar plot
  const entropyPlot = useMemo(() => {
    const entropies = factorNames.map((_, j) => {
      return stdDev(answers.map((row) => row[j])) * weights[j];
    });

    return {
      data: [
        {
          type: "bar",
          // Sort by entropy
          x: factorNames.toSorted(
            (a, b) =>
              entropies[factorNames.indexOf(b)] -
              entropies[factorNames.indexOf(a)],
          ),//.map(x => x * 1),
          y: entropies.toSorted((a, b) => b - a),
          width: weights,
          marker: {
            // This is just to invert the colorscale (since inverting the colorscale doesn't work??)
            color: weights.map(x => 1-x),
            colorscale: [
              ["0.0", "#08326e"],
              ["1.0", theme.palette.background.paper],
            ],
            cmin: 0,
            cmax: 1,
            line: {
              color: theme.palette.background.paper,
              // color: "#ffffff",
              width: 2,
            }
          },
        },
      ],
      layout: {
        // borderwidth: 2,
        // gap: 2,
        // legend: {bordercolor: "#000000", borderwidth: 1, visible: true},
        // bordercolor: theme.palette.divider,
        // bordercolor: "#000000",
        // border: {color: theme.palette.divider, width: 1},
        title: { text: "Usefulness of each factor" },
        // legend: { visible: true, orientation: "h", y: -0.2 },
        xaxis: {
          showticklabels: true,
          showgrid: true,
          title: { text: "Factors" },
        },
        yaxis: {
          title: { text: "How much each factor contributed to the decision" },
          showticklabels: false,
        },
        margin: { t: 60, b: 40, l: 50, r: 20 },
        // plot_bgcolor: theme.palette.primary.main,
      },
    };
  }, [factorNames, answers, weights]);

  const goodnessPlot = useMemo(() => {
    if (!decision) return null;
    const rows = decision.options.map((opt, i) => ({
      option: opt,
      value: goodness[i],
      conf: goodnessConf[i],
    }));
    rows.sort((a, b) => b.value - a.value);
    return {
      data: [
        {
          type: "bar",
          x: rows.map((r) => r.option),
          y: rows.map((r) => r.value),
          error_y: {
            type: "data",
            array: rows.map((r) => r.conf),
            arrayminus: rows.map((r) => r.conf),
            visible: true,
          },
          text: rows.map((r) => r.value),
          texttemplate: "%{text:.0%}",
        },
      ],
      layout: {
        title: { text: "How good each option is" },
        yaxis: {
          range: [0, 1],
          tickformat: ".0%",
        },
        margin: { t: 60, b: 40, l: 50, r: 20 },
      },
    };
  }, [decision, goodness, goodnessConf]);

  const pcaPlot = useMemo(() => {
    console.warn("TODO: PCA plot");
    return null;
    const data = [...normalizedAnswers];
    data.push(optimalNormalized, worstPossibleOptionNormalized);
    const adjusted = computePca2D(data) || data.map(() => [0, 0]);
    console.log("adjusted", adjusted);
    const xs = adjusted.map((row) => row[0]);
    const ys = adjusted.map((row) => row[1]);
    return {
      data: [
        {
          type: "scatter",
          mode: "markers+text",
          x: xs,
          y: ys,
          text: labels,
          textposition: "top center",
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
    };
  }, [
    normalizedAnswers,
    optimalNormalized,
    worstPossibleOptionNormalized,
    labels,
  ]);

  const radarPlot = useMemo(() => {
    const data = [...normalizedAnswers];
    data.push(optimalNormalized, worstPossibleOptionNormalized);
    const optimal = data[data.length - 2];
    const sortedIndices = optimal
      .map((v, i) => [v, i])
      .sort((a, b) => a[0] - b[0])
      .map((p) => p[1]);
    const sortedDimLabels = sortedIndices.map((i) => factorNames[i]);
    const sortedData = data.map((row) => sortedIndices.map((i) => row[i]));
    const traces = [];
    for (let i = 0; i < sortedData.length; i++) {
      if (!includedRadar.includes(labels[i])) continue;
      const r = sortedData[i];
      traces.push({
        type: "scatterpolar",
        r: [...r, r[0]],
        theta: [...sortedDimLabels, sortedDimLabels[0]],
        fill: "toself",
        name: labels[i],
      });
    }
    return {
      data: traces,
      layout: {
        polar: { radialaxis: { visible: true, range: [0, 1] } },
        showlegend: true,
        margin: { t: 40, b: 40, l: 40, r: 40 },
      },
    };
  }, [
    normalizedAnswers,
    optimalNormalized,
    worstPossibleOptionNormalized,
    factorNames,
    includedRadar,
    labels,
  ]);

  if (!decision) {
    return (
      // <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
      //   <DecisionList />
      // <Box sx={{ flex: 1, p: 3 }}>
      <Typography variant="h6">Select a decision to view results.</Typography>
      // {/* </Box> */}
      //   <ExplanationSidebar />
      // </Box>
    );
  }

  const invalid = decision.isInvalid();
  const help = texts.results;
  if (invalid) {
    return (
      // <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
      //   <DecisionList />
      <Box sx={{ flex: 1, p: 3 }}>
        <Typography variant="h6">Results unavailable</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {invalid}
        </Typography>
      </Box>
      //   <ExplanationSidebar />
      // </Box>
    );
  }

  return (
    // <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
    //   <DecisionList />
    <Box sx={{ flex: 1, p: 3, minWidth: 0 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5">Results</Typography>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-line" }}>
            The best option is <code>{best.is}</code> because of{" "}
            <code>{joinAnd(best.because)}</code>, even though{" "}
            <code>{joinAnd(best.despite)}</code> isn't what you want.
            <br />
            The worst option is <code>{worst.is}</code> because of{" "}
            <code>{joinAnd(worst.because)}</code>, even though{" "}
            <code>{joinAnd(worst.despite)}</code> is what you want.
          </Typography>
        </Box>

        <Divider />

        <HelpOverlay helpText={help.goodness_bar}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={goodnessPlot.data}
              layout={goodnessPlot.layout}
              style={{ width: "100%", height: 400 }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </Paper>
        </HelpOverlay>

        <HelpOverlay helpText={help.entropy}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={entropyPlot.data}
              layout={entropyPlot.layout}
              style={{ width: "100%", height: 400 }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </Paper>
        </HelpOverlay>
        <HelpOverlay helpText={help.contributions_var_size}>
          <Paper sx={{ p: 2 }}>
            <Plot
              data={heatmapPlot.data}
              layout={heatmapPlot.layout}
              style={{ width: "100%", height: 500 }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </Paper>
        </HelpOverlay>

        <Typography variant="h6" align="center">
          Relative Distance of Each Option
        </Typography>
        <HelpOverlay helpText={help.line1d}>
          <Paper sx={{ p: 2, width: "100%" }}>
            <Plot
              data={singleLinePlot.data}
              layout={singleLinePlot.layout}
              style={{ width: "100%", height: 350 }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </Paper>
        </HelpOverlay>

        {/*  PCA plot*/}
        {pcaPlot && (
          <HelpOverlay helpText={help.PCA}>
            <Paper sx={{ p: 2 }}>
              <Plot
                data={pcaPlot?.data}
                layout={pcaPlot?.layout}
                style={{ width: "100%", height: 450 }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
            </Paper>
          </HelpOverlay>
        )}

        <HelpOverlay helpText={help.radar}>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1">Radar Selection</Typography>
              <Autocomplete
                multiple
                options={labels}
                value={includedRadar}
                onChange={(e, value) => setIncludedRadar(value)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    let props = getTagProps({ index });
                    // React doesn't like spreading the key prop
                    delete props.key;
                    return (
                      <Chip
                        variant="outlined"
                        label={option}
                        key={`${option}-${index}-radar`}
                        {...props}
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField {...params} label="Options" size="small" />
                )}
              />
              <Plot
                data={radarPlot.data}
                layout={radarPlot.layout}
                style={{ width: "100%", height: 500 }}
                useResizeHandler
                config={{ displayModeBar: false }}
              />
            </Stack>
          </Paper>
        </HelpOverlay>
      </Stack>
    </Box>
    // {/* <ExplanationSidebar /> */}
    // </Box>
  );
}
