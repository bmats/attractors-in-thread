import paper from 'paper';
import { FolderApi, Pane } from 'tweakpane';
import type { BindingApi } from '@tweakpane/core';
import * as TweakpaneThumbnailList from '@kitschpatrol/tweakpane-plugin-thumbnail-list';
import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import type { ButtonGridApi } from '@tweakpane/plugin-essentials';
import { AttractorBase } from './attractor';
import { ATTRACTORS } from './attractors';
import { convertToInkStitch } from './inkstitch';
import { HOOP_HEIGHT_MM, HOOP_WIDTH_MM, mmToPx, pxToMm } from './math';
import StitchOut from './stitchout';
import { type SafeArea, StyleBase, STYLES } from './styles';

// Distance between points checked along a path for the safe area check
const SAFE_AREA_SAMPLE_MM = 0.5;

/** Returns true if every point along `path`, including its stroke, is inside one of `areas`. */
function isInsideSafeAreas(path: paper.Path, areas: SafeArea[]): boolean {
  const halfStroke = path.strokeColor ? path.strokeWidth / 2 : 0;
  const step = mmToPx(SAFE_AREA_SAMPLE_MM);
  for (let offset = 0; offset <= path.length; offset += step) {
    const point = path.getPointAt(offset);
    if (!areas.some((area) => point.getDistance(area.center) + halfStroke <= area.radius)) {
      return false;
    }
  }
  return true;
}

const LOCAL_STORAGE_KEY = 'attractors-state';
const SHARED_FOLDER_URL = 'https://drive.google.com/drive/folders/1EMbGuHu8IpCFKpLO6MErmYHSC6BJ9hHk?usp=sharing';

export default class Controller {
  pane: Pane;

  templateLayer: paper.Layer;
  designLayer: paper.Layer;

  isLoadingState: boolean = false;

  attractorCachedGroup = new paper.Group({ insert: false });

  attractorIndex: string = '0';
  attractor!: AttractorBase;
  attractorFolder?: FolderApi;

  styleIndex: number = 0;
  style: StyleBase = new STYLES[this.styleIndex](this);
  styleFolder?: FolderApi;

  stitchOut = new StitchOut();

  error: string = '';
  errorBinding!: BindingApi;

  constructor() {
    this.designLayer = paper.project.activeLayer;
    this.templateLayer = new paper.Layer({ name: 'Template' });
    this.templateLayer.insertBelow(this.designLayer);

    this.pane = new Pane({ container: document.querySelector<HTMLElement>('#panel')! });
    this.pane.registerPlugin(TweakpaneThumbnailList);
    this.pane.registerPlugin(EssentialsPlugin);

    this.pane.addBinding(this, 'attractorIndex', {
      label: 'attractor',
      view: 'thumbnail-list',
      options: ATTRACTORS.map((AttractorClass, index) => {
        const attractor = new AttractorClass(this);
        return { text: attractor.name, value: String(index), src: attractor.imagePath };
      }),
    }).on('change', () => this.changeAttractor());

    this.pane.addBinding(this, 'styleIndex', {
      label: 'style',
      view: 'list',
      options: STYLES.map((StyleClass, index) => {
        const style = new StyleClass(this);
        return { text: style.name, value: index };
      }),
    }).on('change', () => this.changeStyle());

    this.pane.addButton({ title: 'Start over', label: 'reset' }).on('click', () => {
      console.log('[state] Reset');
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      location.reload();
    });

    const exportFolder = this.pane.addFolder({ title: 'Export', index: 5 });
    this.errorBinding = exportFolder.addBinding(this, 'error', {
      readonly: true,
      label: undefined, // hide the label
      multiline: true,
      rows: 2,
      interval: 0,
    });

    this.pane.addButton({ title: 'Export SVG' }).on('click', () => this.exportSVG());
    this.pane.addButton({ title: 'Open shared folder' }).on('click', () => window.open(SHARED_FOLDER_URL, '_blank', 'noopener'));

    this.changeAttractor();
    this.changeStyle();

    // Load state from local storage and persist changes
    this.loadState();
    this.pane.on('change', () => this.saveState());

    // Set up event handlers to control the attractor.
    paper.view.onMouseDrag = (event: paper.MouseEvent) => this.attractor.onDrag(event.delta);
    paper.view.element.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault(); // zoom the camera instead of scrolling the page
      this.attractor.onScroll(event.deltaY);
    }, { passive: false });

    document.querySelector('#restart-button')!.addEventListener('click', () => this.playStitchOut());
    this.playStitchOut();
  }

  playStitchOut(): void {
    this.stitchOut.play(this.designLayer);
  }

  /** Switches the current attractor, updates the pane, and triggers a render. */
  changeAttractor(): void {
    const AttractorClass = ATTRACTORS[Number(this.attractorIndex)];
    this.attractor = new AttractorClass(this);

    // Create Tweakpane folder
    if (this.attractorFolder) {
      this.attractorFolder.dispose();
    }
    this.attractorFolder = this.pane.addFolder({ title: `Attractor: ${this.attractor.name}`, index: 3 });
    this.attractor.buildTweakpane(this.attractorFolder);

    // Add buttons to reset to a fresh instance or randomize the current one
    (this.attractorFolder.addBlade({
      view: 'buttongrid',
      size: [2, 1],
      cells: (x: number) => ({ title: x === 0 ? 'reset' : 'randomize' }),
      label: 'preset',
    }) as ButtonGridApi).on('click', (event) => {
      if (event.index[0] === 0) {
        this.changeAttractor();
      } else {
        this.attractor.randomize();
      }
    });

    this.render();
  }

  /** Switches the current style, updates the pane, and triggers a render. */
  changeStyle(): void {
    const StyleClass = STYLES[this.styleIndex];
    this.style = new StyleClass(this);

    // Create Tweakpane folder
    if (this.styleFolder) {
      this.styleFolder.dispose();
    }
    this.styleFolder = this.pane.addFolder({ title: `Style: ${this.style.name}`, index: 4 });
    this.style.buildTweakpane(this.styleFolder);

    this.renderCached();
  }

  /** Renders the current attractor, then styles it. */
  render(): void {
    if (this.isLoadingState) return;

    this.attractorCachedGroup = new paper.Group({ insert: false });
    this.attractor.render(this.attractorCachedGroup);

    this.renderCached();
  }

  /** Restyles the cached attractor without recomputing it. Use when only the style changes. */
  renderCached(): void {
    if (this.isLoadingState) return;
    this.stitchOut.stop(); // any change shows the full design

    for (const layer of [this.templateLayer, this.designLayer]) {
      layer.removeChildren();
    }

    // The style gets its own copy of the design so it can change it without affecting the next pass
    const design = this.attractorCachedGroup.clone({ insert: false }) as paper.Group;
    this.style.apply(design, this.designLayer);
    this.style.renderTemplate(this.templateLayer);

    this.validate();
  }

  /** Checks the render for problems and shows them in the pane. */
  validate(): void {
    const errors: string[] = [];

    const stitched = this.designLayer.getItems({
      match: (item: paper.Item) => item instanceof paper.Path,
    }) as paper.Path[];
    if (stitched.some((item) => !paper.view.bounds.contains(item.strokeBounds))) {
      errors.push('⚠️ Design extends outside the embroidery area');
    }

    const safeAreas = this.style.safeAreas();
    const generated = stitched.filter((path) => !path.data.ignoreSafeArea);
    if (safeAreas.length > 0 && generated.some((path) => !isInsideSafeAreas(path, safeAreas))) {
      errors.push('⚠️ Design extends outside the patch\'s safe area');
    }

    errors.push(...this.style.warnings());

    this.error = errors.length === 0 ? '' : errors.join('\n');
    this.errorBinding.refresh();
  }

  /** Restores the pane state from local storage. */
  loadState(): void {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;

    this.isLoadingState = true;
    try {
      const state = JSON.parse(saved);

      // Pass 1 restores the two indices.
      this.pane.importState(state);
      // this.changeAttractor();
      // this.changeStyle();

      // Pass 2 restores the parameters of the folders those indices rebuild.
      this.pane.importState(state);

      console.log('[state] Loaded', state);
    } catch (error) {
      console.error('[state] Load failed', error, saved);
    }

    this.isLoadingState = false;
    this.render();
  }

  /** Saves the pane state to local storage. */
  saveState(): void {
    if (this.isLoadingState) return;

    const state = this.pane.exportState();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }

  /** Builds and exports an Ink/Stitch-compatible SVG. */
  exportSVG(): void {
    // Finish any animation so no partial paths end up in the export
    this.stitchOut.stop();

    // Scale the Paper.js project to match the physical dimensions of the canvas in mm
    const scaleMatrix = new paper.Matrix().scale(
      pxToMm(1),
      new paper.Point(0, 0));

    // Clear the template so only stitches are exported
    this.templateLayer.removeChildren();

    // Generate SVG from Paper.js project
    const svg = paper.project.exportSVG({
      asString: false,
      matchShapes: true,
      matrix: scaleMatrix,
    }) as SVGSVGElement;
    this.renderCached(); // restore the template

    // Convert to an Ink/Stitch-compatible SVG
    convertToInkStitch(svg, {
      widthMm: HOOP_WIDTH_MM,
      heightMm: HOOP_HEIGHT_MM,
    });

    // Serialize
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Trigger download of the file
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
    a.download = `attractor-${this.attractor.name}-${ts}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
