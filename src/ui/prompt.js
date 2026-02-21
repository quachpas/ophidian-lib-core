// @ts-nocheck
import { deferred } from "../deferred";
import { Dialog } from "./dialog";
export class Prompt extends Dialog {
    constructor() {
        super(...arguments);
        this.value = false;
        this.setting = this.contentEl.createDiv("is-mobile"); // hack for reasonable text box
        this.inputEl = this.setting.createEl("input", { type: "text" }, inputEl => {
            inputEl.addEventListener("keypress", async (e) => {
                var _a;
                if (e.key === "Enter" && !e.isComposing) {
                    if (!await ((_a = this.onOK) === null || _a === void 0 ? void 0 : _a.call(this, e)))
                        this.close();
                }
            });
        });
    }
    onOK(_) {
        const { value } = this.inputEl;
        if (!this.isValid(value)) {
            this.handleInvalidEntry(value);
            return true; // refuse entry
        }
        this.value = this.inputEl.value;
    }
    isValid(t) { return true; }
    handleInvalidEntry(t) { return; }
    setPlaceholder(placeholder) {
        if (placeholder)
            this.inputEl.placeholder = placeholder;
        else
            this.inputEl.removeAttribute("placeholder");
        return this;
    }
    setValue(value) {
        this.inputEl.value = value;
        return this;
    }
    setPattern(pattern) {
        this.inputEl.pattern = pattern;
        return this.setValidator(v => new RegExp(`^${pattern}$`).test(v));
    }
    setValidator(isValid) {
        this.isValid = isValid;
        this.inputEl.oninput = () => this.inputEl.setAttribute("aria-invalid", "" + !isValid(this.inputEl.value));
        return this;
    }
    onInvalidEntry(callback) {
        this.handleInvalidEntry = callback;
        return this;
    }
    prompt() {
        this.addCancelButton();
        const { resolve, promise } = deferred();
        this.onClose = () => resolve(this.value);
        this.open();
        this.inputEl.select();
        this.inputEl.focus();
        return promise;
    }
}
