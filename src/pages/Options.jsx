import React, { useState } from "react";
import { useDecisions } from "../contexts/DecisionsContext";
import Decision from "../models/Decision";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import DecisionList from "../components/DecisionList";
import ExplanationSidebar from "../components/ExplanationSidebar";

export default function Options() {
  const { decisions, selectedIndex, addOption, removeOption, renameOption } = useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null;
  const [newOption, setNewOption] = useState("");

  return (
    <Box sx={{ flex: 1 }}>
      {!decision ? (
        <>
          <Typography variant="h4">Options</Typography>
          <Typography>Select a decision to manage options.</Typography>
        </>
      ) : (
        <>
          <Typography variant="h4">Options</Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <TextField
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              label="New option"
              size="small"
              onKeyDown={(e) => {
                if (e.key === "Enter") addOption();
              }}
            />
            <Button variant="contained" onClick={addOption}>
              Add
            </Button>
          </Box>

          <List>
            {decision.options.map((o, i) => (
              <ListItem
                key={i}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeOption(i)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                {/* {o} */}
                <TextField
                  value={o}
                  onChange={(e) => {renameOption(i, e.target.value)}}
                  sx={{width: "100%"}}
                  size="small"
                  variant="standard"
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
}
