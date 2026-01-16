import { obsidian as o } from "../obsidian";
import { defer } from "../defer";
import { deferred } from "../deferred";
export function modalSelect(items, format, placeholder, setup) {
    const { resolve, promise } = deferred();
    const modal = new (class extends o.FuzzySuggestModal {
        getItemText(item) { var _a; return (_a = format === null || format === void 0 ? void 0 : format(item)) !== null && _a !== void 0 ? _a : "" + item; }
        getItems() { return items; }
        onChooseItem(item, event) {
            resolve({ item, event });
        }
        onClose() {
            super.onClose();
            defer(() => resolve({ item: null, event: null }));
        }
    })(app);
    if (placeholder)
        modal.setPlaceholder(placeholder);
    setup === null || setup === void 0 ? void 0 : setup(modal);
    modal.open();
    return promise;
}
