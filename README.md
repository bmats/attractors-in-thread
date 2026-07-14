# Strange Attractors in Thread

A browser-based tool for designing [strange attractors](https://en.wikipedia.org/wiki/Attractor) (mathematical systems that generate intricate, infinitely non-repeating patterns) and generating vector designs ready for machine embroidery.

Exported SVG files are compatible with [Ink/Stitch](https://inkstitch.org/), the open-source machine embroidery extension for [Inkscape](https://inkscape.org/).

## Try it out

**No installation needed!** Visit https://attractors.bryce.town/ to use it in the browser.

**Or, run it locally** if you'd like to modify the source to add your own attractors or styles:

```bash
git clone git@github.com:bmats/attractors-in-thread.git
cd attractors-in-thread
npm install
npm run dev
```

Then, open http://localhost:5173 in your browser.

Adding a new attractor? Go to: `src/lib/attractors.ts`

Adding a new style? Go to: `src/lib/styles.ts`

## Getting a design ready for embroidery

Requirements:
- [Inkscape](https://inkscape.org/), the open-source vector graphics editor
- [Ink/Stitch](https://inkstitch.org/), the open-source machine embroidery extension for Inkscape

Once you've designed an attractor you like, here's how to get it onto fabric:

1. **Export.** Click *Export SVG* to download your attractor as an `.svg` file.
1. **Open your SVG in Inkscape.** The attractor paths will appear as vector curves ready for Ink/Stitch to interpret as stitch runs.
1. **Simulate before you stitch!** Simulate the stitch path to catch any issues before you embroider. *Extensions → Ink/Stitch → Visualize and Export → Simulator*

This shows you exactly how the machine will move through the design. This is a good way to spot overly long jumps, stitch density issues, or paths that need reordering.

1. **Export to your machine format**. When you're happy with the simulation: **Extensions → Ink/Stitch → File → Export**. Choose `.PES` (Brother machines) for this workshop.
1 Transfer the file to the machine via USB and stitch!

## Contributing

Pull requests are welcome! Maybe add a new family of attractors?

# TODO

- more attractors
  - attractor presets?
  - attractor thumbnails
- patch style
  - `paperjs-offset` is a declared dependency but not wired in yet
- don't regen 3d geom if only changing rotation - add some dirty flag
- orbit rotation is messed up
- fix scaling - set some consistent scale on the first gen
- Write readme - refine text for exporting
  - create claude md and skill for creating new attractors (CLAUDE.md done, skill not)
  - clean up console.logs
- publish on cloudflare


// :root {
//   /** Max height of dropdown panel. */
//   --tp-plugin-thumbnail-list-height: 400px;

//   /** Fixed width of dropdown panel. */
//   --tp-plugin-thumbnail-list-width: 200px;

//   /** Width/height of (square) thumbnail. */
//   --tp-plugin-thumbnail-list-thumb-size: 20px;
// }
