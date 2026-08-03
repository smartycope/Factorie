import React from "react";
import Decision from "../models/Decision";
import { useDecisions } from "../contexts/UseDecisions";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import TableViewIcon from "@mui/icons-material/TableView";
import LaunchIcon from '@mui/icons-material/Launch';
import examplePack from "../factor-packs/example.json"
import {
  createDecisionSpreadsheet,
  parseDecisionSpreadsheet,
} from "../utils/decisionSpreadsheet"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import {downloadedFilename} from "../utils/misc";
import xlsxTemplate from "../assets/Decision template.xlsx"

export default function Dashboard() {
  const {
    decisions,
    setDecisions,
    setSelectedIndex,
    selectedIndex,
    createDecision,
    removeDecision,
  } = useDecisions();
  const navigate = useNavigate();
  const decFileInputRef = React.useRef(null);
  const spreadsheetFileInputRef = React.useRef(null);
  const [isImportDialogOpen, setImportDialogOpen] = React.useState(false);

  function addExamples() {
    const ex1 = JSON.parse(
      `{"name":"What should I eat for dinner?","factors":[{"name":"Taste","unit":"0-10","optimal":10,"weight":0.9,"min":0,"max":10},{"name":"Cost","unit":"$","optimal":0,"weight":1,"min":0,"max":null},{"name":"Healthiness","unit":"0-10","optimal":10,"weight":0.85,"min":0,"max":10},{"name":"Time to Make","unit":"minutes","optimal":0,"weight":0.6,"min":null,"max":null},{"name":"Leftovers","unit":"portions","optimal":"Infinity","weight":0.2,"min":0,"max":null}],"options":["Taco Bell","Spaghetti","Tacos","Leftovers","Chicken noodle soup"],"answers":[[[8,8],[15,15],[6,6],[15,30],[1,1]],[[3,3],[5,6],[8,8],[20,20],[1,1]],[[10,10],[8,8],[9,9],[10,10],[1,1]],[[5,5],[1,1],[9,9],[5,5],[1,1]],[[9,9],[4,4],[10,10],[10,10],[5,5]]],"threshold":0,"factorPacks":["Choosing Dinner"]}`,
    );
    ex1.factorPacks = [examplePack.name];
    const exampleDecision = Decision.deserialize(ex1);

    setDecisions((prev) => {
      const existingIndex = prev.findIndex((d) => d.name === exampleDecision.name);
      if (existingIndex === -1) return [...prev, exampleDecision];

      const next = [...prev];
      next[existingIndex] = exampleDecision;
      return next;
    });
  }

  function goToDecision(i) {
    setSelectedIndex(i);
    navigate(`/decisions`);
  }

  function downloadFile({ createData, type, filename, failureMessage }) {
    try {
      const blob = new Blob([createData()], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      alert(failureMessage);
    }
  }

  function downloadDecision(decision) {
    downloadFile({
      createData: () => decision.serialize(),
      type: "application/json",
      filename: downloadedFilename(decision.name, "dec"),
      failureMessage: "Failed to download decision",
    })
  }

  function triggerImport() {
    setImportDialogOpen(true);
  }

  function chooseImport(type) {
    setImportDialogOpen(false)
    if (type === "dec") decFileInputRef.current?.click()
    else spreadsheetFileInputRef.current?.click()
  }

  async function handleDecImportFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const txt = await f.text();
      const obj = JSON.parse(txt);
      const d = Decision.deserialize(obj);
      // ensure a unique name: if duplicate, append numeric suffix
      let baseName = d.name || "Imported Decision";
      let uniqueName = baseName;
      let suffix = 1;
      while (
        decisions.some(
          (dd) => dd.name.toLowerCase() === uniqueName.toLowerCase(),
        )
      ) {
        uniqueName = `${baseName} (${suffix})`;
        suffix += 1;
      }
      d.name = uniqueName;
      setDecisions((prev) => {
        const next = [...prev, d];
        setSelectedIndex(next.length - 1);
        return next;
      });
    } catch (err) {
      console.error("Import failed", err);
      alert("Failed to import decision file");
    } finally {
      e.target.value = null;
    }
  }

  async function handleSpreadsheetImportFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const warnings = []
      const importedDecision = parseDecisionSpreadsheet(
        await file.arrayBuffer(),
        { onWarning: (warning) => warnings.push(warning) },
      )
      if (warnings.length)
        alert(`Spreadsheet imported with warnings:\n\n${warnings.join("\n\n")}`)
      const existingIndex = decisions.findIndex(
        (decision) => decision.name.toLowerCase() === importedDecision.name.toLowerCase(),
      )
      if (
        existingIndex !== -1 &&
        !window.confirm(
          `A decision named "${importedDecision.name}" already exists. Do you want to overwrite it?`,
        )
      )
        return

      setDecisions((previous) => {
        const next = [...previous]
        const index = next.findIndex(
          (decision) => decision.name.toLowerCase() === importedDecision.name.toLowerCase(),
        )
        if (index === -1) {
          next.push(importedDecision)
          setSelectedIndex(next.length - 1)
        } else {
          next[index] = importedDecision
          setSelectedIndex(index)
        }
        return next
      })
    } catch (error) {
      console.error("Spreadsheet import failed", error)
      alert(`Unable to import spreadsheet:\n${error.message}`)
    } finally {
      e.target.value = null
    }
  }

  function downloadSpreadsheet(decision) {
    downloadFile({
      createData: () => createDecisionSpreadsheet(decision),
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: downloadedFilename(decision.name, "xlsx"),
      failureMessage: "Failed to download spreadsheet",
    })
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" onClick={createDecision}>
            New Decision
          </Button>
          <Button
            variant="outlined"
            onClick={triggerImport}
            startIcon={<UploadFileIcon />}
          >
            Import
          </Button>
          {/* <Button onClick={downloadTemplate}>
            Download Template
          </Button> */}
          <a href={xlsxTemplate} download="Decision template.xlsx" target="_blank" rel="noreferrer"><Button variant="outlined" startIcon={<DownloadIcon />}>Download Template</Button></a>
          <input
            ref={decFileInputRef}
            type="file"
            accept=".dec,application/json"
            onChange={handleDecImportFile}
            style={{ display: "none" }}
          />
          <input
            ref={spreadsheetFileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleSpreadsheetImportFile}
            style={{ display: "none" }}
          />
        </Box>
      </Box>
      {(decisions.length || null) && <Typography variant="subtitle1">
        Currently Deciding: <i>{decisions[selectedIndex]?.name}</i>
      </Typography>}

      {decisions.length === 0 ? (
        <Typography>No decisions yet — create one to get started.</Typography>
      ) : (
        <Card>
          <CardContent>
            <List>
              {decisions.map((d, i) => (
                <ListItem
                  key={i}
                  divider
                  disablePadding
                  secondaryAction={
                    <>
                      <IconButton
                        edge="start"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToDecision(i);
                        }}
                        title="Open"
                      >
                        <LaunchIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDecision(d);
                        }}
                        title="Download as a JSON file (.dec)"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadSpreadsheet(d);
                        }}
                        title="Download as a spreadsheet (.xlsx)"
                      >
                        <TableViewIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            !window.confirm(
                              `Are you sure you want to delete "${d.name}"? This action cannot be undone.`,
                            )
                          )
                            return;
                          removeDecision(i);
                        }}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                >
                  <ListItemButton
                    selected={i === selectedIndex}
                    onClick={() => setSelectedIndex(i)}
                  >
                    <ListItemText
                      primary={d.name}
                      secondary={`${d.options.length} options • ${d.factors.length} factors`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
      {(
        <Button variant="outlined" sx={{ mt: 2 }} onClick={addExamples}>
          Load example
        </Button>
      )}
      <Dialog
        open={isImportDialogOpen}
        onClose={() => setImportDialogOpen(false)}
      >
        <DialogTitle>Import decision</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose the kind of decision file you want to import.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => chooseImport("dec")}>Decision file (.dec)</Button>
          <Button variant="contained" onClick={() => chooseImport("xlsx")}>
            Spreadsheet (.xlsx)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
