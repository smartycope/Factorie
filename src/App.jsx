import './App.css'
import './index.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Decisions from './pages/Decision'
import Options from './pages/Options'
import Factors from './pages/Factors'
import FactorPacks from './pages/FactorPacks'
import Weights from './pages/Weights'
import Quiz from './pages/Quiz'
import ViewResults from './pages/Results'
import Save from './pages/Save'
import Explanation from './pages/Explanation'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="options" element={<Options />} />
        <Route path="factors" element={<Factors />} />
        <Route path="factor-packs" element={<FactorPacks />} />
        <Route path="weights" element={<Weights />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="results" element={<ViewResults />} />
        <Route path="save" element={<Save />} />
        <Route path="explanation" element={<Explanation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
