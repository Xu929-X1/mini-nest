export function routeMatch(routePattern: string, path: string) {
    const routeParts = routePattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) {
        return { matched: false };
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
        const r = routeParts[i];
        const p = pathParts[i];

        if (r.startsWith(':')) {
            const key = r.slice(1);
            params[key] = p;
        } else if (r !== p) {
            return { matched: false };
        }
    }
    console.log('Route matched:', routePattern, '→', path, 'with params:', params);
    return { matched: true, params };

}