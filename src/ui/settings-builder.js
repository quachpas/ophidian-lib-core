// @ts-nocheck
import { obsidian as o } from "../obsidian";
export class SettingsTab extends o.PluginSettingTab {
    constructor(use) {
        super(use(o.App), use(o.Plugin));
        this.use = use;
    }
    display() {
        this.containerEl.empty();
        this.use(SettingsProvider).build(this.containerEl);
    }
}
export class SettingsProvider {
    constructor(use) {
        this.use = use;
    }
    add(callback) {
        // this.items.push(callback);
        if (this._loaded) {
            // XXX checking for _loaded is a hack; we should be using a settings-tab-open event
            // or something similar to know when to render
        }
    }
    build(container) {
        // for(const item of this.items) item(container);
    }
    field(name) {
        return new SettingBuilder(this, name);
    }
}
export class SettingBuilder {
    constructor(provider, name) {
        this.provider = provider;
        this.name = name;
    }
}
