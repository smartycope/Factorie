import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"

import MultiHandledSlider from "../src/components/MultiHandledSlider.jsx"

afterEach(cleanup)

test("a queued drag update retains its handle label after mouseup", () => {
  const onChange = vi.fn()
  render(<MultiHandledSlider handles={{ Quality: 0.2 }} onChange={onChange} />)
  const handle = screen.getByTitle("20%")
  const slider = handle.parentElement.parentElement
  slider.getBoundingClientRect = () => ({ left: 0, width: 100 })

  fireEvent.mouseDown(handle)
  fireEvent.mouseMove(document, { clientX: 75 })
  const queuedUpdate = onChange.mock.calls[0][0]
  fireEvent.mouseUp(document)

  expect(queuedUpdate({ Quality: 0.2 })).toEqual({ Quality: 0.75 })
  expect(queuedUpdate({ Quality: 0.2 })).not.toHaveProperty("null")
})

test("specified labels are bold independently of dragging", () => {
  render(
    <MultiHandledSlider
      handles={{ Cost: 0.2, Quality: 0.8 }}
      boldLabels={["Quality"]}
      onChange={() => {}}
    />,
  )

  expect(screen.getByText("Quality - 80%").tagName).toBe("B")
  expect(screen.getByText("Cost - 20%").tagName).not.toBe("B")

  fireEvent.mouseDown(screen.getByTitle("20%"))
  expect(screen.getByText("Quality - 80%").tagName).toBe("B")
  expect(screen.getByText("Cost - 20%").tagName).toBe("B")
  fireEvent.mouseUp(document)
})
