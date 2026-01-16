// @ts-nocheck
import { obsidian as o } from "../obsidian";
import { use } from "../services";
import { LayoutSetting } from "./settings";

export function styleSettings(styles: Record<string, boolean>) {
    return function(target: o.Component) {
        return new StyleSettings(use.service(target), styles);
    }
}

export class StyleSettings extends o.Component {
    constructor(public use: Context, public styles: Record<string, boolean>) {
        super();
        this.onload();
    }

    settings = new LayoutSetting(this.use, "styles", this.styles);

    onload() {
        this.register(this.settings.onSet(this.apply, this));
        this.apply();
    }

    apply(styles = this.settings.get()) {
        const {containerEl} = (this.use.this as any).view; // XXX
        for(const cls in styles) {
            containerEl.toggleClass(cls, styles[cls]);
        }
    }

    toggle(cls: string) {
        const styles = this.settings.get();
        this.settings.set({...styles, [cls]: !styles[cls]});
    }
}