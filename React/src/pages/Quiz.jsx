import React, { useState } from "react";
import { useDecisions } from "../contexts/DecisionsContext";
import Decision from "../models/Decision";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Slider from "@mui/material/Slider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { TextField } from "@mui/material";

// TODO: negative values don't work well with this right now
function cloneDecision(decision) {
  return Decision.deserialize(JSON.parse(decision.serialize()));
}

function formatAnswer(cell) {
  if (!cell) return "";
  const a = cell;
  if (a[0] == null || a[1] == null) return "";
  if (Number.isNaN(a[0]) || Number.isNaN(a[1])) return "";
  return a[0] !== a[1] ? `${a[0]}-${a[1]}` : `${a[0]}`;
}

export default function Quiz() {
  const { decisions, setDecisions, selectedIndex, decision } = useDecisions();

  // UI state (unconditional hooks)
  const [idx, setIdx] = useState(0);
  const [anticolumnar, setAnticolumnar] = useState(true);
  const [precise, setPrecise] = useState(true);
  const [unsure, setUnsure] = useState(false);
  // The value of the response given by the user
  const [resp, setResp] = useState(null);
  // cur is only null if decision is not yet specified
  const [cur, setCur] = useState(null);
  const value = resp ?? cur ?? [0, 0];

  const numOptions = decision?.options.length ?? 0;
  const numFactors = decision?.factors.names.length ?? 0;

  // After we select a decision, initialize cur to the first cell if it's not already set
  if (decision && cur == null)
    setCur(() => {
      console.log("cur", decision.getAnswer(0, 0));
      return decision.getAnswer(0, 0) ?? [0, 0];
    });

  // keep idx in bounds
  if (numOptions && numFactors && idx >= numOptions * Math.max(1, numFactors))
    setIdx(0);

  // index mapping helpers
  function computeIndex(localIdx = idx) {
    if (!anticolumnar) {
      const optionIdx = numOptions ? localIdx % numOptions : 0;
      const factorIdx = numOptions ? Math.floor(localIdx / numOptions) : 0;
      return [optionIdx, factorIdx];
    }
    const optionIdx = numFactors ? Math.floor(localIdx / numFactors) : 0;
    const factorIdx = numFactors ? localIdx % numFactors : 0;
    return [optionIdx, factorIdx];
  }

  function indexToIdx(optionIdx, factorIdx) {
    if (!anticolumnar) return factorIdx * numOptions + optionIdx;
    return optionIdx * numFactors + factorIdx;
  }

  const [optionIdx, factorIdx] = computeIndex();
  const option = decision?.options[optionIdx] || "";
  const factor = decision?.factors.names[factorIdx] || "";
  const scale = [decision?.mins()[factorIdx], decision?.maxs()[factorIdx]];

  function changeCell(newIdx) {
    let newIdxValue;
    if (typeof newIdx === "function") newIdxValue = newIdx(idx);
    else newIdxValue = newIdx;
    const [newOptionIdx, newFactorIdx] = computeIndex(newIdxValue);
    // const newValue = decision?.answers[newOptionIdx][newFactorIdx] || [
    //   NaN,
    //   NaN,
    // ];
    // const newUnsure = !(Number.isNaN(newValue[0]) || Number.isNaN(newValue[1]));
    const { value: newValue, isUnsure: newUnsure } =
      decision?.getAnswer(newOptionIdx, newFactorIdx, false, true) || {};
    console.log("Changing cell", {
      newIdx,
      newIdxValue,
      newOptionIdx,
      newFactorIdx,
      newValue,
      newUnsure,
    });
    setUnsure(newUnsure);
    // if (newUnsure) {
    // setResp(null);
    // setRangeResp(null);
    setCur(newValue);
    setResp(null);
    // } else setRangeResp(newValue);
    setIdx(newIdx);
  }

  function updateDecision(mutator) {
    const copy = decisions.slice();
    const d = cloneDecision(decision);
    mutator(d);
    copy[selectedIndex] = d;
    setDecisions(copy);
  }

  function handleDeleteAll() {
    if (confirm("Are you sure you want to delete all answers?")) {
      updateDecision((d) => d.clearAllAnswers());
      changeCell(0);
    }
  }

  function handleSubmit() {
    updateDecision((d) => {
      // const value = unsure
      // ? [Number(resp[0]), Number(resp[1])]
      // : Number(resp);
      d.setAnswer(option, factor, value);
    });
    changeCell((i) => i + 1);
  }

  function handleSkip() {
    changeCell((i) => i + 1);
  }

  function handleBack() {
    changeCell((i) => Math.max(0, i - 1));
  }

  const step = precise ? 0.1 : 1;
  let sliderMarks = [
    // The scale is calculated to be non-null
    { value: scale[0], label: decision?.factors.mins[factorIdx] },
    { value: scale[1], label: decision?.factors.maxs[factorIdx] },
    // { value: value[0], label: value[0] },
  ];
  if (unsure) sliderMarks.push({ value: value[1], label: value[1] });

  // console.log('min', decision?.factors.mins[factorIdx])
  const isRespInValid = decision?.isAnswerInvalid(option, factor, value);

  return !decision ? (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">Quiz</Typography>
      <Typography>Select a decision to take the quiz.</Typography>
    </Box>
  ) : (
    <Box sx={{ p: 2 }}>
      {/* Top stuff */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Quiz</Typography>
        <Box>
          {/* <Button onClick={() => setIdx(0)}>Go to beginning</Button> */}
          <Button onClick={handleDeleteAll}>Delete all</Button>
        </Box>
      </Box>

      {/* Top Checkboxes */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={anticolumnar}
              onChange={(e) => setAnticolumnar(e.target.checked)}
            />
          }
          label="Left to Right"
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
      </Box>

      {/* Slider box */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">
            {factor ? `${factor}: ${option}` : "Choose a factor/option"}
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={unsure ?? false}
                onChange={(e) => setUnsure(e.target.checked)}
              />
            }
            label="I'm not sure"
          />

          <Box sx={{ mt: 2 }}>
            {!unsure ? (
              <Box sx={{ px: 2 }}>
                <Slider
                  key={`s-${optionIdx}-${factorIdx}`}
                  value={value[0]}
                  min={scale[0]}
                  max={scale[1]}
                  step={step}
                  onChange={(e, v) => setResp([v, v])}
                  marks={sliderMarks}
                />
                <TextField
                  onChange={(e) => setResp([e.target.value, e.target.value])}
                  key={`t-${optionIdx}-${factorIdx}`}
                  value={value[0]}
                  label="Value"
                  shrink="true"
                  error={isRespInValid}
                />
              </Box>
            ) : (
              <Box sx={{ px: 2 }}>
                <Slider
                  key={`r-${optionIdx}-${factorIdx}`}
                  value={value}
                  min={scale[0]}
                  max={scale[1]}
                  step={step}
                  onChange={(e, v) => setResp(v)}
                  marks={sliderMarks}
                />
                <span>
                  <TextField
                    onChange={(e) => setResp([e.target.value, cur[1]])}
                    key={`t1-${optionIdx}-${factorIdx}`}
                    value={value[0]}
                    label="Min"
                    shrink="true"
                    error={isRespInValid}
                    sx={{ width: "40%" }}
                  />
                  {/* I'm not quite sure why this works, but it does */}
                  <span
                    style={{
                      margin: "1rem 16px",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  >
                    {" - "}
                  </span>
                  <TextField
                    onChange={(e) => setResp([cur[0], e.target.value])}
                    key={`t2-${optionIdx}-${factorIdx}`}
                    value={value[1]}
                    label="Max"
                    shrink="true"
                    error={isRespInValid}
                    sx={{ width: "40%" }}
                  />
                </span>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
            <Button variant="contained" onClick={handleSubmit} sx={{ mr: 1 }}>
              Submit
            </Button>
            <Button onClick={handleSkip}>Skip</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Typography variant="h6" gutterBottom>
        Answers - click to jump to an answer
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {decision.factors.names.map((n) => (
                <TableCell key={n}>{n}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.options.map((opt, r) => (
              <TableRow key={opt}>
                <TableCell>{opt}</TableCell>
                {decision.answers[r].map((cell, c) => {
                  const text = formatAnswer(cell);
                  const isActive = r === optionIdx && c === factorIdx;
                  return (
                    <TableCell
                      key={c}
                      onClick={() => changeCell(indexToIdx(r, c))}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: isActive
                          ? "#fff9c4"
                          : text == ""
                            ? "#e02d2d67"
                            : "inherit",
                      }}
                    >
                      {text}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
// import React from 'react'
// import Box from '@mui/material/Box'
// import Typography from '@mui/material/Typography'
// import DecisionList from '../components/DecisionList'
// import ExplanationSidebar from '../components/ExplanationSidebar';

// export default function Quiz() {
//   return (
//       <Box sx={{ flex: 1 }}>
//         <Typography variant="h4">Quiz</Typography>
//         <Typography>Collect user answers here.</Typography>
//       </Box>
//   )
// }
