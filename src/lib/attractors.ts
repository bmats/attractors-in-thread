import paper from 'paper';
import { Vector3 } from 'three';
import { FolderApi } from 'tweakpane';
import { Attractor2D, Attractor3D } from './attractor';
import type Controller from './controller';

function addSlider<T extends object>(
  folder: FolderApi,
  controller: Controller,
  target: T,
  key: keyof T & string,
  min: number,
  max: number,
): void {
  folder.addBinding(target, key, { min, max }).on('change', () => controller.render());
}

class ThomasAttractor extends Attractor3D {
  readonly name = 'Thomas';
  readonly imagePath = '/thumb/thomas.svg';

  b: number = 0.208186;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(1.1, 1.1, -0.01);
    this.iterations = 4000;
    this.deltaTime = 10 * 0.027;
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = sin(y) - b*x
    // dy = sin(z) - b*y
    // dz = sin(x) - b*z

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (Math.sin(y) - this.b * x),
      y + deltaTime * (Math.sin(z) - this.b * y),
      z + deltaTime * (Math.sin(x) - this.b * z),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'b', 0.01, 0.4);
    addSlider(folder, this.controller, this.startPoint, 'x', -1.1, 1.1);
    addSlider(folder, this.controller, this.startPoint, 'y', -1.1, 1.1);
    addSlider(folder, this.controller, this.startPoint, 'z', -1, 1);

    super.buildTweakpane(folder);
  }
}

class AizawaAttractor extends Attractor3D {
  readonly name = 'Aizawa';
  readonly imagePath = '/thumb/aizawa.svg';

  a: number = 0.95;
  b: number = 0.7;
  c: number = 0.6;
  d: number = 3.5;
  e: number = 0.25;
  f: number = 0.1;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(0.1, 1, 0.01);
    this.iterations = 3900;
    this.deltaTime = 0.5 * 0.03;
    this.rotation.set(-0.51, 0.78, -1.11);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.algosome.com/articles/aizawa-attractor-chaos.html
    // dx = (z - b)*x - d*y
    // dy = d*x + (z - b)*y
    // dz = c + a*z - z3/3 - (x2 + y2)*(1 + e*z) + f*z*x3

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * ((z - this.b) * x - this.d * y),
      y + deltaTime * (this.d * x + (z - this.b) * y),
      z + deltaTime * (this.c
                   + this.a * z
                   - (z ** 3) / 3.0
                   - ((x ** 2) + (y ** 2)) * (1.0 + this.e * z)
                   + this.f * z * (x ** 3)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 0.3, 3);
    addSlider(folder, this.controller, this, 'b', 0.3, 3);
    addSlider(folder, this.controller, this, 'c', 0.1, 3);
    addSlider(folder, this.controller, this, 'd', 1, 3);
    addSlider(folder, this.controller, this, 'e', 0.01, 3);
    addSlider(folder, this.controller, this, 'f', 0.01, 3);
    addSlider(folder, this.controller, this.startPoint, 'x', -1.1, 1.1);
    addSlider(folder, this.controller, this.startPoint, 'y', -1.1, 1.1);
    addSlider(folder, this.controller, this.startPoint, 'z', -1, 1);

    super.buildTweakpane(folder);
  }
}

class LorenzAttractor extends Attractor3D {
  readonly name = 'Lorenz';
  readonly imagePath = '/thumb/lorenz.svg';

  sigma: number = 10;
  rho: number = 28;
  beta: number = 8 / 3;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(1.1, 2, 7);
    this.iterations = 3300;
    this.deltaTime = 0.5 * 0.01;
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = sigma*(-x + y)
    // dy = -x*z + rho*x - y
    // dz = x*y - beta*z

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (this.sigma * (-x + y)),
      y + deltaTime * (-x * z + this.rho * x - y),
      z + deltaTime * (x * y - this.beta * z),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'sigma', 0.1, 50);
    addSlider(folder, this.controller, this, 'rho', 0.5, 60);
    addSlider(folder, this.controller, this, 'beta', 0.1, 10);
    addSlider(folder, this.controller, this.startPoint, 'x', -10, 10);
    addSlider(folder, this.controller, this.startPoint, 'y', -10, 10);
    addSlider(folder, this.controller, this.startPoint, 'z', 0, 10);

    super.buildTweakpane(folder);
  }
}

class DadrasAttractor extends Attractor3D {
  readonly name = 'Dadras';
  readonly imagePath = '/thumb/dadras.svg';

  a: number = 3;
  b: number = 2.7;
  c: number = 1.7;
  d: number = 2;
  e: number = 9;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(1.1, 2.1, -2);
    this.iterations = 3500;
    this.deltaTime = 0.5 * 0.02;
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = y - a*x + b*y*z
    // dy = c*y - x*z + z
    // dz = d*x*y - e*z

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (y - this.a * x + this.b * y * z),
      y + deltaTime * (this.c * y - x * z + z),
      z + deltaTime * (this.d * x * y - this.e * z),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 1, 3);
    addSlider(folder, this.controller, this, 'b', 0.2, 3);
    addSlider(folder, this.controller, this, 'c', 0.1, 2);
    addSlider(folder, this.controller, this, 'd', 1, 3);
    addSlider(folder, this.controller, this, 'e', 5, 10);
    addSlider(folder, this.controller, this.startPoint, 'x', -1.5, 1.5);
    addSlider(folder, this.controller, this.startPoint, 'y', -2, 2);
    addSlider(folder, this.controller, this.startPoint, 'z', -5, 5);

    super.buildTweakpane(folder);
  }
}

class ChenAttractor extends Attractor3D {
  readonly name = 'Chen';
  readonly imagePath = '/thumb/chen.svg';

  alpha: number = 5;
  beta: number = -10;
  delta: number = -0.38;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(5, 10, 10);
    this.iterations = 3500;
    this.deltaTime = 0.5 * 0.02;
    this.rotation.set(-0.3, 1, 0);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = alpha*x - y*z
    // dy = beta*y + x*z
    // dz = delta*z + x*y/3

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (this.alpha * x - y * z),
      y + deltaTime * (this.beta * y + x * z),
      z + deltaTime * (this.delta * z + (x * y) / 3),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'alpha', 3, 5);
    addSlider(folder, this.controller, this, 'beta', -10, -7);
    addSlider(folder, this.controller, this, 'delta', -0.5, 0.1);
    addSlider(folder, this.controller, this.startPoint, 'x', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'y', -5, 10);
    addSlider(folder, this.controller, this.startPoint, 'z', -10, 10);

    super.buildTweakpane(folder);
  }
}

class Lorenz84Attractor extends Attractor3D {
  readonly name = 'Lorenz-84';
  readonly imagePath = '/thumb/lorenz-84.svg';

  a: number = 0.95;
  b: number = 7.91;
  f: number = 4.83;
  g: number = 4.66;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(-0.2, -2.82, 2.71);
    this.iterations = 3500;
    this.deltaTime = 1 * 0.01;
    this.rotation.set(0, -0.2, 0);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = -a*x - y2 - z2 + a*f
    // dy = -y + x*y - b*x*z + g
    // dz = -z + b*x*y + x*z

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (-this.a * x - (y ** 2) - (z ** 2) + this.a * this.f),
      y + deltaTime * (-y + x * y - this.b * x * z + this.g),
      z + deltaTime * (-z + this.b * x * y + x * z),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 0.01, 5);
    addSlider(folder, this.controller, this, 'b', 1, 9);
    addSlider(folder, this.controller, this, 'f', 3, 9);
    addSlider(folder, this.controller, this, 'g', 0.1, 9);
    addSlider(folder, this.controller, this.startPoint, 'x', -4, 4);
    addSlider(folder, this.controller, this.startPoint, 'y', -4, 4);
    addSlider(folder, this.controller, this.startPoint, 'z', -4, 4);

    super.buildTweakpane(folder);
  }
}

class RosslerAttractor extends Attractor3D {
  readonly name = 'Rössler';
  readonly imagePath = '/thumb/rossler.svg';

  a: number = 0.2;
  b: number = 0.2;
  c: number = 5.7;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(10, 0, 10);
    this.iterations = 3500;
    this.deltaTime = 0.5 * 0.03;
    this.rotation.set(0.78, -1.19, 1.85);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = -(y + z)
    // dy = x + a*y
    // dz = b + z*(x - c)

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (-(y + z)),
      y + deltaTime * (x + this.a * y),
      z + deltaTime * (this.b + z * (x - this.c)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 0.1, 10);
    addSlider(folder, this.controller, this, 'b', 0.1, 10);
    addSlider(folder, this.controller, this, 'c', 0.1, 10);
    addSlider(folder, this.controller, this.startPoint, 'x', -10, 10);
    addSlider(folder, this.controller, this.startPoint, 'y', -10, 10);
    addSlider(folder, this.controller, this.startPoint, 'z', -10, 10);

    super.buildTweakpane(folder);
  }
}

class HalvorsenAttractor extends Attractor3D {
  readonly name = 'Halvorsen';
  readonly imagePath = '/thumb/halvorsen.svg';

  a: number = 1.89;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(-1.48, -1.51, 2.04);
    this.iterations = 3500;
    this.deltaTime = 0.5 * 0.03;
    this.rotation.set(0.5, -2.27, 0);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = -a*x - 4*y - 4*z - y2
    // dy = -a*y - 4*z - 4*x - z2
    // dz = -a*z - 4*x - 4*y - x2

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (-this.a * x - 4 * y - 4 * z - (y ** 2)),
      y + deltaTime * (-this.a * y - 4 * z - 4 * x - (z ** 2)),
      z + deltaTime * (-this.a * z - 4 * x - 4 * y - (x ** 2)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 0.1, 3);
    addSlider(folder, this.controller, this.startPoint, 'x', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'y', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'z', -5, 5);

    super.buildTweakpane(folder);
  }
}

class RabinovichFabrikantAttractor extends Attractor3D {
  readonly name = 'Rabinovich-Fabrikant';
  readonly imagePath = '/thumb/rabinovich-fabrikant.svg';

  alpha: number = 0.14;
  gamma: number = 0.1;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(-1, 0, 0.5);
    this.iterations = 4000;
    this.deltaTime = 0.5 * 0.05;
    this.rotation.set(-1, 0, 0);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = y*(z - 1 + x2) + gamma*x
    // dy = x*(3*z + 1 - x2) + gamma*y
    // dz = -2*z*(alpha + x*y)

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (y * (z - 1 + (x ** 2)) + this.gamma * x),
      y + deltaTime * (x * (3 * z + 1 - (x ** 2)) + this.gamma * y),
      z + deltaTime * (-2 * z * (this.alpha + x * y)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'alpha', 0.1, 4);
    addSlider(folder, this.controller, this, 'gamma', 0.1, 4);
    addSlider(folder, this.controller, this.startPoint, 'x', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'y', -8, 8);
    addSlider(folder, this.controller, this.startPoint, 'z', 0, 7);

    super.buildTweakpane(folder);
  }
}

class ThreeScrollUnifiedChaoticSystem extends Attractor3D {
  readonly name = 'Three-Scroll Unified Chaotic System';
  readonly imagePath = '/thumb/three-scroll-unified-chaotic-system.svg';

  a: number = 32.48;
  b: number = 45.84;
  c: number = 1.18;
  d: number = 0.13;
  e: number = 0.57;
  f: number = 14.7;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(-0.29, -0.25, -0.59);
    this.iterations = 6500;
    this.deltaTime = 0.5 * 0.0007;
    this.rotation.set(-1.5, 0, 0);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = a*(y - x) + d*x*z
    // dy = b*x - x*z + f*y
    // dz = c*z + x*y - e*x2

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (this.a * (y - x) + this.d * x * z),
      y + deltaTime * (this.b * x - x * z + this.f * y),
      z + deltaTime * (this.c * z + x * y - this.e * (x ** 2)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 30, 40);
    addSlider(folder, this.controller, this, 'b', 30, 55);
    addSlider(folder, this.controller, this, 'c', 0.1, 11 / 6);
    addSlider(folder, this.controller, this, 'd', 0.01, 0.16);
    addSlider(folder, this.controller, this, 'e', 0.01, 0.65);
    addSlider(folder, this.controller, this, 'f', 10, 20);
    addSlider(folder, this.controller, this.startPoint, 'x', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'y', -5, 5);
    addSlider(folder, this.controller, this.startPoint, 'z', -5, 5);

    super.buildTweakpane(folder);
  }
}

class SprottAttractor extends Attractor3D {
  readonly name = 'Sprott';
  readonly imagePath = '/thumb/sprott.svg';

  a: number = 2.07;
  b: number = 1.79;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(0.63, 0.47, -0.54);
    this.iterations = 4500;
    this.deltaTime = 3 * 0.01;
    this.rotation.set(0.11, 1.4, -1.69);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = y + a*x*y + x*z
    // dy = 1 - b*x2 + y*z
    // dz = x - x2 - y2

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (y + this.a * x * y + x * z),
      y + deltaTime * (1 - this.b * (x ** 2) + y * z),
      z + deltaTime * (x - (x ** 2) - (y ** 2)),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 1.4, 2.4);
    addSlider(folder, this.controller, this, 'b', 1.4, 2.4);
    addSlider(folder, this.controller, this.startPoint, 'x', -1, 1);
    addSlider(folder, this.controller, this.startPoint, 'y', -1, 1);
    addSlider(folder, this.controller, this.startPoint, 'z', -1, 1);

    super.buildTweakpane(folder);
  }
}

class FourWingAttractor extends Attractor3D {
  readonly name = 'Four-Wing';
  readonly imagePath = '/thumb/four-wing.svg';

  a: number = 0.2;
  b: number = 0.01;
  c: number = -0.4;

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new Vector3(1.3, -0.18, 0.01);
    this.iterations = 4000;
    this.deltaTime = 2 * 0.05;
    this.rotation.set(0.11, 1.4, -1.69);
  }

  nextPoint(point: Vector3, deltaTime: number): Vector3 {
    // https://www.dynamicmath.xyz/strange-attractors/
    // dx = a*x + y*z
    // dy = b*x + c*y - x*z
    // dz = -z - x*y

    let { x, y, z } = point;

    return new Vector3(
      x + deltaTime * (this.a * x + y * z),
      y + deltaTime * (this.b * x + this.c * y - x * z),
      z + deltaTime * (-z - x * y),
    );
  }

  buildTweakpane(folder: FolderApi): void {
    addSlider(folder, this.controller, this, 'a', 0.1, 0.2);
    addSlider(folder, this.controller, this, 'b', 0.01, 0.02);
    addSlider(folder, this.controller, this, 'c', -0.4, -0.3);
    addSlider(folder, this.controller, this.startPoint, 'x', -3, 3);
    addSlider(folder, this.controller, this.startPoint, 'y', -3, 3);
    addSlider(folder, this.controller, this.startPoint, 'z', -3, 3);

    super.buildTweakpane(folder);
  }
}

class DuffingOscillator extends Attractor2D {
  readonly name = 'Duffing (2D)';
  readonly imagePath = '/thumb/duffing.svg';

  constructor(controller: Controller) {
    super(controller);
    this.startPoint = new paper.Point(0.1, 0.1);
  }

  nextPoint(point: paper.Point, t: number, deltaTime: number): paper.Point {
    return this.rk4(point, t, deltaTime, this.derivative);
  }

  derivative(point: paper.Point, t: number): paper.Point {
    // https://en.wikipedia.org/wiki/Duffing_equation
    // dx = y
    // dy = gamma*cos(omega*t) - damping*y - a*x - b*x3

    let a = 1;
    let b = 5;
    let damping = 0.02;
    let gamma = 8;
    let omega = 0.5;

    let { x, y } = point;

    return new paper.Point(
      y,
      gamma * Math.cos(omega * t) - damping * y - a * x - b * (x ** 3),
    );
  }

  // Runge-Kutta (RK4): advances one step by sampling the derivative four
  // times across it and taking their weighted average. More accurate and
  // stable than Euler's method.
  rk4(
    point: paper.Point,
    t: number,
    deltaTime: number,
    derivative: (point: paper.Point, t: number) => paper.Point,
  ): paper.Point {
    const k1 = derivative(point, t);
    const k2 = derivative(point.add(k1.multiply(deltaTime / 2)), t + deltaTime / 2);
    const k3 = derivative(point.add(k2.multiply(deltaTime / 2)), t + deltaTime / 2);
    const k4 = derivative(point.add(k3.multiply(deltaTime)), t + deltaTime);
    return point.add(k1.add(k2.multiply(2)).add(k3.multiply(2)).add(k4).multiply(deltaTime / 6));
  }
}

export const ATTRACTORS = [
  LorenzAttractor,
  ThomasAttractor,
  AizawaAttractor,
  DadrasAttractor,
  ChenAttractor,
  Lorenz84Attractor,
  RosslerAttractor,
  HalvorsenAttractor,
  RabinovichFabrikantAttractor,
  ThreeScrollUnifiedChaoticSystem,
  SprottAttractor,
  FourWingAttractor,
  DuffingOscillator,
];
