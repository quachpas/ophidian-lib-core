export function cloneValue(ob) { return (ob && typeof ob === "object") ? JSON.parse(JSON.stringify(ob)) : ob; }
