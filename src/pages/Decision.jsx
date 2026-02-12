import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDecisions } from "../contexts/DecisionsContext";
import Decision from "../models/Decision";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import DecisionList from "../components/DecisionList";
import Explanation from "./Explanation";
import ExplanationSidebar from "../components/ExplanationSidebar";

function FactorIndivudialEditTable({}) {
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
  } = useDecisions();
  const [newFactorName, setNewFactorName] = useState("");

  const factorTableCellSx = { minWidth: 50 };

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
        <TextField
          label="New factor name"
          value={newFactorName}
          onChange={(e) => setNewFactorName(e.target.value)}
          size="small"
          onKeyDown={(e) => {
            if (e.key === "Enter") addFactor();
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
                      Number.isFinite(decision.factors.weights[idx])
                        ? decision.factors.weights[idx]
                        : ""
                    }
                    sx={factorTableCellSx}
                    onChange={(e) =>
                      editFactor(idx, {
                        weight:
                          e.target.value === ""
                            ? null
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
                          e.target.value === ""
                            ? null
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
                          e.target.value === ""
                            ? null
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
  );
}

function DecisionInduvidualEditTable({}) {
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
  } = useDecisions();
  const [newOptionName, setNewOptionName] = useState("");
  const optionTableCellSx = { minWidth: 80 };

  function setAnswer(option, factor, answerStr) {
    if (!decision) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    try {
      d.setAnswer(option, factor, answerStr);
      copy[selectedIndex] = d;
      setDecisions(copy);
    } catch (e) {
      // TODO: show basic alert for invalid input; we could improve with inline validation
      alert(e.message);
    }
  }
  // const [newOptionName, setNewOptionName] = useState("");
  return (<>
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
                    const ans = decision.answers?.[oi]?.[fi];
                    if (!ans) return "";
                    const a = ans[0];
                    const b = ans[1];
                    const hasA = Number.isFinite(a);
                    const hasB = Number.isFinite(b);
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
                            if (!hasA && !hasB) return "";
                            if (!hasA) return `${b}`;
                            if (!hasB) return `${a}`;
                            if (a === b) return `${a}`;
                            return `${a} - ${b}`;
                          })()}
                          onBlur={(e) => setAnswer(opt, fac, e.target.value)}
                        />
                      </TableCell>
                    );
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
        </TableContainer></>
)}

export default function Decisions() {
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
  } = useDecisions();
  // const decision = selectedIndex != null ? decisions[selectedIndex] : null;

  const [newOptionName, setNewOptionName] = useState("");
  const [nameRef] = [React.createRef()];

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sel = searchParams.get("selected");
    if (sel != null) {
      const idx = parseInt(sel, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < decisions.length) {
        setSelectedIndex(idx);
      }
    }
  }, [searchParams, decisions, setSelectedIndex]);

  function applyRename() {
    if (!decision) return;
    const val = nameRef.current?.value || "";
    if (!val) return;
    // prevent duplicate names
    if (
      decisions.some(
        (other, idx) =>
          idx !== selectedIndex &&
          other.name.toLowerCase() === val.toLowerCase(),
      )
    ) {
      alert("Another decision already uses that name; choose a unique name.");
      return;
    }
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.name = val;
    copy[selectedIndex] = d;
    setDecisions(copy);
  }


  let content;
  if (!decision)
    content = (
      <>
        <Typography variant="h4">Decisions</Typography>
        <Typography>Add a decision to get started.</Typography>
      </>
    );
  else
    content = (
      <>
        <Typography variant="h4">Decisions</Typography>

        {/* <Button
              variant="contained"
              onClick={createDecision}
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
            >
              New Decision
            </Button> */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            inputRef={nameRef}
            defaultValue={decision?.name || ""}
            size="small"
          />
          <Button variant="outlined" onClick={applyRename}>
            Rename
          </Button>
        </Box>

        {/* <Divider sx={{ my: 2 }} /> */}
        {/* <Typography variant="h6">Factors</Typography> */}
        {/* <FactorIndivudialEditTable/> */}

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Options & Answers</Typography>
         <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
          <TextField
            label="New option name"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter") addOption();
            }}
          />
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={addOption}
          >
            Add Option
          </Button>
        </Box>

        <DecisionInduvidualEditTable/>
      </>
    );

  return (
    // <Box sx={{ display: "flex", gap: 3 }}>
      // {/* <DecisionList /> */}
      <Box sx={{ flex: 1 }}>{content}</Box>
      // {/* <ExplanationSidebar page="decision" /> */}
    // </Box>
  );
}
