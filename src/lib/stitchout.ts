import paper from 'paper';

const DURATION_MS = 4000;
const NEEDLE_RADIUS_PX = 6;

/** Animates the design stitching out by progressively revealing its paths in stitch order. */
export default class StitchOut {
  private frameId?: number;
  private paths: paper.Path[] = [];
  private needle?: paper.Item;

  /** Plays the stitch-out of layer's paths. */
  play(layer: paper.Layer): void {
    this.stop();

    this.paths = layer.getItems({ match: (item: paper.Item) => item instanceof paper.Path }) as paper.Path[];
    const totalLength = this.paths.reduce((sum, path) => sum + path.length, 0);
    if (totalLength === 0) return;

    this.needle = new paper.Group({
      children: [
        new paper.Path.Circle({ center: [0, 0], radius: NEEDLE_RADIUS_PX }),
        new paper.Path.Line({ from: [-10, 0], to: [10, 0] }),
        new paper.Path.Line({ from: [0, -10], to: [0, 10] }),
      ],
      strokeColor: 'black',
      strokeWidth: 1.5,
      applyMatrix: false,
      visible: false, // shown once it has a position
    });
    layer.addChild(this.needle);

    const startTime = performance.now();
    const frame = (now: number) => {
      const progress = (now - startTime) / DURATION_MS;
      if (progress >= 1) {
        this.stop();
        return;
      }

      // Reveal paths up to the drawn length; the path being stitched is cut short with a dash.
      let remaining = progress * totalLength;
      for (const path of this.paths) {
        const length = path.length;
        if (remaining >= length) {
          path.visible = true;
          path.dashArray = [];
        } else if (remaining > 0) {
          path.visible = true;
          path.dashArray = [remaining, length];
          this.needle!.position = path.getPointAt(remaining);
          this.needle!.visible = true;
        } else {
          path.visible = false;
        }
        remaining -= length;
      }

      this.frameId = requestAnimationFrame(frame);
    };
    frame(startTime); // apply the initial state now so the full design never flashes
  }

  /** Stops any running animation and shows the full design. */
  stop(): void {
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }

    for (const path of this.paths) {
      path.visible = true;
      path.dashArray = [];
    }
    this.paths = [];

    this.needle?.remove();
    this.needle = undefined;
  }
}
