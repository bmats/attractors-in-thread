import paper from 'paper';
import { FolderApi } from 'tweakpane';
import type Controller from './controller';
import { mmToPx, THREAD_WIDTH_MM } from './math';
import { setInkStitchData } from './inkstitch';

export abstract class StyleBase {
  abstract readonly name: string;

  controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
  }

  abstract apply(group: paper.Group): void;
  abstract buildTweakpane(folder: FolderApi): void;
}

export class RunningStitchStyle extends StyleBase {
  readonly name: string = 'Running Stitch';

  color: string = '#000000';
  beanStitch: boolean = false;

  // scale: { x: number; y: number } = { x: 1, y: 1 };

  apply(group: paper.Group): void {
    // Apply style to all paths in the group
    for (const path of group.children) {
      path.strokeWidth = mmToPx(THREAD_WIDTH_MM);
      path.strokeColor = new paper.Color(this.color);

      setInkStitchData(path, {
        stroke_method: 'running_stitch',
        running_stitch_length_mm: 2.5,

        ...(this.beanStitch ? { bean_stitch_repeats: 1 } : {}),
      });
    }

    // group.scale(this.scale.x, this.scale.y, paper.view.center);
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'color', {
      picker: 'inline',
    }).on('change', () => this.controller.render());

    folder.addBinding(this, 'beanStitch', {
      label: 'bean stitch',
    }).on('change', () => this.controller.render());

    // folder.addBinding(this, 'scale', {
    //   x: { min: 0, max: 2 },
    //   y: { min: 0, max: 2, inverted: true },
    // }).on('change', () => this.controller.render());
  }
}

export const STYLES = [
  RunningStitchStyle,
];
