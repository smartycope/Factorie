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
import RemoveIcon from "@mui/icons-material/Remove"
import { useDecisions } from "../contexts/DecisionsContext"

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

export default function FactorPacks() {
  const { decision, addFactorPack, removeFactorPack } = useDecisions()
  const activePacks =
    decision?.factorPacks instanceof Set ?
      decision.factorPacks
    : new Set(decision?.factorPacks ?? [])

  return (
    <Box sx={{ flex: 1, width: "100%", maxWidth: 960 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h4">Factor Packs</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Add reusable groups of factors to the current decision.
          </Typography>
        </Box>

        {!decision && (
          <Paper sx={{ p: 2 }}>
            <Typography>Select a decision before adding factor packs.</Typography>
          </Paper>
        )}

        {decision && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Packs in {decision.name}
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
                    sx={{ alignItems: "flex-start", py: 2, pr: 18 }}
                    secondaryAction={
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
