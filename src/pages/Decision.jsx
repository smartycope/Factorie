import React, { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useDecisions } from "../contexts/UseDecisions"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import ListItemText from "@mui/material/ListItemText"
import IconButton from "@mui/material/IconButton"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import { DataGrid, GridColumnMenu } from "@mui/x-data-grid"
import Paper from "@mui/material/Paper"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Popper from "@mui/material/Popper"
import { useToast } from "../contexts/UseToast"
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

// Up to date, currently used
function DecisionEditTableTransposed_MuiTable() {
  const {
    decision,
    renameOption,
    removeFactor,
    renameFactor,
    removeOption,
    setAnswer,
  } = useDecisions()
  const { toast } = useToast()

  if (!decision) return null

  function factorIndexFromRowId(id) {
    const separatorIndex = `${id}`.lastIndexOf("__")
    if (separatorIndex === -1) return id
    const factorIndex = Number(`${id}`.slice(separatorIndex + 2))
    return Number.isInteger(factorIndex) ? factorIndex : id
  }

  const columns = [
    {
      field: "delete",
      headerName: "",
      headerClassName: "pinned-column",
      cellClassName: "pinned-column",
      sortable: false,
      editable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => removeFactor(factorIndexFromRowId(params.id))}>
          <DeleteIcon />
        </IconButton>
      ),
      width: 60,
    },
    {
      field: "factor",
      headerName: "Factor",
      headerClassName: "pinned-column",
      cellClassName: "pinned-column factor-name-cell",
      sortable: true,
      editable: true,
      type: "longText",
      width: 160,
      renderCell: (params) => {
        const isUnnamed = params.value === ""
        return (
          <Box
            sx={{
              color: isUnnamed ? "text.disabled" : "text.primary",
              fontStyle: isUnnamed ? "italic" : "normal",
              lineHeight: 1.3,
              overflowWrap: "anywhere",
              whiteSpace: "normal",
            }}>
            {isUnnamed ? "unnamed" : params.value}
          </Box>
        )
      },
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
            color: params.colDef.headerName === "" ? "text.disabled" : "inherit",
            fontStyle: params.colDef.headerName === "" ? "italic" : "normal",
          }}>
          {params.colDef.headerName === "" ? "unnamed" : params.colDef.headerName}
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
    <Box
      sx={{
        flex: "1 1 auto",
        flexDirection: "column",
        display: "flex",
        height: "calc(100vh - 230px)",
        // height: "100%",
        minHeight: 360,
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "hidden",
      }}>
      <ThemeProvider theme={createTheme({ palette: { mode: "light" } })}> {/* // TODO: this doesn't work */}
        <Paper sx={{ flex: 1, minHeight: 0, width: "100%", overflow: "hidden" }}>
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
            getRowHeight={() => "auto"}
            sx={{
              height: "100%",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              "& .MuiDataGrid-columnHeaderTitleContainerContent": {
                minWidth: 0,
              },
              "& .pinned-column": {
                backgroundColor: "rgba(15, 23, 42, 0.06)",
              },
              "& .MuiDataGrid-columnHeader.pinned-column": {
                backgroundColor: "rgba(15, 23, 42, 0.1)",
              },
              "& .MuiDataGrid-pinnedColumns, & .MuiDataGrid-pinnedColumnHeaders": {
                backgroundColor: "rgba(15, 23, 42, 0.06)",
              },
              "& .MuiDataGrid-cell.factor-name-cell": {
                alignItems: "flex-start",
                py: 1,
              },
            }}
            onProcessRowUpdateError={(error) => toast(error.message)}
            processRowUpdate={(newRow, oldRow, obj) => {
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

              // If they're trying to name the factor, let them
              if (newRow['factor'] !== oldRow['factor']){
                renameFactor(factor, newRow['factor'])
                return newRow
              } else if (option === "") {
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
    setSelectedIndex,
    decision,
    addFactor,
    addOption,
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
        <Stack direction="row">
        <Typography variant="h4" sx={{ mr: 2}}>Deciding: </Typography>
        <TextField
          defaultValue={decision?.name || ""}
          size="large"
          sx={{ flex: 1 }}
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
        <Stack direction="row">
        <Button
          sx={{ display: "flex" }}
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => addFactor()}>
          Add Factor
        </Button>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          // align to the right
          sx={{ display: "flex", ml: "auto" }}
          onClick={() => addOption()}>
          Add Option
        </Button>
        </Stack>
        {/* <DecisionInduvidualEditTableTransposed /> */}
        <DecisionEditTableTransposed_MuiTable />
      </>
    )

  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
      }}>
      {content}
    </Box>
  )
}
