import { obsidian as o } from "../obsidian";
import { SettingsService } from "../plugin-settings";
import { getContext, onLoad, use } from "../services";
export function useSettingsTab(owner) {
    return getContext(owner)(SettingsTabBuilder).addProvider(owner);
}
export class SettingsTabBuilder extends o.PluginSettingTab {
    constructor() {
        super(app, use(o.Plugin));
        this.plugin = use(o.Plugin);
        this.use = use.this;
        this.plugin.register(use(SettingsService).once(() => {
            onLoad(this.plugin, () => this.plugin.addSettingTab(this));
        }));
    }
    clear() { this.containerEl.empty(); return this; }
    field(parentEl = this.containerEl) { return new FieldBuilder(this, parentEl); }
    then(cb) {
        cb(this);
        return this;
    }
    addProvider(provider) {
        if (provider.showSettings) {
            this.onDisplay(c => provider._loaded && provider.showSettings(c));
        }
        return this;
    }
    onDisplay(cb) { this.onDispCb = chain(this.onDispCb, cb); }
    display() { var _a; this.c = new o.Component; this.c.load(); (_a = this.onDispCb) === null || _a === void 0 ? void 0 : _a.call(this, this.c); }
    hide() { this.c.unload(); this.clear(); }
}
export class FieldBuilder extends o.Setting {
    constructor(builder, parentEl = builder.containerEl) {
        super(parentEl);
        this.builder = builder;
    }
    end() {
        return this.builder;
    }
    field(parentEl) {
        return this.builder.field(parentEl);
    }
}
function chain(f1, f2) {
    if (!f1)
        return f2;
    if (!f2)
        return f1;
    return v => { f1 === null || f1 === void 0 ? void 0 : f1(v); f2 === null || f2 === void 0 ? void 0 : f2(v); };
}
