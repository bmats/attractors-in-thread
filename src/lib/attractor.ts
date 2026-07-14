import paper from 'paper';
import { FolderApi } from 'tweakpane';
import { Box3, PerspectiveCamera, Vector3 } from 'three';
import type Controller from './controller';
import { mmToPx } from './math';

// Margin for embroidery area
const MARGIN_MM = 1;

export abstract class AttractorBase {
  abstract readonly name: string;
  readonly imagePath: string = '';

  controller: Controller;

  constructor(controller: Controller) {
    this.controller = controller;
  }

  abstract render(group: paper.Group): void;
  abstract buildTweakpane(folder: FolderApi): void;

  fitToView(path: paper.Path): void {
    if (path.segments.length <= 1) {
      return;
    }

    // Center on the view and scale to fit the target size, leaving a margin on all sides
    const maxSize = Math.min(paper.view.size.width, paper.view.size.height) - 2 * mmToPx(MARGIN_MM);
    const bounds = path.bounds;
    const maxBounds = Math.max(bounds.width, bounds.height);
    path.scale(maxSize / maxBounds, bounds.center);
    path.position = paper.view.center;

    console.log(`Fit to view from ${bounds.width} x ${bounds.height} to ${maxSize}`);
  }
}

export abstract class Attractor2D extends AttractorBase {
  startPoint: paper.Point;

  iterations: number = 3000;
  delta: number = 0.01;

  constructor(controller: Controller, startPoint: paper.Point) {
    super(controller);
    this.startPoint = startPoint;
  }

  abstract nextPoint(point: paper.Point, t: number, delta: number): paper.Point;

  render(group: paper.Group): void {
    const path = new paper.Path();
    group.addChild(path);

    let point = this.startPoint;
    for (let i = 0; i < this.iterations; i++) {
      const t = i * this.delta;
      point = this.nextPoint(point, t, this.delta);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        console.warn(`Encountered invalid point ${point} in iteration ${i}. Check the start and delta values.`);
        return;
      }

      path.add(point);
    }

    this.fitToView(path);

    // TODO: Simplify path?

    console.log(`Rendered ${this.name}: ${this.iterations} points`);
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'iterations', {
      min: 100,
      max: 20000,
      step: 1,
    }).on('change', () => this.controller.render());
    folder.addBinding(this, 'delta', {
      min: 0.001,
      max: 0.1,
    }).on('change', () => this.controller.render());
  }
}

export abstract class Attractor3D extends AttractorBase {
  startPoint: Vector3;

  iterations: number = 3000;
  delta: number = 0.01;

  orbit: { x: number; y: number } = { x: 0, y: 0 };
  roll: number = 0;
  // Camera distance from the attractor center, as a multiple of its largest extent
  cameraDistance: number = 2;

  constructor(controller: Controller, startPoint: Vector3) {
    super(controller);
    this.startPoint = startPoint;
  }

  abstract nextPoint(point: Vector3, delta: number): Vector3;

  render(group: paper.Group): void {
    const path = new paper.Path();
    group.addChild(path);

    const points: Vector3[] = [];
    const bounds = new Box3();

    let point = this.startPoint;
    for (let i = 0; i < this.iterations; i++) {
      point = this.nextPoint(point, this.delta);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
        console.warn(`Encountered invalid point ${point.toArray()} in iteration ${i}. Check the start and delta values.`);
        return;
      }

      points.push(point);
      bounds.expandByPoint(point);
    }

    const camera = this.createCamera(bounds);
    const centerX = paper.view.size.width / 2;
    const centerY = paper.view.size.height / 2;
    for (const point of points) {
      // project() returns normalized device coordinates in [-1, 1], y up
      const projected = point.clone().project(camera);
      path.add(new paper.Point(projected.x * centerX, -projected.y * centerY));
    }

    this.fitToView(path);

    // TODO: Simplify path?

    console.log(`Rendered ${this.name}: ${this.iterations} points`);
  }

  createCamera(bounds: Box3): PerspectiveCamera {
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxExtent = Math.max(size.x, size.y, size.z, 0.001);
    const distance = this.cameraDistance * maxExtent;

    // Orbit the camera around the center. Stop just short of the poles, where the
    // view direction would be parallel to lookAt()'s up vector.
    const azimuth = this.orbit.x * Math.PI;
    const elevation = this.orbit.y * (Math.PI / 2) * 0.999;
    const offset = new Vector3(
      Math.sin(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.cos(azimuth) * Math.cos(elevation),
    ).multiplyScalar(distance);

    const camera = new PerspectiveCamera(
      50,
      paper.view.size.width / paper.view.size.height,
      distance * 0.001,
      distance * 10,
    );
    camera.position.copy(center).add(offset);
    camera.lookAt(center);
    camera.rotateZ(this.roll); // camera looks at -Z, so rotate around Z to roll
    camera.updateMatrixWorld();

    return camera;
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'iterations', {
      min: 100,
      max: 20000,
      step: 1,
    }).on('change', () => this.controller.render());
    folder.addBinding(this, 'delta', {
      min: 0.001,
      max: 0.1,
    }).on('change', () => this.controller.render());
    folder.addBinding(this, 'orbit', {
      picker: 'inline',
      expanded: true,
      x: { min: -1, max: 1 },
      y: { min: -1, max: 1, inverted: true },
    }).on('change', () => this.controller.render());
    folder.addBinding(this, 'roll', {
      min: -Math.PI,
      max: Math.PI,
    }).on('change', () => this.controller.render());
    folder.addBinding(this, 'cameraDistance', {
      min: 1,
      max: 10,
    }).on('change', () => this.controller.render());
  }
}
