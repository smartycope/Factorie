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
  decision.setAnswer("Option", "Alpha", 7)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
}

function savedDecision() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY))[0]
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

test("editing an existing factor color saves immediately without applying other drafts", async () => {
  seedDecision()
  const user = userEvent.setup()
  render(
    <ThemeProvider theme={createTheme()}>
      <DecisionsProvider>
        <Factors />
      </DecisionsProvider>
    </ThemeProvider>,
  )

  await user.click(screen.getByRole("row", { name: /Alpha/ }))
  const nameInput = screen.getByRole("textbox", { name: "Factor" })
  await user.clear(nameInput)
  await user.type(nameInput, "Draft Alpha")
  await user.click(screen.getByRole("button", { name: "Choose factor color" }))
  await user.click(
    screen.getByRole("button", {
      name: "Set factor color to #FDE2E2",
    }),
  )

  await waitFor(() => expect(savedDecision().factors[0].color).toBe("#FDE2E2"))
  expect(savedDecision().factors[0].name).toBe("Alpha")
  expect(savedDecision().answers[0][0]).toEqual([7, 7])
  expect(nameInput.value).toBe("Draft Alpha")
})

test("factor scale inputs and calculated bounds clear each other", async () => {
  seedDecision()
  const user = userEvent.setup()
  render(
    <ThemeProvider theme={createTheme()}>
      <DecisionsProvider>
        <Factors />
      </DecisionsProvider>
    </ThemeProvider>,
  )

  await user.click(screen.getByRole("row", { name: /Alpha/ }))

  const minInput = screen.getByRole("spinbutton", { name: "Min" })
  const calculateMin = screen.getByRole("checkbox", {
    name: "Calculate the Min from the answers",
  })
  await user.click(calculateMin)
  expect(minInput.value).toBe("")
  expect(minInput.disabled).toBe(false)
  await user.type(minInput, "2")
  expect(calculateMin.checked).toBe(false)

  const maxInput = screen.getByRole("spinbutton", { name: "Max" })
  const calculateMax = screen.getByRole("checkbox", {
    name: "Calculate the Max from the answers",
  })
  await user.click(calculateMax)
  expect(maxInput.value).toBe("")
  expect(maxInput.disabled).toBe(false)
  await user.type(maxInput, "9")
  expect(calculateMax.checked).toBe(false)
})
