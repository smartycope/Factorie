import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { DecisionsProvider } from './contexts/DecisionsContext'
import {ShowExplanationsProvider} from './contexts/ShowExplanationsContext.jsx';
import {ToastProvider} from './contexts/ToastContext.jsx';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter basename={'/'}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ShowExplanationsProvider>
        <ToastProvider>
        <DecisionsProvider>
          <App />
        </DecisionsProvider>
        </ToastProvider>
        </ShowExplanationsProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
