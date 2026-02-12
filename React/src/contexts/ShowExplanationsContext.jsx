import React, { createContext, useContext, useEffect, useState } from 'react'
// import Decision from '../models/Decision'

// const STORAGE_KEY = 'factorie.decisions'

const ShowExplanationsContext = createContext(null)

export function ShowExplanationsProvider({ children }) {
  const [showExplanations, setShowExplanations] = useState(true)
//   const [selectedIndex, setSelectedIndex] = useState(null)

//   useEffect(() => {
//     try {
//       const raw = JSON.stringify(decisions.map(d => JSON.parse(d.serialize())))
//       localStorage.setItem(STORAGE_KEY, raw)
//     } catch (e) {
//       console.error('Failed to save decisions', e)
//     }
//   }, [decisions])

//   const value = {
//     decisions,
//     setDecisions,
//     selectedIndex,
//     setSelectedIndex,
//   }

  return <ShowExplanationsContext.Provider value={{showExplanations, setShowExplanations}}>{children}</ShowExplanationsContext.Provider>
}

// export function use() {
//   const ctx = useContext(DecisionsContext)
//   if (!ctx) throw new Error('useDecisions must be used within DecisionsProvider')
//   return ctx
// }

export default ShowExplanationsContext
