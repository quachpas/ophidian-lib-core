/**
 * Export Obsidian as a constant + namespace
 *
 * This allows working around the double-dynamic lookup penalty when using Obsidan
 * exports, by using `o.Whatever` instead of plain `Whatever`.  Paradoxically, the
 * latter is slower and adds more frames in the debugger, because esbuild wraps
 * re-exports as a dynamic lookup, *and* Obsidian's own bundler has a similar wrapping.
 * Using the `obsidian.` prefix gets rid of the dynamic lookups, making it easier to
 * step through code that's using it.
 *
*/
export var obsidian;
(function (obsidian) {
    Object.assign(obsidian, require("obsidian"));
})(obsidian || (obsidian = {}));
