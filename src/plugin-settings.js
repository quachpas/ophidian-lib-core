var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// @ts-nocheck
import { cloneValue } from "./clone-value";
import { obsidian as o } from "./obsidian";
import { Service } from "./services";
import { prop } from "./signify";
export class SettingsService extends Service {
    addDefaults(defaults) {
        this.defaults = deepMerge(this.defaults, defaults);
        this.current = deepMerge(cloneValue(this.defaults), this.current);
    }
    constructor() {
        super();
        // TODO: move this to a standard "defaults" service?
        this.defaults = {};
    }
    onload() {
        this.register(app.workspace.on("ophidian-settings:change", (key, value) => {
            if (key === this.use(o.Plugin).manifest.id) {
                this.current = deepMerge(cloneValue(this.defaults), value);
            }
        }));
    }
    async load() {
        const plugin = this.use(o.Plugin);
        const data = await plugin.loadData();
        this.current = deepMerge(cloneValue(this.defaults), data);
        return this.current;
    }
    async save() {
        const plugin = this.use(o.Plugin);
        await plugin.saveData(this.current);
    }
    async update(op) {
        if (typeof op === "function") {
            const result = op(this.current);
            if (result)
                this.current = deepMerge(this.current, result);
        }
        else {
            this.current = deepMerge(this.current, op);
        }
        await this.save();
        return this.current;
    }
    once(callback, ctx) {
        if (this.current) {
            callback.call(ctx, this.current);
        }
        else {
            const plugin = this.use(o.Plugin);
            const key = plugin.manifest.id;
            const event = app.workspace.on("ophidian-settings:change", (k, v) => {
                if (k === key) {
                    app.workspace.offref(event);
                    callback.call(ctx, this.current);
                }
            });
            this.registerEvent(event);
        }
    }
}
__decorate([
    prop
], SettingsService.prototype, "current", void 0);
function deepMerge(target, source) {
    if (!source || typeof source !== "object")
        return source !== undefined ? source : target;
    if (!target || typeof target !== "object")
        return cloneValue(source);
    const result = cloneValue(target);
    Object.keys(source).forEach(key => {
        const targetValue = result[key];
        const sourceValue = source[key];
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            result[key] = sourceValue; // For arrays, we usually replace
        }
        else if (sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue)) {
            result[key] = deepMerge(targetValue, sourceValue);
        }
        else {
            result[key] = sourceValue;
        }
    });
    return result;
}
