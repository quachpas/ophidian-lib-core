// @ts-nocheck
import { around, dedupe } from "monkey-around";
import { obsidian as o } from "../obsidian";
import { walkLayout } from "./walk";
import { defer } from "../defer";
import { Service } from "../services";
import { cloneValue } from "../clone-value";
export class LayoutSetting {
    constructor(ctx, key, defaultValue, owner) {
        this.key = key;
        this.defaultValue = defaultValue;
        this.owner = owner;
        this.store = ctx.use(LayoutStorage);
    }
    of(on) {
        return new LayoutSetting(this.store, this.key, this.defaultValue, on);
    }
    get(from = this.owner) {
        return this.store.get(this.requires(from), this.key, this.defaultValue);
    }
    set(value, on = this.owner) {
        this.store.set(this.requires(on), this.key, value);
    }
    unset(on = this.owner) {
        this.store.unset(this.requires(on), this.key);
    }
    requires(on) {
        if (on && (on instanceof o.Workspace || on instanceof o.WorkspaceItem))
            return on;
        throw new TypeError("Setting method requires a workspace or workspace item");
    }
    onSet(callback, ctx) {
        if (this.owner)
            return this.store.onSet(this.key, (on, val, old) => {
                if (on === this.owner)
                    callback.call(ctx, on, val, old);
            });
        return this.store.onSet(this.key, callback, ctx);
    }
    onLoadWorkspace(callback, ctx) {
        return this.store.onLoadWorkspace(callback, ctx);
    }
    offref(ref) {
        this.store.offref(ref);
    }
}
export class LayoutStorage extends Service {
    constructor() {
        super(...arguments);
        this.loading = false;
    }
    get(from, key, defaultValue) {
        var _a, _b;
        return (_b = (_a = from === null || from === void 0 ? void 0 : from[layoutProps]) === null || _a === void 0 ? void 0 : _a[key]) !== null && _b !== void 0 ? _b : defaultValue;
    }
    set(on, key, value) {
        const props = on[layoutProps] || (on[layoutProps] = {}), old = props[key];
        props[key] = value;
        if (!this.loading && old !== value) {
            // TODO: we should not trigger this during serialize!  XXX
            app.workspace.trigger(setEvent + key, on, value, old);
            app.workspace.requestSaveLayout();
        }
    }
    unset(on, key) {
        const props = on[layoutProps];
        if (props === null || props === void 0 ? void 0 : props.hasOwnProperty(key)) {
            delete props[key];
            if (!this.loading) {
                app.workspace.requestSaveLayout();
            }
        }
    }
    onSet(key, callback, ctx) {
        return app.workspace.on(setEvent + key, callback, ctx);
    }
    onLoadItem(callback, ctx) {
        if (!this.loading && app.workspace.layoutReady) {
            // A workspace is already loaded; trigger events as microtask
            defer(() => {
                walkLayout(item => {
                    try {
                        callback.call(ctx, item);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            });
        }
        return app.workspace.on(loadEvent, callback, ctx);
    }
    onSaveItem(callback, ctx) {
        return app.workspace.on(saveEvent, callback, ctx);
    }
    onLoadWorkspace(callback, ctx) {
        if (!this.loading && app.workspace.layoutReady) {
            // A workspace is already loaded; trigger event as microtask
            defer(() => {
                try {
                    callback.call(ctx);
                }
                catch (e) {
                    console.error(e);
                }
            });
        }
        return app.workspace.on(loadEvent + ":workspace", callback, ctx);
    }
    offref(ref) {
        app.workspace.offref(ref);
    }
    onload() {
        const events = app.workspace;
        // We have to use the events because another plugin's instance of this service
        // might be handling the monkeypatches and triggering the events, but *all* instances
        // of this service need to know whether they're loading -- i.e., the flag can't be
        // safely set directly within the monkeypatching.
        //
        this.registerEvent(events.on(loadEvent + ":start", () => this.loading = true));
        this.registerEvent(events.on(loadEvent + ":workspace", () => this.loading = false));
        // Save settings as each item is serialized
        this.register(around(o.WorkspaceItem.prototype, { serialize: serializeSettings }));
        this.register(around(app.workspace, {
            // Save settings with workspace layout serialization
            getLayout: serializeSettings,
            // Load workspace settings as workspace is loading
            setLayout(old) {
                return dedupe(STORAGE_EVENTS, old, async function setLayout(layout, ...etc) {
                    events.trigger(loadEvent + ":start");
                    try {
                        loadSettings(this, layout);
                        return await old.call(this, layout, ...etc);
                    }
                    finally {
                        events.trigger(loadEvent + ":workspace");
                    }
                });
            },
            // Load settings after loading each leaf
            deserializeLayout(old) {
                return dedupe(STORAGE_EVENTS, old, async function deserializeLayout(state, ...etc) {
                    const result = await old.call(this, state, ...etc);
                    loadSettings(result, state);
                    return result;
                });
            }
        }));
    }
}
const revision = 2;
const STORAGE_EVENTS = Symbol.for(`v${revision}.layout-storage-events.ophidian.peak-dev.org`);
const layoutProps = "ophidian:layout-settings";
const loadEvent = `ophidian-layout-storage:v${revision}:item-load`;
const saveEvent = `ophidian-layout-storage:v${revision}:item-save`;
const setEvent = `ophidian-layout-storage:set:`;
function serializeSettings(old) {
    return dedupe(STORAGE_EVENTS, old, function serialize() {
        const state = old.call(this);
        app.workspace.trigger(saveEvent, this, state);
        if (this[layoutProps])
            state[layoutProps] = cloneValue(this[layoutProps]);
        return state;
    });
}
function loadSettings(where, state) {
    if (!where)
        return;
    const props = state === null || state === void 0 ? void 0 : state[layoutProps];
    if (props)
        where[layoutProps] = cloneValue(props);
    app.workspace.trigger(loadEvent, where, state);
}
