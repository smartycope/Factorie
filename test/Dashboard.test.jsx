import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { MemoryRouter } from "react-router-dom"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Decision from "../src/models/Decision.js"
import Dashboard from "../src/pages/Dashboard.jsx"

const STORAGE_KEY = "factorie.decisions"

function decisionWithOneOption(name) {
  const decision = new Decision(name)
  decision.addFactor({
    name: "Score",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Option")
  return decision
}

function seedDecisions(decisions) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(decisions.map((decision) => JSON.parse(decision.serialize()))),
  )
}

function savedDecisions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY))
}

function renderDashboard() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Dashboard />
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(STORAGE_KEY, "[]")
  vi.stubGlobal("prompt", vi.fn())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

test("Dashboard creates a decision from the New Decision interaction", async () => {
  window.prompt.mockReturnValue("Weekend plans")
  const user = userEvent.setup()
  renderDashboard()

  await user.click(screen.getByRole("button", { name: "New Decision" }))

  await waitFor(() => {
    expect(screen.getAllByText("Weekend plans")).toHaveLength(2)
    expect(savedDecisions()).toHaveLength(1)
  })
  expect(savedDecisions()[0]).toMatchObject({
    name: "Weekend plans",
    options: [
      { name: "Option A", notes: "", hidden: false },
      { name: "Option B", notes: "", hidden: false },
    ],
  })
})

test("Dashboard changes the active decision when a decision row is selected", async () => {
  seedDecisions([decisionWithOneOption("Dinner"), decisionWithOneOption("Movie")])
  const user = userEvent.setup()
  renderDashboard()

  await user.click(screen.getByRole("button", { name: /Movie/ }))

  await waitFor(() =>
    expect(screen.getByText(/Currently Deciding:/).textContent).toContain("Movie"),
  )
})
