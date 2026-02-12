import React, { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Plot from "react-plotly.js";
import { useDecisions } from "../contexts/DecisionsContext";
import DecisionList from "../components/DecisionList";
import Decision from "../models/Decision";
import Paper from "@mui/material/Paper";
import MultiHandledSlider from "../components/MultiHandledSlider";
import { Checkbox } from "@mui/material";
import ExplanationSidebar from "../components/ExplanationSidebar";

// TODO: add a "back" button to change your previous answer in the quiz without resetting everything (difficult, possibly impossible)
// TODO: let factors that were answered as "about the same" have the same weight and be grouped together in the sorting

const linspace = (a, b, count) => {
  if (count === 1) return [a];
  return Array.from(
    { length: count },
    (_, i) => a + (b - a) * (i / (count - 1)),
  );
};

export default function Weights() {
  const { decisions, setDecisions, selectedIndex } = useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null;

  // positions state must be top-level (hooks cannot be conditional)
  const [handles, setHandles] = useState({});
  const [allowReordering, setAllowReordering] = useState(false);

  // Sync positions from the selected decision only when the decision changes.
  // We intentionally do not include `positions` in the deps to avoid clobbering
  // user edits while they're moving the sliders.

  useEffect(() => {
    if (!decision) return;
    const t = setTimeout(
      () =>
        setHandles(
          decision.factors.names.reduce((acc, label, i) => {
            acc[label] = decision.factors.weights[i] ?? 0;
            return acc;
          }, {}),
        ),
      0,
    );
    return () => clearTimeout(t);
  }, [decision, selectedIndex]);

  // Quiz hooks and handlers (kept at top-level so hooks order is stable)
  const sortGenRef = useRef(null);
  const [pendingPair, setPendingPair] = useState(null);
  const [quizFinished, setQuizFinished] = useState(false);

  function* mergeSortCoroutine(arr) {
    if (arr.length <= 1) return arr;

    function* helper(sub) {
      if (sub.length <= 1) return sub;
      const mid = Math.floor(sub.length / 2);
      const left = yield* helper(sub.slice(0, mid));
      const right = yield* helper(sub.slice(mid));
      const merged = [];
      let i = 0,
        j = 0;
      while (i < left.length && j < right.length) {
        const comparison = yield [left[i], right[j]];
        if (comparison === null) {
          merged.push(left[i]);
          i++;
          j++;
        } else if (comparison) {
          merged.push(left[i]);
          i++;
        } else {
          merged.push(right[j]);
          j++;
        }
      }
      while (i < left.length) {
        merged.push(left[i]);
        i++;
      }
      while (j < right.length) {
        merged.push(right[j]);
        j++;
      }
      return merged;
    }

    const sorted = yield* helper(arr);
    return sorted;
  }

  const startSort = () => {
    setQuizFinished(false);
    if (!decision) return;
    const g = mergeSortCoroutine(decision.factors.names.slice());
    sortGenRef.current = g;
    const first = g.next();
    if (first.done) applySortedWeightsToPositions(first.value);
    else setPendingPair(first.value);
  };

  useEffect(() => {
    startSort();
    return () => {
      sortGenRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const handleNextComparison = (ans) => {
    if (!sortGenRef.current || !pendingPair) return;
    const resp =
      ans === pendingPair[0] ? true : ans === pendingPair[1] ? false : null;
    const res = sortGenRef.current.next(resp);
    if (res.done) {
      setPendingPair(null);
      applySortedWeightsToPositions(res.value || []);
    } else {
      setPendingPair(res.value);
    }
  };

  const applySortedWeightsToPositions = (sortedResult) => {
    setQuizFinished(true);
    if (!sortedResult || sortedResult.length === 0) return;
    const n = sortedResult.length;

    const newWeightsSeq = linspace(1, 1 / n, n);
    const orderedLabels = decision.factors.names.slice();
    const orderedWeights = Array(orderedLabels.length).fill(0);
    for (let i = 0; i < sortedResult.length; i++) {
      const label = sortedResult[i];
      const value = newWeightsSeq[i];
      const idx = orderedLabels.indexOf(label);
      if (idx !== -1) orderedWeights[idx] = value;
    }
    setHandles(
      orderedLabels.reduce((acc, label, i) => {
        acc[label] = orderedWeights[i] ?? 0;
        return acc;
      }, {}),
    );
  };

  function handleCancel() {
    if (!decision) return;
    setHandles(
      decision.factors.names.reduce((acc, label, i) => {
        acc[label] = decision.factors.weights[i] ?? 0;
        return acc;
      }, {}),
    );
  }

  function applyPositionsToWeights() {
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.factors.weights = Object.values(handles).sort(
      (a, b) => d.factors.names.indexOf(a) - d.factors.names.indexOf(b),
    ); // sort the weights so they stay in sync with the labels
    copy[selectedIndex] = d;
    setDecisions(copy);
  }

  const labels = Object.keys(handles);
  const positions = labels.map((label) => handles[label] ?? 0);

  let unsaved;
  if (decision != null)
    unsaved = positions.some((p, i) => p !== decision.factors.weights[i]);

  // Plotly visuals
  const radarData = [
    {
      type: "scatterpolar",
      r: positions,
      theta: labels,
      fill: "none",
      mode: "lines+markers",
    },
  ];
  const radarLayout = {
    polar: { radialaxis: { visible: true, range: [0, 1] } },
    showlegend: false,
    width: 400,
    height: 360,
  };

  // sort bars by value (ascending)
  const pairs = labels.map((lab, i) => ({ lab, val: positions[i] ?? 0 }));
  pairs.sort((a, b) => a.val - b.val);
  const barX = pairs.map((p) => p.lab);
  const barY = pairs.map((p) => p.val);
  const barData = [{ x: barX, y: barY, type: "bar" }];
  const barLayout = {
    yaxis: { tickformat: ".0%", title: "Weight" },
    showlegend: false,
    width: 600,
    height: 360,
  };

  return !decision ? (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h4">Fine Tune Weights</Typography>
      <Typography>Please select or create a decision first.</Typography>
    </Box>
  ) : (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h4">Fine Tune Weights</Typography>
      <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
        <Typography variant="h6">Sort Factors</Typography>
        {quizFinished ? (
          <Typography variant="body1">
            Quiz finished! The results have been loaded into the slider below.
            You can fine tune your answers and save them when you're done, or
            just hit cancel if you changed your mind.
          </Typography>
        ) : (
          <Typography variant="caption">Which is more important?</Typography>
        )}
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
            }}
          >
            {!quizFinished && pendingPair && (
              <>
                <Button
                  sx={{ width: "30%" }}
                  variant="contained"
                  onClick={() => {
                    //   setChoice();
                    handleNextComparison(pendingPair[0]);
                  }}
                >
                  {pendingPair[0]}
                </Button>
                <Button
                  sx={{ width: "30%" }}
                  variant="outlined"
                  onClick={() => {
                    //   setChoice();
                    handleNextComparison("About the same");
                  }}
                >
                  About the same
                </Button>
                <Button
                  sx={{ width: "30%" }}
                  variant="contained"
                  onClick={() => {
                    //   setChoice();
                    handleNextComparison(pendingPair[1]);
                  }}
                >
                  {pendingPair[1]}
                </Button>
              </>
            )}
          </Box>
          {/* {sortedResult && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  onClick={applySortedWeightsToPositions}
                >
                  Set as new weights
                </Button>
              </Box>
            )} */}
        </Box>
        <br />
        <Button variant="outlined" onClick={startSort}>
          Start Over
        </Button>
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

      <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
        <Box>
          <Typography variant="subtitle1">Radar</Typography>
          <Plot data={radarData} layout={radarLayout} />
        </Box>
        <Box>
          <Typography variant="subtitle1">Bar</Typography>
          <Plot data={barData} layout={barLayout} />
        </Box>
      </Box>
    </Box>
  );
}
