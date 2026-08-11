import { expect, test } from "vitest"

import { reorderWeightsForSortedResult } from "../src/utils/weights.js"

test("sorted weights put the most important result at the bottom", () => {
  const handles = {
    Cost: 0.2,
    Quality: 0.55,
    Safety: 0.9,
  }

  expect(
    reorderWeightsForSortedResult(
      handles,
      ["Cost", "Quality", "Safety"],
    ),
  ).toEqual({
    Cost: 0.9,
    Quality: 0.55,
    Safety: 0.2,
  })
})

test("sorting only reorders the current weight values", () => {
  const handles = {
    Cost: 0.17,
    Quality: 0.83,
    Safety: 0.42,
  }
  const reordered = reorderWeightsForSortedResult(
    handles,
    ["Safety", "Cost", "Quality"],
  )

  expect(Object.values(reordered).sort((a, b) => a - b)).toEqual([
    0.17,
    0.42,
    0.83,
  ])
  expect(reordered).toEqual({
    Cost: 0.42,
    Quality: 0.17,
    Safety: 0.83,
  })
})
