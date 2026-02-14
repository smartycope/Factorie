import React, { createContext, useContext, useEffect, useState } from "react";
import Decision from "../models/Decision";

const STORAGE_KEY = "factorie.decisions";

const DecisionsContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // if (!raw) {
    // Seed with example decisions for debugging

    // }
    const arr = JSON.parse(raw);
    return arr.map((d) => Decision.deserialize(d));
  } catch (e) {
    console.error("Failed to load decisions", e);
    return [];
  }
}

export function DecisionsProvider({ children }) {
  const [decisions, setDecisions] = useState(() => loadFromStorage());
  const [selectedIndex, setSelectedIndex] = useState(null);
  //   const { decisions, setDecisions, selectedIndex, setSelectedIndex } =
  // useDecisions();
  const decision = selectedIndex != null ? decisions[selectedIndex] : null;

  function addFactor(name) {
    // if (!decision || !newFactorName) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.addFactor({
      name: name,
      unit: null,
      optimal: 0,
      weight: 0.5,
      min: null,
      max: null,
    });
    copy[selectedIndex] = d;
    setDecisions(copy);
    // setNewFactorName("");
  }

  function editFactor(idx, patch) {
    if (!decision) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.editFactor(d.factors.names[idx], patch);
    copy[selectedIndex] = d;
    setDecisions(copy);
  }

  function removeFactor(idx) {
    if (!decision) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.removeFactor(d.factors.names[idx]);
    copy[selectedIndex] = d;
    setDecisions(copy);
  }

  function addOption(name) {
    // if (!decision || !newOptionName) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.addOption(name);
    d.clearAllAnswers();
    copy[selectedIndex] = d;
    setDecisions(copy);
    // setNewOptionName("");
  }

  function removeOption(idx) {
    if (!decision) return;
    const copy = [...decisions];
    const d = Decision.deserialize(JSON.parse(decision.serialize()));
    d.removeOption(d.options[idx]);
    copy[selectedIndex] = d;
    setDecisions(copy);
  }

  useEffect(() => {
    try {
      const raw = JSON.stringify(
        decisions.map((d) => JSON.parse(d.serialize())),
      );
      localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {
      console.error("Failed to save decisions", e);
    }
  }, [decisions]);

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
  };

  return (
    <DecisionsContext.Provider value={value}>
      {children}
    </DecisionsContext.Provider>
  );
}

export function useDecisions() {
  const ctx = useContext(DecisionsContext);
  if (!ctx)
    throw new Error("useDecisions must be used within DecisionsProvider");
  return ctx;
}

export default DecisionsContext;
