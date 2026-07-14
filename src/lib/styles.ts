import paper from 'paper';
import { FolderApi } from 'tweakpane';
import { PaperOffset } from 'paperjs-offset';
import { polygonHull } from 'd3-polygon';
import type Controller from './controller';
import { mmToPx, THREAD_WIDTH_MM } from './math';
import { setInkStitchData } from './inkstitch';

export abstract class StyleBase {
  abstract readonly name: string;

  controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
  }

  abstract apply(layer: paper.Layer): void;
  abstract buildTweakpane(folder: FolderApi): void;
}

export class RunningStitchStyle extends StyleBase {
  readonly name: string = 'Running Stitch';

  color: string = '#000000';
  beanStitch: boolean = false;

  apply(layer: paper.Layer): void {
    // Apply style to all paths in the layer
    for (const path of layer.children) {
      path.strokeWidth = mmToPx(THREAD_WIDTH_MM);
      path.strokeColor = new paper.Color(this.color);

      setInkStitchData(path, {
        stroke_method: 'running_stitch',
        running_stitch_length_mm: 2.5,

        ...(this.beanStitch ? { bean_stitch_repeats: 1 } : {}),
      });
    }
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'color', {
      picker: 'inline',
    }).on('change', () => this.controller.render());

    folder.addBinding(this, 'beanStitch')
      .on('change', () => this.controller.render());
  }
}

export class PatchStyle extends StyleBase {
  readonly name: string = 'Patch';

  patchMargin: number = 3;
  color: string = '#000000';
  finishedEdgeColor: string = '#2f2cd7';
  beanStitch: boolean = false;

  apply(layer: paper.Layer): void {
    // Main design: running stitch
    for (const path of layer.children) {
      path.strokeWidth = mmToPx(THREAD_WIDTH_MM);
      path.strokeColor = new paper.Color(this.color);
      setInkStitchData(path, {
        stroke_method: 'running_stitch',
        running_stitch_length_mm: 2.5,

        ...(this.beanStitch ? { bean_stitch_repeats: 1 } : {}),
      });
    }

    // Calculate bounding outline. Get the convex hull of the design and offset it outward.
    const hull = convexHull(layer);
    const outlinePath = PaperOffset.offset(hull, mmToPx(this.patchMargin)) as paper.Path;
    hull.remove();

    // Patch outline
    // This is the first anchoring outline that holds the fabric layers together.
    // It's stitched first so it anchors the fabric before the design is stitched out.
    const anchorOutline = outlinePath.clone();
    anchorOutline.name = 'PatchAnchorOutline';
    anchorOutline.strokeColor = new paper.Color('red');
    anchorOutline.strokeWidth = mmToPx(THREAD_WIDTH_MM);
    setInkStitchData(anchorOutline, {
      stroke_method: 'running_stitch',
      running_stitch_length_mm: 1.5, // shorter stitches for a stronger hold
    });
    layer.insertChild(0, anchorOutline);

    // Final outline
    // Outline again after embroidering the design because the fabric might have pulled inward while embroidering the main design.
    // This establishes a boundary for the finished edge that can be cut before running the final finished edge.
    const finalOutline = outlinePath.clone();
    finalOutline.name = 'PatchFinalOutline';
    finalOutline.strokeColor = new paper.Color('yellow');
    finalOutline.strokeWidth = mmToPx(THREAD_WIDTH_MM);
    setInkStitchData(finalOutline, {
      stroke_method: 'running_stitch',
      running_stitch_length_mm: 1.5, // shorter stitches for cutting around
    });
    layer.addChild(finalOutline);

    // NOTE: Trim off top and bottom layers of the patch before now, before running the finished edge!

    // Finished edge
    // A satin stitched border covering the unfinished fabric edge.
    // Offset outward from the final outline so it sits over the edge.
    const finishedEdge = PaperOffset.offset(finalOutline, mmToPx(1)) as paper.Path;
    finishedEdge.name = 'PatchFinishedEdge';
    finishedEdge.strokeWidth = mmToPx(2.5);
    finishedEdge.strokeColor = new paper.Color(this.finishedEdgeColor);
    setInkStitchData(finishedEdge, {
      stroke_method: 'zigzag_stitch',
      force_lock_stitches: true,
      lock_start: 'back_forth',
      lock_end: 'back_forth',
      zigzag_spacing_mm: 0.3,
      stroke_pull_compensation_mm: 1,
    });
    layer.addChild(finishedEdge);

    // The base outline isn't part of the final design.
    outlinePath.remove();
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'patchMargin', {
      min: 1,
      max: 10,
      step: 0.5,
    }).on('change', () => this.controller.render());

    folder.addBinding(this, 'color', {
      picker: 'inline',
    }).on('change', () => this.controller.render());

    folder.addBinding(this, 'finishedEdgeColor', {
      picker: 'inline',
    }).on('change', () => this.controller.render());

    folder.addBinding(this, 'beanStitch')
      .on('change', () => this.controller.render());
  }
}

// Convex hull of every segment point across the layer's paths, as a closed path.
function convexHull(layer: paper.Layer): paper.Path {
  const points: [number, number][] = [];
  for (const child of layer.children) {
    if (child instanceof paper.Path) {
      for (const segment of child.segments) {
        points.push([segment.point.x, segment.point.y]);
      }
    }
  }

  const hull = polygonHull(points);
  if (!hull) {
    return new paper.Path.Rectangle(layer.bounds);
  }

  const path = new paper.Path(hull.map(([x, y]) => new paper.Point(x, y)));
  path.closed = true;
  return path;
}

export const STYLES = [
  RunningStitchStyle,
  PatchStyle,
];
