const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const basePath = rawBasePath === "/" ? "" : rawBasePath.replace(/\/$/, "");

export function withBasePath(path: string) {
  if (!basePath) return path;
  if (path.startsWith(basePath)) return path;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}
