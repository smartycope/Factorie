import React, { useCallback, useEffect, useMemo, useState } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import IconButton from "@mui/material/IconButton"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Slider from "@mui/material/Slider"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
// Select/MenuItem not needed anymore
import Paper from "@mui/material/Paper"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import { DataGrid } from "@mui/x-data-grid"
import DecisionList from "../components/DecisionList"
import { useDecisions } from "../contexts/DecisionsContext"
import Decision from "../models/Decision"
import ExplanationSidebar from "../components/ExplanationSidebar"
import { Tooltip } from "@mui/material"
// import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlinedIcon';

import texts from "../assets/texts.json"

const DEFAULTS = {
  name: "",
  unit: "",
  optimal: null,
  weight: 0.0,
  minUnbounded: false,
  maxUnbounded: false,
  min: null,
  max: null,
}

function factorNameText(value) {
  if (typeof value === "string") return value
  if (value && typeof value === "object") return value.name ?? ""
  return value ?? ""
}

function factorRows(decision) {
  return decision.factors.names.map((name, i) => {
    const factorName = factorNameText(name)
    return {
      id: i,
      index: i,
      name: factorName,
      unit: decision.factors.units[i] ?? "",
      optimal: decision.factors.optimals[i],
      weight: decision.factors.weights[i],
      min: decision.factors.mins[i],
      max: decision.factors.maxs[i],
    }
  })
}

function missingCellSx(value) {
  return {
    backgroundColor: value ? "" : "rgba(247, 82, 82, 0.41)",
  }
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

function FactorsTable({
  decision,
  editFactorIndex,
  setEditFactorIndex,
  handleRemove,
  onDragStart,
  onDragOver,
  onDropRow,
}) {
  const rows = factorRows(decision)

  return (
    <Paper sx={{ mt: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 2,
                backgroundColor: "rgba(15, 23, 42, 0.1)",
              }}>
              Name
            </TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Optimal</TableCell>
            <TableCell>Weight</TableCell>
            <TableCell>Min</TableCell>
            <TableCell>Max</TableCell>
            <TableCell>Delete</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={`${row.name}-${row.index}`}
              draggable
              hover
              selected={editFactorIndex === row.index}
              onClick={() => setEditFactorIndex(row.index)}
              onDragStart={(e) => onDragStart(e, row.index)}
              onDragOver={onDragOver}
              onDrop={(e) => onDropRow(e, row.index)}
              sx={{ cursor: "pointer" }}>
              <TableCell
                sx={{
                  ...missingCellSx(row.name),
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                }}>
                <FactorNameText value={row.name} />
              </TableCell>
              <TableCell sx={missingCellSx(row.unit)}>{row.unit}</TableCell>
              <TableCell sx={missingCellSx(row.optimal !== null)}>
                {row.optimal ?? ""}
              </TableCell>
              <TableCell>
                {Number.isFinite(row.weight) ?
                  (row.weight * 100).toFixed(0) + "%"
                : ""}
              </TableCell>
              <TableCell>
                {row.min == null ? "calculated" : String(row.min)}
              </TableCell>
              <TableCell>
                {row.max == null ? "calculated" : String(row.max)}
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(row.index)
                  }}
                  title="Delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

const FactorsDataGrid = React.memo(function FactorsDataGrid({
  decision,
  editFactorIndex,
  setEditFactorIndex,
  handleRemove,
}) {
  const rows = useMemo(() => factorRows(decision), [decision])
  const handleRowClick = useCallback(
    (params) => setEditFactorIndex(params.row.index),
    [setEditFactorIndex],
  )
  const getRowClassName = useCallback(
    (params) =>
      params.row.index === editFactorIndex ? "selected-factor-row" : "",
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
        width: 80,
        sortable: false,
        cellClassName: (params) =>
          params.value !== null && params.value !== "" ? "" : "invalid-cell",
        renderCell: (params) => params.value ?? "",
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
    // <Paper sx={{ mt: 1, height: 420, minWidth: 0 }}>
    <Paper sx={{ mt: 1, height: "calc(100vh - 230px)", minHeight: 300, minWidth: 0 }}>
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
        sx={factorsDataGridSx}
      />
    </Paper>
  )
})

export default function Factors() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    renameFactor,
    editFactor,
    addFactor,
    removeFactor,
    modifyCurrentDecision,
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

  // Edit state tracks which factor (by index) is being modified. We reuse the add form fields while editing.
  const [editFactorIndex, setEditFactorIndex] = useState(null)

  const resetFormFields = useCallback(() => {
    setAddName(DEFAULTS.name)
    setAddUnit(DEFAULTS.unit)
    setAddOptimal(DEFAULTS.optimal)
    setAddWeight(DEFAULTS.weight)
    setAddMinUnbounded(DEFAULTS.minUnbounded)
    setAddMaxUnbounded(DEFAULTS.maxUnbounded)
    setAddMin(DEFAULTS.min)
    setAddMax(DEFAULTS.max)
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

  // when choosing factor to edit, populate fields
  useEffect(() => {
    if (editFactorIndex == null || !decision) return
    const idx = editFactorIndex
    if (idx < 0 || idx >= decision.factors.names.length) return
    const t = setTimeout(() => {
      // fill the add form with the selected factor's values
      setAddName(factorNameText(decision.factors.names[idx]) || DEFAULTS.name)
      setAddUnit(decision.factors.units[idx] ?? DEFAULTS.unit)
      setAddOptimal(decision.factors.optimals[idx] ?? DEFAULTS.optimal)
      setAddWeight(
        Number.isFinite(decision.factors.weights[idx]) ?
          decision.factors.weights[idx]
        : DEFAULTS.weight,
      )
      // TODO: should this use !! instead?
      setAddMinUnbounded(decision.factors.mins[idx] == null)
      setAddMaxUnbounded(decision.factors.maxs[idx] == null)
      setAddMin(decision.factors.mins[idx] ?? DEFAULTS.min)
      setAddMax(decision.factors.maxs[idx] ?? DEFAULTS.max)
    }, 0)
    return () => clearTimeout(t)
  }, [editFactorIndex, decision])

  function isFormInvalid(){
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
      addOptimal !== null &&
      addOptimal !== "" &&
      (addOptimal < Number(addMin) || addOptimal > Number(addMax))
    )
      return (
        "Optimal must be between Min and Max, or leave blank to finish later"
    )
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
      optimal: Number.isFinite(addOptimal) ? Number(addOptimal) : undefined,
      weight: Number(addWeight),
      min: addMinUnbounded || !Number.isFinite(addMin) ? null : Number(addMin),
      max: addMaxUnbounded || !Number.isFinite(addMax) ? null : Number(addMax),
      unit: addUnit || undefined,
    }
    if (editFactorIndex != null) {
      // modify existing factor, including the name
      editFactor(editFactorIndex, newFactor)
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

  const handleRemove = useCallback((factorToRemove) => {
    removeFactor(factorToRemove)
    if (editFactorIndex === factorToRemove) {
      setEditFactorIndex(null)
      resetFormFields()
    }
  }, [editFactorIndex, removeFactor, resetFormFields])

  // Drag and drop the factor rows
  const onDragStart = (e, idx) => {
    e.dataTransfer.setData("text/plain", String(idx))
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const onDropRow = (e, targetIdx) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData("text/plain"))
    const to = targetIdx
    if (Number.isNaN(from)) return
    if (from === to) return

    const move = (arr) => {
      const item = arr.splice(from, 1)[0]
      arr.splice(to, 0, item)
    }

    modifyCurrentDecision((d) => {
      move(d.factors.names)
      move(d.factors.units)
      move(d.factors.optimals)
      move(d.factors.weights)
      move(d.factors.mins)
      move(d.factors.maxs)
      for (let r = 0; r < d.answers.length; r++) {
        const col = d.answers[r].splice(from, 1)[0]
        d.answers[r].splice(to, 0, col)
      }
    })
  }

  return !decision ?
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Factors</Typography>
        <Typography>Please select or create a decision first.</Typography>
      </Box>
    : <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Factors</Typography>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Paper sx={{ p: 2, width: 700 }}>
            <Box sx={{ mb: 1 }}></Box>

            <Box sx={{ mt: 1 }}>
              <TextField
                label="Factor"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpsert()
                }}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <TextField
                label="Unit"
                placeholder="0-10 scale"
                value={addUnit}
                onChange={(e) => setAddUnit(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <TextField
                label="Optimal"
                type="number"
                value={addOptimal ?? ""}
                onChange={(e) => setAddOptimal(Number(e.target.value))}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography>How much do you care?</Typography>
                <Slider
                  value={Math.round(addWeight * 100)}
                  onChange={(e, v) => setAddWeight(v / 100)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                />
              </Box>
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="subtitle2">Scale</Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addMinUnbounded}
                          onChange={(e) => setAddMinUnbounded(e.target.checked)}
                        />
                      }
                      label="Min Unbounded"
                    />
                    <TextField
                      label="Min"
                      type="number"
                      value={addMin ?? ""}
                      onChange={(e) => setAddMin(e.target.value)}
                      size="small"
                      disabled={addMinUnbounded}
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addMaxUnbounded}
                          onChange={(e) => setAddMaxUnbounded(e.target.checked)}
                        />
                      }
                      label="Max Unbounded"
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={addMax ?? ""}
                      onChange={(e) => setAddMax(e.target.value)}
                      size="small"
                      disabled={addMaxUnbounded}
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </Box>
              {addError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {addError}
                </Typography>
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
          <Typography variant="h6">Current Factors</Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "stretch",
              minWidth: 0,
              overflow: "hidden",
            }}>
              {/* <FactorsTable
                decision={decision}
                editFactorIndex={editFactorIndex}
                setEditFactorIndex={setEditFactorIndex}
                handleRemove={handleRemove}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDropRow={onDropRow}
              /> */}
            </Box>
              <FactorsDataGrid
                decision={decision}
                editFactorIndex={editFactorIndex}
                setEditFactorIndex={setEditFactorIndex}
                handleRemove={handleRemove}
              />
        </Box>
      </Box>
}
