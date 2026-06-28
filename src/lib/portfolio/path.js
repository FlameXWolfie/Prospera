// Tiny immutable dot-path helpers for the inline portfolio editor. Paths address
// nested fields incl. array indices, e.g. 'name', 'experience.0.role',
// 'projects.1.bullets.2'. All return NEW objects/arrays (clone along the path).
export function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = String(path).split('.');
  const root = Array.isArray(obj) ? obj.slice() : { ...obj };
  let cur = root;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const k = keys[i];
    const child = cur[k];
    cur[k] = Array.isArray(child) ? child.slice() : { ...(child || {}) };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return root;
}

export function updatePath(obj, path, fn) {
  const cur = getPath(obj, path);
  return setPath(obj, path, fn(Array.isArray(cur) ? cur : (cur || [])));
}

export function moveInArr(arr, i, dir) {
  const j = i + dir;
  if (!Array.isArray(arr) || j < 0 || j >= arr.length) return arr;
  const a = arr.slice();
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}
