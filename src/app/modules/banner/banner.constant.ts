// Recalibrated from the old value of 8: that guard only counted
// split-tree structural recursion (kind: 'split' nodes). This guard
// counts every level of JSON nesting in the whole tree (arrays, element
// objects, a `pos: {x,y}` sub-object, etc.), which is naturally deeper
// for the same visual layout — 30 gives generous headroom for realistic
// templates (a human cannot build anywhere near this deep through a
// drag-and-drop UI) while still rejecting a pathological/adversarial
// payload.
export const MAX_TREE_DEPTH = 30;
