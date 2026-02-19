// src/lib/api.ts (or src/lib/utils.ts)
import axios, { AxiosError } from 'axios';
import type { User, Socials } from '../types';

// your existing axios instance; adapt if different
export const api = axios.create({
    baseURL: '/api', // <- adjust if your API base is different
    // You might have interceptors that set Authorization; keep them
});

/** Convert a File to base64 data URL (client only) */
export function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = () => {
            fr.abort();
            reject(new Error('Failed to read file'));
        };
        fr.onload = () => {
            const result = fr.result;
            if (typeof result === 'string') resolve(result);
            else reject(new Error('Unexpected read result'));
        };
        fr.readAsDataURL(file);
    });
}
