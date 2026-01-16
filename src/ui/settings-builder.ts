// @ts-nocheck
import { obsidian as o } from "../obsidian";
import { Context, use } from "../services";

export class SettingsTab extends o.PluginSettingTab {
    constructor(public use: Context) {
        super(use(o.App), use(o.Plugin));
    }
    display() {
        this.containerEl.empty();
        this.use(SettingsProvider).build(this.containerEl);
    }
}

export class SettingsProvider {
    constructor(public use: Context) {}
    
    // items: ((container: HTMLElement) => void)[] = [];
    c: o.Setting;

    add(callback: (container: HTMLElement) => void) {
        // this.items.push(callback);
        if (this._loaded) {
            // XXX checking for _loaded is a hack; we should be using a settings-tab-open event
            // or something similar to know when to render
        }
    }

    build(container: HTMLElement) {
        // for(const item of this.items) item(container);
    }

    field(name: string) {
        return new SettingBuilder(this, name);
    }
}

export class SettingBuilder {
    constructor(public provider: SettingsProvider, public name: string) {}
    
}