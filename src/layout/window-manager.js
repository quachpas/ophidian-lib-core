import { obsidian as o } from "../obsidian";
import { Service, onLoad, safeRemoveChild, use } from "../services";
import { defer } from "../defer";
import { around } from "monkey-around";
import { isLeafAttached } from "./walk";
/**
 * Component that belongs to a plugin + window. e.g.:
 *
 *     class TitleWidget extends PerWindowComponent {
 *         onload() {
 *             // do stuff with this.win ...
 *         }
 *     }
 *
 *     class MyPlugin extends Plugin {
 *         titleWidget = this.use(TitleWidget).watch();
 *         ...
 *     }
 *
 * This will automatically create a title widget for each window as it's opened, and
 * on plugin load.  The plugin's `.titleWidget` will also be a WindowManager that can
 * look up the title widget for a given window, leaf, or view, or return a list of
 * all of them.  (e.g. `this.titleWidget.forWindow(...)`)  See WindowManager for the
 * full API.
 *
 * If you want your components to be created lazily only on-demand instead of eagerly
 * and automatically, you can leave off the `.watch()` call, e.g.
 * `titleWidget = this.use(TitleWidget)` instead.
 */
export class PerWindowComponent extends o.Component {
    constructor(use, container) {
        super();
        this.use = use;
        this.container = container;
        this.win = this.container.win;
    }
    [use.factory]() {
        return new WindowManager(this.constructor);
    }
    // Allow PWC's to provide a static initializer -- handy for setting up event dispatching
    static onload(use) { }
    static onunload(use) { }
}
/**
 * Manage per-window components
 */
export class WindowManager extends Service {
    constructor(factory) {
        super();
        this.factory = factory;
        this.instances = new Map();
        this.watching = false;
        this.layoutReadyCallbacks = [];
    }
    onload() {
        var _a, _b;
        this.registerEvent(app.workspace.on("layout-change", () => {
            if (app.workspace.layoutReady && this.layoutReadyCallbacks.length) {
                this.layoutReadyCallbacks.forEach(defer);
                this.layoutReadyCallbacks = [];
            }
        }));
        (_b = (_a = this.factory).onload) === null || _b === void 0 ? void 0 : _b.call(_a, this.use);
    }
    // Only get safe active-leaf-change events, plus get an initial one on workspace load
    onLeafChange(cb, ctx) {
        this.onLayoutReady(() => cb.call(ctx, app.workspace.activeLeaf));
        return app.workspace.on("active-leaf-change", leaf => {
            if (app.workspace.layoutReady)
                cb.call(ctx, leaf);
        });
    }
    // A version of workspce.onLayoutReady that will defer callbacks if the workspace is being replaced
    onLayoutReady(cb) {
        if (app.workspace.layoutReady)
            defer(cb);
        else
            this.layoutReadyCallbacks.push(cb);
    }
    onunload() { var _a, _b; (_b = (_a = this.factory).onunload) === null || _b === void 0 ? void 0 : _b.call(_a, this.use); }
    watch() {
        // Defer watch until plugin is loaded
        if (!this._loaded)
            onLoad(this, () => this.watch());
        else if (!this.watching) {
            const { workspace } = app, self = this;
            this.watching = true;
            this.registerEvent(workspace.on("window-open", container => {
                this.onLayoutReady(() => this.forContainer(container));
            }));
            this.register(around(workspace, {
                clearLayout(old) {
                    return async function clearLayout() {
                        try {
                            return await old.call(this);
                        }
                        finally {
                            // Check for new containers (mainly the rootSplit) after a workspace change
                            self.onLayoutReady(() => self.forAll());
                        }
                    };
                }
            }));
            this.onLayoutReady(() => this.forAll());
        }
        return this;
    }
    forWindow(win, create) {
        var _a;
        if (win === void 0) { win = (_a = window.activeWindow) !== null && _a !== void 0 ? _a : window; }
        if (create === void 0) { create = true; }
        const container = containerForWindow(win);
        if (container)
            return this.forContainer(container, create);
    }
    forContainer(container, create = true) {
        container = container.getContainer(); // always get root-most container
        let inst = this.instances.get(container);
        if (!inst && create) {
            inst = new this.factory(this.use, container);
            if (inst) {
                this.instances.set(container, inst);
                this.addChild(inst); // unload when plugin does
                container.component.addChild(inst); // or if the window closes/workspace changes
                inst.register(() => {
                    // Don't keep it around after unload
                    safeRemoveChild(this, inst);
                    safeRemoveChild(container.component, inst);
                    this.instances.delete(container);
                });
            }
        }
        return inst;
    }
    forDom(el, create = true) {
        return this.forWindow(windowForDom(el), create);
    }
    forLeaf(leaf = app.workspace.activeLeaf, create = true) {
        if (isLeafAttached(leaf))
            return this.forContainer(leaf.getContainer(), create);
    }
    forView(view, create = true) {
        return this.forLeaf(view.leaf, create);
    }
    forAll(create = true) {
        return allContainers().map(c => this.forContainer(c, create)).filter(t => t);
    }
}
export function allContainers() {
    return [app.workspace.rootSplit].concat(app.workspace.floatingSplit.children);
}
export function allWindows() {
    return allContainers().map(c => c.win);
}
export function numWindows() {
    var _a, _b;
    return 1 + ((_b = (_a = app.workspace.floatingSplit) === null || _a === void 0 ? void 0 : _a.children.length) !== null && _b !== void 0 ? _b : 0);
}
export function windowEvent(cond) {
    for (const win of allWindows()) {
        if (win.event && cond(win, win.event))
            return win.event;
    }
}
export function windowForDom(el) {
    // Backward compat to 0.14, which has no .win on nodes; can just use el.win on 0.15.6+
    return el.win || (el.ownerDocument || el).defaultView || window;
}
export function containerForWindow(win) {
    if (win === window)
        return app.workspace.rootSplit;
    const { floatingSplit } = app.workspace;
    if (floatingSplit) {
        for (const split of floatingSplit.children)
            if (win === split.win)
                return split;
    }
}
export function focusedContainer() {
    return allContainers().filter(c => c.win.document.hasFocus()).pop();
}
