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
