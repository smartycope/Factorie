import React, { useState } from "react"
import { useDecisions } from "../contexts/DecisionsContext"
import Decision from "../models/Decision"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Button from "@mui/material/Button"
import FormControlLabel from "@mui/material/FormControlLabel"
import Checkbox from "@mui/material/Checkbox"
import Slider from "@mui/material/Slider"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import { TextField } from "@mui/material"
import Answer from "../models/Answer"
import {Link} from "react-router-dom";

const TRANSPOSED = true

// TODO: negative values don't work well with this right now
// TODO: when there's 2 sliders (unsure), only one is labeled, neither should be
function cloneDecision(decision) {
  return Decision.deserialize(JSON.parse(decision.serialize()))
}

function formatAnswer(cell) {
  return Answer.parse(cell)?.toString() ?? ""
}

function copyAnswer(answer) {
  return new Answer(answer?.min, answer?.max)
}

function numberOrNull(value) {
  if (value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function updateAnswerMin(answer, min) {
  if (min === null) return new Answer()
  return new Answer(min, Number.isFinite(answer.max) ? answer.max : min)
}

function updateAnswerMax(answer, max) {
  if (max === null) return new Answer()
  return new Answer(Number.isFinite(answer.min) ? answer.min : max, max)
}

function answerCellSx(isActive, text) {
  return {
    cursor: "pointer",
    backgroundColor:
      isActive ? "#fff9c4"
      : text == "" ? "#e02d2d67"
      : "inherit",
  }
}

function AnswersTable({
  decision,
  optionIdx,
  factorIdx,
  changeCell,
  indexToIdx,
}) {
  return (
    <>
      {/* <Typography variant="h6" gutterBottom>
        Answers - options on rows
      </Typography> */}
      <Paper sx={{ mb: 2 }}>
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
                  const text = formatAnswer(cell)
                  const isActive = r === optionIdx && c === factorIdx
                  return (
                    <TableCell
                      key={c}
                      onClick={() => changeCell(indexToIdx(r, c))}
                      sx={answerCellSx(isActive, text)}>
                      {text}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  )
}

function TransposedAnswersTable({
  decision,
  optionIdx,
  factorIdx,
  changeCell,
  indexToIdx,
}) {
  return (
    <>
      {/* <Typography variant="h6" gutterBottom>
        Answers - factors on rows
      </Typography> */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {decision.options.map((opt) => (
                <TableCell key={opt}>{opt}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.factors.names.map((factorName, c) => (
              <TableRow key={factorName}>
                <TableCell>{factorName}</TableCell>
                {decision.options.map((opt, r) => {
                  const text = formatAnswer(decision.answers[r]?.[c])
                  const isActive = r === optionIdx && c === factorIdx
                  return (
                    <TableCell
                      key={opt}
                      onClick={() => changeCell(indexToIdx(r, c))}
                      sx={answerCellSx(isActive, text)}>
                      {text}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  )
}

export default function Quiz() {
  const { decisions, setDecisions, selectedIndex, decision } = useDecisions()

  // UI state (unconditional hooks)
  const [idx, setIdx] = useState(0)
  const [anticolumnar, setAnticolumnar] = useState(true)
  const [precise, setPrecise] = useState(false)
  const [unsure, setUnsure] = useState(false)
  // The value of the response given by the user
  const [resp, setResp] = useState(null)
  // cur is only null if decision is not yet specified
  const [cur, setCur] = useState(null)
  const value = resp ?? cur ?? new Answer()

  const numOptions = decision?.options.length ?? 0
  const numFactors = decision?.factors.names.length ?? 0

  // After we select a decision, initialize cur to the first cell if it's not already set
  if (decision && cur == null)
    setCur(() => {
      return copyAnswer(decision.getAnswer(0, 0))
    })

  // keep idx in bounds
  if (numOptions && numFactors && idx >= numOptions * Math.max(1, numFactors))
    setIdx(0)

  // index mapping helpers
  function computeIndex(localIdx = idx) {
    if (TRANSPOSED ? anticolumnar : !anticolumnar) {
      const optionIdx = numOptions ? localIdx % numOptions : 0
      const factorIdx = numOptions ? Math.floor(localIdx / numOptions) : 0
      return [optionIdx, factorIdx]
    }
    const optionIdx = numFactors ? Math.floor(localIdx / numFactors) : 0
    const factorIdx = numFactors ? localIdx % numFactors : 0
    return [optionIdx, factorIdx]
  }

  function indexToIdx(optionIdx, factorIdx) {
    if (TRANSPOSED ? anticolumnar : !anticolumnar) return factorIdx * numOptions + optionIdx
    return optionIdx * numFactors + factorIdx
  }

  const [optionIdx, factorIdx] = computeIndex()
  const option = decision?.options[optionIdx] || ""
  const factor = decision?.factors.names[factorIdx] || ""
  const scale = [decision?.mins()[factorIdx], decision?.maxs()[factorIdx]]

  function changeCell(newIdx) {
    let newIdxValue
    if (typeof newIdx === "function") newIdxValue = newIdx(idx)
    else newIdxValue = newIdx
    const [newOptionIdx, newFactorIdx] = computeIndex(newIdxValue)
    const newValue = copyAnswer(decision?.getAnswer(newOptionIdx, newFactorIdx))
    setUnsure(newValue.isRanged() ?? false)
    setCur(newValue)
    setResp(null)
    setIdx(newIdx)
  }

  function updateDecision(mutator) {
    const copy = decisions.slice()
    const d = cloneDecision(decision)
    mutator(d)
    copy[selectedIndex] = d
    setDecisions(copy)
  }

  function handleDeleteAll() {
    if (confirm("Are you sure you want to delete all answers?")) {
      updateDecision((d) => d.clearAllAnswers())
      changeCell(0)
    }
  }

  function handleSubmit() {
    updateDecision((d) => {
      d.setAnswer(option, factor, value)
    })
    changeCell((i) => i + 1)
  }

  function handleSkip() {
    changeCell((i) => i + 1)
  }

  function handleBack() {
    changeCell((i) => Math.max(0, i - 1))
  }

  const step = precise ? 0.1 : 1
  const sliderMin = Number.isFinite(value.min) ? value.min : scale[0]
  const sliderMax = Number.isFinite(value.max) ? value.max : sliderMin
  const sliderValue = unsure ? [sliderMin, sliderMax] : sliderMin
  const sliderMarks = [
    // The scale is calculated to be non-null
    { value: scale[0], label: decision?.factors.mins[factorIdx] },
    { value: scale[1], label: decision?.factors.maxs[factorIdx] },
  ]
  if (unsure && Number.isFinite(value.max))
    sliderMarks.push({ value: value.max, label: value.max })

  const isRespInValid = decision ?
    Boolean(value.isInvalid(decision, factor, true))
  : false

//   if (!decision.isInvalid(true)) {
    if (decision.factors.names.some((_, i) => !decision.isFactorValid(i))){
        const unfinishedFactors = decision.factors.names.filter((_, i) => decision.isFactorValid(decision.factors.names[i]))
    return <Box sx={{ p: 2 }}>
      <Typography variant="h4">Quiz</Typography>
      <Typography>
        The following factors are unfinished:
        <br/>
        {unfinishedFactors.map((n) => <>"{n}"<br/></>)}
        <br/>
        Go back to the <Link to="/factors">Factors</Link> and fill in the red areas first
        </Typography>
    </Box>
  }

  return !decision ?
      <Box sx={{ p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>Select a decision to take the quiz.</Typography>
      </Box>
    : <Box sx={{ p: 2, minWidth: "60%" }}>
        {/* Top stuff */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}>
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
              {!unsure ?
                <Box sx={{ px: 2 }}>
                  <Slider
                    key={`s-${optionIdx}-${factorIdx}`}
                    value={sliderValue}
                    min={scale[0]}
                    max={scale[1]}
                    step={step}
                    onChange={(e, v) => setResp(new Answer(v, v))}
                    marks={sliderMarks}
                  />
                  <TextField
                    onChange={(e) => {
                      const nextValue = numberOrNull(e.target.value)
                      setResp(new Answer(nextValue, nextValue))
                    }}
                    key={`t-${optionIdx}-${factorIdx}`}
                    value={value.min ?? ""}
                    label="Value"
                    shrink="true"
                    error={isRespInValid}
                  />
                </Box>
              : <Box sx={{ px: 2 }}>
                  <Slider
                    key={`r-${optionIdx}-${factorIdx}`}
                    value={sliderValue}
                    min={scale[0]}
                    max={scale[1]}
                    step={step}
                    onChange={(e, v) => setResp(new Answer(v[0], v[1]))}
                    marks={sliderMarks}
                  />
                  <span>
                    <TextField
                      onChange={(e) =>
                        setResp(
                          updateAnswerMin(value, numberOrNull(e.target.value)),
                        )
                      }
                      key={`t1-${optionIdx}-${factorIdx}`}
                      value={value.min ?? ""}
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
                      }}>
                      {" - "}
                    </span>
                    <TextField
                      onChange={(e) =>
                        setResp(
                          updateAnswerMax(value, numberOrNull(e.target.value)),
                        )
                      }
                      key={`t2-${optionIdx}-${factorIdx}`}
                      value={value.max ?? ""}
                      label="Max"
                      shrink="true"
                      error={isRespInValid}
                      sx={{ width: "40%" }}
                    />
                  </span>
                </Box>
              }
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

        <Typography variant="h6" gutterBottom>
          Answers - click to jump to an answer
        </Typography>
        {!TRANSPOSED && <AnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          indexToIdx={indexToIdx}
        />}
        {TRANSPOSED && <TransposedAnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          indexToIdx={indexToIdx}
        />}
      </Box>
}
