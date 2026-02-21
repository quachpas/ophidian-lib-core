// @ts-nocheck
import { obsidian as o } from "../obsidian";
export class Dialog extends o.Modal {
    onOK(e) {
        return false;
    }
    constructor() {
        super(app);
        this.buttonContainerEl = this.modalEl.createDiv("modal-button-container");
        this.textContentEl = this.contentEl.createDiv("dialog-text");
        this.okButton = this.buttonContainerEl.createEl("button", { cls: "mod-cta", text: i18next.t("dialogue.button-continue") }, b => {
            b.addEventListener("click", async (e) => {
                var _a;
                if (!await ((_a = this.onOK) === null || _a === void 0 ? void 0 : _a.call(this, e)))
                    this.close();
            });
        });
        this.containerEl.addClass("mod-confirmation");
        this.containerEl.addClass("ophidian-dialog");
    }
    setOk(text) {
        this.okButton.textContent = text;
    }
    addButton(cls, text, onClick, setup) {
        this.buttonContainerEl.createEl("button", { cls, text }, setup).addEventListener("click", async (e) => {
            if (!await onClick(e))
                this.close();
        });
        return this;
    }
    addCancelButton(callback) {
        return this.addButton("", i18next.t("dialogue.button-cancel"), () => (this.close(), callback && callback()));
    }
    setContent(c) {
        if (String.isString(c))
            this.textContentEl.setText(c);
        else
            this.textContentEl.appendChild(c);
        return this;
    }
    setTitle(title) {
        this.titleEl.setText(title);
        return this;
    }
    setup(callback) {
        callback && callback(this);
        return this;
    }
}
