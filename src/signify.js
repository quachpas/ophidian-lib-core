/**
 * Wrap preact signals to use @maverick-js/signals API style, w/always-async
 * side effects, nested effect() support, and aSignal()/aSignal.set(value) interface.
 */
export { untracked } from "@preact/signals-core";
import { computed as _computed, batch, signal as _signal, effect as _effect } from "@preact/signals-core";
import { addOn } from "./add-ons";
import { defer } from "./defer";
export function computed(fn) {
    const c = _computed(fn);
    return () => c.value;
}
export function signal(val) {
    const s = _signal(val);
    function signal() { s.value; return val; }
    signal.set = function (v) {
        if (val === v)
            return; // ignore no-op sets
        if (!toUpdate.size)
            defer(tick); // schedule atomic update to run effects
        toUpdate.set(s, val = v); // cache update for immediate read
    };
    return signal;
}
// Asynchronous updates
const toUpdate = new Map();
export function tick() {
    if (!toUpdate.size)
        return;
    batch(() => {
        for (const [s, v] of toUpdate.entries()) {
            toUpdate.delete(s);
            s.value = v;
        }
    });
}
export const signals = addOn(function (_k) { return {}; });
// Must be used *without* accessor and *with* useDefineForClassFields: false
export function prop(_clsOrProto, name) {
    return {
        enumerable: true,
        configurable: true,
        get() {
            const s = signals(this);
            let v = s[name];
            if (!v)
                v = s[name] = signal(undefined);
            return v();
        },
        set(val) {
            const s = signals(this);
            let v = s[name];
            if (!v)
                v = s[name] = signal(undefined);
            v.set(val);
        }
    };
}
export function calc(_clsOrProto, name, desc) {
    const method = desc.get;
    return { ...desc, get() {
            var _a;
            var _b;
            return ((_a = (_b = signals(this))[name]) !== null && _a !== void 0 ? _a : (_b[name] = computed(method.bind(this))))();
        } };
}
// Support nested effects
var childEffects;
export function effect(compute) {
    const cb = _effect(function () {
        const old = childEffects;
        const fx = childEffects = [];
        try {
            const cb = compute.call(this);
            if (cb)
                fx.push(cb);
            if (fx.length) {
                return fx.length === 1 ? fx.pop() : function () {
                    while (fx.length)
                        try {
                            fx.shift()();
                        }
                        catch (e) {
                            Promise.reject(e);
                        }
                };
            }
        }
        finally {
            childEffects = old;
        }
    });
    if (childEffects)
        childEffects.push(cb);
    return cb;
}
/**
 * Create a group of effects tied to a condition.
 *
 * @param cond A function whose return value indicates whether
 * the effects should be enabled.
 *
 * @param bind Optional: an object to bind effect callbacks to
 *
 * @returns A function that can be called with an effect callback to
 * add it to the group (returning a remove function for removing it
 * from the group), or with no arguments to dispose of the entire group.
 */
export function when(cond, bind) {
    var fns = signal([]);
    var active = computed(() => !!cond());
    var stop = effect(() => { if (active())
        fns().forEach(effect); });
    return function (fn) {
        if (arguments.length) {
            if (bind)
                fn = fn.bind(bind);
            fns.set([...fns(), fn]);
            return function () { fns.set(fns().filter(f => f !== fn)); };
        }
        else {
            stop === null || stop === void 0 ? void 0 : stop();
            fns = stop = bind = cond = undefined;
        }
    };
}
