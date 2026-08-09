import { createContext, useEffect, useState } from "react"
import Decision from "../models/Decision"

const STORAGE_KEY = "factorie.decisions"
// In case something terrible goes wrong:
// localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
const DecisionsContext = createContext(null)

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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
        color: patch.color ?? null,
      }),
    )
  }

  function editFactor(
    idx,
    patch,
    clearExistingAnswers = false,
    markExistingAnswersTentative = false,
  ) {
    modifyCurrentDecision((d) => {
      d.editFactor(idx, patch)
      if (clearExistingAnswers) d.clearFactorAnswers(idx)
      else if (markExistingAnswersTentative) d.markFactorAnswersTentative(idx)
    })
  }

  function removeFactor(idx) {
    modifyCurrentDecision((d) => d.removeFactor(idx))
  }

  function reorderFactors(order) {
    modifyCurrentDecision((d) => d.reorderFactors(order))
  }

  function addOption(name = "") {
    modifyCurrentDecision((d) => d.addOption(name))
  }

  function removeOption(idx) {
    modifyCurrentDecision((d) => d.removeOption(idx))
  }

  function reorderOptions(order) {
    modifyCurrentDecision((d) => d.reorderOptions(order))
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
    modifyCurrentDecision((d) => d.renameOption(optionIndex, name))
  }

  function setOptionNote(optionIndex, note) {
    modifyCurrentDecision((d) => d.setOptionNote(optionIndex, note))
  }

  function setOptionHidden(optionIndex, hidden) {
    modifyCurrentDecision((d) => d.setOptionHidden(optionIndex, hidden))
  }

  function setOptionColor(optionIndex, color) {
    modifyCurrentDecision((d) => d.setOptionColor(optionIndex, color))
  }

  function renameFactor(factorIndex, name) {
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
    reorderFactors,
    addOption,
    removeOption,
    reorderOptions,
    decision,
    createDecision,
    removeDecision,
    setAnswer,
    renameOption,
    setOptionNote,
    setOptionHidden,
    setOptionColor,
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

export default DecisionsContext
