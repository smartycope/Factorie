import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, expect, test, vi } from "vitest"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { DecisionsProvider } from "../src/contexts/DecisionsContext.jsx"
import Answer from "../src/models/Answer.js"
import Decision from "../src/models/Decision.js"
import Quiz from "../src/pages/Quiz.jsx"
import Results from "../src/pages/Results.jsx"

const plotMock = vi.hoisted(() => vi.fn(() => null))
vi.mock("react-plotly.js", () => ({ default: plotMock }))

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
  plotMock.mockClear()
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

test("Quiz shows option notes in headers and the focus selector", async () => {
  const decision = new Decision("Option notes")
  decision.addFactor({
    name: "Cost",
    optimal: 0,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Choice")
  decision.options[0].notes = "The lower-risk fallback with extra context."
  decision.setAnswer("Choice", "Cost", 5)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
  const user = userEvent.setup()
  renderQuiz()

  const optionHeader = screen.getByRole("columnheader", { name: "Choice" })
  await user.hover(within(optionHeader).getByText("Choice"))
  expect((await screen.findByRole("tooltip")).textContent).toContain(
    "The lower-risk fallback with extra context.",
  )

  await user.click(screen.getByRole("combobox", { name: "Focus option" }))
  const option = screen.getByRole("option", { name: /Choice/ })
  expect(within(option).getByText("The lower-risk fallback with e")).toBeTruthy()
})

test("Quiz factor search keeps focus when it changes the current question", async () => {
  const user = userEvent.setup()
  renderQuiz()
  const search = screen.getByRole("textbox", { name: "Search by factor" })

  await user.type(search, "Tentative factor")

  expect(document.activeElement).toBe(search)
  expect(screen.getAllByText("Tentative factor").length).toBeGreaterThan(1)
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

test("Factor contributions option selector shows option notes", async () => {
  const decision = new Decision("Contribution notes")
  decision.addFactor({
    name: "Cost",
    optimal: 0,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Choice")
  decision.options[0].notes = "Best for a limited budget and timeline."
  decision.setAnswer("Choice", "Cost", 5)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
  const user = userEvent.setup()

  render(
    <MemoryRouter
      initialEntries={["/results"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Results />
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  await user.click(screen.getByRole("combobox", { name: "Option" }))
  const option = screen.getByRole("option", { name: /Choice/ })
  expect(
    within(option).getByText("Best for a limited budget and").textContent,
  ).toBe("Best for a limited budget and ")

  const contributionPlot = plotMock.mock.calls.find(
    ([props]) => props.layout?.title?.text === "Deciding Factors for Choice",
  )?.[0]
  expect(contributionPlot.layout.legend.traceorder).toBe("reversed")
  expect(contributionPlot.data[0].customdata).toEqual([["Cost", 5, 10]])
  expect(contributionPlot.data[0].name).toBe("Good")
  expect(contributionPlot.data[1].name).toBe("Bad")
  expect(contributionPlot.data[0].hovertemplate).toContain(
    "%{y:.0%} good",
  )
  expect(contributionPlot.data[1].hovertemplate).toContain(
    "%{y:.0%} bad",
  )
  expect(contributionPlot.data[0].hovertemplate).toContain(
    "Answer: %{customdata[1]:.1f} / %{customdata[2]:.0f}",
  )
  expect(contributionPlot.data[1].hovertemplate).toContain(
    "Answer: %{customdata[1]:.1f} / %{customdata[2]:.0f}",
  )
})

test("factor comparison graph searches factors and compares every option", async () => {
  const decision = new Decision("Factor comparison")
  decision.addFactor({
    name: "Cost",
    optimal: 0,
    weight: 0.5,
    min: 0,
    max: 10,
  })
  decision.addFactor({
    name: "Quality",
    optimal: 10,
    weight: 0.5,
    min: 0,
    max: 10,
  })
  decision.addOption("Budget")
  decision.addOption("Premium")
  decision.setAnswer("Budget", "Cost", 2)
  decision.setAnswer("Budget", "Quality", 4)
  decision.setAnswer("Premium", "Cost", 8)
  decision.setAnswer("Premium", "Quality", 9)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
  const user = userEvent.setup()

  render(
    <MemoryRouter
      initialEntries={["/results"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={createTheme()}>
        <DecisionsProvider>
          <Results />
        </DecisionsProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )

  const factorInput = screen.getByRole("combobox", { name: "Factor" })
  await user.clear(factorInput)
  await user.type(factorInput, "Qual")
  await user.click(screen.getByRole("option", { name: "Quality" }))

  await waitFor(() => {
    const comparisonPlot = plotMock.mock.calls.find(
      ([props]) =>
        props.layout?.title?.text === "How Good Each Option Is for Quality",
    )?.[0]
    expect(comparisonPlot).toBeTruthy()
    expect(comparisonPlot.data[0].x).toEqual(["Premium", "Budget"])
    expect(comparisonPlot.data[0].name).toBe("Good")
    expect(comparisonPlot.data[1].name).toBe("Bad")
    expect(comparisonPlot.data[0].y[0]).toBeCloseTo(0.9)
    expect(comparisonPlot.data[0].y[1]).toBeCloseTo(0.4)
    expect(comparisonPlot.data[1].y[0]).toBeCloseTo(0.1)
    expect(comparisonPlot.data[1].y[1]).toBeCloseTo(0.6)
    expect(comparisonPlot.data[0].customdata).toEqual([
      ["Premium", "Quality", 9, 10],
      ["Budget", "Quality", 4, 10],
    ])
    expect(comparisonPlot.layout.legend.traceorder).toBe("reversed")
    expect(comparisonPlot.data[0].hovertemplate).toContain(
      "%{y:.0%} good<br>Answer: %{customdata[2]:.1f} / %{customdata[3]:.0f}",
    )
    expect(comparisonPlot.data[1].hovertemplate).toContain(
      "%{y:.0%} bad<br>Answer: %{customdata[2]:.1f} / %{customdata[3]:.0f}",
    )
  })
})

test("Results graph menu persists hidden graphs without hiding the summary", async () => {
  const decision = new Decision("Graph visibility")
  decision.addFactor({
    name: "Quality",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Choice")
  decision.setAnswer("Choice", "Quality", 8)
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([JSON.parse(decision.serialize())]),
  )
  const user = userEvent.setup()

  const renderResults = () =>
    render(
      <MemoryRouter
        initialEntries={["/results"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider theme={createTheme()}>
          <DecisionsProvider>
            <Results />
          </DecisionsProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

  const view = renderResults()

  expect(
    screen.getByRole("region", { name: "Results summary" }),
  ).toBeTruthy()
  expect(screen.getByRole("combobox", { name: "Factor" })).toBeTruthy()

  const initialGraphButton = screen.getByRole("button", {
    name: /Graphs \(\d+\/\d+\)/,
  })
  const [, initialVisibleCount, totalGraphCount] =
    initialGraphButton.textContent.match(/Graphs \((\d+)\/(\d+)\)/)
  expect(initialVisibleCount).toBe(totalGraphCount)
  const hiddenVisibleCount = Number(initialVisibleCount) - 1

  await user.click(initialGraphButton)
  const graphItem = screen.getByRole("menuitem", {
    name: /Options by factor/,
  })
  expect(
    within(graphItem).getByText("Compare all options on one searchable factor."),
  ).toBeTruthy()
  await user.click(graphItem)
  await user.keyboard("{Escape}")

  expect(screen.queryByRole("combobox", { name: "Factor" })).toBeNull()
  expect(
    screen.getByRole("region", { name: "Results summary" }),
  ).toBeTruthy()
  expect(
    screen.getByRole("button", {
      name: `Graphs (${hiddenVisibleCount}/${totalGraphCount})`,
    }),
  ).toBeTruthy()
  expect(
    JSON.parse(localStorage.getItem("factorie.results.hiddenGraphs")),
  ).toContain("options-by-factor")

  view.unmount()
  renderResults()

  expect(screen.queryByRole("combobox", { name: "Factor" })).toBeNull()
  expect(
    screen.getByRole("button", {
      name: `Graphs (${hiddenVisibleCount}/${totalGraphCount})`,
    }),
  ).toBeTruthy()

  await user.click(
    screen.getByRole("button", {
      name: `Graphs (${hiddenVisibleCount}/${totalGraphCount})`,
    }),
  )
  await user.click(
    screen.getByRole("menuitem", { name: /Options by factor/ }),
  )
  await user.keyboard("{Escape}")
  expect(screen.getByRole("combobox", { name: "Factor" })).toBeTruthy()
})
