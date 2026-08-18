import { expect, test } from "vitest"
import { strFromU8, unzipSync } from "fflate"
import XLSX from "xlsx-js-style"
import Decision from "../src/models/Decision.js"
import {
  createDecisionSpreadsheet,
  parseDecisionSpreadsheet,
} from "../src/utils/decisionSpreadsheet.js"

test("factor and option colors and frozen worksheet panes are exported", () => {
  const decision = new Decision("Colors")
  decision.addFactor({
    name: "Quality",
    unit: "0-10",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
    color: "#DDEEFF",
  })
  decision.addOption({ name: "Choice", color: "#FDE2E2" })
  decision.setAnswer("Choice", "Quality", 8)

  const exported = createDecisionSpreadsheet(decision)
  const imported = parseDecisionSpreadsheet(exported)
  const workbook = XLSX.read(exported, { type: "array", cellStyles: true })
  const decisionSheet = workbook.Sheets.Decision
  const worksheetFiles = unzipSync(new Uint8Array(exported))
  const decisionWorksheetXml = strFromU8(
    worksheetFiles["xl/worksheets/sheet1.xml"],
  )
  const factorWorksheetXml = strFromU8(
    worksheetFiles["xl/worksheets/sheet2.xml"],
  )
  const optionWorksheetXml = strFromU8(
    worksheetFiles["xl/worksheets/sheet3.xml"],
  )

  expect(imported.factors[0].color).toBe("#DDEEFF")
  expect(imported.options[0].color).toBe("#FDE2E2")
  expect(imported.getAnswer("Choice", "Quality").min).toBe(8)
  expect(decisionSheet.A6.s.fgColor.rgb).toBe("DDEEFF")
  expect(decisionSheet.B5.s.fgColor.rgb).toBe("FDE2E2")
  expect(decisionWorksheetXml).toContain(
    '<pane xSplit="1" ySplit="5" topLeftCell="B6" activePane="bottomRight" state="frozen"/>',
  )
  for (const worksheetXml of [factorWorksheetXml, optionWorksheetXml])
    expect(worksheetXml).toContain(
      '<pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/>',
    )
})

function importDiscreteAnswer(value) {
  const decision = new Decision("Discrete labels")
  decision.addFactor({
    name: "Size",
    unit: "1: label, 2: other label",
    optimal: 2,
    weight: 1,
    min: 1,
    max: 2,
  })
  decision.addOption("Choice")
  decision.setAnswer("Choice", "Size", 1)

  const workbook = XLSX.read(createDecisionSpreadsheet(decision), {
    type: "array",
  })
  workbook.Sheets.Decision.B6 = { t: "s", v: value }
  return parseDecisionSpreadsheet(
    XLSX.write(workbook, { type: "array", bookType: "xlsx" }),
  )
}

test("spreadsheet import accepts case-insensitive discrete answer labels", () => {
  const imported = importDiscreteAnswer("LaBeL")

  expect(imported.getAnswer("Choice", "Size").serialize()).toEqual([
    "label",
    "label",
  ])
})

test.each([
  ["label?", ["label", "label", true]],
  ["label-other label", ["label", "other label"]],
  ["label-other label?", ["label", "other label", true]],
])("spreadsheet import parses discrete answer %s", (value, expected) => {
  const imported = importDiscreteAnswer(value)

  expect(imported.getAnswer("Choice", "Size").serialize()).toEqual(expected)
})

test("spreadsheet import lists valid discrete options for invalid answers", () => {
  expect(() => importDiscreteAnswer("unknown")).toThrowError(
    expect.objectContaining({
      message: expect.stringContaining(
        'Valid options: "label", "other label".',
      ),
    }),
  )
})

test("spreadsheet export uses labels for discrete answers", () => {
  const decision = new Decision("Discrete export")
  decision.addFactor({
    name: "Size",
    unit: "1: label, 2: other label",
    optimal: 2,
    weight: 0.5,
    min: 1,
    max: 2,
  })
  decision.addOption("Exact")
  decision.addOption("Range")
  decision.setAnswer("Exact", "Size", 1)
  decision.setAnswer("Range", "Size", [1, 2, true])

  const exported = createDecisionSpreadsheet(decision)
  const workbook = XLSX.read(exported, { type: "array" })
  const imported = parseDecisionSpreadsheet(exported)

  expect(workbook.Sheets.Decision.B6.v).toBe("label")
  expect(workbook.Sheets.Decision.C6.v).toBe("label - other label?")
  expect(imported.getAnswer("Exact", "Size").min).toBe(1)
  expect(imported.getAnswer("Range", "Size").max).toBe(2)
})

test("spreadsheet export formats weights as percentages with one decimal", () => {
  const decision = new Decision("Weight format")
  decision.addFactor({ name: "Quality", weight: 0.1234 })
  decision.addOption("Choice")

  const workbook = XLSX.read(createDecisionSpreadsheet(decision), {
    type: "array",
    cellNF: true,
  })
  const weightCell = workbook.Sheets.Factors.D2

  expect(weightCell.v).toBe(0.1234)
  expect(weightCell.z).toBe("0.0%")
  expect(XLSX.utils.format_cell(weightCell)).toBe("12.3%")
})

test("spreadsheet import reports every invalid answer cell together", () => {
  const decision = new Decision("Invalid answers")
  decision.addFactor({
    name: "Score",
    optimal: 10,
    weight: 1,
    min: 0,
    max: 10,
  })
  decision.addOption("Too high")
  decision.addOption("Not a number")
  decision.setAnswer("Too high", "Score", 5)
  decision.setAnswer("Not a number", "Score", 5)

  const workbook = XLSX.read(createDecisionSpreadsheet(decision), {
    type: "array",
  })
  workbook.Sheets.Decision.B6 = { t: "n", v: 20 }
  workbook.Sheets.Decision.C6 = { t: "s", v: "invalid" }
  const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" })

  expect(() => parseDecisionSpreadsheet(data)).toThrowError(
    expect.objectContaining({
      message: expect.stringMatching(
        /Could not parse answers:[\s\S]*B6 for "Too high" \/ "Score"[\s\S]*Valid range: 0 to 10\.[\s\S]*C6 for "Not a number" \/ "Score"[\s\S]*Valid range: 0 to 10\./,
      ),
    }),
  )
})
