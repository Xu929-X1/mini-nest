export function normalizePath(prefix: string, path: string): string {
    const p1 = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const p2 = path.startsWith('/') ? path : '/' + path;
    return normalizeUrl(p1 + p2);
}

export function normalizeUrl(url: string): string {
    if (!url.startsWith('/')) url = '/' + url;
    if (url.length > 1 && url.endsWith('/')) url = url.slice(0, -1);
    return url;
}