/**
 * Ink/Stitch SVG attribute definitions.
 *
 * Generated from the Ink/Stitch source code:
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/svg/tags.py
 *     (INKSTITCH_ATTRIBS master list)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/elements/element.py
 *     (general/lock params shared by all elements)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/elements/fill_stitch.py
 *     (fill params, cross-stitch params)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/elements/stroke.py
 *     (stroke and ripple params)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/elements/satin_column.py
 *     (satin column params)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/elements/clone.py
 *     (clone params)
 *   - https://github.com/inkstitch/inkstitch/blob/main/lib/stitch_plan/lock_stitch.py
 *     (lock stitch type enum)
 *
 * To regenerate this file against a newer Ink/Stitch release, use the
 * `inkstitch-sync-attributes` skill.
 */


// ---------------------------------------------------------------------------
// String enum types (stored as string identifiers in SVG attributes)
// ---------------------------------------------------------------------------

export type FillMethod =
  | 'auto_fill'
  | 'circular_fill'
  | 'contour_fill'
  | 'cross_stitch'
  | 'guided_fill'
  | 'linear_gradient_fill'
  | 'meander_fill'
  | 'tartan_fill'
  | 'legacy_fill';

export type StrokeMethod =
  | 'running_stitch'
  | 'ripple_stitch'
  | 'zigzag_stitch'
  | 'manual_stitch';

export type SatinMethod =
  | 'satin_column'
  | 'e_stitch'
  | 's_stitch'
  | 'zigzag';

export type SplitMethod =
  | 'default'
  | 'simple'
  | 'staggered';

export type CrossStitchMethod =
  | 'simple_cross'
  | 'simple_cross_flipped'
  | 'half_cross'
  | 'half_cross_flipped'
  | 'upright_cross'
  | 'upright_cross_flipped'
  | 'double_cross';

export type LockStitchType =
  | 'half_stitch'
  | 'arrow'
  | 'back_forth'
  | 'bowtie'
  | 'cross'
  | 'star'
  | 'simple'
  | 'triangle'
  | 'zigzag'
  | 'custom';

export type ReverseRails =
  | 'automatic'
  | 'none'
  | 'first'
  | 'second'
  | 'both';

export type SatinGuidePatternPosition =
  | 'default'
  | 'render_at_rungs'
  | 'adaptive';

export type LayerVisibility =
  | 'unchanged'
  | 'hidden'
  | 'lower_opacity';

// ---------------------------------------------------------------------------
// Integer enum types (stored as numeric strings in SVG attributes)
// ---------------------------------------------------------------------------

/** When to add lock stitches relative to this element. */
export const Ties = {
  /** Add lock stitches before and after */
  Both: 0,
  /** Add lock stitch before only */
  Before: 1,
  /** Add lock stitch after only */
  After: 2,
  /** No lock stitches */
  Neither: 3,
} as const;

export type Ties = (typeof Ties)[keyof typeof Ties];

/** Fill direction strategy for contour fill. */
export const ContourStrategy = {
  /** Fill from the outer edge inward */
  InnerToOuter: 0,
  /** Fill in a single continuous spiral */
  SingleSpiral: 1,
  /** Fill in a double spiral (in then back out) */
  DoubleSpiral: 2,
} as const;

export type ContourStrategy = (typeof ContourStrategy)[keyof typeof ContourStrategy];

/** How guided fill copies the guide line across the shape. */
export const GuidedFillStrategy = {
  /** Fill with shifted copies of the guide line */
  Copy: 0,
  /** Ensure consistent distance between each line (may introduce sharp corners) */
  ParallelOffset: 1,
} as const;

export type GuidedFillStrategy = (typeof GuidedFillStrategy)[keyof typeof GuidedFillStrategy];

/**
 * Corner join style.
 * For contour fill: Round, Mitered, Beveled.
 * For ripple stitch: only Round (flat) and Mitered (point) apply.
 */
export const JoinStyle = {
  /** Rounded corners */
  Round: 0,
  /** Sharp mitered corners */
  Mitered: 1,
  /** Beveled (clipped) corners */
  Beveled: 2,
} as const;

export type JoinStyle = (typeof JoinStyle)[keyof typeof JoinStyle];

/** Which axes to scale for satin-guided ripple stitches. */
export const ScaleAxis = {
  XY: 0,
  X: 1,
  Y: 2,
  None: 3,
} as const;

export type ScaleAxis = (typeof ScaleAxis)[keyof typeof ScaleAxis];

// ---------------------------------------------------------------------------
// Main attribute interface
// ---------------------------------------------------------------------------

/**
 * All `inkstitch:*` XML attributes recognized by Ink/Stitch.
 *
 * Attribute names are snake_case, matching the SVG namespace form exactly
 * (e.g. `fill_method` → `inkstitch:fill_method`).
 */
export interface InkStitchAttributes {
  // -- General / lock stitches ------------------------------------------------

  /** Minimum stitch length; shorter stitches are removed (mm) */
  min_stitch_length_mm?: number;
  /** Minimum jump stitch length; shorter jumps skip lock stitches (mm) */
  min_jump_stitch_length_mm?: number;
  /** When to add lock stitches */
  ties?: Ties;
  /** Force lock stitches even when jump distance is short */
  force_lock_stitches?: boolean;
  /** Tack stitch type at start of element */
  lock_start?: LockStitchType;
  /** Scale of start tack stitch (mm) */
  lock_start_scale_mm?: number;
  /** Scale of start tack stitch (%) */
  lock_start_scale_percent?: number;
  /** Custom SVG path for start tack stitch */
  lock_custom_start?: string;
  /** Lock stitch type at end of element */
  lock_end?: LockStitchType;
  /** Scale of end lock stitch (mm) */
  lock_end_scale_mm?: number;
  /** Scale of end lock stitch (%) */
  lock_end_scale_percent?: number;
  /** Custom SVG path for end lock stitch */
  lock_custom_end?: string;

  // -- Clone ------------------------------------------------------------------

  /** Enable clone stitching */
  clone?: boolean;
  /** Flip the automatically calculated fill angle for clones */
  flip_angle?: boolean;

  // -- Polyline ----------------------------------------------------------------

  /** Treat element as a polyline */
  polyline?: boolean;

  // -- Fill -------------------------------------------------------------------

  /** Stitch angle for fill rows; 0 = horizontal, counter-clockwise (deg) */
  angle?: number;
  /** Legacy toggle: automatically routed fill stitching */
  auto_fill?: boolean;
  /** Fill stitch algorithm */
  fill_method?: FillMethod;
  /** Contour fill strategy */
  contour_strategy?: ContourStrategy;
  /** Guided fill strategy */
  guided_fill_strategy?: GuidedFillStrategy;
  /** Join style for contour fill or ripple stitch */
  join_style?: JoinStyle;
  /** Avoid self-crossing in contour fill */
  avoid_self_crossing?: boolean;
  /** Smooth the stitch path; limits max deviation from original (mm) */
  smoothness_mm?: number;
  /** Contour fill direction: clockwise when true */
  clockwise?: boolean;
  /** Reverse fill or ripple stitch direction */
  reverse?: boolean;
  /** Meander tile pattern name */
  meander_pattern?: string;
  /** Scale meander pattern; space-separated pair for x/y (%) */
  meander_scale_percent?: string | number;
  /** Rotate the meander pattern (deg) */
  meander_angle?: number;
  /** Expand (positive) or contract (negative) the shape before filling (mm) */
  expand_mm?: number;
  /** Enable fill underlay */
  fill_underlay?: boolean;
  /** Fill underlay angle; space-separated list for multiple layers (deg) */
  fill_underlay_angle?: string | number;
  /** Fill underlay inset from shape edge (mm) */
  fill_underlay_inset_mm?: number;
  /** Max underlay stitch length (mm) */
  fill_underlay_max_stitch_length_mm?: number;
  /** Underlay row spacing; default 3x fill row spacing (mm) */
  fill_underlay_row_spacing_mm?: number;
  /** Skip the last stitch in each underlay row */
  fill_underlay_skip_last?: boolean;
  /** Maximum stitch length within a fill row (mm) */
  max_stitch_length_mm?: number;
  /** Distance between fill rows (mm) */
  row_spacing_mm?: number;
  /** Gradually change row spacing toward this value at the end (mm) */
  end_row_spacing_mm?: number;
  /** Skip the last stitch in each fill row */
  skip_last?: boolean;
  /** Number of row staggers before the pattern repeats */
  staggers?: number;
  /** Travel inside the shape for underlay section transitions */
  underlay_underpath?: boolean;
  /** Travel inside the shape for fill section transitions */
  underpath?: boolean;
  /** End stitching at the defined ending point */
  stop_at_ending_point?: boolean;
  /** Start fill right-to-left instead of left-to-right (legacy fill) */
  flip?: boolean;
  /** Clip stitching to the shape boundary (meander fill) */
  clip?: boolean;
  /** Consecutive rows of the same color in tartan fill */
  rows_per_thread?: number;
  /** Herringbone pattern width; 0 for regular rows (mm) */
  herringbone_width_mm?: number;
  /** Stitch angle relative to tartan stripe direction (deg) */
  tartan_angle?: number;
  /** Randomize stitch length and phase */
  enable_random_stitch_length?: boolean;
  /** Amount to vary stitch length when randomizing (± %) */
  random_stitch_length_jitter_percent?: number;
  /** Extra rows to fill gaps between sections caused by distortion */
  gap_fill_rows?: number;

  // -- Cross stitch -----------------------------------------------------------

  /** Cross stitch pattern size; space-separated x y (mm) */
  pattern_size_mm?: string | number;
  /** Percentage of overlap for each cross with the fill area (%) */
  fill_coverage?: number;
  /** Cross stitch method / pattern */
  cross_stitch_method?: CrossStitchMethod;
  /** Maximum stitch length for cross stitch (mm) */
  max_cross_stitch_length_mm?: number;
  /** Offset the cross stitch grid; space-separated x y (mm) */
  cross_offset_mm?: string | number;
  /** Thread count per cross stitch; must be even (half-cross uses odd) */
  cross_thread_count?: number;
  /** Align cross stitch grid with canvas origin */
  canvas_grid_origin?: boolean;

  // -- Stroke -----------------------------------------------------------------

  /** Stroke stitch algorithm */
  stroke_method?: StrokeMethod;
  /** Bean stitch repeats; space-separated list for patterns */
  bean_stitch_repeats?: string | number;
  /** Number of times to stitch down and back along the path */
  repeats?: number;
  /** Running stitch length; space-separated list for patterns (mm) */
  running_stitch_length_mm?: string | number;
  /** Max deviation from path for running stitch placement (mm) */
  running_stitch_tolerance_mm?: number;
  /** Cutwork needle number */
  cutwork_needle?: number;
  /** Zigzag stitch width (mm) */
  zigzag_width_mm?: number;

  // -- Ripple -----------------------------------------------------------------

  /** Use original node positions without adding intermediate stitches */
  manual_pattern_placement?: boolean;
  /** Flip every second line in linear ripple */
  flip_copies?: boolean;
  /** Number of ripple lines from start to finish */
  line_count?: number;
  /** Minimum distance between ripple lines; overrides line_count (mm) */
  min_line_dist_mm?: number;
  /** Pattern position for satin-guided ripple stitches */
  satin_guide_pattern_position?: SatinGuidePatternPosition;
  /** Exponent to increase density toward one side */
  exponent?: number;
  /** Reverse the exponent density effect */
  flip_exponent?: boolean;
  /** Skip this many lines at the start */
  skip_start?: number;
  /** Skip this many lines at the end */
  skip_end?: number;
  /** Scale axis for satin-guided ripple stitches */
  scale_axis?: ScaleAxis;
  /** Scale of first ripple copy (%) */
  scale_start?: number;
  /** Scale of last ripple copy (%) */
  scale_end?: number;
  /** Rotate satin-guided ripple stitches */
  rotate_ripples?: boolean;
  /** Render ripple as grid; watch stitch density (mm) */
  grid_size_mm?: number;
  /** Stitch the grid layer first instead of last */
  grid_first?: boolean;

  // -- Satin column -----------------------------------------------------------

  /** Enable satin column interpretation for this path */
  satin_column?: boolean;
  /** Satin stitch method */
  satin_method?: SatinMethod;
  /** Distance threshold below which stitches are inset (mm) */
  short_stitch_distance_mm?: number;
  /** Inset amount for stitches in high-density areas; space-separated pair for multi-level (%) */
  short_stitch_inset?: string | number;
  /** Reverse rail direction detection */
  reverse_rails?: ReverseRails;
  /** Swap first and second satin rails */
  swap_satin_rails?: boolean;
  /** Enable contour underlay */
  contour_underlay?: boolean;
  /** Contour underlay stitch length (mm) */
  contour_underlay_stitch_length_mm?: number;
  /** Contour underlay stitch tolerance (mm) */
  contour_underlay_stitch_tolerance_mm?: number;
  /** Contour underlay fixed inset from edge (mm) */
  contour_underlay_inset_mm?: number;
  /** Contour underlay proportional inset (% of column width) */
  contour_underlay_inset_percent?: number;
  /** Enable center-walk underlay */
  center_walk_underlay?: boolean;
  /** Center-walk underlay stitch length (mm) */
  center_walk_underlay_stitch_length_mm?: number;
  /** Center-walk underlay stitch tolerance (mm) */
  center_walk_underlay_stitch_tolerance_mm?: number;
  /** Center-walk underlay repeat count; odd reverses satin direction */
  center_walk_underlay_repeats?: number;
  /** Center-walk underlay position between rails (%; 0=first rail, 50=center, 100=second) */
  center_walk_underlay_position?: number;
  /** Enable zigzag underlay */
  zigzag_underlay?: boolean;
  /** Zigzag stitch spacing peak-to-peak (mm) */
  zigzag_spacing_mm?: number;
  /** Zigzag underlay inset from edge (mm) */
  zigzag_underlay_inset_mm?: number;
  /** Zigzag underlay proportional inset (% of column width) */
  zigzag_underlay_inset_percent?: number;
  /** Zigzag underlay peak-to-peak spacing (mm) */
  zigzag_underlay_spacing_mm?: number;
  /** Zigzag underlay max stitch length before splitting (mm) */
  zigzag_underlay_max_stitch_length_mm?: number;
  /** Legacy toggle for E-stitch mode */
  e_stitch?: boolean;
  /** Zigzag pull compensation to widen the column (mm); space-separated pair for asymmetric */
  stroke_pull_compensation_mm?: string | number;
  /** Rotate zigzag direction (deg) */
  zigzag_angle?: number;
  /** Satin pull compensation (mm); space-separated pair for asymmetric */
  pull_compensation_mm?: string | number;
  /** Satin pull compensation (% of width); space-separated pair for asymmetric */
  pull_compensation_percent?: string | number;
  /** Stitch the stroke before the fill on this element */
  stroke_first?: boolean;
  /** Random satin width decrease (% each side); space-separated pair for asymmetric */
  random_width_decrease_percent?: string | number;
  /** Random satin width increase (% each side); space-separated pair for asymmetric */
  random_width_increase_percent?: string | number;
  /** Random jitter added to zigzag spacing (± %) */
  random_zigzag_spacing_percent?: number;
  /** Satin split stitch method */
  split_method?: SplitMethod;
  /** Stagger split stitches this many times before repeating */
  split_staggers?: number;
  /** Randomize split stitch phase */
  random_split_phase?: boolean;
  /** Random jitter for split stitch length or position (± %) */
  random_split_jitter_percent?: number;
  /** Minimum stitch length for random-phase split (mm) */
  min_random_split_length_mm?: number;
  /** Position of running stitches between satin rails (%; 0=first, 50=center, 100=second) */
  running_stitch_position?: number;
  /** Start stitching from the nearest point to the previous element */
  start_at_nearest_point?: boolean;
  /** End stitching at the nearest point to the next element */
  end_at_nearest_point?: boolean;

  // -- Stitch plan / layer ----------------------------------------------------

  /** Comma-separated list of layer IDs hidden when the stitch plan was generated */
  invisible_layers?: string;
  /** How layer visibility was handled during stitch plan generation */
  layer_visibility?: LayerVisibility;

  // -- All elements -----------------------------------------------------------

  /** Trim thread after stitching this element */
  trim_after?: boolean;
  /** Pause the machine after stitching this element */
  stop_after?: boolean;
  /** Seed for randomized attributes; uses element ID if empty */
  random_seed?: string;
  /** Treat this element as manual stitch placement */
  manual_stitch?: boolean;

  // -- Legacy -----------------------------------------------------------------

  /** Legacy grid size attribute */
  grid_size?: number;

  // -- Sew stack --------------------------------------------------------------

  /** Only process this element through the sew stack (skip normal stitching) */
  sew_stack_only?: boolean;
  /** Sew stack configuration */
  sew_stack?: string;
}
