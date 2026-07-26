# Strange Attractors in Thread

A browser-based tool for designing [strange attractors](https://en.wikipedia.org/wiki/Attractor) (mathematical systems that generate intricate, infinitely non-repeating patterns) and generating vector patterns ready for machine embroidery.

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

## Stitch it!

### Requirements

You'll need these to embroider your final design:

- [Inkscape](https://inkscape.org/), the open-source vector graphics editor
- [Ink/Stitch](https://inkstitch.org/), the open-source machine embroidery extension for Inkscape

### Steps

Once you've designed an attractor you like, here's how to get it onto fabric:

1. **Export.** Click *Export SVG* to download your attractor as an `.svg` file.
1. **Open your SVG in Inkscape.** The attractor paths will appear as vector curves ready for Ink/Stitch to interpret as stitch runs.
1. **Simulate before you stitch!** Simulate the stitch path to catch any issues before you embroider. *Extensions → Ink/Stitch → Visualize and Export → Simulator*

   This shows you exactly how the machine will move through the design. This is a good way to spot ordering or stitch density issues.

1. **Export to your machine format**. When you're happy with the simulation: **File → Export...**. Choose `.PES` (Brother machines) for this workshop.
1. Transfer the file to the machine via USB and stitch!

## Make your own

- **Adding a new attractor?** → [`src/lib/attractors.ts`](https://github.com/bmats/attractors-in-thread/blob/main/src/lib/attractors.ts)
- **Adding a new style?** → [`src/lib/styles.ts`](https://github.com/bmats/attractors-in-thread/blob/main/src/lib/styles.ts)

## Contributing

Pull requests are welcome! Maybe add a new family of attractors?
