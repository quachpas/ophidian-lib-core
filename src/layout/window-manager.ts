// @ts-nocheck
import { around } from "monkey-around";
import { obsidian as o } from "../obsidian";
import { Service } from "../services";
import { defer } from "../defer";

export class WindowManager extends Service {

    lastFocused: o.WorkspaceWindow = null;

    onload() {
        this.registerEvent(app.workspace.on("window-open", (win, window) => {
            this.watch(window);
        }));
        this.watch(window);

        const self = this;
        this.register(around(o.Workspace.prototype, {
            onLayoutChange(old) {
                return function(this: o.Workspace, ...args) {
                    self.lastFocused = this.activeLeaf?.view?.containerEl.win || window;
                    return old.apply(this, args);
                }
            }
        }));
    }

    watch(window: Window) {
        const doc = window.document;
        this.registerDomEvent(doc, "focusin", () => {
            const win = (app.workspace.layoutReady && app.workspace.activeLeaf?.view?.containerEl.win) || window;
            this.lastFocused = win;
        });
    }

    container: Element;

    activeWindow() {
        return this.lastFocused || window;
    }

    activeDocument() {
        return this.activeWindow().document;
    }
}

export function hover({x, y}: {x: number, y: number}, target: HTMLElement, scope: o.Component = new o.Component) {
    if (!target) return;
    const mgr = useWindowManager();
    if (!mgr.container) {
        mgr.container = document.body.createDiv("popover hover-popover");
        mgr.container.addClass("file-tree-hover"); // for some reason file-tree-hover is required for style
        mgr.container.style.display = "none";
        mgr.register(() => { mgr.container.detach(); mgr.container = null; });
    }
    const container = mgr.container;
    const parent = mgr.activeDocument().body;
    if (container.parentElement !== parent) parent.appendChild(container);

    container.empty();
    container.appendChild(target);
    container.style.display = "";
    container.style.top = y + "px";
    container.style.left = x + "px";

    const remove = () => {
        if (container.parentElement === parent) container.detach();
        scope.unload();
    };

    scope.registerDomEvent(container, "click", remove);
    scope.registerDomEvent(document.body, "click", remove);
    scope.registerDomEvent(document.body, "keydown", remove);
    scope.registerDomEvent(parent, "click", remove);
    scope.registerDomEvent(parent, "keydown", remove);

    return scope;
}

export function openPopover(
    source: HTMLElement,
    leaf: o.WorkspaceLeaf,
    parent: o.Component,
    minHeight = 100
) {
    const mgr = useWindowManager();
    const useHoverPopover = leaf?.view?.navigation || !source;
    const popover = new o.Popover(leaf);
    const container = popover.hoverPopover?.containerEl;
    if (useHoverPopover && container) {
        const { top, bottom, left, right } = (source || mgr.activeDocument().body).getBoundingClientRect();
        // If the source is near the top of the screen, we need to move the popover down
        // so it doesn't overlap the source
        const y = (top < (innerHeight / 2)) ? bottom : top - minHeight;
        // If the source is near the right of the screen, we need to move the popover left
        const x = (left < (innerWidth / 2)) ? left : right - 300;
        container.style.top = y + "px";
        container.style.left = x + "px";
        if (minHeight) container.style.minHeight = minHeight + "px";
    }
    if (leaf) {
        // Workaround for 0.16.0: load() not called on hover popover leaves, so we do it explicitly
        // (It's also safe on < 0.16.0, as load() is safe to call multiple times)
        // Also: 0.16.2+ seems to have fixed this, but it doesn't hurt to leave it in.
        defer(() => leaf.load());
        
        // In 1.7.2, the popover needs to be added as a child of the parent component
        // or it will be unloaded immediately.
        parent.addChild(popover);
    }
    return popover;
}

export function useWindowManager() {
    return use(WindowManager);
}

declare module "obsidian" {
    interface Workspace {
        onLayoutChange(): void;
        activeLeaf: WorkspaceLeaf;
    }
    interface Popover extends Component {
        constructor(leaf: WorkspaceLeaf);
        hoverPopover: {
            containerEl: HTMLElement;
        }
    }
}