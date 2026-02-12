import React from 'react'
import Decision from '../models/Decision'
import { useDecisions } from '../contexts/DecisionsContext'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import DeleteIcon from '@mui/icons-material/Delete'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DownloadIcon from '@mui/icons-material/Download';
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import ExplanationSidebar from '../components/ExplanationSidebar';

export default function Dashboard() {
  const { decisions, setDecisions, setSelectedIndex } = useDecisions()
  const navigate = useNavigate()
  const fileInputRef = React.useRef(null)

  function goToDecision(i) {
    setSelectedIndex(i)
    navigate(`/decisions?selected=${i}`)
  }

  function downloadDecision(d) {
    try {
      const data = d.serialize()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safe = (d.name || 'decision').replace(/[^a-z0-9_.-]/gi, '_')
      a.href = url
      a.download = `${safe}.dec`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed', e)
      alert('Failed to download decision')
    }
  }

  function triggerImport() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    try {
      const txt = await f.text()
      const obj = JSON.parse(txt)
      const d = Decision.deserialize(obj)
      // ensure a unique name: if duplicate, append numeric suffix
      let baseName = d.name || 'Imported Decision'
      let uniqueName = baseName
      let suffix = 1
      while (decisions.some(dd => dd.name.toLowerCase() === uniqueName.toLowerCase())) {
        uniqueName = `${baseName} (${suffix})`
        suffix += 1
      }
      d.name = uniqueName
      setDecisions(prev => {
        const next = [...prev, d]
        setSelectedIndex(next.length - 1)
        return next
      })
    } catch (err) {
      console.error('Import failed', err)
      alert('Failed to import decision file')
    } finally {
      e.target.value = null
    }
  }

  function createDecision() {
    const name = window.prompt('Decision name')
    if (!name) return
    // prevent duplicate names
    if (decisions.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      alert('A decision with that name already exists. Choose a unique name.')
      return
    }
    const d = new Decision(name)
    d.addFactor({ name: 'Cost', unit: '$', optimal: 0, weight: 0.5, min: 0, max: 100 })
    d.addFactor({ name: 'Time', unit: 'hrs', optimal: 0, weight: 0.5, min: 0, max: 100 })
    d.addOption('Option A')
    d.addOption('Option B')
    d.clearAllAnswers()
    setDecisions(prev => {
      const next = [...prev, d]
      setSelectedIndex(next.length - 1)
      return next
    })
  }

  function removeDecision(idx) {
    setDecisions(prev => {
      const next = prev.filter((_, i) => i !== idx)
      return next
    })
  }

  return (
    // <Box sx={{ display: "flex", gap: 3 }}>
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".dec,application/json"
              onChange={handleImportFile}
              style={{ display: "none" }}
            />
          </Box>
        </Box>

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
                    button
                    onClick={() => goToDecision(i)}
                  >
                    <ListItemText
                      primary={d.name}
                      secondary={`${d.options.length} options • ${d.factors.names.length} factors`}
                    />
                    <ListItemSecondaryAction>
                      {/* We want to keep this as a download button, not an import button */}
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadDecision(d);
                        }}
                        title="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDecision(i);
                        }}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    //   <ExplanationSidebar page="Dashboard" />
    // </Box>
  );
}
