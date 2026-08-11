export function reorderWeightsForSortedResult(
  handles,
  sortedResult,
  orderedLabels = Object.keys(handles),
) {
  const orderedWeights = orderedLabels
    .map((label) => handles[label] ?? 0)
    .sort((a, b) => b - a)
  const weightByLabel = new Map(
    sortedResult.map((label, index) => [label, orderedWeights[index]]),
  )

  return orderedLabels.reduce((nextHandles, label) => {
    nextHandles[label] =
      weightByLabel.has(label) ? weightByLabel.get(label) : handles[label] ?? 0
    return nextHandles
  }, {})
}
