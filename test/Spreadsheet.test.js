import { expect, test } from "vitest"
import { strFromU8, unzipSync } from "fflate"
import XLSX from "xlsx-js-style"
import Decision from "../src/models/Decision.js"
import {
  createDecisionSpreadsheet,
  parseDecisionSpreadsheet,
} from "../src/utils/decisionSpreadsheet.js"

test("factor and option colors round-trip as spreadsheet cell fills", () => {
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
  const worksheetXml = strFromU8(
    unzipSync(new Uint8Array(exported))["xl/worksheets/sheet1.xml"],
  )

  expect(imported.factors[0].color).toBe("#DDEEFF")
  expect(imported.options[0].color).toBe("#FDE2E2")
  expect(imported.getAnswer("Choice", "Quality").min).toBe(8)
  expect(decisionSheet.A6.s.fgColor.rgb).toBe("DDEEFF")
  expect(decisionSheet.B5.s.fgColor.rgb).toBe("FDE2E2")
  expect(worksheetXml).toContain(
    '<pane xSplit="1" ySplit="5" topLeftCell="B6" activePane="bottomRight" state="frozen"/>',
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
