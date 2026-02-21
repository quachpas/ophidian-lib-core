// @ts-nocheck
import { obsidian as o } from "../obsidian";
export function isLeafAttached(leaf) {
    const ws = app.workspace, root = leaf === null || leaf === void 0 ? void 0 : leaf.getRoot();
    switch (root) {
        case ws.rootSplit:
        case ws.floatingSplit:
        case ws.leftSplit:
        case ws.rightSplit:
            return true;
        default:
            return false;
    }
}
export function walkLayout(item, visitor) {
    if (!item)
        return false;
    if (typeof item === "function") {
        visitor = item;
        item = app.workspace;
    }
    if (visitor && visitor(item))
        return true;
    if (item instanceof o.Workspace) {
        return walkLayout(item.rootSplit, visitor) ||
            walkLayout(item.floatingSplit, visitor) ||
            walkLayout(item.leftSplit, visitor) ||
            walkLayout(item.rightSplit, visitor);
    }
    else if (item instanceof o.WorkspaceParent) {
        for (const child of item.children) {
            if (walkLayout(child, visitor))
                return true;
        }
    }
    return false;
}
