import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DecisionsProvider } from './contexts/DecisionsContext'
import {ShowExplanationsProvider} from './contexts/ShowExplanationsContext.jsx';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ShowExplanationsProvider>
        <DecisionsProvider>
          <App />
        </DecisionsProvider>
        </ShowExplanationsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
