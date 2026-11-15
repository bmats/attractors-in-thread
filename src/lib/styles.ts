import paper from 'paper';
import { FolderApi } from 'tweakpane';
import { PaperOffset } from 'paperjs-offset';
import { polygonHull } from 'd3-polygon';
import type Controller from './controller';
import { HOOP_HEIGHT_MM, HOOP_WIDTH_MM, MM_TO_PX, mmToPx, THREAD_WIDTH_MM } from './math';
import { setInkStitchData, type InkStitchAttributes } from './inkstitch';
import patchTemplateSvg from '../assets/templates/patch-template.svg?raw';
import keychainTemplateSvg from '../assets/templates/keychain-template.svg?raw';
import owlTemplateSvg from '../assets/templates/owl-template.svg?raw';

/** A circle, in hoop px, that every stitch must stay inside. */
export interface SafeArea {
  center: paper.Point;
  radius: number;
}

/**
 * A style is a post-process pass. It transforms the rendered attractor to produce the finished design.
 */
export abstract class StyleBase {
  abstract readonly name: string;

  controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
  }

  /** Areas every stitch must stay inside. Empty means only the hoop bounds apply. */
  safeAreas(): SafeArea[] {
    return [];
  }

  /** Returns export validation errors for this style's current configuration. */
  warnings(): string[] {
    return [];
  }

  /** Draws preview-only reference shapes, such as the piece being stitched onto. */
  renderTemplate(_layer: paper.Layer): void {
  }

  /** Builds the finished, stitchable design into layer. The design group is a fresh copy made for this pass. */
  abstract apply(design: paper.Group, layer: paper.Layer): void;
  abstract buildTweakpane(folder: FolderApi): void;
}

export class RunningStitchStyle extends StyleBase {
  readonly name: string = 'Running Stitch';

  color: string = '#000000';
  beanStitch: boolean = false;

  apply(design: paper.Group, layer: paper.Layer): void {
    this.stitch(design);
    layer.addChild(design);
  }

  /** Running stitches every path in the design. */
  protected stitch(design: paper.Group): void {
    for (const path of design.children) {
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
    folder.addBinding(this, 'beanStitch')
      .on('change', () => this.controller.renderCached());

    folder.addBinding(this, 'color', {
      picker: 'inline',
    }).on('change', () => this.controller.renderCached());
  }
}

export class ContourPatchStyle extends StyleBase {
  readonly name: string = 'Contour Patch';

  patchMargin: number = 3;
  color: string = '#000000';
  finishedEdgeColor: string = '#2f2cd7';
  beanStitch: boolean = false;

  apply(design: paper.Group, layer: paper.Layer): void {
    // Main design: running stitch
    for (const path of design.children) {
      path.strokeWidth = mmToPx(THREAD_WIDTH_MM);
      path.strokeColor = new paper.Color(this.color);
      setInkStitchData(path, {
        stroke_method: 'running_stitch',
        running_stitch_length_mm: 2.5,

        ...(this.beanStitch ? { bean_stitch_repeats: 1 } : {}),
      });
    }
    layer.addChild(design);

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
    }).on('change', () => this.controller.renderCached());

    folder.addBinding(this, 'color', {
      picker: 'inline',
    }).on('change', () => this.controller.renderCached());

    folder.addBinding(this, 'finishedEdgeColor', {
      picker: 'inline',
    }).on('change', () => this.controller.renderCached());

    folder.addBinding(this, 'beanStitch')
      .on('change', () => this.controller.renderCached());
  }
}

// Convex hull of every segment point across the layer's paths, as a closed path.
function convexHull(layer: paper.Layer): paper.Path {
  const points: [number, number][] = [];
  const paths = layer.getItems({
    match: (item: paper.Item) => item instanceof paper.Path,
  }) as paper.Path[];
  for (const path of paths) {
    for (const segment of path.segments) {
      points.push([segment.point.x, segment.point.y]);
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

// Map the hoop working area onto the safe area's radius so the design keeps its size relative to the hoop.
const HOOP_CENTER = new paper.Point(mmToPx(HOOP_WIDTH_MM / 2), mmToPx(HOOP_HEIGHT_MM / 2));
const FRAME_RADIUS = mmToPx(Math.min(HOOP_WIDTH_MM, HOOP_HEIGHT_MM) / 2);

const TEMPLATE_LINE_COLOR = 'rgba(0, 0, 0, 0.5)';

/**
 * Stitch the design onto a pre-cut piece described by template SVGs.
 * The design is running stitched and placed into each of the template's safe areas. The template outline is shown but not stitched.
 */
abstract class TemplateStyle extends RunningStitchStyle {
  margin: number = 1; // mm, shrinks the safe areas
  fillColor: string = '#ffffff'; // preview only

  private outline: paper.Path;
  private safeCircles: SafeArea[];

  constructor(controller: Controller, svgs: string[], outlineId: string, safeAreaIds: string[]) {
    super(controller);

    const docs = svgs.map((svg) => new DOMParser().parseFromString(svg, 'image/svg+xml'));
    const element = (id: string) => {
      const el = docs.map((doc) => doc.getElementById(id)).find((found) => found);
      if (!el) throw new Error(`Template is missing #${id}`);
      return el;
    };

    this.outline = new paper.Path({ pathData: element(outlineId).getAttribute('d')!, insert: false });
    this.outline.scale(MM_TO_PX, new paper.Point(0, 0));

    this.safeCircles = safeAreaIds.map((id) => {
      const el = element(id);
      const attr = (name: string) => Number(el.getAttribute(name));
      const radius = el.hasAttribute('r') ? attr('r') : Math.min(attr('rx'), attr('ry'));
      return { center: new paper.Point(attr('cx'), attr('cy')).multiply(MM_TO_PX), radius: mmToPx(radius) };
    });
  }

  /** Matrix mapping the hoop working area onto each safe area (minus the margin) */
  private placements(): paper.Matrix[] {
    const [upright, next] = this.safeCircles;
    // The design's up points from the upright safe area toward the next one
    const up = next ? next.center.subtract(upright.center).angle + 90 : 0;

    return this.safeCircles.map((circle, index) => {
      const scale = Math.max(circle.radius - mmToPx(this.margin), 0) / FRAME_RADIUS;
      return new paper.Matrix()
        .translate(circle.center)
        .rotate(index === 0 ? up : up + 180, new paper.Point(0, 0))
        .scale(scale)
        .translate(HOOP_CENTER.multiply(-1));
    });
  }

  safeAreas(): SafeArea[] {
    return this.safeCircles.map(({ center, radius }) => ({ center, radius: radius - mmToPx(this.margin) }));
  }

  warnings(): string[] {
    return new paper.Color(this.color).equals(new paper.Color(this.fillColor)) ? ['⚠️ Thread color matches the fill color'] : [];
  }

  apply(design: paper.Group, layer: paper.Layer): void {
    this.stitch(design);

    // Copy first so every copy starts from the untransformed design!
    const placements = this.placements();
    const copies = placements.map((_, index) => index === 0 ? design : design.clone({ insert: false }) as paper.Group);
    copies.forEach((copy, index) => copy.transform(placements[index]));

    layer.addChildren(copies);
  }

  renderTemplate(layer: paper.Layer): void {
    const outline = this.outline.clone({ insert: false });
    outline.strokeColor = new paper.Color(TEMPLATE_LINE_COLOR);
    outline.strokeWidth = 1;
    outline.fillColor = new paper.Color(this.fillColor);
    layer.addChild(outline);

    for (const { center, radius } of this.safeAreas()) {
      layer.addChild(new paper.Path.Circle({
        center,
        radius,
        strokeColor: new paper.Color(TEMPLATE_LINE_COLOR),
        strokeWidth: 1,
        dashArray: [4, 4],
        insert: false,
      }));
    }
  }

  buildTweakpane(folder: FolderApi): void {
    super.buildTweakpane(folder);

    folder.addBinding(this, 'fillColor', {
      picker: 'inline',
    }).on('change', () => this.controller.renderCached());

    folder.addBinding(this, 'margin', {
      label: 'margin (mm)',
      min: 0,
      max: 10,
      step: 0.5,
    }).on('change', () => this.controller.renderCached());
  }
}

export class PatchTemplateStyle extends TemplateStyle {
  readonly name: string = 'Patch Template';

  constructor(controller: Controller) {
    super(controller, [patchTemplateSvg], 'PatchAnchor', ['PatchSafeArea']);
  }
}

export class KeychainTemplateStyle extends TemplateStyle {
  readonly name: string = 'Keychain Template';

  constructor(controller: Controller) {
    super(controller, [keychainTemplateSvg], 'KeychainAnchor', [
      'KeychainSafeAreaBottom', 'KeychainSafeAreaTop'
    ]);
  }
}

const INKSTITCH_NAMESPACE = 'http://inkstitch.org/namespace';

/**
 * The patch template with an owl stitched around the design.
 * The owl is included in the output and stitched after the design in its own thread color.
 */
export class OwlPatchTemplateStyle extends TemplateStyle {
  readonly name: string = 'Owl Patch Template';

  owlColor: string = '#ff6600';

  private owl: paper.Group;

  constructor(controller: Controller) {
    super(controller, [patchTemplateSvg, owlTemplateSvg], 'PatchAnchor', ['AttractorSafeArea']);

    const doc = new DOMParser().parseFromString(owlTemplateSvg, 'image/svg+xml');
    this.owl = paper.project.importSVG(doc.querySelector<SVGGElement>('#Owl')!, { insert: false, expandShapes: true }) as paper.Group;
    this.owl.scale(MM_TO_PX, new paper.Point(0, 0));

    const owlPaths = this.owl.getItems({ match: (item: paper.Item) => item instanceof paper.Path }) as paper.Path[];
    for (const path of owlPaths) {
      if (path.strokeColor) {
        path.strokeWidth = mmToPx(THREAD_WIDTH_MM);
        path.dashArray = [];
      }
      path.data.ignoreSafeArea = true;

      // Paper.js drops the inkstitch:* attributes on import, so carry them over from the source element.
      const attributes: Record<string, string> = {};
      for (const attribute of doc.getElementById(path.name)?.attributes ?? []) {
        if (attribute.namespaceURI === INKSTITCH_NAMESPACE) attributes[attribute.localName] = attribute.value;
      }
      setInkStitchData(path, attributes as InkStitchAttributes);
    }
  }

  apply(design: paper.Group, layer: paper.Layer): void {
    super.apply(design, layer);
    const owl = this.owl.clone({ insert: false }) as paper.Group;

    // Update owl colors to match color property
    const paths = owl.getItems({ match: (item: paper.Item) => item instanceof paper.Path }) as paper.Path[];
    for (const path of paths) {
      if (path.fillColor) path.fillColor = new paper.Color(this.owlColor);
      if (path.strokeColor) path.strokeColor = new paper.Color(this.owlColor);
    }
    layer.addChild(owl);
  }

  warnings(): string[] {
    const warnings = super.warnings();
    if (new paper.Color(this.owlColor).equals(new paper.Color(this.color))) warnings.push('⚠️ Owl color matches the thread color');
    return warnings;
  }

  buildTweakpane(folder: FolderApi): void {
    super.buildTweakpane(folder);

    folder.addBinding(this, 'owlColor', {
      picker: 'inline',
    }).on('change', () => this.controller.renderCached());
  }
}

export const STYLES = [
  PatchTemplateStyle,
  KeychainTemplateStyle,
  OwlPatchTemplateStyle,

  // Not covered in workshop
  // RunningStitchStyle,
  // ContourPatchStyle,
];
