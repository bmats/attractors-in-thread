import type { InkStitchAttributes } from './attributes';

interface ItemWithData {
  data: Record<string, unknown>;
}

/**
 * Sets Ink/Stitch embroidery parameters on a Paper.js item's data property.
 *
 * The data is stored under `item.data.inkstitch` and will be serialized into
 * `data-paper-data` JSON when the SVG is exported.
 *
 * @example
 * ```ts
 * setInkStitchData(circle, { fill_method: 'auto_fill', angle: 45 });
 * ```
 */
export function setInkStitchData(item: ItemWithData, params: InkStitchAttributes): void {
  if (!item.data) {
    item.data = {};
  }
  item.data.inkstitch = params;
}

/**
 * Marks a Paper.js item as an Ink/Stitch guide line. At export time
 * `convertToInkStitch` appends `marker-start:url(#inkstitch-guide-line-marker)`
 * to the element's style, which is how Ink/Stitch figures out which siblings
 * inside a group to use as guide lines for `guided_fill`.
 */
export function setInkStitchGuideLine(item: ItemWithData): void {
  if (!item.data) {
    item.data = {};
  }
  item.data.inkstitchGuideLine = true;
}
