import React, { useState } from 'react'
import { useDecisions } from '../contexts/DecisionsContext'
import Decision from '../models/Decision'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'

import DecisionList from '../components/DecisionList'
import ExplanationSidebar from '../components/ExplanationSidebar';

export default function Options() {
  const { decisions, setDecisions, selectedIndex } = useDecisions()
  const decision = selectedIndex != null ? decisions[selectedIndex] : null
  const [newOption, setNewOption] = useState('')

  function addOption() {
    if (!decision || !newOption) return
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    d.addOption(newOption)
    d.clearAllAnswers()
    copy[selectedIndex] = d
    setDecisions(copy)
    setNewOption('')
  }

  function removeOption(idx) {
    if (!decision) return
    const copy = [...decisions]
    const d = Decision.deserialize(JSON.parse(decision.serialize()))
    d.removeOption(decision.options[idx])
    copy[selectedIndex] = d
    setDecisions(copy)
  }



  return (
    // <Box sx={{ display: 'flex', gap: 3 }}>
    //   <DecisionList />
      <Box sx={{ flex: 1 }}>
        {!decision ? (
          <>
            <Typography variant="h4">Options</Typography>
            <Typography>Select a decision to manage options.</Typography>
          </>
        ) : (
          <>
            <Typography variant="h4">Options</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <TextField value={newOption} onChange={e => setNewOption(e.target.value)} label="New option" size="small" onKeyDown={e => { if (e.key === 'Enter') addOption()}}/>
              <Button variant="contained" onClick={addOption}>Add</Button>
            </Box>

            <List>
              {decision.options.map((o, i) => (
                <ListItem key={i} secondaryAction={<IconButton edge="end" onClick={() => removeOption(i)}><DeleteIcon /></IconButton>}>
                  {o}
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    //   <ExplanationSidebar page="options" />

    // </Box>
  )
}
