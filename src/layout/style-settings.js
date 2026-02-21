// @ts-nocheck
import { obsidian as o } from "../obsidian";
import { use } from "../services";
import { LayoutSetting } from "./settings";
export function styleSettings(styles) {
    return function (target) {
        return new StyleSettings(use.service(target), styles);
    };
}
export class StyleSettings extends o.Component {
    constructor(use, styles) {
        super();
        this.use = use;
        this.styles = styles;
        this.settings = new LayoutSetting(this.use, "styles", this.styles);
        this.onload();
    }
    onload() {
        this.register(this.settings.onSet(this.apply, this));
        this.apply();
    }
    apply(styles = this.settings.get()) {
        const { containerEl } = this.use.this.view; // XXX
        for (const cls in styles) {
            containerEl.toggleClass(cls, styles[cls]);
        }
    }
    toggle(cls) {
        const styles = this.settings.get();
        this.settings.set({ ...styles, [cls]: !styles[cls] });
    }
}
