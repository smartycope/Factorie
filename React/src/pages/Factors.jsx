import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Slider from "@mui/material/Slider";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// Select/MenuItem not needed anymore
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import DecisionList from "../components/DecisionList";
import { useDecisions } from "../contexts/DecisionsContext";
import Decision from "../models/Decision";
import ExplanationSidebar from "../components/ExplanationSidebar";
import {Tooltip} from "@mui/material";
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import texts from '../assets/texts.json';

export default function Factors() {
  const { decisions, setDecisions, selectedIndex } = useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null;

  const [quickAddName, setQuickAddName] = useState("");
  const [addError, setAddError] = useState("");

  // Add form state
  const [addName, setAddName] = useState("");
  const [addUnit, setAddUnit] = useState("");
  const [addOptimal, setAddOptimal] = useState(0);
  const [addWeight, setAddWeight] = useState(1);
  const [addMinUnbounded, setAddMinUnbounded] = useState(false);
  const [addMaxUnbounded, setAddMaxUnbounded] = useState(false);
  const [addMin, setAddMin] = useState(0);
  const [addMax, setAddMax] = useState(10);

  // Edit state tracks which factor (by name) is being modified. We reuse the add form fields while editing.
  const [editFactorName, setEditFactorName] = useState("");

  useEffect(() => {
    // when decision changes, reset forms (scheduled to avoid sync setState in effect)
    const t = setTimeout(() => {
      setAddName("");
      setAddUnit("");
      setAddOptimal(0);
      setAddWeight(1);
      setAddMinUnbounded(false);
      setAddMaxUnbounded(false);
      setAddMin(0);
      setAddMax(10);

      setEditFactorName("");
      setQuickAddName("");
      setAddError("");
    }, 0);
    return () => clearTimeout(t);
  }, [selectedIndex]);

  // when choosing factor to edit, populate fields
  useEffect(() => {
    if (!editFactorName) return;
    const idx = decision.factors.names.indexOf(editFactorName);
    if (idx === -1) return;
    const t = setTimeout(() => {
      // fill the add form with the selected factor's values
      setAddName(editFactorName);
      setAddUnit(decision.factors.units[idx] ?? "");
      setAddOptimal(decision.factors.optimals[idx] ?? 0);
      setAddWeight(
        Number.isFinite(decision.factors.weights[idx])
          ? decision.factors.weights[idx]
          : 1,
      );
      setAddMinUnbounded(decision.factors.mins[idx] == null);
      setAddMaxUnbounded(decision.factors.maxs[idx] == null);
      setAddMin(decision.factors.mins[idx] ?? 0);
      setAddMax(decision.factors.maxs[idx] ?? 10);
    }, 0);
    return () => clearTimeout(t);
  }, [editFactorName, decision]);

  function saveDecision(newDecision) {
    const copy = [...decisions];
    copy[selectedIndex] = newDecision;
    setDecisions(copy);
  }

  function handleAdd() {
    // validate name
    if (!addName || !addName.trim()) {
      setAddError("Factor name is required");
      return;
    }
    if (
      !addMinUnbounded &&
      !addMaxUnbounded &&
      Number(addMin) >= Number(addMax)
    ) {
      setAddError("Min must be less than Max");
      return;
    }
    setAddError("");

    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    if (editFactorName) {
      // modify existing factor (do not change name)
      d.editFactor(editFactorName, {
        unit: addUnit || undefined,
        optimal: Number(addOptimal),
        weight: Number(addWeight),
        min: addMinUnbounded ? null : Number(addMin),
        max: addMaxUnbounded ? null : Number(addMax),
      });
      saveDecision(d);
      // exit edit mode
      setEditFactorName("");
      // reset add form
      setAddName("");
      setAddUnit("");
      setAddOptimal(0);
      setAddWeight(1);
      setAddMinUnbounded(false);
      setAddMaxUnbounded(false);
      setAddMin(0);
      setAddMax(10);
      return;
    }

    // normal add
    d.addFactor({
      name: addName.trim(),
      unit: addUnit || null,
      optimal: Number(addOptimal),
      weight: Number(addWeight),
      min: addMinUnbounded ? null : Number(addMin),
      max: addMaxUnbounded ? null : Number(addMax),
    });
    saveDecision(d);
    // clear name
    setAddName("");
  }

  function handleRemove(factorToRemove) {
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.removeFactor(factorToRemove);
    saveDecision(d);
  }

  function handleQuickAdd() {
    if (!quickAddName || !quickAddName.trim()) return;
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.addFactor({ name: quickAddName.trim() });
    saveDecision(d);
    setQuickAddName("");
  }

  const onDragStart = (e, idx) => {
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDropRow = (e, targetIdx) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    const to = targetIdx;
    if (Number.isNaN(from)) return;
    if (from === to) return;
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    const move = (arr) => {
      const item = arr.splice(from, 1)[0];
      arr.splice(to, 0, item);
    };
    move(d.factors.names);
    move(d.factors.units);
    move(d.factors.optimals);
    move(d.factors.weights);
    move(d.factors.mins);
    move(d.factors.maxs);
    for (let r = 0; r < d.answers.length; r++) {
      const col = d.answers[r].splice(from, 1)[0];
      d.answers[r].splice(to, 0, col);
    }
    saveDecision(d);
  };

  return (
    // <Box sx={{ display: "flex", gap: 3, flex: 1}}>
    //   <DecisionList />
    !decision ? (
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Factors</Typography>
        <Typography>Please select or create a decision first.</Typography>
      </Box>
    ) : (
      <Box sx={{ flex: 1 }}>
        <Typography variant="h4">Factors</Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            label="New factor name"
            value={quickAddName}
            onChange={(e) => setQuickAddName(e.target.value)}
            size="small"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuickAdd();
            }}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" onClick={handleQuickAdd}>
            Quick add
          </Button>
          <Tooltip title={texts.factors.quick_add}><HelpOutlineIcon/></Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Paper sx={{ p: 2, width: 700 }}>
            <Box sx={{ mb: 1 }}></Box>

            <Box sx={{ mt: 1 }}>
              <TextField
                label="Factor"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                disabled={Boolean(editFactorName)}
                helperText={
                  editFactorName ? "Name cannot be changed while editing" : ""
                }
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <TextField
                label="Unit"
                placeholder="0-10 scale"
                value={addUnit}
                onChange={(e) => setAddUnit(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <TextField
                label="Optimal"
                type="number"
                value={addOptimal}
                onChange={(e) => setAddOptimal(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography>How much do you care?</Typography>
                <Slider
                  value={addWeight * 100}
                  onChange={(e, v) => setAddWeight(v / 100)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                />
              </Box>
              <Box sx={{ mt: 1, mb: 1 }}>
                <Typography variant="subtitle2">Scale</Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addMinUnbounded}
                          onChange={(e) => setAddMinUnbounded(e.target.checked)}
                        />
                      }
                      label="Min Unbounded"
                    />
                    <TextField
                      label="Min"
                      type="number"
                      value={addMin}
                      onChange={(e) => setAddMin(e.target.value)}
                      size="small"
                      disabled={addMinUnbounded}
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={addMaxUnbounded}
                          onChange={(e) => setAddMaxUnbounded(e.target.checked)}
                        />
                      }
                      label="Max Unbounded"
                    />
                    <TextField
                      label="Max"
                      type="number"
                      value={addMax}
                      onChange={(e) => setAddMax(e.target.value)}
                      size="small"
                      disabled={addMaxUnbounded}
                      fullWidth
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </Box>
              {addError && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {addError}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                {editFactorName ? (
                  <>
                    <Button variant="contained" onClick={handleAdd}>
                      Modify
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => {
                        // cancel edit
                        setEditFactorName("");
                        setAddName("");
                        setAddUnit("");
                        setAddOptimal(0);
                        setAddWeight(1);
                        setAddMinUnbounded(false);
                        setAddMaxUnbounded(false);
                        setAddMin(0);
                        setAddMax(10);
                      }}
                      sx={{ ml: 1 }}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="contained" onClick={handleAdd}>
                    Add
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          {/* <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Factors</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Edit or delete rows directly below; drag the rows to reorder factors.</Typography>
            <Box>
            </Box>
          </Paper> */}
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6">Current Factors</Typography>
          <Paper sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Unit</TableCell>
                  <TableCell>Optimal</TableCell>
                  <TableCell>Weight</TableCell>
                  <TableCell>Min</TableCell>
                  <TableCell>Max</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {decision.factors.names.map((name, i) => (
                  <TableRow
                    key={name}
                    draggable
                    onDragStart={(e) => onDragStart(e, i)}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDropRow(e, i)}
                  >
                    <TableCell>{name}</TableCell>
                    <TableCell>{decision.factors.units[i] ?? ""}</TableCell>
                    <TableCell>
                      {String(decision.factors.optimals[i] ?? "")}
                    </TableCell>
                    <TableCell>
                      {Number.isFinite(decision.factors.weights[i])
                        ? (decision.factors.weights[i] * 100).toFixed(0) + "%"
                        : ""}
                    </TableCell>
                    <TableCell>
                      {decision.factors.mins[i] == null
                        ? "calculated"
                        : String(decision.factors.mins[i])}
                    </TableCell>
                    <TableCell>
                      {decision.factors.maxs[i] == null
                        ? "calculated"
                        : String(decision.factors.maxs[i])}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => setEditFactorName(name)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(name)}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      </Box>
    )
    //   {/* <ExplanationSidebar page="factors" />
    // </Box> */}
  );
}
