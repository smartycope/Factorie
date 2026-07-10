import { createContext, useState } from 'react'

const ShowExplanationsContext = createContext(null)

export function ShowExplanationsProvider({ children }) {
  const [showExplanations, setShowExplanations] = useState(true)
  return <ShowExplanationsContext.Provider value={{showExplanations, setShowExplanations}}>{children}</ShowExplanationsContext.Provider>
}

export default ShowExplanationsContext
