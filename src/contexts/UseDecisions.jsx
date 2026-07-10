import { useContext } from "react"
import DecisionsContext from "./DecisionsContext"

export function useDecisions() {
  const ctx = useContext(DecisionsContext)
  if (!ctx)
    throw new Error("useDecisions must be used within DecisionsProvider")
  return ctx
}
