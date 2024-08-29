import { Bezier } from './bezier.mjs';

const inputRadius = document.getElementById('radius-input');
const inputLength = document.getElementById('length-input');
const inputSteps = document.getElementById('steps-input');
const radiusOutput = document.getElementById('radius-output');
const lengthOutput = document.getElementById('length-output');
const stepsOutput = document.getElementById('steps-output');

const rect = document.getElementById('rect');
const output = document.getElementById('code');
const copyButton = document.getElementById('copy-button');
const resizeButton = document.getElementById('resize-button');
const rectDimensions = document.getElementById('rect-dimensions');

const round = (value) => {
  return Math.round(value * 100) / 100;
};

const calcPolygon = (curve, radius, steps) => {
  const step = 1 / steps;
  const points = [];
  for (let t = 0; t < 1; t += step) {
    const [x, y] = curve.b_t(t);
    // convert from bottom right to top right coords
    points.push([
      round(x * radius),
      round(radius - y * radius)
    ]);
  }
  const [eX, eY] = curve.b_t(1);
  points.push([
    round(eX * radius),
    round(radius - eY * radius)
  ]);
  const numPoints = points.length;

  // create path
  const parts = [];
  for (let i = 0; i < numPoints; i++) {
    const [x, y] = points[i];
    parts.push([x + 'px', y + 'px']);
  }

  for (let i = numPoints - 1; i >= 0; i--) {
    const [x, y] = points[i];
    parts.push(['calc(100% - ' + x + 'px)', y + 'px']);
  }

  for (let i = 0; i < numPoints; i++) {
    const [x, y] = points[i];
    parts.push(['calc(100% - ' + x + 'px)', 'calc(100% - ' + y + 'px)']);
  }

  for (let i = numPoints - 1; i >= 0; i--) {
    const [x, y] = points[i];
    parts.push([x + 'px', 'calc(100% - ' + y + 'px)']);
  }

  return parts;
};

const calcBorderRadius = (curve, radius) => {
  const [x, y] = curve.b_t(0.5);
  const px = x * radius;
  const py = y * radius;
  const dist = Math.sqrt(Math.pow(radius - px, 2) + Math.pow(0 - py, 2));
  const dia = radius * Math.sqrt(2);
  const rad = dia - dist;
  return round(rad * (1 + Math.sqrt(2)));
};

const createCss = (clip, borderRadius, radius, length, steps) => {
  return `.squircle {
  --squircle-background: white;
  position: relative;
  border-radius: ${borderRadius}px;

  &::before {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: var(--squircle-background);
    /* radius: ${radius}px, length: ${length}, steps: ${steps} */
    clip-path: ${clip};
  }
}`;
};

const handleUpdate = () => {
  const radius = inputRadius.value;
  const length = inputLength.value;
  const steps = inputSteps.value;

  radiusOutput.innerHTML = radius + 'px';
  lengthOutput.innerHTML = length;
  stepsOutput.innerHTML = steps;

  const curve = new Bezier([
    [0, 0],
    [0, length],
    [1 - length, 1],
    [1, 1]
  ]);
  const points = calcPolygon(curve, radius, steps);
  const str = points.map(coords => coords.join(' ')).join(',');
  const clip = `polygon(${str})`;
  const borderRadius = calcBorderRadius(curve, radius);

  rect.style.setProperty('border-radius', borderRadius + 'px');
  rect.style.setProperty('--clip-path', clip);
  output.innerHTML = createCss(clip, borderRadius, radius, length, steps);
};

const handleRectDimensions = (width, height) => {
  rectDimensions.textContent = `${width}px x ${height}px`;

  const max = Math.floor(Math.min(width, height) / 2);
  const current = inputRadius.value;
  const newValue = Math.min(current, max);
  inputRadius.max = max;
  if (newValue !== current) {
    inputRadius.value = newValue;
    handleUpdate();
  }
};

// init

inputRadius.value = 120;
inputLength.value = 0.8;
inputSteps.max = 100;
inputSteps.value = 30;

inputRadius.addEventListener('input', () => {
  handleUpdate();
});

inputLength.addEventListener('input', () => {
  handleUpdate();
});

inputSteps.addEventListener('input', () => {
  handleUpdate();
});

rect.addEventListener('click', (e) => {
  e.preventDefault();
  if (e.target !== rect) {
    return;
  }
  const current = rect.style.getPropertyValue('background-color');
  if (current === '') {
    rect.style.setProperty('background-color', 'violet');
  }
  else {
    rect.style.removeProperty('background-color');
  }
});

copyButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (e.buttons !== 1) {
    return;
  }
  if ('clipboard' in navigator) {
    navigator.clipboard.writeText(output.textContent);
    e.target.animate([
      { transform: 'scale(1.5)', opacity: 0 }
    ], {
      duration: 150,
      easing: 'ease'
    });
  }
});

resizeButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (e.buttons !== 1) {
    return;
  }

  document.body.style.cursor = 'grabbing';
  e.target.classList.add('sizing');

  const startX = e.clientX;
  const startY = e.clientY;
  const { width, height } = rect.getBoundingClientRect();

  const dragMove = (ev) => {
    const deltaX = (ev.clientX - startX) * 2;
    const deltaY = (ev.clientY - startY) * 2;

    let newWidth = width + deltaX;
    let newHeight = height + deltaY;

    newWidth = Math.max(30, Math.min(newWidth, 600));
    newHeight = Math.max(30, Math.min(newHeight, 600));

    handleRectDimensions(newWidth, newHeight);

    rect.style.width = `${newWidth}px`;
    rect.style.height = `${newHeight}px`;
  };

  const dragEnd = () => {
    document.removeEventListener('pointerup', dragEnd);
    document.removeEventListener('pointermove', dragMove);
    document.body.style.cursor = '';
    e.target.classList.remove('sizing');
  };

  document.addEventListener('pointermove', dragMove);
  document.addEventListener('pointerup', dragEnd);
});

{
  const { width, height } = rect.getBoundingClientRect();
  handleRectDimensions(width, height);
}

handleUpdate();