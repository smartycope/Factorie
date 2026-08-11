import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Slider from "@mui/material/Slider"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import DeleteIcon from "@mui/icons-material/Delete"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
import VerticalAlignBottomIcon from "@mui/icons-material/VerticalAlignBottom"
import VerticalAlignTopIcon from "@mui/icons-material/VerticalAlignTop"
import CloseIcon from "@mui/icons-material/Close"
import InputAdornment from "@mui/material/InputAdornment"
// Select/MenuItem not needed anymore
import Paper from "@mui/material/Paper"
import Tooltip from "@mui/material/Tooltip"
import { DataGrid } from "@mui/x-data-grid"
import { useDecisions } from "../contexts/UseDecisions"
import HelpOverlay from "../components/HelpOverlay"
import { getSuggestedUnitMinMax, SUGGESTED_UNITS } from "../suggestedUnits"
// import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlinedIcon';

import texts from "../assets/texts.json"
import Stack from "@mui/material/Stack"
import ColorSelector from "../components/ColorSelector"

// TODO: a place (on this page? New page?) that asks the user what the optimal value is for each factor that doesn't have one set yet

const DEFAULTS = {
  name: "",
  unit: "",
  optimal: null,
  weight: 0.0,
  minUnbounded: false,
  maxUnbounded: false,
  min: null,
  max: null,
  color: null,
}

function factorNameText(value) {
  if (typeof value === "string") return value
  if (value && typeof value === "object") return value.name ?? ""
  return value ?? ""
}

function factorMatchesSearch(name, searchQuery = "") {
  const query = searchQuery.trim().toLowerCase()
  return !query || factorNameText(name).toLowerCase().includes(query)
}

function factorRows(decision) {
  return decision.factors.map((factor, i) => {
    const factorName = factorNameText(factor.name)
    const discreteOptimalLabel = factor
      .discreteValues?.()
      .find(({ number }) => number === factor.optimal)?.name
    return {
      id: i,
      index: i,
      name: factorName,
      unit: factor.unit ?? "",
      optimal: factor.optimal,
      discreteOptimalLabel,
      weight: factor.weight,
      min: factor.min,
      max: factor.max,
      color: factor.color,
    }
  })
}

function isFactorRowUnfinished(row, decision) {
  return (
    !row.name ||
    !row.unit ||
    row.optimal === null ||
    row.optimal === "" ||
    row.weight === null ||
    row.weight === "" ||
    !Number.isFinite(row.weight) ||
    Boolean(decision?.isFactorValid(row.index))
  )
}

function FactorNameText({ value }) {
  const isUnnamed = !value
  return (
    <Typography
      component="span"
      variant="body2"
      sx={{
        color: isUnnamed ? "text.disabled" : "text.primary",
        fontStyle: isUnnamed ? "italic" : "normal",
        lineHeight: 1.3,
        overflowWrap: "anywhere",
        whiteSpace: "normal",
      }}>
      {isUnnamed ? "unnamed" : value}
    </Typography>
  )
}

function SortableFactor({ factorIndex, name, position, count, onMove, color=null }) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: factorIndex })

  const moveButton = (label, targetPosition, disabled, icon) => (
    <Tooltip title={label}>
      <span>
        <IconButton
          size="small"
          aria-label={label}
          disabled={disabled}
          onClick={() => onMove(position, targetPosition)}>
          {icon}
        </IconButton>
      </span>
    </Tooltip>
  )

  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        zIndex: isDragging ? 1 : "auto",
        opacity: isDragging ? 0.55 : 1,
        backgroundColor: color,
      }}>
      <IconButton
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        size="small"
        aria-label={`Drag to reorder ${name}`}
        title={`Drag to reorder ${name}`}
        sx={{
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}>
        <DragIndicatorIcon color="action" />
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FactorNameText value={name} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {moveButton(
          `Move ${name} to top`,
          0,
          position === 0,
          <VerticalAlignTopIcon />,
        )}
        {moveButton(
          `Move ${name} up`,
          position - 1,
          position === 0,
          <KeyboardArrowUpIcon />,
        )}
        {moveButton(
          `Move ${name} down`,
          position + 1,
          position === count - 1,
          <KeyboardArrowDownIcon />,
        )}
        {moveButton(
          `Move ${name} to bottom`,
          count - 1,
          position === count - 1,
          <VerticalAlignBottomIcon />,
        )}
      </Box>
    </Paper>
  )
}

const factorsDataGridInitialState = {
  pagination: { paginationModel: { page: 0, pageSize: 10 } },
  pinnedColumns: { left: ["delete", "name"] },
}

const getAutoRowHeight = () => "auto"

const factorsDataGridSx = (theme) => ({
  "& .pinned-column": {
    backgroundColor: "rgba(15, 23, 42, 0.06)",
  },
  "& .MuiDataGrid-columnHeader.pinned-column": {
    backgroundColor: "rgba(15, 23, 42, 0.1)",
  },
  "& .MuiDataGrid-pinnedColumns, & .MuiDataGrid-pinnedColumnHeaders": {
    backgroundColor: "rgba(15, 23, 42, 0.06)",
  },
  "& .MuiDataGrid-cell.invalid-cell": {
    backgroundColor: "rgba(247, 82, 82, 0.41)",
  },
  "& .MuiDataGrid-cell.pinned-column": {
    alignItems: "flex-start",
    py: 1,
  },
  "& .selected-factor-row": {
    backgroundColor: theme.palette.action.selected,
  },
  "& .selected-factor-row:hover": {
    backgroundColor: theme.palette.action.hover,
  },
})

const FactorsDataGrid = React.memo(function FactorsDataGrid({
  decision,
  editFactorIndex,
  setEditFactorIndex,
  handleRemove,
  showOnlyUnfinished,
  factorSearch,
}) {
  const rows = useMemo(
    () =>
      factorRows(decision).filter(
        (row) =>
          factorMatchesSearch(row.name, factorSearch) &&
          (!showOnlyUnfinished || isFactorRowUnfinished(row, decision)),
      ),
    [decision, factorSearch, showOnlyUnfinished],
  )
  const handleRowClick = useCallback(
    (params) => setEditFactorIndex(params.row.index),
    [setEditFactorIndex],
  )
  const getRowClassName = useCallback(
    (params) =>
      [
        params.row.index === editFactorIndex ? "selected-factor-row" : "",
        params.row.color ? `factor-color-${params.row.index}` : "",
      ].filter(Boolean).join(" "),
    [editFactorIndex],
  )
  const columns = useMemo(
    () => [
      {
        field: "delete",
        headerName: "",
        sortable: false,
        filterable: false,
        width: 56,
        headerClassName: "pinned-column",
        cellClassName: "pinned-column",
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(params.row.index)
            }}
            title="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      },
      {
        field: "name",
        headerName: "Name",
        width: 180,
        sortable: true,
        headerClassName: "pinned-column",
        cellClassName: (params) =>
          (params.value ? "" : "invalid-cell") + " pinned-column",
        renderCell: (params) => <FactorNameText value={params.value} />,
      },
      {
        field: "unit",
        headerName: "Unit",
        width: 80,
        sortable: false,
        cellClassName: (params) => (params.value ? "" : "invalid-cell"),
        renderCell: (params) => params.value || "",
      },
      {
        field: "optimal",
        headerName: "Optimal",
        width: 90,
        sortable: false,
        cellClassName: (params) =>
          params.value !== null && params.value !== "" ? "" : "invalid-cell",
        renderCell: (params) =>
          params.value === -Infinity ? "min"
          : params.value === Infinity ? "max"
          : (params.row.discreteOptimalLabel ?? params.value ?? ""),
      },
      {
        field: "weight",
        headerName: "Weight",
        width: 80,
        sortable: true,
        cellClassName: (params) =>
          params.value !== null && params.value !== "" ? "" : "invalid-cell",
        renderCell: (params) =>
          Number.isFinite(params.value) ?
            `${(params.value * 100).toFixed(0)}%`
          : "",
      },
      {
        field: "min",
        headerName: "Min",
        width: 90,
        sortable: false,
        renderCell: (params) =>
          params.value == null ? "calculated" : String(params.value),
      },
      {
        field: "max",
        headerName: "Max",
        width: 90,
        sortable: false,
        renderCell: (params) =>
          params.value == null ? "calculated" : String(params.value),
      },
    ],
    [handleRemove],
  )

  return (
    <Paper
      sx={{
        mt: 1,
        height: "calc(100vh - 230px)",
        minHeight: 300,
        minWidth: 0,
      }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableColumnMenu
        disableRowSelectionOnClick={false}
        // hideFooter
        getRowHeight={getAutoRowHeight}
        initialState={factorsDataGridInitialState}
        onRowClick={handleRowClick}
        getRowClassName={getRowClassName}
        sx={(theme) => ({
          ...factorsDataGridSx(theme),
          ...Object.fromEntries(
            rows
              .filter((row) => row.color)
              .map((row) => [
                `& .MuiDataGrid-row.factor-color-${row.index} .MuiDataGrid-cell[data-field="name"]`,
                { backgroundColor: row.color },
              ]),
          ),
        })}
      />
    </Paper>
  )
})

export default function Factors() {
  const {
    decisions,
    selectedIndex,
    editFactor,
    addFactor,
    removeFactor,
    reorderFactors,
  } = useDecisions()
  const decision = selectedIndex != null ? decisions[selectedIndex] : null
  const [addError, setAddError] = useState("")

  // Add form state
  const [addName, setAddName] = useState(DEFAULTS.name)
  const [addUnit, setAddUnit] = useState(DEFAULTS.unit)
  const [addOptimal, setAddOptimal] = useState(DEFAULTS.optimal)
  const [addWeight, setAddWeight] = useState(DEFAULTS.weight)
  const [addMinUnbounded, setAddMinUnbounded] = useState(DEFAULTS.minUnbounded)
  const [addMaxUnbounded, setAddMaxUnbounded] = useState(DEFAULTS.maxUnbounded)
  const [addMin, setAddMin] = useState(DEFAULTS.min)
  const [addMax, setAddMax] = useState(DEFAULTS.max)
  const [addColor, setAddColor] = useState(DEFAULTS.color)

  // Edit state tracks which factor (by index) is being modified. We reuse the add form fields while editing.
  const [editFactorIndex, setEditFactorIndex] = useState(null)
  const [clearExistingAnswersOverride, setClearExistingAnswersOverride] =
    useState(null)
  const [markExistingAnswersTentative, setMarkExistingAnswersTentative] =
    useState(false)
  const [showOnlyUnfinished, setShowOnlyUnfinished] = useState(false)
  const [factorSearch, setFactorSearch] = useState("")
  const [unitMenuAnchorEl, setUnitMenuAnchorEl] = useState(null)
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false)
  const [factorOrder, setFactorOrder] = useState([])
  const reorderSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const unitMenuOpen = Boolean(unitMenuAnchorEl)
  const weightComparisons = useMemo(() => {
    const otherFactors =
      decision?.factors
        .map((factor, index) => ({
          index,
          name: factorNameText(factor.name),
          weight: factor.weight,
        }))
        .filter(
          (factor) =>
            factor.index !== editFactorIndex &&
            factor.name &&
            Number.isFinite(factor.weight),
        ) ?? []

    return {
      below: otherFactors
        .filter((factor) => factor.weight < addWeight)
        .sort((a, b) => a.weight - b.weight)
        .at(-1)?.name,
      above: otherFactors
        .filter((factor) => factor.weight > addWeight)
        .sort((a, b) => a.weight - b.weight)
        .at(0)?.name,
    }
  }, [addWeight, decision, editFactorIndex])
  const editedFactor = decision?.factors[editFactorIndex] ?? null
  const editedMin =
    addMinUnbounded || !Number.isFinite(Number(addMin)) ? null : Number(addMin)
  const editedMax =
    addMaxUnbounded || !Number.isFinite(Number(addMax)) ? null : Number(addMax)
  const factorScaleChanged = Boolean(
    editedFactor &&
      (addUnit !== (editedFactor.unit ?? "") ||
        editedMin !== editedFactor.min ||
        editedMax !== editedFactor.max),
  )
  const clearExistingAnswers =
    clearExistingAnswersOverride ?? factorScaleChanged

  const resetFormFields = useCallback(() => {
    setAddName(DEFAULTS.name)
    setAddUnit(DEFAULTS.unit)
    setAddOptimal(DEFAULTS.optimal)
    setAddWeight(DEFAULTS.weight)
    setAddMinUnbounded(DEFAULTS.minUnbounded)
    setAddMaxUnbounded(DEFAULTS.maxUnbounded)
    setAddMin(DEFAULTS.min)
    setAddMax(DEFAULTS.max)
    setAddColor(DEFAULTS.color)
    setClearExistingAnswersOverride(null)
    setMarkExistingAnswersTentative(false)
  }, [])

  useEffect(() => {
    // when decision changes, reset forms (scheduled to avoid sync setState in effect)
    const t = setTimeout(() => {
      resetFormFields()

      setEditFactorIndex(null)
      setAddError("")
    }, 0)
    return () => clearTimeout(t)
  }, [selectedIndex, resetFormFields])

  function beginEditingFactor(index) {
    const factor = decision?.factors[index]
    if (!factor) return
    setEditFactorIndex(index)
    setAddName(factorNameText(factor.name) || DEFAULTS.name)
    setAddUnit(factor.unit ?? DEFAULTS.unit)
    setAddOptimal(factor.optimal ?? DEFAULTS.optimal)
    setAddWeight(
      Number.isFinite(factor.weight) ? factor.weight : DEFAULTS.weight,
    )
    setAddMinUnbounded(factor.min == null)
    setAddMaxUnbounded(factor.max == null)
    setAddMin(factor.min ?? DEFAULTS.min)
    setAddMax(factor.max ?? DEFAULTS.max)
    setAddColor(factor.color ?? DEFAULTS.color)
    setClearExistingAnswersOverride(null)
    setMarkExistingAnswersTentative(false)
  }

  function handleColorChange(color) {
    setAddColor(color)
    if (editFactorIndex != null)
      editFactor(editFactorIndex, { color })
  }

  function isFormInvalid() {
    if (!factorNameText(addName).trim()) {
      return "Factor name is required"
    }
    // Validate min/max
    if (
      !addMinUnbounded &&
      !addMaxUnbounded &&
      addMin !== null &&
      addMax !== null &&
      Number(addMin) >= Number(addMax)
    ) {
      return "Min must be less than Max"
    }
    // Optimal must be between min and max, if provided and bounded
    if (
      !addMinUnbounded &&
      !addMaxUnbounded &&
      addOptimal !== Infinity &&
      addOptimal !== -Infinity &&
      addOptimal !== null &&
      addOptimal !== "" &&
      (addOptimal < Number(addMin) || addOptimal > Number(addMax))
    )
      return "Optimal must be between Min and Max, or leave blank to finish later"
    // Reset error
    return null
  }

  // Handles either add or modify, as appropriate
  function handleUpsert() {
    const nextName = factorNameText(addName).trim()
    // validate name
    const error = isFormInvalid()
    if (error) {
      setAddError(error)
      return
    }
    setAddError("")

    // Reset all the the form fields
    resetFormFields()

    const newFactor = {
      name: nextName,
      optimal:
        addOptimal === Infinity || addOptimal === -Infinity ? addOptimal
        : Number.isFinite(addOptimal) ? Number(addOptimal)
        : undefined,
      weight: Number(addWeight),
      min:
        addMinUnbounded || !Number.isFinite(Number(addMin)) ?
          null
        : Number(addMin),
      max:
        addMaxUnbounded || !Number.isFinite(Number(addMax)) ?
          null
        : Number(addMax),
      unit: editFactorIndex != null ? addUnit : addUnit || undefined,
      color: addColor,
    }

    if (editFactorIndex != null) {
      // modify existing factor, including the name
      editFactor(
        editFactorIndex,
        newFactor,
        clearExistingAnswers,
        markExistingAnswersTentative,
      )
      // exit edit mode
      setEditFactorIndex(null)
      // reset add form
      resetFormFields()
    } else {
      // normal add
      addFactor(newFactor)
      // clear name
      setAddName("")
    }
  }

  const handleRemove = useCallback(
    (factorToRemove) => {
      removeFactor(factorToRemove)
      if (editFactorIndex === factorToRemove) {
        setEditFactorIndex(null)
        resetFormFields()
      }
    },
    [editFactorIndex, removeFactor, resetFormFields],
  )

  function handleSuggestedUnit(unit) {
    setAddUnit(unit)
    const [min, max] = getSuggestedUnitMinMax(unit)
    setAddMin(min)
    setAddMax(max)
    setAddMinUnbounded(false)
    setAddMaxUnbounded(false)
    setUnitMenuAnchorEl(null)
  }

  function openReorderDialog() {
    setFactorOrder(decision.factors.map((_, index) => index))
    setReorderDialogOpen(true)
  }

  function closeReorderDialog() {
    setReorderDialogOpen(false)
  }

  function moveFactor(from, to) {
    if (
      from < 0 ||
      to < 0 ||
      from >= factorOrder.length ||
      to >= factorOrder.length ||
      from === to
    ) return
    setFactorOrder((currentOrder) => arrayMove(currentOrder, from, to))
  }

  function handleFactorDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    moveFactor(factorOrder.indexOf(active.id), factorOrder.indexOf(over.id))
  }

  function applyFactorOrder() {
    reorderFactors(factorOrder)
    if (editFactorIndex != null)
      setEditFactorIndex(factorOrder.indexOf(editFactorIndex))
    closeReorderDialog()
  }

  return !decision ?
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Factors</Typography>
        <Typography>Please select or create a decision first.</Typography>
      </Box>
    : <Box sx={{ flex: 1 }}>
        <Typography variant="h4">{decision.factors.length} Factors</Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
          <Paper sx={{ p: 2, width: 700 }}>
            <Box sx={{ mb: 1 }}></Box>

            <Box sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <HelpOverlay helpText={texts.factors.name}>
                    <TextField
                      label="Factor"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpsert()
                      }}
                      fullWidth
                      size="small"
                    />
                  </HelpOverlay>
                </Box>
                <ColorSelector
                  value={addColor}
                  onChange={handleColorChange}
                  label="factor color"
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 1,
                  alignItems: "flex-start",
                }}>
                <HelpOverlay helpText={texts.factors.unit}>
                  <TextField
                    label="Unit"
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </HelpOverlay>
                <Button
                  variant="outlined"
                  onClick={(event) => setUnitMenuAnchorEl(event.currentTarget)}
                  sx={{ whiteSpace: "nowrap", minHeight: 40 }}>
                  Units
                </Button>
                <Menu
                  anchorEl={unitMenuAnchorEl}
                  open={unitMenuOpen}
                  onClose={() => setUnitMenuAnchorEl(null)}>
                  {SUGGESTED_UNITS.map((unit) => (
                    <MenuItem
                      key={unit}
                      onClick={() => handleSuggestedUnit(unit)}>
                      {unit}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>

              <Stack direction="row" spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addOptimal === -Infinity}
                      onChange={(e) =>
                        setAddOptimal(e.target.checked ? -Infinity : undefined)
                      }
                    />
                  }
                  label="Min"
                  labelPlacement="start"
                />
                <HelpOverlay helpText={texts.factors.optimal} rightAmt="7%">
                  <TextField
                    label="Optimal"
                    type="number"
                    value={
                      addOptimal === -Infinity || addOptimal === Infinity ?
                        ""
                      : (addOptimal ?? "")
                    }
                    onChange={(e) =>
                      setAddOptimal(
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    fullWidth
                    size="small"
                    sx={{ mb: 1 }}
                    disabled={
                      addOptimal === -Infinity || addOptimal === Infinity
                    }
                  />
                </HelpOverlay>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addOptimal === Infinity}
                      onChange={(e) =>
                        setAddOptimal(e.target.checked ? Infinity : undefined)
                      }
                    />
                  }
                  label="Max"
                  labelPlacement="end"
                />
              </Stack>

              <HelpOverlay helpText={texts.factors.weight} rightAmt="-1.5rem">
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography sx={{ maxWidth: "6rem" }}>
                    How much do you care?
                  </Typography>
                  <Slider
                    value={Math.round(addWeight * 100)}
                    onChange={(e, v) => setAddWeight(v / 100)}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          whiteSpace: "nowrap",
                        }}>
                        {weightComparisons.below && (
                          <span>{weightComparisons.below}</span>
                        )}
                        <span>⇐ {value}% ⇒</span>
                        {weightComparisons.above && (
                          <span>{weightComparisons.above}</span>
                        )}
                      </Box>
                    )}
                    min={0}
                    max={100}
                  />
                </Box>
              </HelpOverlay>

              <HelpOverlay helpText={texts.factors.scale}>
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="subtitle2">Scale</Typography>
                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Min"
                        type="number"
                        value={addMin ?? ""}
                        onChange={(e) => {
                          setAddMin(e.target.value)
                          if (e.target.value !== "") setAddMinUnbounded(false)
                        }}
                        size="small"
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={addMinUnbounded}
                            onChange={(e) => {
                              setAddMinUnbounded(e.target.checked)
                              if (e.target.checked) setAddMin(null)
                            }}
                          />
                        }
                        label="Calculate the Min from the answers"
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        label="Max"
                        type="number"
                        value={addMax ?? ""}
                        onChange={(e) => {
                          setAddMax(e.target.value)
                          if (e.target.value !== "") setAddMaxUnbounded(false)
                        }}
                        size="small"
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={addMaxUnbounded}
                            onChange={(e) => {
                              setAddMaxUnbounded(e.target.checked)
                              if (e.target.checked) setAddMax(null)
                            }}
                          />
                        }
                        label="Calculate the Max from the answers"
                      />
                    </Box>
                  </Box>
                </Box>
              </HelpOverlay>

              {addError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {addError}
                </Typography>
              )}
              {editFactorIndex != null && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={clearExistingAnswers}
                        onChange={(event) => {
                          setClearExistingAnswersOverride(event.target.checked)
                          if (event.target.checked)
                            setMarkExistingAnswersTentative(false)
                        }}
                      />
                    }
                    label="Clear existing answers"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={markExistingAnswersTentative}
                        onChange={(event) => {
                          setMarkExistingAnswersTentative(event.target.checked)
                          if (event.target.checked)
                            setClearExistingAnswersOverride(false)
                        }}
                      />
                    }
                    label="Mark existing answers as tentative"
                  />
                </>
              )}
              <Box sx={{ mt: 1 }}>
                {editFactorIndex != null ?
                  <>
                    <Button variant="contained" onClick={handleUpsert}>
                      Modify
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        // cancel edit
                        setEditFactorIndex(null)
                        resetFormFields()
                      }}
                      sx={{ ml: 1 }}>
                      Cancel
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleRemove(editFactorIndex)}
                      sx={{ ml: 1 }}>
                      Delete
                    </Button>
                  </>
                : <Button variant="contained" onClick={handleUpsert}>
                    Add
                  </Button>
                }
              </Box>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}>
            <Typography variant="h6">Current Factors</Typography>
            <TextField
              label="Search factors"
              size="small"
              value={factorSearch}
              onChange={(event) => setFactorSearch(event.target.value)}
              slotProps={{
                input: {
                  endAdornment:
                    factorSearch ?
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          aria-label="Clear factor search"
                          onClick={() => setFactorSearch("")}
                          edge="end">
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    : null,
                },
              }}
              sx={{ flex: 1, maxWidth: 400, mx: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showOnlyUnfinished}
                  onChange={(event) =>
                    setShowOnlyUnfinished(event.target.checked)
                  }
                />
              }
              label="Show only unfinished"
            />
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "stretch",
              minWidth: 0,
              overflow: "hidden",
            }}></Box>
          <FactorsDataGrid
            decision={decision}
            editFactorIndex={editFactorIndex}
            setEditFactorIndex={beginEditingFactor}
            handleRemove={handleRemove}
            showOnlyUnfinished={showOnlyUnfinished}
            factorSearch={factorSearch}
          />
          <Button
            variant="outlined"
            onClick={openReorderDialog}
            disabled={decision.factors.length < 2}
            sx={{ mt: 1, whiteSpace: "nowrap" }}>
            Reorder factors
          </Button>
        </Box>
        <Dialog
          open={reorderDialogOpen}
          onClose={closeReorderDialog}
          fullWidth
          maxWidth="sm">
          <DialogTitle>Reorder factors</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Drag factors into the order you want, or use the move buttons.
            </Typography>
            <DndContext
              sensors={reorderSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFactorDragEnd}>
              <SortableContext
                items={factorOrder}
                strategy={verticalListSortingStrategy}>
                <Stack spacing={1}>
                  {factorOrder.map((factorIndex, position) => (
                    <SortableFactor
                      key={factorIndex}
                      factorIndex={factorIndex}
                      name={factorNameText(
                        decision.factors[factorIndex]?.name,
                      )}
                      color={decision.factors[factorIndex]?.color}
                      position={position}
                      count={factorOrder.length}
                      onMove={moveFactor}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeReorderDialog}>Cancel</Button>
            <Button variant="contained" onClick={applyFactorOrder}>
              Apply
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
}
