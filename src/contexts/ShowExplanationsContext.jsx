import { createContext, useEffect, useState } from 'react'

const STORAGE_KEY = "factorie.showExplanations"

const ShowExplanationsContext = createContext(null)

function loadFromStorage() {
  try {
    const storedValue = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return typeof storedValue === "boolean" ? storedValue : true
  } catch (e) {
    console.error("Failed to load show explanations preference", e)
    return true
  }
}

export function ShowExplanationsProvider({ children }) {
  const [showExplanations, setShowExplanations] = useState(loadFromStorage)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(showExplanations))
    } catch (e) {
      console.error("Failed to save show explanations preference", e)
    }
  }, [showExplanations])

  return <ShowExplanationsContext.Provider value={{showExplanations, setShowExplanations}}>{children}</ShowExplanationsContext.Provider>
}

export default ShowExplanationsContext
