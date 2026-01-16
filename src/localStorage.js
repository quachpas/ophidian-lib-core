import { obsidian as o } from "./obsidian";
import defaults from "defaults";
export class LocalObject extends o.Component {
    constructor(key, defaults = {}, onChange // async callback on load + whenever value changes
    ) {
        super();
        this.key = key;
        this.onChange = onChange;
        this.defaultJSON = JSON.stringify(defaults);
    }
    get() { return this.parseWithDefaults(localStorage[this.key]); }
    modify(fn, leaseTime = 1000) {
        return this.withLock(() => {
            var _a;
            const oldJSON = (_a = localStorage[this.key]) !== null && _a !== void 0 ? _a : "{}", obj = this.parseWithDefaults(oldJSON), ret = fn(obj), newJSON = JSON.stringify(obj);
            if (newJSON !== oldJSON) {
                localStorage[this.key] = newJSON;
                this._update(obj);
            }
            return ret;
        }, leaseTime);
    }
    unset() {
        return this.withLock(() => localStorage.removeItem(this.key));
    }
    parseWithDefaults(s) {
        return defaults(JSON.parse(s !== null && s !== void 0 ? s : "{}"), JSON.parse(this.defaultJSON));
    }
    async withLock(fn, leaseTime = 1000) {
        const poll = 50, retry = 100;
        const lockX = this.key + "::lock-X", lockY = this.key + "::lock-Y";
        // Lamport lock: loop until valid lease acquired
        // ( https://www.cs.rochester.edu/research/synchronization/pseudocode/fastlock.html )
        while (true) {
            const id = app.appId + ":" + Math.random() + ":" + (+Date.now() + leaseTime);
            localStorage[lockX] = id;
            const Y = localStorage[lockY];
            if (Y && +(Y.split(":").pop()) > +Date.now()) {
                // An unexpired lease exists; try again after a delay
                await sleep(poll * (Math.random() + 0.5));
            }
            else {
                localStorage[lockY] = id;
                if (localStorage[lockX] === id)
                    break;
                // Collision: wait for other process to notice and abort
                await sleep(retry * (Math.random() + 0.5));
                if (localStorage[lockY] === id)
                    break;
            }
        }
        try {
            return fn();
        }
        finally {
            delete localStorage[lockX];
            delete localStorage[lockY];
        }
    }
    onload() {
        if (!this.onChange)
            return;
        this._update(this.get());
        this.registerDomEvent(window, "storage", e => {
            if (e.key !== this.key || e.oldValue === e.newValue)
                return;
            this._update(this.parseWithDefaults(e.newValue));
        });
    }
    _update(value) {
        Promise.resolve(value).then(this.onChange);
    }
}
