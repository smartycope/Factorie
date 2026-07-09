import React, { createContext, useContext, useEffect, useState } from "react"
import Decision from "../models/Decision"

const STORAGE_KEY = "factorie.decisions"
// In case something terrible goes wrong:
// localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
const DecisionsContext = createContext(null)

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // if (!raw) {
    // Seed with example decisions for debugging

    // }
    const arr = JSON.parse(raw)
    return arr.map((d) => Decision.deserialize(d))
  } catch (e) {
    console.error("Failed to load decisions", e)
    return []
  }
}

export function DecisionsProvider({ children }) {
  const [decisions, setDecisions] = useState(() => loadFromStorage())
  const [selectedIndex, setSelectedIndex] = useState(0)
  //   const { decisions, setDecisions, selectedIndex, setSelectedIndex } =
  // useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null

  useEffect(() => {
    try {
      const raw = JSON.stringify(
        decisions.map((d) => JSON.parse(d.serialize())),
      )
      localStorage.setItem(STORAGE_KEY, raw)
    } catch (e) {
      console.error("Failed to save decisions", e)
    }
  }, [decisions])

  function modifyCurrentDecision(func) {
    if (!decision) return
    const copy = [...decisions]

    const dec = decision.copy()
    func(dec)
    copy[selectedIndex] = dec
    setDecisions(copy)
  }

  function addFactor(factor = "") {
    const patch =
      typeof factor === "object" && factor !== null ?
        factor
      : { name: factor ?? "" }
    modifyCurrentDecision((d) =>
      d.addFactor({
        name: patch.name ?? "",
        unit: patch.unit ?? null,
        optimal: patch.optimal ?? null,
        weight: patch.weight ?? 0.0,
        min: patch.min ?? null,
        max: patch.max ?? null,
      }),
    )
  }

  function editFactor(idx, patch) {
    modifyCurrentDecision((d) => d.editFactor(idx, patch))
  }

  function removeFactor(idx) {
    modifyCurrentDecision((d) => d.removeFactor(idx))
  }

  function addOption(name = "") {
    console.log('adding option', name)
    modifyCurrentDecision((d) => d.addOption(name))
  }

  function removeOption(idx) {
    modifyCurrentDecision((d) => d.removeOption(idx))
  }

  function createDecision() {
    const name = window.prompt("Decision name")
    if (!name) return
    // prevent duplicate names
    if (decisions.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      alert("A decision with that name already exists. Choose a unique name.")
      return
    }
    const d = new Decision(name)
    d.addFactor({
      name: "Cost",
      unit: "$",
      optimal: 0,
      weight: 0.5,
      min: 0,
      max: 100,
    })
    d.addFactor({
      name: "Time",
      unit: "hrs",
      optimal: 0,
      weight: 0.5,
      min: 0,
      max: 100,
    })
    d.addOption("Option A")
    d.addOption("Option B")
    d.clearAllAnswers()
    setDecisions((prev) => {
      const next = [...prev, d]
      setSelectedIndex(next.length - 1)
      return next
    })
  }

  function removeDecision(idx) {
    setDecisions((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      return next
    })
  }

    // Throws an error if it can't parse
  function setAnswer(option, factor, answerStr) {
    modifyCurrentDecision((d) => d.setAnswer(option, factor, answerStr))
  }

  function renameOption(optionIndex, name) {
    // if (!decision) return
    // const nextName = name.trim()
    // const currentName = decision.options[optionIndex]
    // if (nextName === currentName) return true
    // if (!nextName) return false
    // if (
    //   decision.options.some(
    //     (opt, idx) =>
    //       idx !== optionIndex && opt.toLowerCase() === nextName.toLowerCase(),
    //   )
    // ) {
    //   alert("Another option already uses that name; choose a unique name.")
    //   return false
    // }
    // const copy = [...decisions]
    // const d = Decision.deserialize(JSON.parse(decision.serialize()))
    // d.options[optionIndex] = nextName
    // copy[selectedIndex] = d
    // setDecisions(copy)
    // return true
    modifyCurrentDecision((d) => d.renameOption(optionIndex, name))
  }

  function renameFactor(factorIndex, name) {
    // if (!decision) return false
    // const nextName = name.trim()
    // const currentName = decision.factors.names[factorIndex]
    // if (nextName === currentName) return true
    // if (!nextName) return false
    // if (
    //   decision.factors.names.some(
    //     (factor, idx) =>
    //       idx !== factorIndex &&
    //       factor.toLowerCase() === nextName.toLowerCase(),
    //   )
    // ) {
    //   alert("Another factor already uses that name; choose a unique name.")
    //   return false
    // }
    // const copy = [...decisions]
    // const d = Decision.deserialize(JSON.parse(decision.serialize()))
    // d.factors.names[factorIndex] = nextName
    // copy[selectedIndex] = d
    // setDecisions(copy)
    // return true
    return editFactor(factorIndex, { name })
  }

  function renameDecision(name) {
    modifyCurrentDecision((d) => d.name = name)
  }

  function addFactorPack(name) {
    modifyCurrentDecision((d) => d.addFactorPack(name))
  }
  function removeFactorPack(name) {
    modifyCurrentDecision((d) => d.removeFactorPack(name))
  }

  const value = {
    decisions,
    setDecisions,
    selectedIndex,
    setSelectedIndex,
    addFactor,
    editFactor,
    removeFactor,
    addOption,
    removeOption,
    decision,
    createDecision,
    removeDecision,
    setAnswer,
    renameOption,
    renameFactor,
    renameDecision,
    addFactorPack,
    removeFactorPack,
    modifyCurrentDecision,
  }

  return (
    <DecisionsContext.Provider value={value}>
      {children}
    </DecisionsContext.Provider>
  )
}

export function useDecisions() {
  const ctx = useContext(DecisionsContext)
  if (!ctx)
    throw new Error("useDecisions must be used within DecisionsProvider")
  return ctx
}

export default DecisionsContext
