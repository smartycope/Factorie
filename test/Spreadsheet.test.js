import { expect, test } from "vitest"
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

  const imported = parseDecisionSpreadsheet(createDecisionSpreadsheet(decision))

  expect(imported.factors[0].color).toBe("#DDEEFF")
  expect(imported.options[0].color).toBe("#FDE2E2")
  expect(imported.getAnswer("Choice", "Quality").min).toBe(8)
})
