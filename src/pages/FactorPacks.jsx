import React from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import AddIcon from "@mui/icons-material/Add"
import DownloadIcon from "@mui/icons-material/Download"
import RemoveIcon from "@mui/icons-material/Remove"
import { useDecisions } from "../contexts/DecisionsContext"
import Decision from "../models/Decision"

// TODO: search bar on this page
// TODO: the "start new deicision" button is too wide now, it overlaps with the description

const factorPackModules = import.meta.glob("../factor-packs/*.json", {
  eager: true,
  import: "default",
})

const factorPacks = Object.entries(factorPackModules)
  .map(([path, pack]) => {
    const fileName = path.split("/").pop()
    const factors = pack.factors ?? []
    return {
      id: pack.name ?? fileName,
      fileName,
      name: pack.name ?? fileName,
      description: pack.description ?? "",
      decisionName: pack.decisionName ?? "",
      factors: factors.map((factor) => ({
        name: factor.name ?? "",
        unit: factor.unit ?? "",
        optimal: factor.optimal ?? null,
        min: factor.min ?? null,
        max: factor.max ?? null,
      })),
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

function FactorSummary({ factors }) {
  const preview = factors
    .slice(0, 3)
    .map((factor) => factor.name)
    .filter(Boolean)

  if (!preview.length) return null

  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1, flexWrap: "wrap" }}>
      {preview.map((name) => (
        <Chip key={name} label={name} size="small" variant="outlined" />
      ))}
      {factors.length > preview.length && (
        <Chip
          label={`+${factors.length - preview.length} more`}
          size="small"
          variant="outlined"
        />
      )}
    </Stack>
  )
}

function downloadFactorPackFactors(pack) {
  try {
    const text = `${pack.factors
      .map((factor) => factor.name)
      .filter(Boolean)
      .join("\n")}\n`
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    const safe = (pack.name || "factor-pack").replace(/[^a-z0-9_.-]/gi, "_")
    a.href = url
    a.download = `${safe}-factors.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error("Download failed", e)
    alert("Failed to download factors")
  }
}

export default function FactorPacks() {
  const {
    decisions,
    setDecisions,
    setSelectedIndex,
    decision,
    addFactorPack,
    removeFactorPack,
  } = useDecisions()
  const hasDecisions = decisions.length > 0
  const activePacks =
    decision?.factorPacks instanceof Set ?
      decision.factorPacks
    : new Set(decision?.factorPacks ?? [])

  function startNewDecisionFromPack(pack) {
    const newDecision = new Decision(pack.decisionName || pack.name)
    newDecision.addFactorPack(pack)
    setDecisions((prev) => {
      const next = [...prev, newDecision]
      setSelectedIndex(next.length - 1)
      return next
    })
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4">Factor Packs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Add reusable groups of factors to the current decision.
          </Typography>
        </Box>

        {!decision && (
          <Paper sx={{ p: 2 }}>
            <Typography>
              {hasDecisions ?
                "Select a decision before adding factor packs."
              : "Start a new decision from a factor pack."}
            </Typography>
          </Paper>
        )}

        {decision && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Packs in <i>{decision.name}</i>
            </Typography>
            {activePacks.size === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No factor packs added yet.
              </Typography>
            ) : (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {[...activePacks].map((packName) => (
                  <Chip key={packName} label={packName} color="primary" />
                ))}
              </Stack>
            )}
          </Paper>
        )}

        <Paper>
          <List disablePadding>
            {factorPacks.map((pack, index) => {
              const isActive = activePacks.has(pack.id)
              return (
                <React.Fragment key={pack.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    // alignItems="flex-start"
                    sx={{
                      alignItems: "flex-start",
                      py: 2,
                      pr: hasDecisions ? 34 : 45,
                    }}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        {hasDecisions ?
                          <Button
                            variant={isActive ? "outlined" : "contained"}
                            color={isActive ? "error" : "primary"}
                            startIcon={isActive ? <RemoveIcon /> : <AddIcon />}
                            disabled={!decision}
                            onClick={() =>
                              isActive ?
                                removeFactorPack(pack)
                              : addFactorPack(pack)
                            }
                          >
                            {isActive ? "Remove" : "Add"}
                          </Button>
                        : <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => startNewDecisionFromPack(pack)}
                          >
                            Start New Decision
                          </Button>
                        }
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => downloadFactorPackFactors(pack)}
                        >
                          Download
                        </Button>
                      </Stack>
                    }
                  >
                    <ListItemText
                      slotProps={{
                        secondary: { component: "div" },
                      }}
                      primary={
                        <Stack
                          direction="row"
                          spacing={1}

                          useFlexGap
                          sx={{ flexWrap: "wrap", alignItems: "center" }}
                        >
                          <Typography variant="h6">{pack.name}</Typography>
                          <Chip
                            label={`${pack.factors.length} factors`}
                            size="small"
                          />
                          {isActive && (
                            <Chip label="Added" size="small" color="primary" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Box component="span">
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            {pack.description}
                          </Typography>
                          {/* {pack.decisionName && (
                            <Typography
                              component="span"
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.75 }}
                            >
                              Suggested decision: {pack.decisionName}
                            </Typography>
                          )} */}
                          <FactorSummary factors={pack.factors} />
                        </Box>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              )
            })}
          </List>
        </Paper>
      </Stack>
    </Box>
  )
}
