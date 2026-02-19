// src/lib/api.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
    User,
    Leader,
    Quote,
    EventItem,
    ScanResponse,
    VerificationRequest,
    Socials,
} from '../types';
import { normalizeAvatarUrl } from '../utils/url'; // adjust path


const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000/api';

const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    headers: { Accept: 'application/json' },
});

// Attach token for client-side calls
api.interceptors.request.use((cfg) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('encounter_token');
        if (token) cfg.headers.setAuthorization(`Bearer ${token}`);
        else {
            // ensure Authorization removed when token absent
            if (cfg.headers && 'Authorization' in cfg.headers) {
                cfg.headers.deleteAuthorization();
            }
        }
    }
    return cfg;
});

function extractAxiosMessage(err: unknown): { status: number | null; message: string; body?: unknown } {
    if (!err) return { status: null, message: 'Unknown error' };
    if ((err as AxiosError).isAxiosError) {
        const e = err as AxiosError;
        const status = e.response?.status ?? null;
        // try to extract server message/body
        const body = e.response?.data;
        const message =
            (typeof body === 'object' && body !== null && 'message' in body && typeof (body as Record<string, unknown>).message === 'string' ? (body as Record<string, unknown>).message : null) ||
            e.message ||
            (body && JSON.stringify(body)) ||
            'Request failed';
        return { status, message: String(message), body };
    }
    return { status: null, message: (err as Error).message ?? String(err) };
}

function throwAuthError(status: number | null, body?: unknown) {
    // helper: wrap common auth errors
    const msg = status === 401 ? 'Unauthorized — please login.' : status === 403 ? 'Forbidden — insufficient permissions.' : 'Authentication error';
    const e = new Error(`${msg} ${body ? JSON.stringify(body) : ''}`);
    throw e;
}

/**
 * Lightweight typed wrapper around axios.request to avoid ts-ignore and probe multiple verbs/paths.
 * - stops probing when receives 401/403 (treat as auth/permission issue)
 * - continues on 404/405 (not exist / method not allowed)
 */
async function tryPathsAndMethods<T = unknown>(
    pathCandidates: string[],
    payload: unknown,
    methods: Array<'patch' | 'put' | 'post'> = ['patch', 'put', 'post']
): Promise<{ data: T; path: string; method: string }> {
    const failures: Array<{ path: string; method: string; status: number | null; message?: string }> = [];

    // ensure token present for endpoints that require auth — quick heuristic
    if (typeof window !== 'undefined') {
        const maybeAuthRequired = pathCandidates.some((p) => p.includes('/auth') || p.includes('/me') || p.includes('/user'));
        if (maybeAuthRequired) {
            const token = localStorage.getItem('encounter_token');
            if (!token) throw new Error('Not authenticated — no token found. Please login.');
        }
    }

    for (const path of pathCandidates) {
        for (const method of methods) {
            try {
                const resp = await api.request<{ data?: T; user?: unknown; avatarUrl?: string; success?: boolean }>({
                    url: path,
                    method,
                    data: payload,
                });
                // some servers return { user: ... }, some return body, so return resp.data if present
                const returnData = ((resp.data as unknown) as T) ?? (resp.data.user as T);
                return { data: returnData, path, method };
            } catch (err) {
                const info = extractAxiosMessage(err);
                failures.push({ path, method, status: info.status, message: info.message });
                // for auth issues, stop and surface clear message
                if (info.status === 401 || info.status === 403) {
                    throwAuthError(info.status, info.body);
                }
                // continue probing on 404/405 only
                if (info.status === 404 || info.status === 405) {
                    continue;
                }
                // other statuses: rethrow full axios error (validation, 422, 500)
                throw err;
            }
        }
    }

    const debug = failures.map((f) => `${f.method.toUpperCase()} ${f.path} => ${f.status ?? 'no-response'} ${f.message ?? ''}`).join('; ');
    throw new Error(`No supported HTTP verb/path worked. Attempts: ${debug}`);
}

/* ---------- Auth ---------- */

export async function register(payload: {
    name?: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: 'USER' | 'LEADER' | 'ADMIN';
}): Promise<{ user: User; token: string }> {
    try {
        const r = await api.post<{ user: User; token: string }>('/auth/register', payload);
        if (r.data?.token) localStorage.setItem('encounter_token', r.data.token);
        return r.data;
    } catch (err) {
        const info = extractAxiosMessage(err);
        throw new Error(`Register failed: ${info.message}`);
    }
}

export async function login(payload: { email: string; password: string }): Promise<{ user: User; token: string }> {
    try {
        const r = await api.post<{ user: User; token: string }>('/auth/login', payload);
        if (r.data?.token) localStorage.setItem('encounter_token', r.data.token);
        return r.data;
    } catch (err) {
        const info = extractAxiosMessage(err);
        throw new Error(`Login failed: ${info.message}`);
    }
}

export async function me(): Promise<User> {
    try {
        const r = await api.get<User>('/auth/me');
        return r.data;
    } catch (err) {
        const info = extractAxiosMessage(err);
        if (info.status === 401 || info.status === 403) throwAuthError(info.status, info.body);
        throw new Error(`Failed to fetch current user: ${info.message}`);
    }
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
        localStorage.removeItem('encounter_token');
    } catch (err) {
        const info = extractAxiosMessage(err);
        // still remove token locally to avoid stale state
        localStorage.removeItem('encounter_token');
        throw new Error(`Logout failed: ${info.message}`);
    }
}

/* ---------- Profile utilities ---------- */

export async function getUserProfile(): Promise<User> {
    const candidates = ['/auth/me', '/me', '/user/me'];
    for (const p of candidates) {
        try {
            const resp = await api.get<User>(p);
            return resp.data;
        } catch (err) {
            const info = extractAxiosMessage(err);
            if (info.status === 404) continue;
            if (info.status === 401 || info.status === 403) throwAuthError(info.status, info.body);
            throw err;
        }
    }
    throw new Error('Could not fetch current user profile (checked /auth/me, /me, /user/me)');
}

export async function updateUserProfile(payload: {
    name?: string;
    bio?: string | null;
    socials?: Socials | null;
    avatar?: string | null;
}): Promise<{ user: User }> {
    try {
        const resp = await api.patch<{ user: User }>('/auth/me', payload);
        return resp.data;
    } catch (err) {
        const e = err as AxiosError;
        if (e.response) {
            // if validation errors (422), throw a structured error with details
            if (e.response.status === 422) {
                // server returns { message, errors }
                const body = e.response.data as Record<string, unknown>;
                const validation = body.errors ?? null;
                const message = String(body.message ?? 'Validation failed');
                const ex = new Error(message) as Error & { validation?: unknown };
                ex.validation = validation;
                throw ex;
            }
            // auth errors handled upstream
            if (e.response.status === 401 || e.response.status === 403) {
                throw new Error(`${e.response.status === 401 ? 'Unauthorized — please login.' : 'Forbidden — insufficient permissions.'} ${JSON.stringify(e.response.data)}`);
            }
        }
        throw e;
    }
}

/* ---------- Avatar helpers ---------- */

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const avatarEndpoints = [
        '/auth/me/avatar',
        '/me/avatar',
        '/user/me/avatar',
        '/users/me/avatar',
        '/user/avatar',
        '/users/avatar',
        '/avatar',
    ];

    type AvatarResponse = { avatarUrl?: string; user?: User };

    for (const ep of avatarEndpoints) {
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const resp = await api.post<AvatarResponse>(ep, fd, {
                headers: {
                    // important: let browser set Content-Type and boundary — don't set manually.
                    // but we explicitly allow multipart here (no custom header).
                },
            });
            const avatarUrl = resp.data.avatarUrl ?? resp.data.user?.avatar;
            if (avatarUrl) return { avatarUrl };
            // return empty string as success if API accepted but did not return url
            return { avatarUrl: '' };
        } catch (err) {
            const info = extractAxiosMessage(err);
            // try next endpoint only on 404/405
            if (info.status === 404 || info.status === 405) continue;
            if (info.status === 401 || info.status === 403) throwAuthError(info.status, info.body);
            throw new Error(`Avatar upload failed: ${info.message}`);
        }
    }

    // fallback: convert to dataURL and send in profile update (less optimal)
    try {
        const dataUrl = await fileToDataUrl(file);
        const { user } = await updateUserProfile({ avatar: dataUrl });
        return { avatarUrl: user.avatar ?? dataUrl };
    } catch (err) {
        const info = extractAxiosMessage(err);
        throw new Error(`Avatar fallback upload failed: ${info.message}`);
    }
}

export async function deleteAvatar(): Promise<{ success: true }> {
    const deleteEndpoints = [
        '/auth/me/avatar',
        '/me/avatar',
        '/user/me/avatar',
        '/users/me/avatar',
        '/user/avatar',
        '/users/avatar',
        '/avatar',
    ];

    for (const ep of deleteEndpoints) {
        try {
            const resp = await api.delete<{ success?: true; user?: User }>(ep);
            // success if server accepted delete
            return { success: true };
        } catch (err) {
            const info = extractAxiosMessage(err);
            if (info.status === 404 || info.status === 405) continue;
            if (info.status === 401 || info.status === 403) throwAuthError(info.status, info.body);
            throw new Error(`Delete avatar failed: ${info.message}`);
        }
    }

    // fallback: clear avatar via profile update
    await updateUserProfile({ avatar: null });
    return { success: true };
}

/* ---------- Leaders / Events / Scan etc (unchanged) ---------- */

export async function getMyLeader(): Promise<Leader> {
    const r = await api.get<Leader>('/leader/me');
    return r.data;
}

export async function updateMyLeader(payload: {
    bio?: string;
    verification_badge?: string;
    avatar?: string;
}): Promise<{ success: true; leader: Leader }> {
    const r = await api.put<{ success: true; leader: Leader }>('/leader/me', payload);
    return r.data;
}

export async function requestVerification(payload: { note?: string; meta?: Record<string, unknown> }): Promise<{ success: true; request: VerificationRequest }> {
    const r = await api.post<{ success: true; request: VerificationRequest }>('/leader/me/request-verification', payload);
    return r.data;
}

export async function listMyQuotes(): Promise<Quote[]> {
    const r = await api.get<Quote[]>('/leader/me/quotes');
    return r.data;
}
export async function addMyQuote(payload: { text: string; source?: string }): Promise<{ success: true; quote: Quote }> {
    const r = await api.post<{ success: true; quote: Quote }>('/leader/me/quotes', payload);
    return r.data;
}
export async function deleteMyQuote(id: string): Promise<{ success: true }> {
    const r = await api.delete<{ success: true }>(`/leader/me/quotes/${encodeURIComponent(id)}`);
    return r.data;
}

export async function listMyEvents(): Promise<EventItem[]> {
    const r = await api.get<EventItem[]>('/leader/me/events');
    return r.data;
}
export async function createMyEvent(payload: {
    title: string;
    description?: string;
    start_at?: string;
    end_at?: string;
    location?: string;
}): Promise<{ success: true; event: EventItem }> {
    const r = await api.post<{ success: true; event: EventItem }>('/leader/me/events', payload);
    return r.data;
}
export async function deleteMyEvent(id: string): Promise<{ success: true }> {
    const r = await api.delete<{ success: true }>(`/leader/me/events/${encodeURIComponent(id)}`);
    return r.data;
}

export async function scan(payload: { userId?: string; preferences?: Record<string, unknown> }): Promise<ScanResponse> {
    const r = await api.post<ScanResponse>('/scan', payload);
    return r.data;
}

export async function getLeaders(): Promise<Leader[]> {
    // try common leader endpoints; prefer the public one we just added
    const candidates = ['/leaders', '/api/leaders', '/v1/leaders', '/api/v1/leaders', '/leaders/list'];

    for (const path of candidates) {
        try {
            const r = await api.get<Leader[]>(path);
            // sanitize avatar urls and ensure followed boolean exists
            const normalized = (r.data ?? []).map((l) => ({
                ...l,
                avatar: normalizeAvatarUrl(l.avatar ?? null),
                followed: !!l.followers_count,
            }));
            return normalized;
        } catch (err) {
            const e = err as AxiosError;
            const status = e?.response?.status ?? null;
            // If 404 continue to try other candidates; otherwise surface error
            if (status === 404) continue;
            throw e;
        }
    }

    throw new Error('Could not find a /leaders endpoint on the API (checked common paths)');
}


export async function followLeader(leaderId: string): Promise<{ success: true }> {
    const r = await api.post<{ success: true }>('/follow', { leader_id: leaderId });
    return r.data;
}

export async function unfollowLeader(leaderId: string): Promise<{ success: true }> {
    const r = await api.post<{ success: true }>('/unfollow', { leader_id: leaderId });
    return r.data;
}

export async function getPublicEvents(): Promise<EventItem[]> {
    const candidates = [
        '/events',
        '/api/events',
        '/v1/events',
        '/api/v1/events',
        '/public/events',
    ];

    for (const path of candidates) {
        try {
            const r = await api.get<EventItem[]>(path);
            const normalized: EventItem[] = ((r.data ?? []) as unknown as Record<string, unknown>[]).map((ev: Record<string, unknown>) => ({
                id: String(ev.id),
                title: String(ev.title),
                description: (ev.description as string | null) ?? null,
                start_at: (ev.start_at as string | null) ?? null,
                end_at: (ev.end_at as string | null) ?? null,
                location: (ev.location as string | null) ?? null,
                leader_id: (ev.leader_id as string | null) ?? ((ev.leader as Record<string, unknown>)?.id as string | null) ?? null,
                leader: ev.leader ? {
                    id: String((ev.leader as Record<string, unknown>).id),
                    name: String((ev.leader as Record<string, unknown>).name),
                    avatar: normalizeAvatarUrl((ev.leader as Record<string, unknown>).avatar as string ?? null),
                } : undefined,
                created_at: (ev.created_at as string | null) ?? null,
            }) as EventItem);
            return normalized;
        } catch (err) {
            const e = err as AxiosError;
            const status = e?.response?.status ?? null;
            if (status === 404) {
                continue; // try next candidate
            }
            throw e;
        }
    }

    throw new Error('Could not find /events endpoint on API (checked common paths)');
}

/* ---------- Utilities ---------- */
function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
    });
}
