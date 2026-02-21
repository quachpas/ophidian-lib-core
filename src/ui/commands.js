// @ts-nocheck
import { obsidian as o } from "../obsidian";
import { Service } from "../services";
export class CommandService extends Service {
    add(command) {
        this.use(o.Plugin).addCommand(command);
        return this;
    }
    addCommand(command) {
        return this.add(command);
    }
    bind(id, check, callback) {
        return this.add({ id, checkCallback: callback, name: check ? undefined : id });
    }
}
