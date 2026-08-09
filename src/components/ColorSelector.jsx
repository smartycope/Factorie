import { useState } from "react"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Popover from "@mui/material/Popover"
import Tooltip from "@mui/material/Tooltip"
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';

const ENTITY_COLORS = [
  "#E3F6D5",
  "#FDE2E2",
  "#D8F3EA",
  "#FFF3BF",
  "#FCE8D5",
  "#DDEEFF",
  "#E8E2FF",
  "#f3fcc0",
  "#F6DDF1",
]

export default function ColorSelector({ value, onChange, label = "color" }) {
  const [anchorEl, setAnchorEl] = useState(null)

  function openPalette(event) {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  function selectColor(event, color) {
    event.stopPropagation()
    onChange(color)
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title={`Choose ${label}`}>
        <IconButton
          aria-label={`Choose ${label}`}
          size="small"
          onClick={openPalette}
          sx={{
            width: 32,
            height: 32,
            flex: "0 0 auto",
            backgroundColor: value ?? "#FFFFFF",
            border: "2px solid",
            borderColor: value ? "rgba(15, 23, 42, 0.45)" : "rgba(15, 23, 42, 0.2)",
            boxShadow: value ? `inset 0 0 0 2px #fff` : "none",
            "&:hover": { backgroundColor: value ?? "#F8FAFC" },
          }}>
          {!value && <FormatColorResetIcon sx={{ fontSize: 17, color: "text.disabled" }} />}
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}>
        <Box
          role="group"
          aria-label={`${label} palette`}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 30px)",
            gap: 0.75,
            p: 1,
          }}>
          {ENTITY_COLORS.map((color) => (
            <Tooltip title={color} key={color}>
              <IconButton
                aria-label={`Set ${label} to ${color}`}
                onClick={(event) => selectColor(event, color)}
                sx={{
                  width: 30,
                  height: 30,
                  backgroundColor: color,
                  border: "1px solid rgba(15, 23, 42, 0.2)",
                  outline: value === color ? "2px solid #1976d2" : "none",
                  outlineOffset: -3,
                  "&:hover": { backgroundColor: color },
                }}
              />
            </Tooltip>
          ))}
          <Tooltip title="Clear color">
            <IconButton
              aria-label={`Clear ${label}`}
              onClick={(event) => selectColor(event, null)}
              sx={{
                width: 30,
                height: 30,
                border: "1px solid rgba(15, 23, 42, 0.2)",
              }}>
              <FormatColorResetIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Popover>
    </>
  )
}
