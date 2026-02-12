// ORIGINAL

import {
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"
import React, {
  useEffect,
  useState,
  useRef,
} from "react"
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function lerpColor(a, b, t) {
const ah = parseInt(a.replace(/#/g, ''), 16);
const bh = parseInt(b.replace(/#/g, ''), 16);

const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;

const rr = Math.round(ar + t * (br - ar));
const rg = Math.round(ag + t * (bg - ag));
const rb = Math.round(ab + t * (bb - ab));

return `rgb(${rr}, ${rg}, ${rb})`;
}

function getColorFromGradient(gradient, t) {
if (gradient.length === 1) return gradient[0];
const scaledT = t * (gradient.length - 1);
const i = Math.floor(scaledT);
const f = scaledT - i;
const c1 = gradient[i];
const c2 = gradient[Math.min(i + 1, gradient.length - 1)];
return lerpColor(c1, c2, f);
}

function MultiHandledSlider({ args, disabled, theme }) {
  const {
      values,
      names,
      gradient = ['#000000', '#ffffff'],
      overlap = 'push',
      startText,
      endText,
      showValues = false,
      labelPos = 'top',
      labelRotation = 0,
      // Because functions are not json serializable, we need to pass the formatting like this
      digits = 1,
      multiplier = 1,
      prefix = '',
      sep = ' ',
      suffix = '',
      step = null,
      height = null,
      continuousUpdate=false,
    } = args

const [positions, setPositions] = useState(values);
const sliderRef = useRef(null);
const draggingIndex = useRef(null);

const valueFormatter = (v) => prefix + (v * multiplier).toFixed(digits) + suffix

useEffect(() => {
  // Call this when the component's size might change
  Streamlit.setFrameHeight(height)
  // Adding the style and theme as dependencies since they might
  // affect the visual size of the component.
}, [theme, names, height])

useEffect(() => {
  if (continuousUpdate) Streamlit.setComponentValue(positions);
}, [positions]);

const getClientX = (e) => {
  if (e.touches) return e.touches[0].clientX;
  return e.clientX;
};

const startDrag = (index) => (e) => {
  draggingIndex.current = index;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchmove', onDrag, { passive: false });
  document.addEventListener('touchend', endDrag);
};

let currentHandle = null;
const onDrag = (e) => {
  if (draggingIndex.current === null || !sliderRef.current) return;
  if (e.cancelable) e.preventDefault(); // prevent page scrolling on touch

  const rect = sliderRef.current.getBoundingClientRect();
  const clientX = getClientX(e);
  let newPos = clamp((clientX - rect.left) / rect.width, 0, 1);


  if (step != null && step > 0) {
    newPos = Math.round(newPos / step) * step;
  }

  setPositions((prev) => {
    const newPositions = [...prev];

    // if overlap != 'allow', and 2 handles are at the same value, then if pulled left, pull the first one,
    // if pulled right, pull the second one, instead of just the second one
    if (currentHandle === null) {
      currentHandle = draggingIndex.current;
      // Handle overlapping handles when overlap is not 'allow'
      if (overlap !== 'allow') {
        // Check if there are adjacent handles at the same position
        const isSameAsPrev = currentHandle > 0 && Math.abs(newPositions[currentHandle] - newPositions[currentHandle - 1]) < step;
        const isSameAsNext = currentHandle < newPositions.length - 1 && Math.abs(newPositions[currentHandle] - newPositions[currentHandle + 1]) < step;

        // If current handle is at the same position as the next one
        if (isSameAsNext) {
          // If dragging left, move the current handle
          // If dragging right, move the next handle
          if (newPos < newPositions[currentHandle]) {
            // Keep current handle (i) as is
          } else {
            // Move the next handle instead
            currentHandle = currentHandle + 1;
          }
        }
        // If current handle is at the same position as the previous one
        else if (isSameAsPrev) {
          // If dragging right, move the current handle
          // If dragging left, move the previous handle
          if (newPos > newPositions[currentHandle]) {
            // Keep current handle (i) as is
          } else {
            // Move the previous handle instead
            currentHandle = currentHandle - 1;
          }
        }
      }
    }

    if (overlap === 'block') {
      if (currentHandle > 0) newPos = Math.max(newPos, newPositions[currentHandle - 1]);
      if (currentHandle < newPositions.length - 1) newPos = Math.min(newPos, newPositions[currentHandle + 1]);
    }

    newPositions[currentHandle] = clamp(newPos, 0, 1);

    if (overlap === 'push') {
      if (currentHandle > 0) newPositions[currentHandle - 1] = Math.min(newPositions[currentHandle - 1], newPositions[currentHandle]);
      if (currentHandle < newPositions.length - 1) newPositions[currentHandle + 1] = Math.max(newPositions[currentHandle + 1], newPositions[currentHandle]);
    }
    return newPositions;
  });
};

// Lilly: positions from here is accurate
console.log(positions)

const endDrag = () => {
  draggingIndex.current = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', endDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', endDrag);
  if (!continuousUpdate) Streamlit.setComponentValue(positions); // <- here! This line is the problem, it's consistenly 1 behind (Lilly)
};

const sortedPositions = positions.toSorted()

const getLabelTrans = (labelPos, pos) => {
  if (labelPos === 'left') return '0%';
  if (labelPos === 'right') return '-120%';
  const index = sortedPositions.indexOf(pos);
  return index % 2 === 0 ? '0%' : '-120%';
}

const getLabelOrigin = (labelPos, pos) => {
  if (labelPos === 'left') return '0 0';
  if (labelPos === 'right') return '120% 0';
  const index = sortedPositions.indexOf(pos);
  return index % 2 === 0 ? '0 0' : '120% 0';
}

let valuesRendered = new Set()
const getLabelContent = (pos, i) => {
  if (valuesRendered.has(pos)) return '';
  let name = names[i]
  // If multiple of the same value, group them together
  let idx = sortedPositions.indexOf(pos, i + 1);
  while (idx !== -1) {
    name += ', ' + names[idx]
    idx = sortedPositions.indexOf(pos, idx + 1);
  }
  if (showValues) name += sep + valueFormatter(pos);
  valuesRendered.add(pos)
  return name;
}

let renderedLast = false
return (
  <div style={{
    userSelect: 'none',
    touchAction: 'none',
    display: 'flex',
    justifyContent: 'space-between',
  }}>
    {startText && <span style={{ margin: '0 1em' }}>{startText}</span>}
    <div
      ref={sliderRef}
      style={{
        position: 'relative',
        // height: '10px',
        height: '1em',
        // display: 'flex',
        // alignItems: 'center',
        // height: '100%',
        width: '100%',
        background: `linear-gradient(to right, ${gradient.join(',')})`,
        borderRadius: '6px',
        margin: '1em 0',
      }}
    >
      {positions.map((pos, i) => {
        const color = getColorFromGradient(gradient, pos);
        // edge case: if overlap == 'block', and the handle is at the right edge of the track (not the left edge), then
        // don't render the last handle, but still render the label, and the handle for the left most value
        if (renderedLast) return null
        if (overlap === 'block' && pos + step >= 1 && !renderedLast)
          renderedLast = true

        return (
          <div key={i}>
            <div
              key={'handle'+i}
              onMouseDown={startDrag(i)}
              onTouchStart={startDrag(i)}
              style={{
                position: 'absolute',
                left: `${pos * 100}%`,
                transform: 'translate(-50%, -50%)',
                top: '50%',
                cursor: 'grab',
                backgroundColor: color,
                border: '2px solid white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                zIndex: 10,
              }}
              title={valueFormatter(pos)}
            />
            <div key={'label'+i} style={{
              position: 'absolute',
              left: `${pos * 100}%`,
              transform: `translate(${getLabelTrans(labelPos, pos)}, -50%) rotate(${labelRotation}deg)`,
              transformOrigin: getLabelOrigin(labelPos, pos),
              textAlign: labelPos === 'left' ? 'left' : labelPos === 'right' ? 'right' : 'center',
              minWidth: '60px',
              // whiteSpace: 'nowrap',
            }}>
              {getLabelContent(pos, i)}
            </div>
          </div>
        );
      })}
    </div>
    {endText && <span style={{ margin: '0 1em' }}>{endText}</span>}
  </div>
);
}

export default withStreamlitConnection(MultiHandledSlider)