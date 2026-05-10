import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useDecisions } from "../contexts/DecisionsContext"
import Decision from "../models/Decision"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import ListItemText from "@mui/material/ListItemText"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import { DataGrid, GridColumnMenu } from "@mui/x-data-grid"
import Paper from "@mui/material/Paper"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Popper from "@mui/material/Popper"
import { useToast } from "../contexts/ToastContext"
import { createTheme, Stack, ThemeProvider } from "@mui/material"

// Out of date
function FactorIndivudialEditTableTransposed() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    decision,
    addFactor,
    editFactor,
    removeFactor,
    addOption,
    removeOption,
  } = useDecisions()
  const [newFactorName, setNewFactorName] = useState("")

  const factorTableCellSx = { minWidth: 50 }

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
        <TextField
          label="New factor name"
          value={newFactorName}
          onChange={(e) => setNewFactorName(e.target.value)}
          size="small"
          onKeyDown={(e) => {
            if (e.key === "Enter") addFactor()
          }}
        />
        <Button startIcon={<AddIcon />} variant="contained" onClick={addFactor}>
          Add Factor
        </Button>
      </Box>

      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Factor</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Optimal</TableCell>
              <TableCell>Weight</TableCell>
              <TableCell>Min</TableCell>
              <TableCell>Max</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.factors.names.map((n, idx) => (
              <TableRow key={idx}>
                <TableCell>{n}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={decision.factors.units[idx] ?? ""}
                    sx={{ width: 100 }}
                    onChange={(e) => editFactor(idx, { unit: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={decision.factors.optimals[idx] ?? ""}
                    sx={factorTableCellSx}
                    onChange={(e) =>
                      editFactor(idx, {
                        optimal: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={
                      Number.isFinite(decision.factors.weights[idx]) ?
                        decision.factors.weights[idx]
                      : ""
                    }
                    sx={factorTableCellSx}
                    onChange={(e) =>
                      editFactor(idx, {
                        weight:
                          e.target.value === "" ?
                            null
                          : parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={decision.factors.mins[idx] ?? ""}
                    sx={factorTableCellSx}
                    onChange={(e) =>
                      editFactor(idx, {
                        min:
                          e.target.value === "" ?
                            null
                          : parseFloat(e.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={decision.factors.maxs[idx] ?? ""}
                    sx={factorTableCellSx}
                    onChange={(e) =>
                      editFactor(idx, {
                        max:
                          e.target.value === "" ?
                            null
                          : parseFloat(e.target.value),
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => removeFactor(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// Out of date
function FactorIndivudialEditTable() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    decision,
    addFactor,
    editFactor,
    removeFactor,
    addOption,
    removeOption,
  } = useDecisions()
  const [newFactorName, setNewFactorName] = useState("")

  const factorTableCellSx = { minWidth: 50 }
  const optionTableCellSx = { minWidth: 80 }

  function setAnswer(option, factor, answerStr) {
    if (!decision) return
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    try {
      d.setAnswer(option, factor, answerStr)
      copy[selectedIndex] = d
      setDecisions(copy)
    } catch (e) {
      alert(e.message)
    }
  }

  if (!decision) return null

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
        <TextField
          label="New factor name"
          value={newFactorName}
          onChange={(e) => setNewFactorName(e.target.value)}
          size="small"
          onKeyDown={(e) => {
            if (e.key === "Enter") addFactor()
          }}
        />
        <Button startIcon={<AddIcon />} variant="contained" onClick={addFactor}>
          Add Factor
        </Button>
      </Box>

      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Factor</TableCell>
              {decision.options.map((opt, oi) => (
                <TableCell key={oi}>{opt}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.factors.names.map((facName, fi) => (
              <TableRow key={fi}>
                <TableCell>{facName}</TableCell>
                {decision.options.map((opt, oi) => {
                  const ans = decision.answers?.[oi]?.[fi]
                  if (!ans) {
                    return (
                      <TableCell key={oi}>
                        <TextField
                          size="small"
                          sx={{
                            ...optionTableCellSx,
                            backgroundColor: "rgb(175, 88, 88)",
                          }}
                          defaultValue=""
                          onBlur={(e) =>
                            setAnswer(opt, facName, e.target.value)
                          }
                        />
                      </TableCell>
                    )
                  }
                  const a = ans[0]
                  const b = ans[1]
                  const hasA = Number.isFinite(a)
                  const hasB = Number.isFinite(b)
                  return (
                    <TableCell key={oi}>
                      <TextField
                        size="small"
                        sx={{
                          ...optionTableCellSx,
                          backgroundColor:
                            hasA || hasB ? "white" : "rgb(175, 88, 88)",
                        }}
                        defaultValue={(() => {
                          if (!hasA && !hasB) return ""
                          if (!hasA) return `${b}`
                          if (!hasB) return `${a}`
                          if (a === b) return `${a}`
                          return `${a} - ${b}`
                        })()}
                        onBlur={(e) => setAnswer(opt, facName, e.target.value)}
                      />
                    </TableCell>
                  )
                })}
                <TableCell>
                  <IconButton size="small" onClick={() => removeFactor(fi)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// Very good, up to date, and functional.
function DecisionInduvidualEditTableTransposed() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    decision,
    addFactor,
    editFactor,
    removeFactor,
    addOption,
    removeOption,
  } = useDecisions()
  const [newOptionName, setNewOptionName] = useState("")
  const { setAnswer, renameOption, renameFactor } = useDecisions()
  const optionTableCellSx = { minWidth: 80 }
  const headerSx = {
    minWidth: { xs: 30, sm: 80, md: 100 },
    "& .MuiInputBase-input": {
      fontWeight: 400,
      p: 0,
    },
    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
      borderBottomColor: "text.secondary",
    },
  }
  const sharedHeaderProps = (text) => ({
    size: "small",
    variant: "standard",
    defaultValue: text,
    error: text === "",
    multiline: true,
    sx: {
      ...headerSx,
      "& .MuiInput-underline:before": {
        borderBottomColor: text === "" ? null : "transparent",
      },
    },
  })
  if (!decision) return null

  function wire_keydown(original_value) {
    return (e) => {
      if (e.key === "Enter") e.target.blur()
      if (e.key === "Escape") {
        e.target.value = original_value
        e.target.blur()
      }
    }
  }

  return (
    <>
      <TableContainer sx={{ mt: 2, overflowX: "auto", maxWidth: "80vw" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                Options ⇨<br />
                Factors ⇩
              </TableCell>
              {decision.options.map((opt, oi) => (
                <TableCell key={oi}>
                  {/* Column headers */}
                  <TextField
                    key={opt + oi}
                    {...sharedHeaderProps(opt)}
                    placeholder="option"
                    onBlur={(e) => {
                      if (!renameOption(oi, e.target.value))
                        e.target.value = opt
                    }}
                    onKeyDown={wire_keydown(opt)}
                  />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.factors.names.map((fac, fi) => (
              <TableRow key={fi}>
                <TableCell>
                  {/* Row headers */}
                  <TextField
                    key={fac + fi}
                    placeholder="factor"
                    {...sharedHeaderProps(fac)}
                    onBlur={(e) => {
                      if (!renameFactor(fi, e.target.value))
                        e.target.value = fac
                    }}
                    onKeyDown={wire_keydown(fac)}
                  />
                </TableCell>
                {decision.options.map((opt, oi) => {
                  const ans = decision.answers?.[oi]?.[fi]
                  if (!ans) return <TableCell key={oi} />

                  const a = ans[0]
                  const b = ans[1]
                  const hasA = Number.isFinite(a)
                  const hasB = Number.isFinite(b)

                  const answerStr = decision.getAnswerStr(opt, fac)

                  return (
                    // Answer cells
                    <TableCell key={oi}>
                      <TextField
                        size="small"
                        error={!hasA && !hasB}
                        sx={{
                          ...optionTableCellSx,
                          backgroundColor:
                            // TODO: make this color part of a theme
                            hasA || hasB ? "white" : "rgba(247, 82, 82, 0.41)",
                        }}
                        // helperText={!hasA && !hasB ? "empty" : ""}
                        defaultValue={answerStr}
                        onBlur={(e) => setAnswer(opt, fac, e.target.value)}
                        onKeyDown={wire_keydown(answerStr)}
                      />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

// Out of date
function DecisionInduvidualEditTable() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    decision,
    addFactor,
    editFactor,
    removeFactor,
    addOption,
    removeOption,
  } = useDecisions()
  const [newOptionName, setNewOptionName] = useState("")
  const optionTableCellSx = { minWidth: 80 }

  function setAnswer(option, factor, answerStr) {
    if (!decision) return
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    try {
      d.setAnswer(option, factor, answerStr)
      copy[selectedIndex] = d
      setDecisions(copy)
    } catch (e) {
      // TODO: show basic alert for invalid input; we could improve with inline validation
      alert(e.message)
    }
  }
  // const [newOptionName, setNewOptionName] = useState("");
  return (
    <>
      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Option</TableCell>
              {decision.factors.names.map((n, idx) => (
                <TableCell key={idx}>{n}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {decision.options.map((opt, oi) => (
              <TableRow key={oi}>
                <TableCell>{opt}</TableCell>
                {decision.factors.names.map((fac, fi) => {
                  const ans = decision.answers?.[oi]?.[fi]
                  if (!ans) return ""
                  const a = ans[0]
                  const b = ans[1]
                  const hasA = Number.isFinite(a)
                  const hasB = Number.isFinite(b)
                  return (
                    <TableCell key={fi}>
                      <TextField
                        size="small"
                        sx={{
                          ...optionTableCellSx,
                          backgroundColor:
                            hasA || hasB ? "white" : "rgb(175, 88, 88)",
                        }}
                        defaultValue={(() => {
                          if (!hasA && !hasB) return ""
                          if (!hasA) return `${b}`
                          if (!hasB) return `${a}`
                          if (a === b) return `${a}`
                          return `${a} - ${b}`
                        })()}
                        onBlur={(e) => setAnswer(opt, fac, e.target.value)}
                      />
                    </TableCell>
                  )
                })}
                <TableCell>
                  <IconButton size="small" onClick={() => removeOption(oi)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
