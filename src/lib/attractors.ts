import paper from 'paper';
import { Vector3 } from 'three';
import { Attractor2D, Attractor3D } from './attractor';
import type Controller from './controller';

class AizawaAttractor extends Attractor3D {
  readonly name = 'Aizawa';
  readonly imagePath = './aizawa.png';

  constructor(controller: Controller) {
    super(controller, new Vector3(0.1, 0, 0));
  }

  nextPoint(point: Vector3, delta: number): Vector3 {
    // https://www.algosome.com/articles/aizawa-attractor-chaos.html
    // dx = (z-b) * x - d*y
    // dy = d * x + (z-b) * y
    // dz = c + a*z - z3 /3 - x2 + f * z * x3

    let a = 0.95;
    let b = 0.7;
    let c = 0.6;
    let d = 3.5;
    let e = 0.25;
    let f = 0.1;

    let { x, y, z } = point;

    return new Vector3(
      x + delta * ((z - b) * x - d * y),
      y + delta * (d * x + (z - b) * y),
      z + delta * (c
                   + a * z
                   - (z ** 3) / 3.0
                   - ((x ** 2) + (y ** 2)) * (1.0 + e * z)
                   + f * z * (x ** 3)),
    );
  }
}

class DuffingOscillator extends Attractor2D {
  readonly name = 'Duffing';
  readonly imagePath = './duffing.png';

  constructor(controller: Controller) {
    super(controller, new paper.Point(0.1, 0.1));
  }

  nextPoint(point: paper.Point, t: number, delta: number): paper.Point {
    return this.rk4(point, t, delta, this.derivative);
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
    delta: number,
    derivative: (point: paper.Point, t: number) => paper.Point,
  ): paper.Point {
    const k1 = derivative(point, t);
    const k2 = derivative(point.add(k1.multiply(delta / 2)), t + delta / 2);
    const k3 = derivative(point.add(k2.multiply(delta / 2)), t + delta / 2);
    const k4 = derivative(point.add(k3.multiply(delta)), t + delta);
    return point.add(k1.add(k2.multiply(2)).add(k3.multiply(2)).add(k4).multiply(delta / 6));
  }
}

export const ATTRACTORS = [
  DuffingOscillator,
  AizawaAttractor,
];
