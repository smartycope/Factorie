import React, { createContext, useContext, useEffect, useState } from "react";
import Decision from "../models/Decision";

const STORAGE_KEY = "factorie.decisions";

const DecisionsContext = createContext(null);

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // if (!raw) {
    // Seed with example decisions for debugging
    const ex1 = JSON.parse(
      `{"name":"What to eat","factors":{"names":["Taste","Cost","Healthiness","Time to Make","Leftovers","Test"],"units":["0-10","$","0-10","minutes","portions","na"],"optimals":[10,0,10,0,5,10],"weights":[0.9,1,1,0.6,0.2,0.5],"mins":[0,0,0,null,0,0],"maxs":[10, null,10,null,null,10]},"options":["Taco Bell","Spaghetti","Tacos","Leftovers","Chicken noodle soup"],"answers":[[[8,8],[15,15],[6,6],[15,30],[1,1],[9.3,9.3]],[[3,3],[5,6],[8,8],[20,20],[1,1],[0.7,0.7]],[[10,10],[8,8],[9,9],[10,10],[1,1],[2,8]],[[5,5],[1,1],[9,9],[5,5],[1,1],[3,4]],[[9,9],[4,4],[10,10],[10,10],[5,5],[2,4]]],"threshold":0,"factor_packs":[]} `,
    );
    const ex2 = JSON.parse(
      `{"name":"What to do","factors":{"names":["Fun","Time","Cost","Test"],"units":["0-10","minutes","$","na"],"optimals":[10,0,0,10],"weights":[1,0.6,1,0.5],"mins":[0,null,0,0],"maxs":[10,null,null,10]},"options":["Watch Netflix","Play video games","Watch a movie"],"answers":[[[8,8],[2,2],[1,1],[10,10]],[[10,10],[2,2],[1,1],[10,10]],[[8,8],[2,2],[1,1],[10,10]]],"threshold":0,"factor_packs":[]} `,
    );
    return [Decision.deserialize(ex1), Decision.deserialize(ex2)];
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
