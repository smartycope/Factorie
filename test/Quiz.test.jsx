import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Quiz from "../src/pages/Quiz.jsx"
import Results from "../src/pages/Results.jsx"

vi.mock("react-plotly.js", () => ({ default: () => null }))

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

function renderQuiz(initialEntries = ["/quiz"]) {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
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

test("Quiz loads all persisted filters from query parameters", () => {
  renderQuiz([
    "/quiz?option=Choice&answer=invalid&factor=Invalid%20factor",
  ])

  expect(screen.getByRole("combobox", { name: "Focus option" }).textContent).toBe(
    "Choice",
  )
  expect(screen.getByRole("textbox", { name: "Search by factor" }).value).toBe(
    "Invalid factor",
  )
  expect(screen.getByRole("button", { name: /Answer filters/ }).textContent).toContain(
    "(1)",
  )
  const table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Invalid factor")).toBeTruthy()
  expect(within(table).queryByText("Range factor")).toBeNull()
})

test("Quiz displays discrete answers as labels in the answers table", () => {
  const decision = new Decision("Discrete answers")
  decision.addFactor({
    name: "Priority",
    unit: "1: Low, 2: High",
    optimal: 2,
    weight: 1,
    min: 1,
    max: 2,
  })
  decision.addOption("Certain")
  decision.addOption("Unsure")
  decision.setAnswer("Certain", "Priority", 2)
  decision.setAnswer("Unsure", "Priority", new Answer(1, 2, true))
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )

  renderQuiz()

  const table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("High")).toBeTruthy()
  expect(within(table).getByText("Low - High?")).toBeTruthy()
  expect(within(table).queryByText("2")).toBeNull()
  expect(within(table).queryByText("1 - 2?")).toBeNull()
})

test("Results links invalid answers to an invalid-only Quiz view", async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter
      initialEntries={["/results"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Routes>
            <Route path="results" element={<Results />} />
            <Route path="quiz" element={<Quiz />} />
          </Routes>
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  await user.click(screen.getByRole("link", { name: "Quiz" }))

  expect(screen.getByRole("button", { name: /Answer filters/ }).textContent).toContain(
    "(1)",
  )
  const table = screen.getByRole("table", { hidden: true })
  expect(within(table).getByText("Invalid factor")).toBeTruthy()
  expect(within(table).queryByText("Unanswered factor")).toBeNull()
  expect(within(table).queryByText("Range factor")).toBeNull()
})
