// @ts-nocheck
import { obsidian as o } from "../obsidian";
import { Service } from "../services";

export class CommandService extends Service {
    
    add(command: o.Command) {
        this.use(o.Plugin).addCommand(command);
        return this;
    }

    addCommand(command: o.Command) {
        return this.add(command);
    }

    bind(id: string, check: boolean, callback: (checking: boolean) => boolean | void) {
        return this.add({id, checkCallback: callback, name: check ? undefined : id});
    }
}
