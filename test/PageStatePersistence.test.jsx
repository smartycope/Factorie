import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { Link, MemoryRouter, Route, Routes } from "react-router-dom"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Factors from "../src/pages/Factors.jsx"
import Quiz from "../src/pages/Quiz.jsx"
import Weights from "../src/pages/Weights.jsx"

vi.mock("react-plotly.js", () => ({ default: () => null }))

const STORAGE_KEY = "factorie.decisions"

function saveDecision(decision) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
}

function renderPage(Page, path) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Link to="/other">Leave page</Link>
          <Routes>
            <Route path={path} element={<Page />} />
            <Route path="/other" element={<Link to={path}>Return to page</Link>} />
          </Routes>
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => localStorage.clear())
afterEach(cleanup)

test("fine tune weights keeps unsaved weights and sorting progress across navigation", async () => {
  const decision = new Decision("Weights")
  decision.addFactor({ name: "Alpha", weight: 0.2 })
  decision.addFactor({ name: "Bravo", weight: 0.5 })
  decision.addFactor({ name: "Charlie", weight: 0.8 })
  saveDecision(decision)
  const user = userEvent.setup()
  renderPage(Weights, "/weights")

  await waitFor(() => expect(screen.getByText("Alpha - 20%")).toBeTruthy())
  await user.click(screen.getByRole("button", { name: "Arrange Weights" }))
  await user.click(screen.getByRole("menuitem", { name: "Linear" }))
  await user.click(screen.getByRole("button", { name: "Start Sorting" }))
  expect(screen.getByText("Alpha - 0%")).toBeTruthy()
  expect(screen.getByText("Unsaved changes")).toBeTruthy()
  expect(screen.getByText("Which is more important?")).toBeTruthy()

  await user.click(screen.getByRole("link", { name: "Leave page" }))
  await user.click(screen.getByRole("link", { name: "Return to page" }))

  expect(screen.getByText("Alpha - 0%")).toBeTruthy()
  expect(screen.getByText("Unsaved changes")).toBeTruthy()
  expect(screen.getByText("Which is more important?")).toBeTruthy()
  expect(screen.getByRole("button", { name: "Start Over" })).toBeTruthy()
})

test("fine tune weights search bolds matching slider labels", async () => {
  const decision = new Decision("Weight search")
  decision.addFactor({ name: "Purchase price", weight: 0.2 })
  decision.addFactor({ name: "Travel time", weight: 0.8 })
  saveDecision(decision)
  const user = userEvent.setup()
  renderPage(Weights, "/weights")

  await waitFor(() =>
    expect(screen.getByText("Purchase price - 20%")).toBeTruthy(),
  )
  await user.type(
    screen.getByRole("textbox", { name: "Search factors" }),
    "PRICE",
  )

  expect(screen.getByText("Purchase price - 20%").tagName).toBe("B")
  expect(screen.getByText("Travel time - 80%").tagName).not.toBe("B")

  await user.click(screen.getByRole("button", { name: "Clear factor search" }))
  expect(screen.getByRole("textbox", { name: "Search factors" }).value).toBe("")
  expect(screen.getByText("Purchase price - 20%").tagName).not.toBe("B")
})

test("Quiz keeps its current answer, option, filters, and search across navigation", async () => {
  const decision = new Decision("Quiz state")
  decision.addFactor({
    name: "Cost",
    optimal: 0,
    weight: 0.5,
    min: 0,
    max: 10,
  })
  decision.addFactor({
    name: "Time",
    optimal: 0,
    weight: 0.5,
    min: 0,
    max: 10,
  })
  decision.addOption("Choice")
  decision.setAnswer("Choice", "Cost", 5)
  decision.setAnswer("Choice", "Time", new Answer(2, 8))
  saveDecision(decision)
  const user = userEvent.setup()
  renderPage(Quiz, "/quiz")

  const timeRow = screen.getByRole("row", { name: /Time/ })
  await user.click(within(timeRow).getAllByRole("cell")[1])
  await user.click(screen.getByRole("combobox", { name: "Focus option" }))
  await user.click(screen.getByRole("option", { name: "Choice" }))
  await user.type(
    screen.getByRole("textbox", { name: "Search by factor" }),
    "Time",
  )
  await user.click(screen.getByRole("button", { name: "Answer filters" }))
  await user.click(screen.getByRole("menuitem", { name: "Range" }))
  await user.keyboard("{Escape}")

  await user.click(screen.getByRole("link", { name: "Leave page" }))
  await user.click(screen.getByRole("link", { name: "Return to page" }))

  expect(screen.getByRole("combobox", { name: "Focus option" }).textContent).toBe(
    "Choice",
  )
  expect(screen.getByRole("textbox", { name: "Search by factor" }).value).toBe(
    "Time",
  )
  expect(screen.getByRole("button", { name: /Answer filters/ }).textContent).toContain(
    "(1)",
  )
  expect(
    screen
      .getAllByText("Time")
      .some((element) => element.parentElement?.textContent === "Time:Choice"),
  ).toBe(true)
})

test("Factors keeps the selected factor across navigation", async () => {
  const decision = new Decision("Factors")
  decision.addFactor({ name: "Alpha", weight: 0.25 })
  decision.addFactor({ name: "Bravo", weight: 0.75 })
  saveDecision(decision)
  const user = userEvent.setup()
  renderPage(Factors, "/factors")

  await user.click(screen.getByRole("row", { name: /Bravo/ }))
  expect(screen.getByRole("textbox", { name: "Factor" }).value).toBe("Bravo")

  await user.click(screen.getByRole("link", { name: "Leave page" }))
  await user.click(screen.getByRole("link", { name: "Return to page" }))

  expect(screen.getByRole("textbox", { name: "Factor" }).value).toBe("Bravo")
  expect(screen.getByRole("button", { name: "Modify" })).toBeTruthy()
})
