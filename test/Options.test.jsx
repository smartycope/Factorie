import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Decision from "../src/models/Decision.js"
import Options from "../src/pages/Options.jsx"

const STORAGE_KEY = "factorie.decisions"

function createDecision() {
  const decision = new Decision("Dinner")
  decision.addFactor({
    name: "Taste",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Alpha")
  decision.addOption("Bravo")
  return decision
}

function seedDecision(decision = createDecision()) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
}

function savedDecision() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY))[0]
}

function renderOptions() {
  return render(
    <ThemeProvider theme={createTheme()}>
      <DecisionsProvider>
        <Options />
      </DecisionsProvider>
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(cleanup)

test("Options adds an option and saves notes for the selected option", async () => {
  seedDecision()
  const user = userEvent.setup()
  renderOptions()

  await user.type(screen.getByLabelText("New option"), "Charlie")
  await user.click(screen.getByRole("button", { name: "Add" }))
  await user.click(screen.getByRole("button", { name: "Charlie No notes" }))
  await user.type(screen.getByLabelText("Notes for Charlie"), "Bring dessert")

  await waitFor(() =>
    expect(savedDecision().options).toEqual([
      { name: "Alpha", notes: "", hidden: false },
      { name: "Bravo", notes: "", hidden: false },
      { name: "Charlie", notes: "Bring dessert", hidden: false },
    ]),
  )
})

test("Options hides and deletes options through their page controls", async () => {
  seedDecision()
  const user = userEvent.setup()
  renderOptions()

  await user.click(screen.getByRole("button", { name: "Hide Alpha" }))
  await user.click(screen.getByRole("button", { name: "Delete Bravo" }))

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Show Alpha" })).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Bravo/ })).toBeNull()
    expect(savedDecision().options).toEqual([
      { name: "Alpha", notes: "", hidden: true },
    ])
  })
})
