export function normalizeAvatarUrl(url?: string | null): string | null {
    if (!url) return null;
    // already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    // if relative like /storage/avatars/..., prefix with backend host
    const apiBase = (process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000').replace(/\/api\/?$/, '');
    // ensure single slash
    if (url.startsWith('/')) return apiBase + url;
    return apiBase + '/' + url;
}