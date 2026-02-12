import React, { useEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function lerpColor(a, b, t) {
  const ah = parseInt(a.replace(/#/g, ""), 16);
  const bh = parseInt(b.replace(/#/g, ""), 16);
  const ar = (ah >> 16) & 0xff,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff;
  const br = (bh >> 16) & 0xff,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff;
  const rr = Math.round(ar + t * (br - ar));
  const rg = Math.round(ag + t * (bg - ag));
  const rb = Math.round(ab + t * (bb - ab));
  return `rgb(${rr}, ${rg}, ${rb})`;
}

function getColorFromGradient(gradient, t) {
  if (!gradient || gradient.length === 1) return gradient?.[0] || "#000";
  const scaledT = t * (gradient.length - 1);
  const i = Math.floor(scaledT);
  const f = scaledT - i;
  const c1 = gradient[i];
  const c2 = gradient[Math.min(i + 1, gradient.length - 1)];
  return lerpColor(c1, c2, f);
}

// Overlap can be "free" (handles can cross freely), "block" (handles can't cross), or "push" (handles push each other but can't cross)
export default function MultiHandledSlider({
  // values = [],
  // names = [],
  handles = {},
  gradient = ["#C1CBD6", "#002463"],
  overlap = "pasdfush",
  step = 0.01,
  showValues = true,
  digits = 1,
  centerLabels = false,
  onChange,
}) {
  const sliderRef = useRef(null);
  // this is a ref instead of a state so it can be updated inside of startDrag/endDrag events.
  // It's not really a ref, really just a persistant global variable that doesn't trigger re-renders when it changes
  const draggingLabel = useRef(null);
  // Same for this.
  const blockingBounds = useRef({ min: 0, max: 1 });

  const startDrag = (label) => () => {
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", endDrag);
    draggingLabel.current = label;
    const orderedLabels = Object.entries(handles).sort((a, b) => a[1] - b[1]).map(([label]) => label);
    const currentIndex = orderedLabels.indexOf(label);
    // the .0001 is to make sure the handles don't get stuck next to another and flip the labels awkwardly
    const min = currentIndex > 0 ? handles[orderedLabels[currentIndex - 1]] + .0001 : 0;
    const max = currentIndex < orderedLabels.length - 1
        ? handles[orderedLabels[currentIndex + 1]] - .0001
        : 1;
    blockingBounds.current = { min, max };
  };

  const endDrag = () => {
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", endDrag);
    draggingLabel.current = null;
    blockingBounds.current = { min: 0, max: 1 };
  };

  const onDrag = (e) => {
    if (e.cancelable)
      e.preventDefault();
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let newPos = clamp((clientX - rect.left) / rect.width, 0, 1);
    if (step && step > 0)
      newPos = Math.round(newPos / step, digits) * step;

    onChange((prev) => {
      const newHandles = { ...prev };

      if (overlap === "block") {
        newPos = clamp(
          newPos,
          blockingBounds.current.min,
          blockingBounds.current.max,
        );
      }

      if (overlap === "push") {
        throw new Error("Overlap 'push' is not implemented yet");
        //   if (currentHandle > 0)
        //     newHandles[currentHandle - 1] = Math.min(
        //       newHandles[currentHandle - 1],
        //       newHandles[currentHandle],
        //     );
        //   if (currentHandle < newHandles.length - 1)
        //     newHandles[currentHandle + 1] = Math.max(
        //       newHandles[currentHandle + 1],
        //       newHandles[currentHandle],
        //     );
      }
      newHandles[draggingLabel.current] = clamp(newPos, 0, 1);

      return newHandles;
    });
  };

  const formatLabel = (label) => {
    return (
      `${label}` +
      (showValues ? ` - ${(handles[label] * 100).toFixed(0)}%` : "")
    );
  };

  const sliderDiam = 16;
  let handlesAndLabels;
  // Labels in the center
  if (centerLabels) {
    handlesAndLabels = Object.entries(handles)
      .sort((a, b) => a[1] - b[1])
      .map(([label, pos], i) => {
        const color = getColorFromGradient(gradient, pos);
        return (
          <div key={i}>
            <div
              style={{
                transform: `translateY(5px)`,
                height: sliderDiam,
                fontSize: "16px",
              }}
            >
              {formatLabel(label)}
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
                backgroundColor: color,
                border: "2px solid white",
                borderRadius: "50%",
                height: sliderDiam,
                width: sliderDiam,
              }}
              title={`${(pos * 100).toFixed(0)}%`}
            />
          </div>
        );
      });
    // Labels next to the handles
  } else {
    handlesAndLabels = Object.entries(handles)
      .sort((a, b) => a[1] - b[1])
      .map(([label, pos], i) => {
        const color = getColorFromGradient(gradient, pos);
        const flip = pos < 0.5;
        const text = formatLabel(label);
        const labelWidth = text.length * 8;
        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                left: `${pos * 100}%`,
                transform: `translate(${flip ? sliderDiam : -sliderDiam - labelWidth}px)`,
                top: i * sliderDiam + 6,
                height: sliderDiam,
                color: flip ? "black" : "white",
                fontSize: "16px",
                whiteSpace: "nowrap",
              }}
            >
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
                backgroundColor: color,
                // border: "2px solid " + (flip ? "black" : "white"),
                border: "2px solid white",
                borderRadius: "50%",
                width: sliderDiam,
              }}
              title={`${(pos * 100).toFixed(0)}%`}
            />
          </div>
        );
      });
  }

  return (
    <div style={{ userSelect: "none", touchAction: "none" }}>
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
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
        }}
      >
        {handlesAndLabels}
      </div>
    </div>
  );
}
