import { useEffect, useEffectEvent, useRef, useState, Fragment } from "react"
import DeleteIcon from "@mui/icons-material/Delete"
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
import FormControl from "@mui/material/FormControl"
import InputLabel from "@mui/material/InputLabel"
import MenuItem from "@mui/material/MenuItem"
import Menu from "@mui/material/Menu"
import Select from "@mui/material/Select"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import CloseIcon from "@mui/icons-material/Close"
import FilterListIcon from "@mui/icons-material/FilterList"
import { TextField } from "@mui/material"
import Answer from "../models/Answer"
import { Link, useSearchParams } from "react-router-dom"

const TRANSPOSED = true
const ALL_OPTIONS = ""
const ANSWER_FILTERS = [
  { value: "unanswered", label: "Unanswered" },
  { value: "tentative", label: "Tentative" },
  { value: "range", label: "Range" },
  { value: "invalid", label: "Invalid" },
]
const ANSWER_FILTER_VALUES = new Set(
  ANSWER_FILTERS.map(({ value }) => value),
)

// TODO: negative values don't work well with this right now
// function cloneDecision(decision) {
//   return Decision.deserialize(decision.serialize())
// }

function formatAnswer(cell, factor) {
  if (!cell?.isAnswered()) return ""

  const discreteValues = factor?.discreteValues?.() ?? []
  const formatValue = (value) =>
    discreteValues.find(({ number }) => number === value)?.name ?? value
  const tentativeMarker = cell.isTentative() ? "?" : ""

  if (cell.isRanged())
    return `${formatValue(cell.min)} - ${formatValue(cell.max)}${tentativeMarker}`
  return `${formatValue(cell.min)}${tentativeMarker}`
}

function copyAnswer(answer) {
  return answer?.copy() ?? new Answer()
}

function numberOrNull(value) {
  const normalized = String(value)
    .replaceAll(",", "")
    .replaceAll("$", "")
    .trim()
  if (normalized === "") return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function updateAnswerMin(answer, min) {
  if (min === null) return answer.copy({ min: null, max: null })
  return answer.copy({
    min,
    max: Number.isFinite(answer.max) ? answer.max : min,
  })
}

function updateAnswerMax(answer, max) {
  if (max === null) return answer.copy({ min: null, max: null })
  return answer.copy({
    min: Number.isFinite(answer.min) ? answer.min : max,
    max,
  })
}

function DiscreteAnswerButtons({ options, value, onAnswer }) {
  const selectedValue =
    (
      value.min === value.max &&
      options.some((option) => option.value === value.min)
    ) ?
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
          key={`${option.value}:${option.label}`}
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
  const answer = decision.answers[optionIndex]?.[factorIndex]
  return (
    !answer?.isAnswered() ||
    answer.isTentative() ||
    Boolean(answer.isInvalid(true))
  )
}

function answerMatchesFilters(
  decision,
  optionIndex,
  factorIndex,
  answerFilters,
) {
  const answer = decision.answers[optionIndex]?.[factorIndex]
  return answerFilters.some((filter) => {
    if (filter === "unanswered") return !answer?.isAnswered()
    if (filter === "tentative") return Boolean(answer?.isTentative())
    if (filter === "range") return answer?.isRanged() === true
    if (filter === "invalid") return Boolean(answer?.isInvalid(true))
    return false
  })
}

function factorMatchesFilters(decision, factorIndex, answerFilters) {
  return decision.options.some(
    (option, optionIndex) =>
      !option.hidden &&
      answerMatchesFilters(
        decision,
        optionIndex,
        factorIndex,
        answerFilters,
      ),
  )
}

function optionMatchesFilters(decision, optionIndex, answerFilters) {
  return decision.factors.some((_, factorIndex) =>
    answerMatchesFilters(
      decision,
      optionIndex,
      factorIndex,
      answerFilters,
    ),
  )
}

function optionIndexesForMode(
  decision,
  answerFilters,
  focusedOption = ALL_OPTIONS,
) {
  if (!decision) return []
  return decision.options
    .map((_, index) => index)
    .filter(
      (index) =>
        !decision.options[index].hidden &&
        (!focusedOption || decision.options[index].name === focusedOption) &&
        (!answerFilters.length ||
          optionMatchesFilters(decision, index, answerFilters)),
    )
}

function factorIndexesForMode(
  decision,
  answerFilters,
  factorSearch = "",
  focusedOption = ALL_OPTIONS,
) {
  if (!decision) return []
  const query = factorSearch.trim().toLowerCase()
  const focusedOptionIndex =
    focusedOption ?
      decision.options.findIndex((option) => option.name === focusedOption)
    : -1
  return decision.factors
    .map((_, index) => index)
    .filter(
      (index) =>
        (!query ||
          String(decision.factors[index].name).toLowerCase().includes(query)) &&
        (!answerFilters.length ||
          (focusedOptionIndex === -1 ?
            factorMatchesFilters(decision, index, answerFilters)
          : answerMatchesFilters(
              decision,
              focusedOptionIndex,
              index,
              answerFilters,
            ))),
    )
}

function answerCellSx(isActive, hasProblem, tentative) {
  return {
    cursor: "pointer",
    backgroundColor:
      isActive ? "#bcdaf8"
      : tentative ? "#f6c34499"
      : hasProblem ? "#e02d2d67"
      : "inherit",
  }
}

function AnswersTable({
  decision,
  optionIdx,
  factorIdx,
  changeCell,
  optionIndexes,
  factorIndexes,
}) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const selectedOptionPosition = optionIndexes.indexOf(optionIdx)
  const selectedPage =
    selectedOptionPosition === -1 ? page : (
      Math.floor(selectedOptionPosition / rowsPerPage)
    )
  const selectedPageKey = `${selectedOptionPosition}-${rowsPerPage}`
  const previousSelectedPageKey = useRef(null)
  const maxPage = Math.max(0, Math.ceil(optionIndexes.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const start = safePage * rowsPerPage
  const visibleOptionIndexes = optionIndexes.slice(start, start + rowsPerPage)
  const visibleFactorIndexes = factorIndexes

  useEffect(() => {
    if (selectedOptionPosition === -1) return
    if (previousSelectedPageKey.current === selectedPageKey) return
    previousSelectedPageKey.current = selectedPageKey
    setPage(selectedPage)
  }, [selectedOptionPosition, selectedPage, selectedPageKey])

  return (
    <>
      <Paper sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {visibleFactorIndexes.map((factorIndex) => (
                <TableCell
                  key={factorIndex}
                  sx={{
                    backgroundColor:
                      decision.factors[factorIndex].color ?? undefined,
                  }}>
                  {decision.factors[factorIndex].name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleOptionIndexes.map((r) => {
              const opt = decision.options[r].name
              return (
                <TableRow key={r}>
                  <TableCell
                    sx={{
                      backgroundColor: decision.options[r].color ?? undefined,
                    }}>
                    {opt}
                  </TableCell>
                  {visibleFactorIndexes.map((c) => {
                    const cell = decision.answers[r]?.[c]
                    const text = formatAnswer(cell, decision.factors[c])
                    const isActive = r === optionIdx && c === factorIdx
                    const hasProblem = answerHasProblem(decision, r, c)
                    const tentative = cell?.isTentative()
                    return (
                      <TableCell
                        key={c}
                        onClick={() => changeCell([r, c])}
                        sx={answerCellSx(isActive, hasProblem, tentative)}>
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
          count={optionIndexes.length}
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
  optionIndexes,
  factorIndexes,
}) {
  const activeCellRef = useRef(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const selectedFactorPosition = factorIndexes.indexOf(factorIdx)
  const selectedPage =
    selectedFactorPosition === -1 ? page : (
      Math.floor(selectedFactorPosition / rowsPerPage)
    )
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

  //   Why did I want this??
  //   useEffect(() => {
  //     activeCellRef.current?.scrollIntoView({
  //       block: "nearest",
  //       inline: "nearest",
  //     })
  //   }, [optionIdx, factorIdx, safePage, optionIndexes, factorIndexes])

  return (
    <>
      <Paper sx={{ maxWidth: "100%" }}>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ width: "max-content", minWidth: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    backgroundColor: "background.paper",
                  }}></TableCell>
                {optionIndexes.map((r) => (
                  <TableCell
                    key={r}
                    sx={{
                      whiteSpace: "nowrap",
                      backgroundColor: decision.options[r].color ?? undefined,
                    }}>
                    {decision.options[r].name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleFactorIndexes.map((c) => {
                return (
                  <TableRow key={c}>
                    <TableCell
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 2,
                        backgroundColor:
                          decision.factors[c].color ?? "background.paper",
                      }}>
                      {decision.factors[c].name}
                    </TableCell>
                    {optionIndexes.map((r) => {
                      const cell = decision.answers[r]?.[c]
                      const text = formatAnswer(cell, decision.factors[c])
                      const isActive = r === optionIdx && c === factorIdx
                      const hasProblem = answerHasProblem(decision, r, c)
                      return (
                        <TableCell
                          key={r}
                          ref={isActive ? activeCellRef : null}
                          onClick={() => changeCell([r, c])}
                          sx={answerCellSx(
                            isActive,
                            hasProblem,
                            cell?.isTentative(),
                          )}>
                          {text}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
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
  const { decision, modifyCurrentDecision: updateDecision } = useDecisions()
  const [searchParams, setSearchParams] = useSearchParams()

  // UI state (unconditional hooks)
  const [precise, setPrecise] = useState(false)
  const [unsure, setUnsure] = useState(null)
  const focusedOption = searchParams.get("option") ?? ALL_OPTIONS
  const answerFilters = searchParams
    .getAll("answer")
    .filter(
      (filter, index, filters) =>
        ANSWER_FILTER_VALUES.has(filter) && filters.indexOf(filter) === index,
    )
  const [answerFilterAnchorEl, setAnswerFilterAnchorEl] = useState(null)
  const factorSearch = searchParams.get("factor") ?? ""
  const [selectedCell, setSelectedCell] = useState([0, 0])
  const [history, setHistory] = useState([])
  // The value of the response given by the user
  const [resp, setResp] = useState(null)
  const [valueInputText, setValueInputText] = useState(null)
  const [minInputText, setMinInputText] = useState(null)
  const [maxInputText, setMaxInputText] = useState(null)
  const valueInputRef = useRef(null)

  const visibleOptions = decision?.getVisibleOptions() ?? []
  const decisionOptionCount = visibleOptions.length
  const decisionFactorCount = decision?.factors.length ?? 0
  const activeFocusedOption =
    visibleOptions.some((option) => option.name === focusedOption) ?
      focusedOption
    : ALL_OPTIONS
  const traversalOptionIndexes = optionIndexesForMode(
    decision,
    answerFilters,
    activeFocusedOption,
  )
  const traversalFactorIndexes = factorIndexesForMode(
    decision,
    answerFilters,
    factorSearch,
    activeFocusedOption,
  )
  const hasVisibleQuizCells =
    traversalOptionIndexes.length > 0 && traversalFactorIndexes.length > 0
  const selectedCellIsVisible =
    traversalOptionIndexes.includes(selectedCell[0]) &&
    traversalFactorIndexes.includes(selectedCell[1])
  const [optionIdx, factorIdx] =
    hasVisibleQuizCells && !selectedCellIsVisible ?
      [traversalOptionIndexes[0], traversalFactorIndexes[0]]
    : selectedCell

  const option =
    hasVisibleQuizCells ? decision?.options[optionIdx]?.name || "" : ""
  const factor =
    hasVisibleQuizCells ? decision?.factors[factorIdx]?.name || "" : ""
  const unit =
    hasVisibleQuizCells ? decision?.factors[factorIdx]?.unit || "" : ""
  const factorDefinition =
    hasVisibleQuizCells ? decision?.factors[factorIdx] : null
  const optionDefinition =
    hasVisibleQuizCells ? decision?.options[optionIdx] : null
  const currentAnswer =
    hasVisibleQuizCells ?
      copyAnswer(decision.getAnswer(optionIdx, factorIdx))
    : new Answer()
  const value = resp ?? currentAnswer
  const isUnsure = unsure ?? currentAnswer.isRanged() ?? false
  const valueLabel = unit || "Value"
  const minLabel = unit ? `Min: ${unit}` : "Min"
  const maxLabel = unit ? `Max: ${unit}` : "Max"
  const discreteAnswerOptions =
    factorDefinition?.isDiscrete() ?
      factorDefinition.discreteValues().map(({ number, name }) => ({
        label: name,
        value: number,
      }))
    : null
  const hasDiscreteButtons = Boolean(discreteAnswerOptions)
  const factorAnswers =
    hasVisibleQuizCells ?
      decision.answers
        .filter((_, index) => !decision.options[index].hidden)
        .map((row) => row[factorIdx])
    : []
  const scale =
    hasVisibleQuizCells ? factorDefinition.practicalRange(factorAnswers)
    : [null, null]
  const hasSliderScale = factorDefinition?.isFinite(factorAnswers) ?? false

  function focusValueInput() {
    requestAnimationFrame(() => valueInputRef.current?.focus())
  }

  function clearInputText() {
    setValueInputText(null)
    setMinInputText(null)
    setMaxInputText(null)
  }

  function setAnswerResponse(answer) {
    clearInputText()
    setResp(answer)
  }

  function changeCell(
    newCell,
    sourceDecision = decision,
    remember = true,
    dontFocus = false,
  ) {
    if (!dontFocus) {
      focusValueInput()
    }
    if (!newCell) return
    const [newOptionIdx, newFactorIdx] = newCell
    if (
      !sourceDecision ||
      newOptionIdx < 0 ||
      newOptionIdx >= sourceDecision.options.length ||
      newFactorIdx < 0 ||
      newFactorIdx >= sourceDecision.factors.length
    )
      return
    if (remember && (newOptionIdx !== optionIdx || newFactorIdx !== factorIdx))
      setHistory((previous) => [...previous, [optionIdx, factorIdx]])
    const newValue = copyAnswer(
      sourceDecision?.getAnswer(newOptionIdx, newFactorIdx),
    )
    setUnsure(newValue.isRanged() ?? false)
    clearInputText()
    setResp(null)
    setSelectedCell([newOptionIdx, newFactorIdx])
  }

  function getNextRelevantAnswer(
    currentlySelected,
    ignoredFactors,
    ignoredOptions,
    sourceDecision = decision,
  ) {
    const ignoredFactorSet = new Set(ignoredFactors)
    const ignoredOptionSet = new Set(ignoredOptions)
    const coordinates = sourceDecision.factors.flatMap((_, sourceFactorIndex) =>
      sourceDecision.options.map((__, sourceOptionIndex) => [
        sourceOptionIndex,
        sourceFactorIndex,
      ]),
    )
    const currentPosition = coordinates.findIndex(
      ([sourceOptionIndex, sourceFactorIndex]) =>
        sourceOptionIndex === currentlySelected[0] &&
        sourceFactorIndex === currentlySelected[1],
    )

    for (let offset = 1; offset <= coordinates.length; offset += 1) {
      const position =
        (Math.max(currentPosition, -1) + offset) % coordinates.length
      const [sourceOptionIndex, sourceFactorIndex] = coordinates[position]
      if (
        !ignoredOptionSet.has(sourceOptionIndex) &&
        !ignoredFactorSet.has(sourceFactorIndex) &&
        (answerFilters.length ?
          answerMatchesFilters(
            sourceDecision,
            sourceOptionIndex,
            sourceFactorIndex,
            answerFilters,
          )
        : answerHasProblem(
            sourceDecision,
            sourceOptionIndex,
            sourceFactorIndex,
          ))
      )
        return [sourceOptionIndex, sourceFactorIndex]
    }
    return null
  }

  function visibleIndexes(
    sourceDecision = decision,
    nextAnswerFilters = answerFilters,
    nextFactorSearch = factorSearch,
    nextFocusedOption = activeFocusedOption,
  ) {
    return [
      optionIndexesForMode(
        sourceDecision,
        nextAnswerFilters,
        nextFocusedOption,
      ),
      factorIndexesForMode(
        sourceDecision,
        nextAnswerFilters,
        nextFactorSearch,
        nextFocusedOption,
      ),
    ]
  }

  function ignoredIndexes(sourceDecision = decision) {
    const [visibleOptions, visibleFactors] = visibleIndexes(sourceDecision)
    return [
      sourceDecision.factors
        .map((_, index) => index)
        .filter((index) => !visibleFactors.includes(index)),
      sourceDecision.options
        .map((_, index) => index)
        .filter((index) => !visibleOptions.includes(index)),
    ]
  }

  function handleDeleteAll() {
    if (confirm("Are you sure you want to delete all answers?")) {
      const updatedDecision = updateDecision((d) => d.clearAllAnswers())
      setHistory([])
      const [visibleOptions, visibleFactors] = visibleIndexes(updatedDecision)
      changeCell(
        visibleOptions.length && visibleFactors.length ?
          [visibleOptions[0], visibleFactors[0]]
        : null,
        updatedDecision,
        false,
      )
    }
  }

  function handleSubmit(submittedValue = value) {
    const updatedDecision = updateDecision((d) => {
      d.setAnswer(option, factor, submittedValue)
    })
    const [ignoredFactors, ignoredOptions] = ignoredIndexes(updatedDecision)
    changeCell(
      getNextRelevantAnswer(
        [optionIdx, factorIdx],
        ignoredFactors,
        ignoredOptions,
        updatedDecision,
      ),
      updatedDecision,
    )
  }

  function handleDiscreteAnswer(answerValue) {
    handleSubmit(value.copy({ min: answerValue, max: answerValue }))
  }

  function handleSkip() {
    const [ignoredFactors, ignoredOptions] = ignoredIndexes()
    changeCell(
      getNextRelevantAnswer(
        [optionIdx, factorIdx],
        ignoredFactors,
        ignoredOptions,
      ),
    )
  }

  function handleBack() {
    const previousCell = history.at(-1)
    setHistory(history.slice(0, -1))
    changeCell(previousCell, decision, false)
  }

  function handleClearAnswer() {
    const updatedDecision = updateDecision((d) => {
      d.setAnswer(
        option,
        factor,
        value.copy({ min: null, max: null, tentative: false }),
      )
    })
    changeCell([optionIdx, factorIdx], updatedDecision, false)
  }

  const submitOnEnter = useEffectEvent(() => {
    if (hasVisibleQuizCells) handleSubmit()
  })

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Enter" || event.repeat || event.isComposing) return
      event.preventDefault()
      submitOnEnter()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const step = precise ? 0.1 : 1
  const sliderMin = Number.isFinite(value.min) ? value.min : scale[0]
  const sliderMax = Number.isFinite(value.max) ? value.max : sliderMin
  const sliderValue = isUnsure ? [sliderMin, sliderMax] : sliderMin
  const sliderMarks = [
    {
      value: scale[0],
      label: factorDefinition?.min == null ? "−∞" : scale[0],
    },
    {
      value: scale[1],
      label: factorDefinition?.max == null ? "∞" : scale[1],
    },
  ]
  const rangedSliderMarks = [sliderMin, sliderMax].reduce(
    (marks, markValue) => {
      if (!Number.isFinite(markValue)) return marks
      const existingIndex = marks.findIndex((mark) => mark.value === markValue)
      if (existingIndex === -1)
        return [...marks, { value: markValue, label: markValue }]

      return marks.map((mark, index) => {
        if (index !== existingIndex) return mark
        if (mark.label === "−∞" || mark.label === "∞") return mark
        return { ...mark, label: markValue }
      })
    },
    sliderMarks,
  )

  function handleUnsureChange(event) {
    const isChecked = event.target.checked
    setUnsure(isChecked)
    if (isChecked && !value.isRanged() && hasSliderScale)
      setAnswerResponse(value.copy({ min: scale[0], max: scale[1] }))
  }

  function handleTentativeChange(event) {
    setResp(value.copy({ tentative: event.target.checked }))
    focusValueInput()
  }

  function changeFilters(
    nextAnswerFilters,
    nextFactorSearch,
    nextFocusedOption = activeFocusedOption,
    dontFocus = false,
  ) {
    const nextOptionIndexes = optionIndexesForMode(
      decision,
      nextAnswerFilters,
      nextFocusedOption,
    )
    const nextFactorIndexes = factorIndexesForMode(
      decision,
      nextAnswerFilters,
      nextFactorSearch,
      nextFocusedOption,
    )

    if (!nextOptionIndexes.length || !nextFactorIndexes.length) return

    const nextOptionIdx =
      nextOptionIndexes.includes(optionIdx) ? optionIdx : nextOptionIndexes[0]
    const nextFactorIdx =
      nextFactorIndexes.includes(factorIdx) ? factorIdx : nextFactorIndexes[0]
    const visibleCell = ([sourceOptionIndex, sourceFactorIndex]) =>
      nextOptionIndexes.includes(sourceOptionIndex) &&
      nextFactorIndexes.includes(sourceFactorIndex)
    setHistory((previous) => previous.filter(visibleCell))
    changeCell([nextOptionIdx, nextFactorIdx], decision, false, dontFocus)
  }

  function changeAnswerFilters(nextAnswerFilters) {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.delete("answer")
    for (const filter of nextAnswerFilters)
      nextSearchParams.append("answer", filter)
    setSearchParams(nextSearchParams, { replace: true })
    changeFilters(nextAnswerFilters, factorSearch, activeFocusedOption, true)
  }

  function toggleAnswerFilter(filter) {
    const nextAnswerFilters =
      answerFilters.includes(filter) ?
        answerFilters.filter((current) => current !== filter)
      : [...answerFilters, filter]
    changeAnswerFilters(nextAnswerFilters)
  }

  function handleFactorSearchChange(event) {
    const nextFactorSearch = event.target.value
    changeFactorSearch(nextFactorSearch, true)
  }

  function changeFactorSearch(nextFactorSearch, dontFocus = false) {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextFactorSearch) nextSearchParams.set("factor", nextFactorSearch)
    else nextSearchParams.delete("factor")
    setSearchParams(nextSearchParams, { replace: true })
    changeFilters(
      answerFilters,
      nextFactorSearch,
      activeFocusedOption,
      dontFocus,
    )
  }

  function handleFocusedOptionChange(event) {
    const nextFocusedOption = event.target.value
    const nextSearchParams = new URLSearchParams(searchParams)
    if (nextFocusedOption) nextSearchParams.set("option", nextFocusedOption)
    else nextSearchParams.delete("option")
    setSearchParams(nextSearchParams, { replace: true })
    setHistory([])
    changeFilters(answerFilters, factorSearch, nextFocusedOption)
  }

  const isRespInValid =
    hasVisibleQuizCells ? Boolean(value.isInvalid(true)) : false

  const unfinishedFactors =
    decision?.factors
      .filter((_, i) => decision.isFactorValid(i))
      .map((factor) => factor.name) ?? []

  if (!decision) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>Select a decision to take the quiz.</Typography>
      </Box>
    )
  }

  if (!decisionOptionCount) {
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>
          Add or show an option on the <Link to="/options">Options</Link> page
          to take the quiz.
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
    return (
      <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
        <Typography variant="h4">Quiz</Typography>
        <Typography>
          There are unfinished factors! We can't decide how good each option is
          until we know what "good" means.
          <br />
          Go back to the <Link to="/factors">Factors</Link> page and fill in the
          red areas first
          <br />
          <br />
          The following factors are unfinished:
          <br />
          {unfinishedFactors.map((n) => (
            <Fragment key={n}>
              "{n}"<br />
            </Fragment>
          ))}
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0, p: 2 }}>
      {/* Top stuff */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}>
        <Typography variant="h4">Quiz</Typography>
      </Box>

      {/* Quiz controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="focus-option-label">Focus option</InputLabel>
          <Select
            labelId="focus-option-label"
            value={activeFocusedOption}
            label="Focus option"
            onChange={handleFocusedOptionChange}>
            <MenuItem value={ALL_OPTIONS}>All</MenuItem>
            {visibleOptions.map((option) => (
              <MenuItem key={option.name} value={option.name}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
      {hasVisibleQuizCells ?
        <Card sx={{ mb: 2 }}>
          <CardContent>
            {factor ?
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  mb: 1,
                  width: "100%",
                  alignItems: "center",
                }}>
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    backgroundColor: factorDefinition?.color ?? undefined,
                    px: 0.5,
                    borderRadius: 1,
                  }}>
                  {factor}
                </Typography>
                :
                <Typography
                  variant="h6"
                  component="span"
                  sx={{
                    ml: 1,
                    backgroundColor: optionDefinition?.color ?? undefined,
                    px: 0.5,
                    borderRadius: 1,
                  }}>
                  {option}
                </Typography>
              </Box>
            : <Typography variant="h6">Choose a factor/option</Typography>}

            <FormControlLabel
              control={
                <Checkbox checked={isUnsure} onChange={handleUnsureChange} />
              }
              label="I'm not sure"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.tentative}
                  onChange={handleTentativeChange}
                />
              }
              label="Tentative"
            />

            <Box sx={{ mt: 2 }}>
              {!isUnsure ?
                <Box sx={{ px: 2 }}>
                  {hasDiscreteButtons ?
                    <DiscreteAnswerButtons
                      options={discreteAnswerOptions}
                      value={value}
                      onAnswer={handleDiscreteAnswer}
                    />
                  : hasSliderScale ?
                    <Slider
                      key={`s-${optionIdx}-${factorIdx}`}
                      value={sliderValue}
                      min={scale[0]}
                      max={scale[1]}
                      step={step}
                      onChange={(e, v) =>
                        setAnswerResponse(value.copy({ min: v, max: v }))
                      }
                      marks={sliderMarks}
                    />
                  : <Typography variant="body2" sx={{ mb: 2 }}>
                      Enter a value below. A slider is available once this
                      factor has a finite range.
                    </Typography>
                  }
                  <TextField
                    onChange={(e) => {
                      setValueInputText(e.target.value)
                      const nextValue = numberOrNull(e.target.value)
                      setResp(value.copy({ min: nextValue, max: nextValue }))
                    }}
                    key={`t-${optionIdx}-${factorIdx}`}
                    value={valueInputText ?? value.min ?? ""}
                    inputRef={valueInputRef}
                    autoFocus
                    label={valueLabel}
                    shrink="true"
                    error={isRespInValid}
                  />
                </Box>
              : <Box sx={{ px: 2 }}>
                  {/* Still use the slider if we're unsure */}
                  {/* {hasDiscreteButtons ?
                    <DiscreteAnswerButtons
                      options={discreteAnswerOptions}
                      value={value}
                      onAnswer={handleDiscreteAnswer}
                    /> */}
                  {hasSliderScale ?
                    <Slider
                      key={`r-${optionIdx}-${factorIdx}`}
                      value={sliderValue}
                      min={scale[0]}
                      max={scale[1]}
                      step={step}
                      onChange={(e, v) =>
                        setAnswerResponse(value.copy({ min: v[0], max: v[1] }))
                      }
                      marks={rangedSliderMarks}
                    />
                  : <Typography variant="body2" sx={{ mb: 2 }}>
                      Enter the range below. A slider is available once this
                      factor has a finite range.
                    </Typography>
                  }
                  {/* } */}
                  <span>
                    <TextField
                      onChange={(e) => {
                        setMinInputText(e.target.value)
                        setResp(
                          updateAnswerMin(value, numberOrNull(e.target.value)),
                        )
                      }}
                      key={`t1-${optionIdx}-${factorIdx}`}
                      value={minInputText ?? value.min ?? ""}
                      inputRef={valueInputRef}
                      autoFocus
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
                      onChange={(e) => {
                        setMaxInputText(e.target.value)
                        setResp(
                          updateAnswerMax(value, numberOrNull(e.target.value)),
                        )
                      }}
                      key={`t2-${optionIdx}-${factorIdx}`}
                      value={maxInputText ?? value.max ?? ""}
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
              {currentAnswer.isAnswered() && (
                <Button onClick={handleClearAnswer} sx={{ mr: 1 }}>
                  Clear Answer
                </Button>
              )}
              <Button
                onClick={handleBack}
                disabled={!history.length}
                sx={{ mr: 1 }}>
                Back
              </Button>
              {(!hasDiscreteButtons || isUnsure) && (
                <Button
                  variant="contained"
                  onClick={() => handleSubmit()}
                  sx={{ mr: 1 }}>
                  Submit
                </Button>
              )}
              <Button onClick={handleSkip}>Skip</Button>
            </Box>
          </CardContent>
        </Card>
      : <Paper sx={{ p: 2, mb: 2 }}>
          <Typography>
            No options or factors match the current filters.
          </Typography>
        </Paper>
      }

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}>
        <Typography variant="h6">Answers</Typography>
        <TextField
          label="Search by factor"
          size="small"
          value={factorSearch}
          onChange={handleFactorSearchChange}
          slotProps={{
            input: {
              endAdornment:
                factorSearch ?
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear factor search"
                      onClick={() => changeFactorSearch("")}
                      edge="end">
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                : null,
            },
          }}
          sx={{ flex: 1, maxWidth: 400, mx: 2 }}
        />
        <Button
          variant={answerFilters.length ? "contained" : "outlined"}
          size="small"
          startIcon={<FilterListIcon />}
          onClick={(event) => setAnswerFilterAnchorEl(event.currentTarget)}
          aria-haspopup="true"
          aria-expanded={Boolean(answerFilterAnchorEl)}>
          Answer filters
          {answerFilters.length ? ` (${answerFilters.length})` : ""}
        </Button>
        <Menu
          anchorEl={answerFilterAnchorEl}
          open={Boolean(answerFilterAnchorEl)}
          onClose={() => setAnswerFilterAnchorEl(null)}>
          {ANSWER_FILTERS.map(({ value: filter, label }) => (
            <MenuItem key={filter} onClick={() => toggleAnswerFilter(filter)}>
              <Checkbox
                size="small"
                checked={answerFilters.includes(filter)}
                tabIndex={-1}
                disableRipple
              />
              {label}
            </MenuItem>
          ))}
          <MenuItem
            disabled={!answerFilters.length}
            onClick={() => changeAnswerFilters([])}>
            Clear filters
          </MenuItem>
        </Menu>
      </Box>
      {!TRANSPOSED && (
        <AnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          optionIndexes={traversalOptionIndexes}
          factorIndexes={traversalFactorIndexes}
        />
      )}
      {TRANSPOSED && (
        <TransposedAnswersTable
          decision={decision}
          optionIdx={optionIdx}
          factorIdx={factorIdx}
          changeCell={changeCell}
          optionIndexes={traversalOptionIndexes}
          factorIndexes={traversalFactorIndexes}
        />
      )}
      <Box sx={{ mt: 2, display: "flex" }}>
        <Button
          variant="text"
          color="error"
          onClick={handleDeleteAll}
          startIcon={<DeleteIcon />}>
          Clear All Answers
        </Button>
      </Box>
    </Box>
  )
}
