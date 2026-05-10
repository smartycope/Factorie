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

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      DataGrid: {
        bg: mode === "light" ? "#f8fafc" : "#334155",
        pinnedBg: mode === "light" ? "#a990db" : "#293548",
        // pinnedBg: mode === "light" ? "#f1f5f9" : "#293548",
        headerBg: mode === "light" ? "#eaeff5" : "#1e293b",
      },
    },
  })

function ResetToExamplesButton() {
  const {
    decisions,
    setDecisions,
    setSelectedIndex,
    selectedIndex,
    createDecision,
    removeDecision,
    setAnswer,
  } = useDecisions()

  function reset() {
    const ex1 = JSON.parse(
      `{"name":"What to eat","factors":{"names":["Taste","Cost","Healthiness","Time to Make","Leftovers","Test"],"units":["0-10","$","0-10","minutes","portions","na"],"optimals":[10,0,10,0,5,10],"weights":[0.9,1,1,0.6,0.2,0.5],"mins":[0,0,0,null,0,0],"maxs":[10, null,10,null,null,10]},"options":["Taco Bell","Spaghetti","Tacos","Leftovers","Chicken noodle soup"],"answers":[[[8,8],[15,15],[6,6],[15,30],[1,1],[9.3,9.3]],[[3,3],[5,6],[8,8],[20,20],[1,1],[0.7,0.7]],[[10,10],[8,8],[9,9],[10,10],[1,1],[2,8]],[[5,5],[1,1],[9,9],[5,5],[1,1],[3,4]],[[9,9],[4,4],[10,10],[10,10],[5,5],[2,4]]],"threshold":0,"factor_packs":[]} `,
    )
    const ex2 = JSON.parse(
      `{"name":"What to do","factors":{"names":["Fun","Time","Cost","Test"],"units":["0-10","minutes","$","na"],"optimals":[10,0,0,10],"weights":[1,0.6,1,0.5],"mins":[0,null,0,0],"maxs":[10,null,null,10]},"options":["Watch Netflix","Play video games","Watch a movie"],"answers":[[[8,8],[2,2],[1,1],[10,10]],[[10,10],[2,2],[1,1],[10,10]],[[8,8],[2,2],[1,1],[10,10]]],"threshold":0,"factor_packs":[]} `,
    )
    setDecisions(() => [Decision.deserialize(ex1), Decision.deserialize(ex2)])
    // setAnswer(0, 0, '2')
  }
  return <Button onClick={reset}>Reset to Examples</Button>
}

// Source: https://mui.com/x/react-data-grid/column-definition/#expand-cell-renderer
const GridCellExpand = React.memo(function GridCellExpand(props) {
  const { width, value } = props
  const wrapper = React.useRef(null)
  const cellDiv = React.useRef(null)
  const cellValue = React.useRef(null)
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [showFullCell, setShowFullCell] = React.useState(false)
  const [showPopper, setShowPopper] = React.useState(false)
  function isOverflown(element) {
    return (
      element.scrollHeight > element.clientHeight ||
      element.scrollWidth > element.clientWidth
    )
  }
  const handleMouseEnter = () => {
    const isCurrentlyOverflown = isOverflown(cellValue.current)
    setShowPopper(isCurrentlyOverflown)
    setAnchorEl(cellDiv.current)
    setShowFullCell(true)
  }

  const handleMouseLeave = () => {
    setShowFullCell(false)
  }

  React.useEffect(() => {
    if (!showFullCell) {
      return undefined
    }

    function handleKeyDown(nativeEvent) {
      if (nativeEvent.key === "Escape") {
        setShowFullCell(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [setShowFullCell, showFullCell])

  return (
    <Box
      ref={wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        alignItems: "center",
        lineHeight: "24px",
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
      }}>
      <Box
        ref={cellDiv}
        sx={{
          height: "100%",
          width,
          display: "block",
          position: "absolute",
          top: 0,
        }}
      />
      <Box
        ref={cellValue}
        sx={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
        {value}
      </Box>
      {showPopper && (
        <Popper
          open={showFullCell && anchorEl !== null}
          anchorEl={anchorEl}
          style={{ width, marginLeft: -17 }}>
          <Paper
            elevation={1}
            style={{ minHeight: wrapper.current.offsetHeight - 3 }}>
            <Typography variant="body2" style={{ padding: 8 }}>
              {value}
            </Typography>
          </Paper>
        </Popper>
      )}
    </Box>
  )
})

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

// Up to date, currently used
function DecisionEditTableTransposed_MuiTable() {
  const {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    decision,
    addFactor,
    editFactor,
    renameOption,
    removeFactor,
    addOption,
    removeOption,
    setAnswer,
  } = useDecisions()
  const { toast } = useToast()

  if (!decision) return null

  const columns = [
    {
      field: "delete",
      headerName: "",
      sortable: false,
      editable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => removeFactor(params.id.split("__")[0])}>
          <DeleteIcon />
        </IconButton>
      ),
      width: 60,
    },
    {
      field: "factor",
      headerName: "Factor",
      sortable: true,
      editable: true,
      type: "longText",
      width: 160,
      renderCell: (params) => (
        <GridCellExpand
          value={params.value || ""}
          width={params.colDef.computedWidth}
        />
      ),
    },
    ...decision.options.map((option, i) => ({
      field: option + "__" + i,
      headerName: option,
      renderHeader: (params) => (
        <Box
          sx={{
            whiteSpace: "normal",
            lineHeight: 1.2,
            overflowWrap: "anywhere",
          }}>
          {params.colDef.headerName}
        </Box>
      ),
      sortable: false,
      type: "string",
      minWidth: 100,
      editable: true,
      flex: 1,
      // Validate the answer in real time
      // preProcessEditCellProps: (params) => {
      //   const factor = params.id.split("__")[0]
      //   const ans = Answer.parse(params.props.value)
      //   let hasError
      //   console.log('preprocessEditCellProps',{params})
      //   if (ans === null)
      //     hasError = "Answer is not a number"
      //   else
      //     hasError = ans.isInvalid(decision, factor)
      //   if (hasError && params.props.changeReason !== "debouncedSetEditCellValue") {
      //     toast(hasError)
      //   }
      //   console.log({hasError})
      //   return { ...params.props, error: hasError }
      // },
    })),
  ]

  const rows = decision.factors.names.map((fac, fi) => ({
    id: fac + "__" + fi,
    factor: fac,
    ...Object.fromEntries(
      decision.options.map((opt, oi) => [
        opt + "__" + oi,
        decision.getAnswer(opt, fac).toString(),
      ]),
    ),
  }))

  function optionIndexFromField(field) {
    const separatorIndex = field.lastIndexOf("__")
    if (separatorIndex === -1) return field
    const optionIndex = Number(field.slice(separatorIndex + 2))
    return Number.isInteger(optionIndex) ? optionIndex : field
  }

  // TODO: for cell styling: https://mui.com/x/react-data-grid/style/#styling-cells

  function CustomColumnMenu(props) {
    return (
      <>
        <GridColumnMenu
          {...props}
          slots={{
            columnMenuSortItem: null,
            columnMenuFilterItem: null,
            columnMenuColumnsItem: null,
            columnMenuPinningItem: null,
            columnMenuAggregationItem: null,
            columnMenuGroupingItem: null,
            // Add new item
            columnMenuUserItem: () => (
              <>
                <Box
                  sx={{ px: 2, py: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}>
                  <TextField
                    size="small"
                    defaultValue={props.colDef.headerName ?? ""}
                    placeholder="Name Option"
                    onKeyDown={(e) => {
                      e.stopPropagation()
                      if (e.key !== "Enter") return
                      renameOption(
                        optionIndexFromField(props.colDef.field),
                        e.target.value,
                      )
                      props.hideMenu?.()
                    }}
                  />
                </Box>
                <MenuItem
                  onClick={() =>
                    removeOption(optionIndexFromField(props.colDef.field))
                  }>
                  <ListItemIcon>
                    <DeleteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete Option</ListItemText>
                </MenuItem>
              </>
            ),
          }}
        />
      </>
    )
  }

  return (
    <Box sx={{flexDirection: "column", display: "flex", height: "100%", width: "100%", maxWidth: "900px" }}> {/* TODO: the 900px is a hack */}
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}> {/* // TODO: this doesn't work */}
        <Paper sx={{ height: "100%", width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
              pinnedColumns: { left: ["delete", "factor"] },
            }}
            pageSizeOptions={[5, 10]}
            disableRowSelectionOnClick
            autosizeOnMount
            columnHeaderHeight={72}
            sx={{
              "& .MuiDataGrid-columnHeaderTitleContainerContent": {
                minWidth: 0,
              },
            }}
            onProcessRowUpdateError={(error) => toast(error.message)}
            processRowUpdate={(newRow, oldRow) => {
              const factor = oldRow.factor
              const cleanNewRow = Object.fromEntries(
                Object.entries(newRow).map(([k, v]) => [k.split("__")[0], v]),
              )
              const cleanOldRow = Object.fromEntries(
                Object.entries(oldRow).map(([k, v]) => [k.split("__")[0], v]),
              )
              const option = decision.options.find(
                (opt) => cleanNewRow[opt] !== cleanOldRow[opt],
              )

              if (option === "") {
                toast("Please name the option before adding an answer")
                return oldRow
              } else if (factor === "") {
                toast("Please name the factor before adding an answer")
                return oldRow
              } else if (option)
                setAnswer(option, factor, cleanNewRow[option] ?? "")
              return newRow
            }}
            slots={{ columnMenu: CustomColumnMenu }}
          />
        </Paper>
      </ThemeProvider>
    </Box>
  )
}

export default function Decisions() {
  const {
    decisions,
    renameDecision,
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

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sel = searchParams.get("selected")
    if (sel != null) {
      const idx = parseInt(sel, 10)
      if (!Number.isNaN(idx) && idx >= 0 && idx < decisions.length) {
        setSelectedIndex(idx)
      }
    }
  }, [searchParams, decisions, setSelectedIndex])

  let content
  if (!decision)
    content = (
      <>
        <Typography variant="h4">Decisions</Typography>
        <Typography>Add/Select a decision to get started.</Typography>
      </>
    )
  else
    content = (
      <>
        {/* <ResetToExamplesButton /> */}
        <Stack direction="row">
        <Typography variant="h4" sx={{ mr: 2}}>Deciding: </Typography>
        <TextField
          defaultValue={decision?.name || ""}
          size="large"
          // sx={{scale: 1.5}}
          variant="standard"
          onBlur={(e) => {
            if (!renameDecision(e.target.value)) e.target.value = decision.name
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.target.blur()
            if (e.key === "Escape") {
              e.target.value = decision.name
              e.target.blur()
            }
          }}
        />
        </Stack>
        <br />
        {/* <br /> */}
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          // align to the right
          sx={{ display: "flex", ml: "auto" }}
          onClick={() => addOption()}>
          Add Option
        </Button>
        {/* <DecisionInduvidualEditTableTransposed /> */}
        <DecisionEditTableTransposed_MuiTable />
        <Button
          sx={{ display: "flex" }}
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => addFactor()}>
          Add Factor
        </Button>
      </>
    )

  return <Box sx={{ flex: 1 }}>{content}</Box>
}
