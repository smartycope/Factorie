import React from 'react'
import { useDecisions } from '../contexts/DecisionsContext'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

// TODO: move these to ListButtons instead of the depricated button prop on ListItem

export default function DecisionList({ sx }) {
  const { decisions, selectedIndex, setSelectedIndex } = useDecisions()

  return (
    <Box sx={{ width: 300, minWidth: 100, ...sx }}>
      <List>
        {decisions.map((d, i) => (
          <ListItem key={i} button selected={i === selectedIndex} onClick={() => setSelectedIndex(i)}>
            <ListItemText primary={d.name} secondary={`${d.options.length} options\n${d.factors.names.length} factors`} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
