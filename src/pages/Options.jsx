import { Fragment, useState, useRef } from "react"
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
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown"
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"
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
import ListItemText from "@mui/material/ListItemText"
import Paper from "@mui/material/Paper"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { useDecisions } from "../contexts/UseDecisions"
import ColorSelector from "../components/ColorSelector"

function SortableOption({
  option,
  index,
  optionCount,
  selected,
  onSelect,
  onMove,
  onDelete,
  onColorChange,
  onHiddenChange,
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.name })

  return (
    <ListItem
      ref={setNodeRef}
      disablePadding
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{ zIndex: isDragging ? 1 : "auto", opacity: isDragging ? 0.55 : 1, backgroundColor: option.color ?? undefined,}}
      secondaryAction={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <Tooltip title={`Move ${option.name} up`}>
            <span>
              <IconButton
                size="small"
                aria-label={`Move ${option.name} up`}
                disabled={index === 0}
                onClick={(event) => {
                  event.stopPropagation()
                  onMove(index, index - 1)
                }}>
                <KeyboardArrowUpIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={`Move ${option.name} down`}>
            <span>
              <IconButton
                size="small"
                aria-label={`Move ${option.name} down`}
                disabled={index === optionCount - 1}
                onClick={(event) => {
                  event.stopPropagation()
                  onMove(index, index + 1)
                }}>
                <KeyboardArrowDownIcon />
              </IconButton>
            </span>
          </Tooltip>
          <ColorSelector
            value={option.color}
            onChange={onColorChange}
            label={`${option.name} color`}
          />
          <Tooltip title={`${option.hidden ? "Show" : "Hide"} ${option.name}`}>
            <IconButton
              aria-label={`${option.hidden ? "Show" : "Hide"} ${option.name}`}
              onClick={(event) => {
                event.stopPropagation()
                onHiddenChange(!option.hidden)
              }}>
              {option.hidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${option.name}`}>
            <IconButton
              edge="end"
              aria-label={`Delete ${option.name}`}
              onClick={(event) => onDelete(event, index)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      }>
      <IconButton
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        size="small"
        aria-label={`Drag to reorder ${option.name}`}
        title={`Drag to reorder ${option.name}`}
        sx={{
          ml: 0.75,
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}>
        <DragIndicatorIcon color="action" />
      </IconButton>
      <ListItemButton
        selected={selected}
        onClick={onSelect}
        sx={{
          pr: 27,
          pl: 1,
          opacity: option.hidden ? 0.6 : 1,
        }}>
        <ListItemText
          primary={option.name}
          secondary={option.notes ? option.notes.slice(0, 80) : "No notes"}
        />
      </ListItemButton>
    </ListItem>
  )
}

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
  const [optionName, setOptionName] = useState("")
  const nameBox = useRef()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
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

  function moveOption(sourceIndex, targetIndex) {
    if (
      sourceIndex < 0 ||
      targetIndex < 0 ||
      sourceIndex >= decision.options.length ||
      targetIndex >= decision.options.length ||
      sourceIndex === targetIndex
    ) return

    const order = arrayMove(
      decision.options.map((_, index) => index),
      sourceIndex,
      targetIndex,
    )
    reorderOptions(order)
    if (selectedOptionIndex != null)
      setSelectedOptionIndex(order.indexOf(selectedOptionIndex))
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const sourceIndex = decision.options.findIndex(
      (option) => option.name === active.id,
    )
    const targetIndex = decision.options.findIndex(
      (option) => option.name === over.id,
    )
    moveOption(sourceIndex, targetIndex)
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
          <Typography variant="h4">{decision.options.length} Options</Typography>
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
        : <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={decision.options.map((option) => option.name)}
              strategy={verticalListSortingStrategy}>
              <List disablePadding aria-label="Decision options">
                {decision.options.map((option, index) => (
                  <Fragment key={option.name}>
                    {index > 0 && <Divider component="li" />}
                    <SortableOption
                      option={option}
                      index={index}
                      optionCount={decision.options.length}
                      selected={selectedOptionIndex === index}
                      onSelect={() => selectOption(index)}
                      onMove={moveOption}
                      onDelete={deleteOption}
                      onColorChange={(color) => setOptionColor(index, color)}
                      onHiddenChange={(hidden) =>
                        setOptionHidden(index, hidden)
                      }
                    />
                  </Fragment>
                ))}
              </List>
            </SortableContext>
          </DndContext>
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
