import { useEffect, useRef, useState } from "react"
import { useDecisions } from "../contexts/UseDecisions"
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
import TablePagination from "@mui/material/TablePagination"
import TableRow from "@mui/material/TableRow"
import Paper from "@mui/material/Paper"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import { TextField } from "@mui/material"
import Answer from "../models/Answer"
import {Link} from "react-router-dom";
import { getSuggestedUnitAnswerOptions } from "../suggestedUnits"

const TRANSPOSED = true

// TODO: negative values don't work well with this right now
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

function SuggestedUnitAnswerButtons({ options, value, onAnswer }) {
  const selectedValue =
    value.min === value.max &&
    options.some((option) => option.value === value.min) ?
      value.min
    : null

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        gap: 4,
        mb: 2,
        flexWrap: "wrap",
      }}>
      {options.map((option) => (
        <Button
          key={option.label}
          variant={selectedValue === option.value ? "contained" : "outlined"}
          onClick={() => onAnswer(option.value)}
          sx={{ minWidth: 120 }}>
          {option.label}
        </Button>
      ))}
    </Box>
  )
}

function answerHasProblem(decision, optionIndex, factorIndex) {
  const answer = Answer.parse(decision.answers[optionIndex]?.[factorIndex])
  const factor = decision.factors.names[factorIndex]
  return !answer?.isAnswered() || Boolean(answer.isInvalid(decision, factor, true))
}

function factorHasProblem(decision, factorIndex) {
  return decision.options.some((_, optionIndex) =>
    answerHasProblem(decision, optionIndex, factorIndex)
  )
}

function factorIndexesForMode(decision, onlyShowUnanswered) {
  if (!decision) return []
  return decision.factors.names
    .map((_, index) => index)
    .filter((index) => !onlyShowUnanswered || factorHasProblem(decision, index))
}

function answerCellSx(isActive, hasProblem) {
  return {
    cursor: "pointer",
    backgroundColor:
      isActive ? "#bcdaf8"
      : hasProblem ? "#e02d2d67"
      : "inherit",
  }
}

function AnswersTable({
  decision,
  optionIdx,
  factorIdx,
  changeCell,
  indexToIdx,
  onlyShowUnanswered,
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const selectedPage = Math.floor(optionIdx / rowsPerPage)
  const selectedPageKey = `${optionIdx}-${rowsPerPage}`
  const previousSelectedPageKey = useRef(null)
  const maxPage = Math.max(0, Math.ceil(decision.options.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const start = safePage * rowsPerPage
  const visibleOptions = decision.options.slice(start, start + rowsPerPage)
  const visibleFactorIndexes = factorIndexesForMode(decision, onlyShowUnanswered)

  useEffect(() => {
    if (previousSelectedPageKey.current === selectedPageKey) return
    previousSelectedPageKey.current = selectedPageKey
    setPage(selectedPage)
  }, [selectedPage, selectedPageKey])

  return (
    <>
      <Paper sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {visibleFactorIndexes.map((factorIndex) => (
                <TableCell key={factorIndex}>
                  {decision.factors.names[factorIndex]}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleOptions.map((opt, visibleRow) => {
              const r = start + visibleRow
              return (
                <TableRow key={opt}>
                  <TableCell>{opt}</TableCell>
                  {visibleFactorIndexes.map((c) => {
                    const cell = decision.answers[r]?.[c]
                    const text = formatAnswer(cell)
                    const isActive = r === optionIdx && c === factorIdx
                    const hasProblem = answerHasProblem(decision, r, c)
                    return (
                      <TableCell
                        key={c}
                        onClick={() => changeCell(indexToIdx(r, c))}
                        sx={answerCellSx(isActive, hasProblem)}>
                        {text}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={decision.options.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
        />
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
  onlyShowUnanswered,
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const factorIndexes = factorIndexesForMode(decision, onlyShowUnanswered)
  const selectedFactorPosition = factorIndexes.indexOf(factorIdx)
  const selectedPage =
    selectedFactorPosition === -1 ?
      page
    : Math.floor(selectedFactorPosition / rowsPerPage)
  const selectedPageKey = `${selectedFactorPosition}-${rowsPerPage}`
  const previousSelectedPageKey = useRef(null)
  const maxPage = Math.max(0, Math.ceil(factorIndexes.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const start = safePage * rowsPerPage
  const visibleFactorIndexes = factorIndexes.slice(start, start + rowsPerPage)

  useEffect(() => {
    if (selectedFactorPosition === -1) return
    if (previousSelectedPageKey.current === selectedPageKey) return
    previousSelectedPageKey.current = selectedPageKey
    setPage(selectedPage)
  }, [selectedFactorPosition, selectedPage, selectedPageKey])

  return (
    <>
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
            {visibleFactorIndexes.map((c) => {
              return (
                <TableRow key={c}>
                  <TableCell>{decision.factors.names[c]}</TableCell>
                  {decision.options.map((opt, r) => {
                    const text = formatAnswer(decision.answers[r]?.[c])
                    const isActive = r === optionIdx && c === factorIdx
                    const hasProblem = answerHasProblem(decision, r, c)
                    return (
                      <TableCell
                        key={opt}
                        onClick={() => changeCell(indexToIdx(r, c))}
                        sx={answerCellSx(isActive, hasProblem)}>
                        {text}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={factorIndexes.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
        />
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
  const [onlyShowUnanswered, setOnlyShowUnanswered] = useState(false)
  // The value of the response given by the user
  const [resp, setResp] = useState(null)
  // cur is only null if decision is not yet specified
  const [cur, setCur] = useState(null)
  const value = resp ?? cur ?? new Answer()

  const numOptions = decision?.options.length ?? 0
  const decisionFactorCount = decision?.factors.names.length ?? 0
  const hasQuizCells = numOptions > 0 && decisionFactorCount > 0
  const traversalFactorIndexes = factorIndexesForMode(
    decision,
    onlyShowUnanswered,
  )
  const numFactors = traversalFactorIndexes.length

  // After we select a decision, initialize cur to the first cell if it's not already set
  if (hasQuizCells && cur == null)
    setCur(() => {
      return copyAnswer(decision.getAnswer(0, 0))
    })

  // keep idx in bounds
  if (idx > 0 && (!numOptions || !numFactors || idx >= numOptions * numFactors))
    setIdx(0)

  // index mapping helpers
  function normalizeIdx(
    localIdx,
    sourceDecision = decision,
    useOnlyShowUnanswered = onlyShowUnanswered,
  ) {
    const sourceNumOptions = sourceDecision?.options.length ?? 0
    const sourceNumFactors = factorIndexesForMode(
      sourceDecision,
      useOnlyShowUnanswered,
    ).length
    const total = sourceNumOptions * sourceNumFactors
    if (!total) return 0
    return ((localIdx % total) + total) % total
  }

  function computeIndex(
    localIdx = idx,
    sourceDecision = decision,
    useOnlyShowUnanswered = onlyShowUnanswered,
  ) {
    const sourceNumOptions = sourceDecision?.options.length ?? 0
    const sourceFactorIndexes = factorIndexesForMode(
      sourceDecision,
      useOnlyShowUnanswered,
    )
    const sourceNumFactors = sourceFactorIndexes.length
    if (!sourceNumOptions || !sourceNumFactors) return [0, 0]

    const normalizedIdx = normalizeIdx(
      localIdx,
      sourceDecision,
      useOnlyShowUnanswered,
    )
    if (TRANSPOSED ? anticolumnar : !anticolumnar) {
      const optionIdx = normalizedIdx % sourceNumOptions
      const factorPosition = Math.floor(normalizedIdx / sourceNumOptions)
      return [optionIdx, sourceFactorIndexes[factorPosition]]
    }
    const optionIdx = Math.floor(normalizedIdx / sourceNumFactors)
    const factorPosition = normalizedIdx % sourceNumFactors
    return [optionIdx, sourceFactorIndexes[factorPosition]]
  }

  function indexToIdx(
    optionIdx,
    factorIdx,
    sourceDecision = decision,
    useOnlyShowUnanswered = onlyShowUnanswered,
  ) {
    const sourceNumOptions = sourceDecision?.options.length ?? 0
    const sourceFactorIndexes = factorIndexesForMode(
      sourceDecision,
      useOnlyShowUnanswered,
    )
    const sourceNumFactors = sourceFactorIndexes.length
    if (!sourceNumOptions || !sourceNumFactors) return 0

    const factorPosition = Math.max(0, sourceFactorIndexes.indexOf(factorIdx))
    if (TRANSPOSED ? anticolumnar : !anticolumnar) {
      return factorPosition * sourceNumOptions + optionIdx
    }
    return optionIdx * sourceNumFactors + factorPosition
  }

  function nextIdxFromCurrent(sourceDecision, delta) {
    const sourceNumOptions = sourceDecision?.options.length ?? 0
    const sourceFactorIndexes = factorIndexesForMode(
      sourceDecision,
      onlyShowUnanswered,
    )
    const sourceNumFactors = sourceFactorIndexes.length
    if (!sourceNumOptions || !sourceNumFactors) return 0

    const currentFactorPosition = sourceFactorIndexes.indexOf(factorIdx)
    if (currentFactorPosition !== -1) {
      return normalizeIdx(
        indexToIdx(optionIdx, factorIdx, sourceDecision) + delta,
        sourceDecision,
      )
    }

    const forwardFactorPosition = sourceFactorIndexes.findIndex(
      (sourceFactorIndex) => sourceFactorIndex > factorIdx,
    )
    const nextFactorPosition =
      forwardFactorPosition === -1 ? 0 : forwardFactorPosition

    if (TRANSPOSED ? anticolumnar : !anticolumnar) {
      return nextFactorPosition * sourceNumOptions
    }

    const nextOptionIdx =
      forwardFactorPosition === -1 ? optionIdx + 1 : optionIdx
    return normalizeIdx(
      nextOptionIdx * sourceNumFactors + nextFactorPosition,
      sourceDecision,
    )
  }

  const [optionIdx, factorIdx] = computeIndex()
  const option = decision?.options[optionIdx] || ""
  const factor = decision?.factors.names[factorIdx] || ""
  const unit = decision?.factors.units[factorIdx] || ""
  const valueLabel = unit || "Value"
  const minLabel = unit ? `Min: ${unit}` : "Min"
  const maxLabel = unit ? `Max: ${unit}` : "Max"
  const suggestedUnitAnswerOptions = getSuggestedUnitAnswerOptions(unit)
  const hasSuggestedUnitButtons = Boolean(suggestedUnitAnswerOptions)
  const scale = [decision?.mins()[factorIdx], decision?.maxs()[factorIdx]]

  function changeCell(
    newIdx,
    sourceDecision = decision,
    useOnlyShowUnanswered = onlyShowUnanswered,
  ) {
    if (
      !sourceDecision?.options.length ||
      !factorIndexesForMode(sourceDecision, useOnlyShowUnanswered).length
    )
      return

    let newIdxValue
    if (typeof newIdx === "function") newIdxValue = newIdx(idx)
    else newIdxValue = newIdx
    const normalizedIdx = normalizeIdx(
      newIdxValue,
      sourceDecision,
      useOnlyShowUnanswered,
    )
    const [newOptionIdx, newFactorIdx] = computeIndex(
      normalizedIdx,
      sourceDecision,
      useOnlyShowUnanswered,
    )
    const newValue = copyAnswer(
      sourceDecision?.getAnswer(newOptionIdx, newFactorIdx),
    )
    setUnsure(newValue.isRanged() ?? false)
    setCur(newValue)
    setResp(null)
    setIdx(normalizedIdx)
  }

  function updateDecision(mutator) {
    const copy = decisions.slice()
    const d = cloneDecision(decision)
    mutator(d)
    copy[selectedIndex] = d
    setDecisions(copy)
    return d
  }

  function handleDeleteAll() {
    if (confirm("Are you sure you want to delete all answers?")) {
      const updatedDecision = updateDecision((d) => d.clearAllAnswers())
      changeCell(0, updatedDecision)
    }
  }

  function handleSubmit(submittedValue = value) {
    const updatedDecision = updateDecision((d) => {
      d.setAnswer(option, factor, submittedValue)
    })
    changeCell(nextIdxFromCurrent(updatedDecision, 1), updatedDecision)
  }

  function handleSuggestedUnitAnswer(answerValue) {
    handleSubmit(new Answer(answerValue, answerValue))
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
  const rangedSliderMarks = [sliderMin, sliderMax].reduce((marks, markValue) => {
    if (!Number.isFinite(markValue)) return marks
    const existingIndex = marks.findIndex((mark) => mark.value === markValue)
    if (existingIndex === -1)
      return [...marks, { value: markValue, label: markValue }]

    return marks.map((mark, index) =>
      index === existingIndex ? { ...mark, label: markValue } : mark,
    )
  }, sliderMarks)

  function handleUnsureChange(event) {
    const isChecked = event.target.checked
    setUnsure(isChecked)
    if (isChecked && !value.isRanged()) setResp(new Answer(scale[0], scale[1]))
  }

  function handleOnlyShowUnansweredChange(event) {
    const isChecked = event.target.checked
    const nextFactorIndexes = factorIndexesForMode(decision, isChecked)
    setOnlyShowUnanswered(isChecked)

    if (!nextFactorIndexes.length) {
      setIdx(0)
      return
    }

    const nextFactorIdx =
      nextFactorIndexes.includes(factorIdx) ? factorIdx : nextFactorIndexes[0]
    changeCell(
      indexToIdx(optionIdx, nextFactorIdx, decision, isChecked),
      decision,
      isChecked,
    )
  }

  const isRespInValid = hasQuizCells ?
    Boolean(value.isInvalid(decision, factor, true))
  : false

  const unfinishedFactors =
    decision?.factors.names.filter((_, i) =>
      decision.isFactorValid(decision.factors.names[i]),
    ) ?? []

  if (!decision) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>Select a decision to take the quiz.</Typography>
      </Box>
    )
  }

  if (!numOptions) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>
          Add an option on the <Link to="/options">Options</Link> page to take
          the quiz.
        </Typography>
      </Box>
    )
  }

  if (!decisionFactorCount) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>
          Add a factor on the <Link to="/factors">Factors</Link> page to take
          the quiz.
        </Typography>
      </Box>
    )
  }

  if (unfinishedFactors.length > 0) {
      return <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>
          There are unfinished factors! We can't decide how good each option is until we know what "good" means.
          <br/>
          Go back to the <Link to="/factors">Factors</Link> page and fill in the red areas first
          <br/>
          <br/>
          The following factors are unfinished:
          <br/>
          {unfinishedFactors.map((n) => <>"{n}"<br/></>)}
          </Typography>
      </Box>
  }

  return <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
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
                  onChange={handleUnsureChange}
                />
              }
              label="I'm not sure"
            />

            <Box sx={{ mt: 2 }}>
              {!unsure ?
                <Box sx={{ px: 2 }}>
                  {hasSuggestedUnitButtons ?
                    <SuggestedUnitAnswerButtons
                      options={suggestedUnitAnswerOptions}
                      value={value}
                      onAnswer={handleSuggestedUnitAnswer}
                    />
                  : <Slider
                      key={`s-${optionIdx}-${factorIdx}`}
                      value={sliderValue}
                      min={scale[0]}
                      max={scale[1]}
                      step={step}
                      onChange={(e, v) => setResp(new Answer(v, v))}
                      marks={sliderMarks}
                    />
                  }
                  <TextField
                    onChange={(e) => {
                      const nextValue = numberOrNull(e.target.value)
                      setResp(new Answer(nextValue, nextValue))
                    }}
                    key={`t-${optionIdx}-${factorIdx}`}
                    value={value.min ?? ""}
                    label={valueLabel}
                    shrink="true"
                    error={isRespInValid}
                  />
                </Box>
              : <Box sx={{ px: 2 }}>
                {/* Still use the slider if we're unsure */}
                  {/* {hasSuggestedUnitButtons ?
                    <SuggestedUnitAnswerButtons
                      options={suggestedUnitAnswerOptions}
                      value={value}
                      onAnswer={handleSuggestedUnitAnswer}
                    /> */}
                  <Slider
                      key={`r-${optionIdx}-${factorIdx}`}
                      value={sliderValue}
                      min={scale[0]}
                      max={scale[1]}
                      step={step}
                      onChange={(e, v) => setResp(new Answer(v[0], v[1]))}
                      marks={rangedSliderMarks}
                    />
                  {/* } */}
                  <span>
                    <TextField
                      onChange={(e) =>
                        setResp(
                          updateAnswerMin(value, numberOrNull(e.target.value)),
                        )
                      }
                      key={`t1-${optionIdx}-${factorIdx}`}
                      value={value.min ?? ""}
                      label={minLabel}
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
                      label={maxLabel}
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
              {!hasSuggestedUnitButtons && (
                <Button variant="contained" onClick={() => handleSubmit()} sx={{ mr: 1 }}>
                  Submit
                </Button>
              )}
              <Button onClick={handleSkip}>Skip</Button>
            </Box>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}>
          <Typography variant="h6">
            Answers - click to jump to an answer
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyShowUnanswered}
                onChange={handleOnlyShowUnansweredChange}
              />
            }
            label="Only Show Unanswered"
          />
        </Box>
        {!TRANSPOSED && <AnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          indexToIdx={indexToIdx}
          onlyShowUnanswered={onlyShowUnanswered}
        />}
        {TRANSPOSED && <TransposedAnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          indexToIdx={indexToIdx}
          onlyShowUnanswered={onlyShowUnanswered}
        />}
      </Box>
}
