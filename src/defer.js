/** Invoke a no-argument function as a microtask, using queueMicrotask or Promise.resolve().then() */
export const defer = typeof queueMicrotask === "function" ? queueMicrotask : (p => (cb) => p.then(cb))(Promise.resolve());
/**
 * Return a queuing function that invokes callbacks serially, returning a promise for the task's completion
 *
 * The returned function has a signature that's equivalent to Promise<void>.then() - i.e., it takes an
 * optional onfulfilled and onrejected callback.  If no onrejected callback is supplied, `console.error`
 * is used.
 */
export function taskQueue(initalValue) {
    let last = Promise.resolve(initalValue);
    return (onfulfilled, onrejected) => {
        if (onfulfilled || onrejected) {
            if (typeof onrejected === "undefined")
                onrejected = console.error;
            return last = last.then(onfulfilled, onrejected);
        }
        return last;
    };
}
