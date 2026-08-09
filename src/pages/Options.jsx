import { Fragment, useState, useRef } from "react"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Divider from "@mui/material/Divider"
import Fab from "@mui/material/Fab"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemIcon from "@mui/material/ListItemIcon"
import ListItemText from "@mui/material/ListItemText"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useDecisions } from "../contexts/UseDecisions"

function OptionsEditor({
  decision,
  addOption,
  removeOption,
  reorderOptions,
  renameOption,
  setOptionNote,
  setOptionHidden,
  setOptionColor,
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null)
  const [draggedOptionIndex, setDraggedOptionIndex] = useState(null)
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState(null)
  const [optionName, setOptionName] = useState("")
  const nameBox = useRef()
  const selectedOption =
    selectedOptionIndex == null ? null : decision.options[selectedOptionIndex]
  const normalizedName = optionName.trim()
  const duplicateName = decision.options.some(
    (option, index) =>
      option.name === normalizedName && index !== selectedOptionIndex,
  )
  const canSubmit = Boolean(normalizedName) && !duplicateName

  function selectOption(index) {
    setSelectedOptionIndex(index)
    setOptionName(decision.options[index].name)
  }

  function startAdding() {
    setSelectedOptionIndex(null)
    setOptionName("")
  }

  function submitOption() {
    if (!canSubmit) return
    if (selectedOptionIndex == null) {
      const newIndex = decision.options.length
      addOption(normalizedName)
      setSelectedOptionIndex(newIndex)
    } else {
      renameOption(selectedOptionIndex, normalizedName)
    }
    setOptionName(normalizedName)
  }

  function deleteOption(event, index) {
    event.stopPropagation()
    removeOption(index)
    if (selectedOptionIndex === index) {
      startAdding()
    } else if (selectedOptionIndex > index) {
      setSelectedOptionIndex(selectedOptionIndex - 1)
    }
  }

  function handleDragStart(event, index) {
    setDraggedOptionIndex(index)
    event.dataTransfer.setData("text/plain", String(index))
    event.dataTransfer.effectAllowed = "move"
  }

  function handleDrop(event, targetIndex) {
    event.preventDefault()
    const transferredValue = event.dataTransfer.getData("text/plain")
    const transferredIndex = Number(transferredValue)
    const sourceIndex =
      transferredValue !== "" && Number.isInteger(transferredIndex) ?
        transferredIndex
      : draggedOptionIndex

    setDraggedOptionIndex(null)
    setDragOverOptionIndex(null)
    if (
      sourceIndex == null ||
      sourceIndex < 0 ||
      sourceIndex >= decision.options.length ||
      sourceIndex === targetIndex
    )
      return

    const order = decision.options.map((_, index) => index)
    const [movedOptionIndex] = order.splice(sourceIndex, 1)
    order.splice(targetIndex, 0, movedOptionIndex)
    reorderOptions(order)
    if (selectedOptionIndex != null)
      setSelectedOptionIndex(order.indexOf(selectedOptionIndex))
  }

  function handleDragEnd() {
    setDraggedOptionIndex(null)
    setDragOverOptionIndex(null)
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}>
        <Box>
          <Typography variant="h4">Options</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Select an option to rename it or add notes. Use Ctrl+Enter to add a new option after submitting the current one.
          </Typography>
        </Box>
        <Tooltip title="Add a new option">
          <Fab
            color="primary"
            size="medium"
            aria-label="Add a new option"
            onClick={() => {
              startAdding()
              nameBox.current?.focus()
            }}>
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
        <TextField
          slotProps={{ htmlInput: { ref: nameBox } }}
          value={optionName}
          onChange={(event) => setOptionName(event.target.value)}
          label={selectedOptionIndex == null ? "New option" : "Option name"}
          size="small"
          fullWidth
          error={duplicateName}
          helperText={duplicateName ? "Option names must be unique." : " "}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              if (event.ctrlKey) {
                submitOption()
                startAdding()
              } else submitOption()
            }
          }}
        />
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={submitOption}
          sx={{ alignSelf: "flex-start", minWidth: 104 }}>
          {selectedOptionIndex == null ? "Add" : "Rename"}
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ mt: 1, overflow: "hidden" }}>
        {decision.options.length === 0 ?
          <Typography color="text.secondary" sx={{ px: 2, py: 4 }}>
            No options yet. Enter a name above to add your first one.
          </Typography>
        : <List disablePadding aria-label="Decision options">
            {decision.options.map((option, index) => (
              <Fragment key={`${option.name}-${index}`}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  disablePadding
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = "move"
                    setDragOverOptionIndex(index)
                  }}
                  onDrop={(event) => handleDrop(event, index)}
                  sx={{
                    outline:
                      dragOverOptionIndex === index &&
                      draggedOptionIndex !== index ?
                        "2px solid"
                      : "2px solid transparent",
                    // outlineColor: "primary.main",
                    outlineOffset: -2,
                  }}
                  secondaryAction={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Tooltip
                        title={`${option.hidden ? "Show" : "Hide"} ${option.name}`}>
                        <IconButton
                          aria-label={`${option.hidden ? "Show" : "Hide"} ${option.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            setOptionHidden(index, !option.hidden)
                          }}>
                          {option.hidden ?
                            <VisibilityOffIcon />
                          : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={`Delete ${option.name}`}>
                        <IconButton
                          edge="end"
                          aria-label={`Delete ${option.name}`}
                          onClick={(event) => deleteOption(event, index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }>
                  <ListItemButton
                    selected={selectedOptionIndex === index}
                    onClick={() => selectOption(index)}
                    sx={{
                      pr: 12,
                      opacity: option.hidden ? 0.6 : 1,
                      backgroundColor: option.color ?? undefined,
                    }}>
                    <ListItemIcon
                      draggable
                      title={`Drag to reorder ${option.name}`}
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragEnd={handleDragEnd}
                      sx={{ minWidth: 32, cursor: "grab" }}>
                      <DragIndicatorIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={option.name}
                      secondary={
                        option.notes ?
                          option.notes.slice(0, 80)
                        : "No notes"
                      }
                    />
                  </ListItemButton>
                </ListItem>
              </Fragment>
            ))}
          </List>
        }
      </Paper>

      <TextField
        label={
          selectedOption ? `Notes for ${selectedOption.name}` : "Option notes"
        }
        value={selectedOption?.notes ?? ""}
        onChange={(event) =>
          setOptionNote(selectedOptionIndex, event.target.value)
        }
        disabled={!selectedOption}
        placeholder="Add details, reminders, links, or anything else about this option."
        helperText={
          selectedOption ?
            "Notes are saved automatically."
          : "Select an option above to add notes."
        }
        multiline
        minRows={5}
        fullWidth
        sx={{ mt: 3 }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
        <TextField
          label={selectedOption ? `Color for ${selectedOption.name}` : "Option color"}
          type="color"
          value={selectedOption?.color ?? "#FFFFFF"}
          onChange={(event) =>
            setOptionColor(selectedOptionIndex, event.target.value)
          }
          disabled={!selectedOption}
          size="small"
          slotProps={{ htmlInput: { "aria-label": "Option color" } }}
          sx={{ width: 190 }}
        />
        <Button
          size="small"
          disabled={!selectedOption?.color}
          onClick={() => setOptionColor(selectedOptionIndex, null)}>
          Clear color
        </Button>
      </Box>
    </>
  )
}

export default function Options() {
  const {
    decisions,
    selectedIndex,
    addOption,
    removeOption,
    reorderOptions,
    renameOption,
    setOptionNote,
    setOptionHidden,
    setOptionColor,
  } = useDecisions()
  const decision = selectedIndex != null ? decisions[selectedIndex] : null

  return (
    <Box sx={{ flex: 1, minWidth: 0, textAlign: "left" }}>
      {!decision ?
        <>
          <Typography variant="h4">Options</Typography>
          <Typography>Select a decision to manage options.</Typography>
        </>
      : <OptionsEditor
          key={selectedIndex}
          decision={decision}
          addOption={addOption}
          removeOption={removeOption}
          reorderOptions={reorderOptions}
          renameOption={renameOption}
          setOptionNote={setOptionNote}
          setOptionHidden={setOptionHidden}
          setOptionColor={setOptionColor}
        />
      }
    </Box>
  )
}
