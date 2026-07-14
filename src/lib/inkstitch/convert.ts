const INKSTITCH_NS = 'http://inkstitch.org/namespace';
const INKSCAPE_NS = 'http://www.inkscape.org/namespaces/inkscape';
const SODIPODI_NS = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd';
const SVG_NS = 'http://www.w3.org/2000/svg';

const INKSTITCH_SVG_VERSION = '3';
const DEFAULT_MIN_STITCH_LEN_MM = '0.1';
const DEFAULT_COLLAPSE_LEN_MM = '3';

interface ConvertOptions {
  /** Document width in mm. */
  widthMm: number;
  /** Document height in mm. */
  heightMm: number;
}

/**
 * Converts a SVG element into an Ink/Stitch-compatible SVG in place.
 * Adds required namespaces and default Ink/Stitch metadata, sets file dimensions in mm,
 * and rewrites metadata in `data-paper-data` into proper `inkstitch:*` attributes.
 */
export function convertToInkStitch(svg: SVGSVGElement, options: ConvertOptions): void {
  addNamespaces(svg);
  setDimensions(svg, options.widthMm, options.heightMm);
  addDefaultNamedView(svg);
  addMetadata(svg);
  addDefs(svg);
  rewriteDataAttributes(svg);
}

function addNamespaces(svg: SVGSVGElement): void {
  const namespaces: [string, string][] = [
    ['xmlns:inkstitch', INKSTITCH_NS],
    ['xmlns:inkscape', INKSCAPE_NS],
    ['xmlns:sodipodi', SODIPODI_NS],
  ];
  for (const [attr, uri] of namespaces) {
    const prefix = attr.split(':')[1];
    if (svg.lookupNamespaceURI(prefix) !== uri) {
      svg.setAttributeNS('http://www.w3.org/2000/xmlns/', attr, uri);
    }
  }
}

function setDimensions(svg: SVGSVGElement, widthMm: number, heightMm: number): void {
  svg.setAttribute('width', `${widthMm}mm`);
  svg.setAttribute('height', `${heightMm}mm`);
  svg.setAttribute('viewBox', `0 0 ${widthMm} ${heightMm}`);
}

function addDefaultNamedView(svg: SVGSVGElement): void {
  if (svg.querySelector('sodipodi\\:namedview')) return;

  const namedView = svg.ownerDocument.createElementNS(SODIPODI_NS, 'sodipodi:namedview');
  namedView.setAttribute('pagecolor', '#ffffff');
  namedView.setAttribute('bordercolor', '#262626');
  namedView.setAttribute('borderopacity', '1');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:document-units', 'mm');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:showpageshadow', 'true');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:pageopacity', '0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:pagecheckerboard', 'true');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:deskcolor', '#3f3f3f');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:cx', '0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:cy', '0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:zoom', '1.0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:window-width', '1500');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:window-height', '900');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:window-x', '0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:window-y', '0');
  namedView.setAttributeNS(INKSCAPE_NS, 'inkscape:window-maximized', '0');
  svg.prepend(namedView);
}

function addMetadata(svg: SVGSVGElement): void {
  // Don't add if already present
  if (svg.querySelector('metadata')) return;

  const metadata = svg.ownerDocument.createElementNS(SVG_NS, 'metadata');

  const entries: [string, string][] = [
    ['inkstitch:min_stitch_len_mm', DEFAULT_MIN_STITCH_LEN_MM],
    ['inkstitch:collapse_len_mm', DEFAULT_COLLAPSE_LEN_MM],
    ['inkstitch:inkstitch_svg_version', INKSTITCH_SVG_VERSION],
  ];
  for (const [tag, text] of entries) {
    const el = svg.ownerDocument.createElementNS(INKSTITCH_NS, tag);
    el.textContent = text;
    metadata.appendChild(el);
  }

  svg.prepend(metadata);
}

function addDefs(svg: SVGSVGElement): void {
  if (svg.querySelector('defs')) return;

  const doc = svg.ownerDocument;
  const defs = doc.createElementNS(SVG_NS, 'defs');

  const marker = doc.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('refX', '10');
  marker.setAttribute('refY', '5');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('id', 'inkstitch-guide-line-marker');
  marker.setAttribute('markerUnits', 'userSpaceOnUse');
  marker.setAttribute('markerWidth', '0.1');
  marker.setAttribute('viewBox', '0 0 1 1');

  const g = doc.createElementNS(SVG_NS, 'g');
  g.setAttribute('id', 'inkstitch-guide-line-group');

  marker.appendChild(g);
  defs.appendChild(marker);
  svg.prepend(defs);
}

/**
 * Finds all elements with data-paper-data, extracts inkstitch params,
 * and sets inkstitch:* namespaced attributes on each element.
 */
function rewriteDataAttributes(svg: SVGSVGElement): void {
  const elements = svg.querySelectorAll('[data-paper-data]');

  for (const el of elements) {
    processElement(el);
  }

  // Also check the root element itself
  if (svg.hasAttribute('data-paper-data')) {
    processElement(svg);
  }
}

function processElement(el: Element): void {
  const raw = el.getAttribute('data-paper-data');
  if (!raw) return;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  applyInkstitchAttributes(el, parsed);
  applyGuideLineMarker(el, parsed);

  // Clean up data-paper-data
  const remaining = { ...parsed };
  delete remaining.inkstitch;
  delete remaining.inkstitchGuideLine;
  if (Object.keys(remaining).length > 0) {
    el.setAttribute('data-paper-data', JSON.stringify(remaining));
  } else {
    el.removeAttribute('data-paper-data');
  }
}

function applyInkstitchAttributes(el: Element, parsed: Record<string, unknown>): void {
  const inkstitch = parsed.inkstitch as Record<string, unknown> | undefined;
  if (!inkstitch || typeof inkstitch !== 'object') return;

  for (const [key, value] of Object.entries(inkstitch)) {
    if (value === undefined || value === null) continue;
    el.setAttributeNS(INKSTITCH_NS, `inkstitch:${key}`, String(value));
  }
}

function applyGuideLineMarker(el: Element, parsed: Record<string, unknown>): void {
  if (parsed.inkstitchGuideLine !== true) return;
  const marker = 'marker-start:url(#inkstitch-guide-line-marker)';
  const existing = el.getAttribute('style') ?? '';
  el.setAttribute('style', existing ? `${existing};${marker}` : marker);
}
