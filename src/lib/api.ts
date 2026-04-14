import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
    User,
    Leader,
    Quote,
    EventItem,
    ScanResponse,
    VerificationRequest,
    Socials,
    Role,
    UpdateLeaderPayload,
    CreateLeaderEventPayload,
} from '../types';
import { normalizeAvatarUrl } from '../utils/url';

const AUTH_TOKEN_KEY = 'encounter_token';
const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

type ApiError = Error & {
    status?: number | null;
    body?: unknown;
    validation?: unknown;
};

type AuthResponse = {
    user: User;
    token: string;
};

type RegisterPayload = {
    name?: string;
    email: string;
    password: string;
    password_confirmation: string;
    role?: Exclude<Role, 'ADMIN'> | Role;
};

type LoginPayload = {
    email: string;
    password: string;
};

type UpdateUserProfilePayload = {
    name?: string;
    bio?: string | null;
    socials?: Socials | null;
    avatar?: string | null;
};


type CreateEventPayload = {
    title: string;
    description?: string;
    start_at?: string;
    end_at?: string;
    location?: string;
};

type CreateQuotePayload = {
    text: string;
    source?: string;
};

const api: AxiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
        Accept: 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem(AUTH_TOKEN_KEY);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers.Authorization) {
            delete config.headers.Authorization;
        }
    }

    return config;
});

function makeError(
    message: string,
    status: number | null = null,
    body?: unknown,
    validation?: unknown,
): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.body = body;
    error.validation = validation;
    return error;
}

function extractError(err: unknown): never {
    if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? null;
        const body = err.response?.data;

        const detail =
            typeof body === 'object' && body !== null && 'detail' in body
                ? (body as Record<string, unknown>).detail
                : null;

        const messageFromBody =
            typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail
                        .map((item) => {
                            if (
                                typeof item === 'object' &&
                                item !== null &&
                                'loc' in item &&
                                'msg' in item
                            ) {
                                const loc = Array.isArray((item as Record<string, unknown>).loc)
                                    ? ((item as Record<string, unknown>).loc as unknown[]).join('.')
                                    : 'field';
                                const msg =
                                    typeof (item as Record<string, unknown>).msg === 'string'
                                        ? (item as Record<string, unknown>).msg
                                        : 'Invalid value';
                                return `${loc}: ${msg}`;
                            }
                            return JSON.stringify(item);
                        })
                        .join('; ')
                    : typeof body === 'object' &&
                        body !== null &&
                        'message' in body &&
                        typeof (body as Record<string, unknown>).message === 'string'
                        ? String((body as Record<string, unknown>).message)
                        : err.message || 'Request failed';

        if (status === 401) {
            throw makeError('Unauthorized — please login.', status, body);
        }

        if (status === 403) {
            throw makeError('Forbidden — insufficient permissions.', status, body);
        }

        if (status === 422) {
            throw makeError(messageFromBody || 'Validation failed', status, body, detail);
        }

        throw makeError(messageFromBody, status, body);
    }

    if (err instanceof Error) {
        throw makeError(err.message);
    }

    throw makeError('Unknown error');
}

/* ---------- Auth ---------- */

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/auth/register', payload);

        if (typeof window !== 'undefined' && response.data.token) {
            window.localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        }

        return {
            ...response.data,
            user: {
                ...response.data.user,
                avatar: normalizeAvatarUrl(response.data.user.avatar ?? null),
            },
        };
    } catch (err) {
        extractError(err);
    }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
    try {
        const response = await api.post<AuthResponse>('/auth/login', payload);

        if (typeof window !== 'undefined' && response.data.token) {
            window.localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        }

        return {
            ...response.data,
            user: {
                ...response.data.user,
                avatar: normalizeAvatarUrl(response.data.user.avatar ?? null),
            },
        };
    } catch (err) {
        extractError(err);
    }
}

export async function me(): Promise<User> {
    try {
        const response = await api.get<User>('/auth/me');

        return {
            ...response.data,
            avatar: normalizeAvatarUrl(response.data.avatar ?? null),
        };
    } catch (err) {
        extractError(err);
    }
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
    } catch (err) {
        if (typeof window !== 'undefined') {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        extractError(err);
    }

    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
}

/* ---------- Profile ---------- */

export async function getUserProfile(): Promise<User> {
    try {
        const response = await api.get<User>('/auth/me');

        return {
            ...response.data,
            avatar: normalizeAvatarUrl(response.data.avatar ?? null),
        };
    } catch (err) {
        extractError(err);
    }
}

export async function updateUserProfile(
    payload: UpdateUserProfilePayload,
): Promise<{ user: User }> {
    try {
        const response = await api.patch<{ user: User }>('/auth/me', payload);

        return {
            user: {
                ...response.data.user,
                avatar: normalizeAvatarUrl(response.data.user.avatar ?? null),
            },
        };
    } catch (err) {
        extractError(err);
    }
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await api.post<{ avatarUrl: string }>(
            '/auth/me/avatar',
            formData,
        );

        return {
            avatarUrl: normalizeAvatarUrl(response.data.avatarUrl ?? null) ?? '',
        };
    } catch (err) {
        extractError(err);
    }
}

export async function deleteAvatar(): Promise<{ success: true }> {
    try {
        const response = await api.delete<{ success: true }>('/auth/me/avatar');
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

/* ---------- Leader self ---------- */

export async function getMyLeader(): Promise<Leader> {
    try {
        const response = await api.get<Leader>('/leader/me');

        return {
            ...response.data,
            avatar: normalizeAvatarUrl(response.data.avatar ?? null),
        };
    } catch (err) {
        extractError(err);
    }
}

export async function updateMyLeader(
    payload: UpdateLeaderPayload,
): Promise<{ success: true; leader: Leader }> {
    try {
        const response = await api.put<{ success: true; leader: Leader }>(
            '/leader/me',
            payload,
        );

        return {
            success: response.data.success,
            leader: {
                ...response.data.leader,
                avatar: normalizeAvatarUrl(response.data.leader.avatar ?? null),
            },
        };
    } catch (err) {
        extractError(err);
    }
}

export async function requestVerification(payload: {
    note?: string;
    meta?: Record<string, unknown>;
}): Promise<{ success: true; request: VerificationRequest }> {
    try {
        const response = await api.post<{ success: true; request: VerificationRequest }>(
            '/leader/me/request-verification',
            payload,
        );
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function checkinSelf(): Promise<{ success: true }> {
    try {
        const response = await api.post<{ success: true }>('/leader/me/checkin');
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function checkoutSelf(): Promise<{ success: true }> {
    try {
        const response = await api.post<{ success: true }>('/leader/me/checkout');
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

/* ---------- Leader quotes ---------- */

export async function listMyQuotes(): Promise<Quote[]> {
    try {
        const response = await api.get<Quote[]>('/leader/me/quotes');
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function addMyQuote(
    payload: CreateQuotePayload,
): Promise<{ success: true; quote: Quote }> {
    try {
        const response = await api.post<{ success: true; quote: Quote }>(
            '/leader/me/quotes',
            payload,
        );
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function deleteMyQuote(id: string): Promise<{ success: true }> {
    try {
        const response = await api.delete<{ success: true }>(
            `/leader/me/quotes/${encodeURIComponent(id)}`,
        );
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

/* ---------- Leader events ---------- */

export async function listMyEvents(): Promise<EventItem[]> {
    try {
        const response = await api.get<EventItem[]>('/leader/me/events');
        return response.data.map((event) => ({
            ...event,
            leader: event.leader
                ? {
                    ...event.leader,
                    avatar: normalizeAvatarUrl(event.leader.avatar ?? null),
                }
                : event.leader,
        }));
    } catch (err) {
        extractError(err);
    }
}

export async function createMyEvent(
    payload: CreateEventPayload,
): Promise<{ success: true; event: EventItem }> {
    try {
        const response = await api.post<{ success: true; event: EventItem }>(
            '/leader/me/events',
            payload,
        );

        return {
            success: response.data.success,
            event: {
                ...response.data.event,
                leader: response.data.event.leader
                    ? {
                        ...response.data.event.leader,
                        avatar: normalizeAvatarUrl(
                            response.data.event.leader.avatar ?? null,
                        ),
                    }
                    : response.data.event.leader,
            },
        };
    } catch (err) {
        extractError(err);
    }
}

export async function deleteMyEvent(id: string): Promise<{ success: true }> {
    try {
        const response = await api.delete<{ success: true }>(
            `/leader/me/events/${encodeURIComponent(id)}`,
        );
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

/* ---------- Public ---------- */

export async function scan(payload: {
    userId?: string;
    preferences?: Record<string, unknown>;
}): Promise<ScanResponse> {
    try {
        const response = await api.post<ScanResponse>('/scan', payload);
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function getLeaders(): Promise<Leader[]> {
    try {
        const response = await api.get<Leader[]>('/leaders');

        return response.data.map((leader) => ({
            ...leader,
            avatar: normalizeAvatarUrl(leader.avatar ?? null),
        }));
    } catch (err) {
        extractError(err);
    }
}

export async function followLeader(
    leaderId: string,
): Promise<{ success: true }> {
    try {
        const response = await api.post<{ success: true }>('/follow', {
            leader_id: leaderId,
        });
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function unfollowLeader(
    leaderId: string,
): Promise<{ success: true }> {
    try {
        const response = await api.post<{ success: true }>('/unfollow', {
            leader_id: leaderId,
        });
        return response.data;
    } catch (err) {
        extractError(err);
    }
}

export async function getPublicEvents(): Promise<EventItem[]> {
    try {
        const response = await api.get<EventItem[]>('/events');

        return response.data.map((event) => ({
            ...event,
            leader: event.leader
                ? {
                    ...event.leader,
                    avatar: normalizeAvatarUrl(event.leader.avatar ?? null),
                }
                : event.leader,
        }));
    } catch (err) {
        extractError(err);
    }
}