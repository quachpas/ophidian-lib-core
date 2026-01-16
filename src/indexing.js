import { setMap } from "./add-ons";
import { obsidian as o } from "./obsidian";
import { use } from "./services";
import { signal } from "./signify";
// reuse/recycle sets and maps instead of constantly allocating new ones
// (we can do this because they're never directly exposed in the API, so we
// know when we can safely dispose of/resuse them.)
var freeSets = [], freeMaps = [];
var toAdd;
function recordEntry(k, v) {
    ((toAdd || (toAdd = freeMaps.pop() || new Map)).get(k) || setMap(toAdd, k, freeSets.pop() || new Set)).add(v);
}
export class AbstactIndexer extends o.Component {
    constructor() {
        super(...arguments);
        this.indices = new Map();
        this.version = signal(0);
        this.history = new WeakMap();
    }
    /** Add an item to the index, or update it if already present */
    add(item) { this.process(item, this.parse); }
    /** Remove an item from the index */
    delete(item) { this.process(item, noparse); }
    /** Get number of values for a key, or number of items for a key+value */
    count(key, val) {
        var _a;
        this.version();
        const idx = this.indices.get(key);
        return ((_a = (arguments.length > 1 ? idx === null || idx === void 0 ? void 0 : idx.get(val) : idx)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
    /** Return the first item with a key of val (or undefined if none) */
    first(key, val) {
        this.version();
        const vals = this.indices.get(key);
        if (!vals)
            return;
        const items = vals === null || vals === void 0 ? void 0 : vals.get(val);
        if (!items)
            return;
        for (const item of items)
            return item;
    }
    items(key, val) {
        this.version();
        const vals = this.indices.get(key);
        if (!vals)
            return [];
        const items = vals === null || vals === void 0 ? void 0 : vals.get(val);
        if (!items)
            return [];
        if (items.size)
            return Array.from(items); // copy so stored set is recyclable
        return [];
    }
    *entries(key) {
        this.version();
        const index = this.indices.get(key);
        if (!index || !index.size)
            return;
        const pair = [null, null];
        for (const [v, items] of index) {
            pair[0] = v;
            // copy set so stored set is recyclable
            for (pair[1] of Array.from(items))
                yield pair;
        }
    }
    // Update indexes using a no-thrash algorithm, so that the underlying
    // sets and maps are not changed when an unchanged item is passed to
    // .add(), and so that no memory allocation is done when processing
    // items that don't have any index entries (which is typically most of them!).
    //
    process(item, parser) {
        toAdd = undefined;
        parser.call(this, item, recordEntry);
        var toDelete = this.history.get(item);
        var { indices } = this;
        var changed = false;
        // Add new entries
        if (toAdd) {
            for (const [k, vals] of toAdd) {
                const idx = indices.get(k) || setMap(indices, k, freeMaps.pop() || new Map);
                const old = toDelete && toDelete.get(k);
                for (const v of vals) {
                    const items = (idx.get(v) || setMap(idx, v, freeSets.pop() || new Set));
                    if (!items.has(item)) {
                        items.add(item);
                        changed = true;
                    }
                    if (old)
                        old.delete(v);
                }
            }
            this.history.set(item, toAdd);
            toAdd = undefined;
        }
        else
            this.history.delete(item);
        if (toDelete) {
            // Remove entries that don't apply any more
            for (const [k, vals] of toDelete) {
                const idx = indices.get(k);
                if (!idx)
                    continue;
                for (const v of vals) {
                    const items = idx.get(v);
                    if (items && items.has(item)) {
                        items.delete(item);
                        changed = true;
                        if (!items.size) {
                            idx.delete(v);
                            freeSets.push(items);
                        }
                    }
                }
                vals.clear();
                freeSets.push(vals);
            }
            toDelete.clear();
            freeMaps.push(toDelete);
        }
        // trigger rerun of queries using the current state
        if (changed)
            this.version.set(this.version() + 1);
    }
}
export class NoteMetaIndexer extends AbstactIndexer {
    constructor() {
        super(...arguments);
        this.use = use.service(this);
    }
    onload() {
        app.workspace.onLayoutReady(() => {
            const metaCache = app.metadataCache;
            metaCache.getCachedFiles().forEach((filename) => {
                this.add(app.vault.getAbstractFileByPath(filename));
            });
            this.registerEvent(metaCache.on("changed", this.add, this));
            this.registerEvent(app.vault.on("delete", (f) => { if (f instanceof o.TFile)
                this.delete(f); }));
            // XXX add a signal to notify of loaded status?
        });
    }
}
function noparse() { }
