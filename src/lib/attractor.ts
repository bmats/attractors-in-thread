import paper from 'paper';
import { FolderApi } from 'tweakpane';
import type { BindingApi } from '@tweakpane/core';
import { Box3, Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type Controller from './controller';
import { mmToPx } from './math';

// Margin for embroidery area
const MARGIN_MM = 1;

// Camera distance multipliers
const MIN_CAMERA_DISTANCE = 1;
const MAX_CAMERA_DISTANCE = 10;

export abstract class AttractorBase {
  abstract readonly name: string;
  readonly imagePath: string = '';

  controller: Controller;

  // Scalar bindings that `randomize()` may re-roll within their declared range.
  private randomizable: { target: object; key: string; min: number; max: number; binding: BindingApi }[] = [];

  constructor(controller: Controller) {
    this.controller = controller;
  }

  abstract render(layer: paper.Layer): void;
  abstract buildTweakpane(folder: FolderApi): void;

  /** Adds a slider bound to `target[key]`, rendering on change and registering it for randomization. */
  protected slider<T extends object>(folder: FolderApi, target: T, key: keyof T & string, min: number, max: number): void {
    const binding = folder.addBinding(target, key, { min, max });
    binding.on('change', () => this.controller.render());
    this.randomizable.push({ target, key, min, max, binding });
  }

  /** Re-rolls every registered slider within its range, then re-renders. No-op if none are registered. */
  randomize(): void {
    for (const { target, key, min, max, binding } of this.randomizable) {
      (target as Record<string, number>)[key] = min + Math.random() * (max - min);
      binding.refresh();
    }
    this.controller.render();
  }

  onDrag(_delta: paper.Point): void {
  }

  onScroll(_deltaY: number): void {
  }
}

export abstract class Attractor2D extends AttractorBase {
  startPoint: paper.Point = new paper.Point(0.1, 0.1);

  iterations: number = 3000;
  deltaTime: number = 0.01;

  abstract nextPoint(point: paper.Point, t: number, deltaTime: number): paper.Point;

  render(layer: paper.Layer): void {
    const path = new paper.Path();
    path.name = 'Attractor';
    layer.addChild(path);

    let point = this.startPoint;
    for (let i = 0; i < this.iterations; i++) {
      const t = i * this.deltaTime;
      point = this.nextPoint(point, t, this.deltaTime);
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
      max: 10000,
      step: 1,
    }).on('change', () => this.controller.render());
  }

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
  }
}

export abstract class Attractor3D extends AttractorBase {
  startPoint: Vector3 = new Vector3(1, 1, 1);

  iterations: number = 3000;
  deltaTime: number = 0.01;

  // Camera orientation as Euler angles.
  rotation: Vector3 = new Vector3(0, 0, 0);
  rotationBinding?: BindingApi;

  // Camera distance from the center, as a multiple of the attractor's largest extent.
  cameraDistance: number = 1.5;
  cameraDistanceBinding?: BindingApi;

  fov: number = 50;

  abstract nextPoint(point: Vector3, deltaTime: number): Vector3;

  render(layer: paper.Layer): void {
    const path = new paper.Path();
    path.name = 'Attractor';
    layer.addChild(path);

    const points: Vector3[] = [];
    const bounds = new Box3();

    let point = this.startPoint;
    for (let i = 0; i < this.iterations; i++) {
      point = this.nextPoint(point, this.deltaTime);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) {
        console.warn(`Encountered invalid point ${point.toArray()} in iteration ${i}. Check the start and delta values.`);
        return;
      }

      points.push(point);
      bounds.expandByPoint(point);
    }

    const camera = this.createCamera(bounds);
    const center = paper.view.center;
    const halfWidth = paper.view.size.width / 2;
    const halfHeight = paper.view.size.height / 2;
    for (const point of points) {
      const projected = point.clone().project(camera);
      // Remap projected points to paper's coordinate system.
      // project() returns normalized device coordinates in [-1, 1], y up
      path.add(new paper.Point(
        center.x + projected.x * halfWidth,
        center.y - projected.y * halfHeight,
      ));
    }

    // TODO: Simplify path?

    console.log(`Rendered ${this.name}: ${this.iterations} points`);
  }

  createCamera(bounds: Box3): PerspectiveCamera {
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const maxExtent = Math.max(size.x, size.y, size.z, 0.001);
    const distance = this.cameraDistance * maxExtent;

    const orientation = new Quaternion().setFromEuler(new Euler(
      this.rotation.x,
      this.rotation.y,
      this.rotation.z,
      'YXZ',
    ));

    const camera = new PerspectiveCamera(
      this.fov,
      paper.view.size.width / paper.view.size.height,
      distance * 0.001,
      distance * 10,
    );

    // The camera at -Z, so move along +Z to orbit at a distance around the center.
    camera.position.copy(center).add(new Vector3(0, 0, distance).applyQuaternion(orientation));
    camera.quaternion.copy(orientation);
    camera.updateMatrixWorld();

    return camera;
  }

  onDrag(delta: paper.Point): void {
    // Drag to rotate: horizontal yaws, vertical pitches.
    const radiansPerPixel = (2 * Math.PI) / paper.view.size.height;
    this.rotation.y -= delta.x * radiansPerPixel;
    this.rotation.x -= delta.y * radiansPerPixel;
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

    this.rotationBinding?.refresh();
    this.controller.render();
  }

  onScroll(deltaY: number): void {
    // Scroll to dolly the camera in and out.
    // Copies Three.js's OrbitControls where each unit scales the distance instead of adding.
    const scale = Math.pow(0.95, Math.abs(deltaY) * 0.01);
    const distance = this.cameraDistance * (deltaY < 0 ? scale : 1 / scale);
    this.cameraDistance = Math.max(MIN_CAMERA_DISTANCE, Math.min(MAX_CAMERA_DISTANCE, distance));

    this.cameraDistanceBinding?.refresh();
    this.controller.render();
  }

  buildTweakpane(folder: FolderApi): void {
    folder.addBinding(this, 'iterations', {
      min: 100,
      max: 10000,
      step: 1,
    }).on('change', () => this.controller.render());

    const cameraFolder = folder.addFolder({ title: 'camera', expanded: false });

    this.rotationBinding = cameraFolder.addBinding(this, 'rotation', {
      x: { min: -Math.PI / 2, max: Math.PI / 2 }, // pitch
      y: { min: -Math.PI, max: Math.PI }, // yaw
      z: { min: -Math.PI, max: Math.PI }, // roll
    }).on('change', () => this.controller.render());

    this.cameraDistanceBinding = cameraFolder.addBinding(this, 'cameraDistance', {
      min: MIN_CAMERA_DISTANCE,
      max: MAX_CAMERA_DISTANCE,
    }).on('change', () => this.controller.render());

    cameraFolder.addBinding(this, 'fov', {
      min: 10,
      max: 120,
    }).on('change', () => this.controller.render());
  }
}
