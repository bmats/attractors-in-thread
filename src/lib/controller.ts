import paper from 'paper';
import { FolderApi, Pane } from 'tweakpane';
import type { BindingApi } from '@tweakpane/core';
import * as TweakpaneThumbnailList from '@kitschpatrol/tweakpane-plugin-thumbnail-list';
import { AttractorBase } from './attractor';
import { ATTRACTORS } from './attractors';
import { convertToInkStitch } from './inkstitch';
import { HOOP_HEIGHT_MM, HOOP_WIDTH_MM, pxToMm } from './math';
import { StyleBase, STYLES } from './styles';

const LOCAL_STORAGE_KEY = 'attractors-state';

export default class Controller {
  pane: Pane;

  isLoadingState: boolean = false;

  attractorIndex: number = 0;
  attractor!: AttractorBase;
  attractorFolder?: FolderApi;
  attractorGroup?: paper.Group;

  styleIndex: number = 0;
  style: StyleBase = new STYLES[this.styleIndex](this);
  styleFolder?: FolderApi;

  error: string = '';
  errorBinding!: BindingApi;

  constructor() {
    this.pane = new Pane();
    this.pane.registerPlugin(TweakpaneThumbnailList);

    this.pane.addBinding(this, 'attractorIndex', {
      label: 'Attractor',
      view: 'thumbnail-list',
      options: ATTRACTORS.map((AttractorClass, index) => {
        const attractor = new AttractorClass(this);
        return { text: attractor.name, value: index, src: attractor.imagePath };
      }),
    }).on('change', () => this.changeAttractor());

    this.pane.addBinding(this, 'styleIndex', {
      label: 'Style',
      view: 'list',
      options: STYLES.map((StyleClass, index) => {
        const style = new StyleClass(this);
        return { text: style.name, value: index };
      }),
    }).on('change', () => this.changeStyle());

    const exportFolder = this.pane.addFolder({ title: 'Export', index: 4 });
    this.errorBinding = exportFolder.addBinding(this, 'error', {
      readonly: true,
      label: undefined, // hide the label
      multiline: true,
      rows: 2,
      interval: 0,
    });
    exportFolder.addButton({ title: 'Export SVG' }).on('click', () => this.exportSVG());

    this.changeAttractor();
    this.changeStyle();

    // Load state from local storage and persist changes
    this.loadState();
    this.pane.on('change', () => this.saveState());
  }

  /** Switches the current attractor, updates the pane, and triggers a render. */
  changeAttractor(): void {
    const AttractorClass = ATTRACTORS[this.attractorIndex];
    this.attractor = new AttractorClass(this);

    // Create Tweakpane folder
    if (this.attractorFolder) {
      this.attractorFolder.dispose();
    }
    this.attractorFolder = this.pane.addFolder({ title: `Attractor: ${this.attractor.name}`, index: 2 });
    this.attractor.buildTweakpane(this.attractorFolder);

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
    this.styleFolder = this.pane.addFolder({ title: `Style: ${this.style.name}`, index: 3 });
    this.style.buildTweakpane(this.styleFolder);

    this.render();
  }

  /** Renders the current attractor. */
  render(): void {
    if (this.isLoadingState) return;

    if (this.attractorGroup) {
      this.attractorGroup.remove();
    }
    this.attractorGroup = new paper.Group();
    this.attractor.render(this.attractorGroup);
    this.style.apply(this.attractorGroup);
    console.log(`Rendered ${this.attractor.name}`, paper.project.activeLayer);

    this.validate();
  }

  /** Checks the render for problems and shows them in the pane. */
  validate(): void {
    const errors: string[] = [];

    if (this.attractorGroup && !paper.view.bounds.contains(this.attractorGroup.strokeBounds)) {
      errors.push('⚠️ Design extends outside the embroidery area');
    }

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
    // Scale the Paper.js project to match the physical dimensions of the canvas in mm
    const scaleMatrix = new paper.Matrix().scale(
      pxToMm(1),
      new paper.Point(0, 0));

    // Generate SVG from Paper.js project
    const svg = paper.project.exportSVG({
      asString: false,
      matchShapes: true,
      matrix: scaleMatrix,
    }) as SVGSVGElement;

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
