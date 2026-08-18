import { useRef, useState } from "react"

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

// Overlap can be "free" (handles can cross freely), "block" (handles can't cross), or "push" (handles push each other but can't cross)
export default function MultiHandledSlider({
  handles = {},
  gradient = ["#00246300", "#002463"],
  overlap = "block",
  step = 0.01,
  showValues = true,
  digits = 1,
  centerLabels = false,
  boldLabels = [],
  onChange,
}) {
  const sliderRef = useRef(null)
  // this is a ref instead of a state so it can be updated inside of startDrag/endDrag events.
  // It's not really a ref, really just a persistant global variable that doesn't trigger re-renders when it changes
  const draggingLabel = useRef(null)
  const [selectedLabel, setSelectedLabel] = useState(null)
  // Same for this.
  const blockingBounds = useRef({ min: 0, max: 1 })
  const boldLabelSet = new Set(boldLabels)

  const startDrag = (label) => () => {
    document.addEventListener("mousemove", onDrag)
    document.addEventListener("mouseup", endDrag)
    document.addEventListener("touchmove", onDrag, { passive: false })
    document.addEventListener("touchend", endDrag)
    draggingLabel.current = label
    setSelectedLabel(label)
    const orderedLabels = Object.entries(handles)
      .sort((a, b) => a[1] - b[1])
      .map(([label]) => label)
    const currentIndex = orderedLabels.indexOf(label)
    // the .0001 is to make sure the handles don't get stuck next to another and flip the labels awkwardly
    const min =
      currentIndex > 0 ? handles[orderedLabels[currentIndex - 1]] + 0.0001 : 0
    const max =
      currentIndex < orderedLabels.length - 1 ?
        handles[orderedLabels[currentIndex + 1]] - 0.0001
      : 1
    blockingBounds.current = { min, max }
  }

  const endDrag = () => {
    document.removeEventListener("mousemove", onDrag)
    document.removeEventListener("mouseup", endDrag)
    document.removeEventListener("touchmove", onDrag)
    document.removeEventListener("touchend", endDrag)
    draggingLabel.current = null
    setSelectedLabel(null)
    blockingBounds.current = { min: 0, max: 1 }
  }

  const onDrag = (e) => {
    if (e.cancelable) e.preventDefault()
    const draggedLabel = draggingLabel.current
    if (draggedLabel == null) return
    const rect = sliderRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    let newPos = clamp((clientX - rect.left) / rect.width, 0, 1)
    if (step && step > 0) newPos = Math.round(newPos / step, digits) * step

    if (overlap === "block") {
      newPos = clamp(
        newPos,
        blockingBounds.current.min,
        blockingBounds.current.max,
      )
    }

    if (overlap === "push")
      throw new Error("Overlap 'push' is not implemented yet")

    const nextPosition = clamp(newPos, 0, 1)
    onChange((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, draggedLabel)) return prev
      const newHandles = { ...prev }
      newHandles[draggedLabel] = nextPosition

      return newHandles
    })
  }

  const formatLabel = (selected, label) => {
    const rtn = (
      `${label}` +
      (showValues ? ` - ${(handles[label] * 100).toFixed(Math.max(0, -digits))}%` : "")
    )
    if (selected || boldLabelSet.has(label)) return <b>{rtn}</b>
    else return rtn
  }

  const sliderDiam = 16
  let handlesAndLabels
  // Labels in the center
  if (centerLabels) {
    handlesAndLabels = Object.entries(handles)
      .sort((a, b) => b[1] - a[1])
      .map(([label, pos], i) => {
        const selected = selectedLabel === label
        return (
          <div key={i}>
            <div
              style={{
                transform: `translateY(5px)`,
                height: sliderDiam,
                fontSize: "16px",
              }}>
              {formatLabel(selected, label)}
            </div>
            <div
              onMouseDown={startDrag(label)}
              onTouchStart={startDrag(label)}
              style={{
                position: "absolute",
                left: `${pos * 100}%`,
                top: (i + 0.5) * sliderDiam + 10,
                cursor: "grab",
                display: "flex",
                transform: "translate(-50%, -50%)",
                backgroundColor: !selected ? '#00000000' : "white",
                border: `2px solid ${!selected ? "white" : '#00000000'}`,
                borderRadius: "50%",
                height: sliderDiam,
                width: sliderDiam,
              }}
              title={`${(pos * 100).toFixed(0)}%`}
            />
          </div>
        )
      })
    // Labels next to the handles
  } else {
    handlesAndLabels = Object.entries(handles)
      .sort((a, b) => b[1] - a[1])
      .map(([label, pos], i) => {
        const selected = selectedLabel === label
        const flip = pos < 0.5
        const text = formatLabel(selected, label)
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: `${pos * 100}%`,
                transform:
                  flip ?
                    `translateX(${sliderDiam}px)`
                  : `translateX(calc(-100% - ${sliderDiam}px))`,
                top: i * sliderDiam + 6,
                height: sliderDiam,
                color: flip ? "black" : "white",
                fontSize: "16px",
                whiteSpace: "nowrap",
              }}>
              {text}
            </div>
            <div
              onMouseDown={startDrag(label)}
              onTouchStart={startDrag(label)}
              style={{
                position: "absolute",
                left: `${pos * 100}%`,
                top: (i + 0.5) * sliderDiam + 10,
                cursor: "grab",
                height: sliderDiam,
                transform: "translate(-50%, -50%)",
                backgroundColor: !selected ? '#00000000' : "white",
                // border: "2px solid " + (flip ? "black" : "white"),
                border: `2px solid ${!selected ? "white" : '#00000000'}`,
                borderRadius: "50%",
                width: sliderDiam,
              }}
              title={`${(pos * 100).toFixed(0)}%`}
            />
          </div>
        )
      })
  }

  return (
    <div style={{ userSelect: "none", touchAction: "none" }}>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}>
        <div>Least Important</div>
        <div>Most Important</div>
      </div>
      <div
        ref={sliderRef}
        style={{
          position: "relative",
          height: Object.keys(handles).length * sliderDiam + 20,
          width: "100%",
          background: `linear-gradient(to right, ${gradient.join(",")})`,
          borderRadius: 6,
        }}>
        {handlesAndLabels}
      </div>
    </div>
  )
}
