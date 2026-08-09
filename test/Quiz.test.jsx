import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { MemoryRouter } from "react-router-dom"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Quiz from "../src/pages/Quiz.jsx"

const STORAGE_KEY = "factorie.decisions"

function quizFilterDecision() {
  const decision = new Decision("Answer filters")
  for (const name of ["Unanswered factor", "Tentative factor", "Range factor", "Invalid factor"])
    decision.addFactor({
      name,
      optimal: 10,
      weight: 0.25,
      min: 0,
      max: 10,
    })
  decision.addOption("Choice")
  decision.setAnswer(
    "Choice",
    "Tentative factor",
    new Answer(5, 5, true),
  )
  decision.setAnswer("Choice", "Range factor", [2, 8])
  decision.setAnswer("Choice", "Invalid factor", 5)
  decision.getAnswer("Choice", "Invalid factor").min = 12
  decision.getAnswer("Choice", "Invalid factor").max = 12
  return decision
}

function renderQuiz() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Quiz />
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(quizFilterDecision().serialize())]),
  )
})

afterEach(() => cleanup())

test("Quiz answer filters combine unanswered, tentative, range, and invalid states", async () => {
  const user = userEvent.setup()
  renderQuiz()
  const filterButton = screen.getByRole("button", { name: "Answer filters" })

  await user.click(filterButton)
  await user.click(screen.getByRole("menuitem", { name: "Tentative" }))

  let table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Tentative factor")).toBeTruthy()
  expect(within(table).queryByText("Range factor")).toBeNull()

  await user.click(screen.getByRole("menuitem", { name: "Range" }))
  table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Tentative factor")).toBeTruthy()
  expect(within(table).getByText("Range factor")).toBeTruthy()

  await user.click(screen.getByRole("menuitem", { name: "Tentative" }))
  await user.click(screen.getByRole("menuitem", { name: "Range" }))
  await user.click(screen.getByRole("menuitem", { name: "Invalid" }))
  table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Invalid factor")).toBeTruthy()
  expect(within(table).queryByText("Range factor")).toBeNull()

  await user.click(screen.getByRole("menuitem", { name: "Invalid" }))
  await user.click(screen.getByRole("menuitem", { name: "Unanswered" }))
  table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Unanswered factor")).toBeTruthy()
  expect(within(table).queryByText("Invalid factor")).toBeNull()
})
