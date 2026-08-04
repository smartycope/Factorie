import { Fragment, useState, useRef } from "react"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined"
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
  renameOption,
  setOptionNote,
}) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null)
  const [optionName, setOptionName] = useState("")
  const nameBox = useRef()
  const selectedOption =
    selectedOptionIndex == null ? null : decision.options[selectedOptionIndex]
  const normalizedName = optionName.trim()
  const duplicateName = decision.options.some(
    (name, index) => name === normalizedName && index !== selectedOptionIndex,
  )
  const canSubmit = Boolean(normalizedName) && !duplicateName

  function selectOption(index) {
    setSelectedOptionIndex(index)
    setOptionName(decision.options[index])
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
          <Typography color="text.caption" sx={{ px: 2, py: 4 }}>
            No options yet. Enter a name above to add your first one.
          </Typography>
        : <List disablePadding aria-label="Decision options">
            {decision.options.map((option, index) => (
              <Fragment key={`${option}-${index}`}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Tooltip title={`Delete ${option}`}>
                      <IconButton
                        edge="end"
                        aria-label={`Delete ${option}`}
                        onClick={(event) => deleteOption(event, index)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  }>
                  <ListItemButton
                    selected={selectedOptionIndex === index}
                    onClick={() => selectOption(index)}
                    sx={{ pr: 7 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <NotesOutlinedIcon
                        color={
                          decision.optionNotes[option] ? "primary" : "disabled"
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={option}
                      secondary={
                        decision.optionNotes[option] ?
                          decision.optionNotes[option].slice(0, 80)
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
        label={selectedOption ? `Notes for ${selectedOption}` : "Option notes"}
        value={
          selectedOption ? (decision.optionNotes[selectedOption] ?? "") : ""
        }
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
    </>
  )
}

export default function Options() {
  const {
    decisions,
    selectedIndex,
    addOption,
    removeOption,
    renameOption,
    setOptionNote,
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
          renameOption={renameOption}
          setOptionNote={setOptionNote}
        />
      }
    </Box>
  )
}
