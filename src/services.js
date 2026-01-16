import { obsidian as o } from "./obsidian";
import { use as _use } from "to-use";
import { defer } from "./defer";
export var app;
export const use = (use => {
    use.service = function service(service) {
        use(Bootloader).addChild(service);
        return use.this;
    };
    use.plugin = function plugin(plugin) {
        if (!rootCtx) {
            app = plugin.app;
            rootCtx = use.fork();
            // Register the plugin under its generic and concrete types
            rootCtx.set(o.Plugin, plugin);
            rootCtx.set(plugin.constructor, plugin);
            // ensure boot service loads and unloads with the (root) plugin
            plugin.addChild(rootCtx.use(Bootloader));
        }
        else if (plugin !== rootCtx.use(o.Plugin)) {
            throw new TypeError("use.plugin() called on multiple plugins");
        }
        return rootCtx;
    };
    use.def(o.Plugin, () => { throw new Error("Plugin not created yet"); });
    use.def(o.App, () => use(o.Plugin).app);
    return use;
})(_use);
let rootCtx;
export function getContext(parent) {
    if (parent === null || parent === void 0 ? void 0 : parent.use)
        return parent.use;
    if (rootCtx)
        return rootCtx;
    if (parent instanceof o.Plugin) {
        return parent.use = use.plugin(parent);
    }
    throw new Error("No context available: did you forget to `use.plugin()`?");
}
export class Service extends o.Component {
    constructor() {
        super(...arguments);
        this.use = use.service(this);
    }
}
/** Service manager to ensure services load and unload with the plugin in an orderly manner */
class Bootloader extends o.Component {
    constructor() {
        super(...arguments);
        this.loaded = false;
        this.children = new Set([this]);
    }
    onload() { this.loaded = true; }
    onunload() { this.loaded = false; this.children.clear(); }
    addChild(service) {
        if (!this.children.has(service)) {
            this.children.add(service);
            if (this.loaded) {
                // De-zalgofy addChild() so component doesn't load() during service lookup/registration
                defer(() => super.addChild(service));
            }
            else {
                super.addChild(service);
            }
        }
        return service;
    }
}
/** Remove a child component safely even if the parent is loading (unsafe in all Obsidians) or unloading (unsafe before 1.0) */
export function safeRemoveChild(parent, child) {
    defer(() => parent.removeChild(child));
}
export function onLoad(component, callback) {
    const child = new o.Component();
    child.onload = () => { safeRemoveChild(component, child); component = null; callback(); };
    component.addChild(child);
}
