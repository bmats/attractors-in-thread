import paper from 'paper';
import Controller from './lib/controller';
import * as math from './lib/math';

import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<canvas id="canvas"></canvas>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#canvas')!;

// Size canvas to the configured physical width
const widthPx = math.mmToPx(math.HOOP_WIDTH_MM);
const heightPx = math.mmToPx(math.HOOP_HEIGHT_MM);
const dpr = window.devicePixelRatio;
canvas.width = widthPx * dpr;
canvas.height = heightPx * dpr;
canvas.style.width = `${widthPx}px`;
canvas.style.height = `${heightPx}px`;

// Set CSS var for sizing elements in mm
document.documentElement.style.setProperty('--mm-to-px', `${math.MM_TO_PX}px`);

paper.setup(canvas);
paper.view.viewSize = new paper.Size(widthPx, heightPx);

new Controller();
