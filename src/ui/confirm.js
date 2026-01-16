import { deferred } from "../deferred";
import { Dialog } from "./dialog";
export class Confirm extends Dialog {
    constructor() {
        super(...arguments);
        this.value = false;
    }
    onOK(_) {
        this.value = true;
    }
    confirm() {
        this.addCancelButton();
        const { resolve, promise } = deferred();
        this.onClose = () => resolve(this.value);
        this.open();
        return promise;
    }
}
