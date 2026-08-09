import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Decision from "../src/models/Decision.js"
import Factors from "../src/pages/Factors.jsx"

const STORAGE_KEY = "factorie.decisions"

function seedDecision() {
  const decision = new Decision("Dinner")
  for (const name of ["Alpha", "Bravo", "Charlie"])
    decision.addFactor({ name, optimal: 10, weight: 1, min: 0, max: 10 })
  decision.addOption("Option")
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
}

function savedFactorNames() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY))[0].factors.map(
    (factor) => factor.name,
  )
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(cleanup)

test("factor move controls remain draft-only until Apply", async () => {
  seedDecision()
  const user = userEvent.setup()
  render(
    <ThemeProvider theme={createTheme()}>
      <DecisionsProvider>
        <Factors />
      </DecisionsProvider>
    </ThemeProvider>,
  )

  await user.click(screen.getByRole("button", { name: "Reorder factors" }))
  await user.click(
    screen.getByRole("button", { name: "Move Alpha to bottom" }),
  )

  expect(savedFactorNames()).toEqual(["Alpha", "Bravo", "Charlie"])
  await user.click(screen.getByRole("button", { name: "Apply" }))

  await waitFor(() =>
    expect(savedFactorNames()).toEqual(["Bravo", "Charlie", "Alpha"]),
  )
})
