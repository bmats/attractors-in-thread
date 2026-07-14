const INCH_TO_MM = 25.4;

// The true physical inch -> CSS px ratio depends on the display and OS scaling. This is an estimate for a MacBook Pro retina display.
export const MM_TO_PX = 152 / INCH_TO_MM;

// 40-weight embroidery thread width
export const THREAD_WIDTH_MM = 0.25;

export const HOOP_WIDTH_MM = 4 * INCH_TO_MM;
export const HOOP_HEIGHT_MM = 4 * INCH_TO_MM;

export function pxToMm(px: number): number {
  return px / MM_TO_PX;
}

export function mmToPx(mm: number): number {
  return mm * MM_TO_PX;
}
