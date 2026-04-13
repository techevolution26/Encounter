
// app/profile/page.tsx
'use client';

import React, { useEffect, useState, type JSX } from 'react';
import type { User, Socials } from '../../types';
import {
    getUserProfile,
    updateUserProfile,
    uploadAvatar,
    deleteAvatar,
} from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage(): JSX.Element {
    const { user, setUser } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);

    // form fields
    const [name, setName] = useState<string>('');
    const [bio, setBio] = useState<string>('');
    const [twitter, setTwitter] = useState<string>('');
    const [facebook, setFacebook] = useState<string>('');
    const [website, setWebsite] = useState<string>('');

    // avatar handling
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

    const [saving, setSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const p = await getUserProfile();
                setProfile(p);
                setName(p.name ?? '');
                setBio(p.bio ?? '');
                setAvatarUrl(p.avatar ?? null);
                setTwitter(p.socials?.twitter ?? '');
                setFacebook(p.socials?.facebook ?? '');
                setWebsite(p.socials?.website ?? '');
            } catch (err) {
                console.error('Failed to load profile', err);
                setError('Failed to load profile');
            }
        })();
    }, []);

    // cleanup preview object URL when avatarFile changes
    useEffect(() => {
        if (!avatarFile) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
            setPreviewUrl(null);
        };
    }, [avatarFile]);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        if (f) {
            // simple client-side validation (file type + size optional)
            if (!f.type.startsWith('image/')) {
                setError('Only images allowed for avatar');
                return;
            }
            if (f.size > 5 * 1024 * 1024) {
                setError('Avatar must be <= 5MB');
                return;
            }
            setAvatarFile(f);
            setError(null);
        }
    }

    async function handleUploadAvatar(): Promise<string | null> {
        if (!avatarFile) return null;
        setUploadingAvatar(true);
        try {
            const res = await uploadAvatar(avatarFile);
            setAvatarUrl(res.avatarUrl);
            setAvatarFile(null);
            setMessage('Avatar uploaded');
            setTimeout(() => setMessage(null), 2000);
            return res.avatarUrl;
        } catch (err) {
            console.error('avatar upload failed', err);
            setError(err instanceof Error ? err.message : 'Avatar upload failed');
            return null;
        } finally {
            setUploadingAvatar(false);
        }
    }

    async function handleDeleteAvatar() {
        try {
            await deleteAvatar();
            setAvatarUrl(null);
            setProfile((p) => (p ? { ...p, avatar: null } : p));
            setUser((u) => (u ? { ...u, avatar: null } : u));
            setMessage('Avatar removed');
            setTimeout(() => setMessage(null), 2000);
        } catch (err) {
            console.error('delete avatar failed', err);
            setError('Failed to delete avatar');
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            // 1) if user selected a new avatar file, upload it first
            let avatarFromUpload: string | null = null;
            if (avatarFile) {
                avatarFromUpload = await handleUploadAvatar();
            }

            // 2) assemble socials
            const socials: Socials = {
                twitter: twitter.trim() || undefined,
                facebook: facebook.trim() || undefined,
                website: website.trim() || undefined,
            };

            // 3) send profile update (include avatar url if present)
            const payload = {
                name: name.trim() || undefined,
                bio: bio.trim() || undefined,
                socials,
                avatar: avatarFromUpload ?? avatarUrl ?? null,
            };

            const res = await updateUserProfile(payload);
            setProfile(res.user);
            // update global auth user so Header updates
            setUser(res.user);

            setMessage('Profile saved');
            setTimeout(() => setMessage(null), 2000);
        } catch (err) {
            console.error('save profile failed', err);
            setError(err instanceof Error ? err.message : 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    }

    if (!profile) {
        return <div className="card">Loading profile…</div>;
    }

    return (
        <div className="card max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">My Profile</h2>

            <form onSubmit={handleSave} className="space-y-4">
                {/* Avatar */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400">No Avatar</span>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="inline-flex items-center px-3 py-1 bg-white border rounded cursor-pointer text-sm">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span>Choose file</span>
                            </label>

                            {avatarUrl && (
                                <button
                                    type="button"
                                    onClick={handleDeleteAvatar}
                                    className="text-sm text-red-600 hover:underline"
                                >
                                    Remove avatar
                                </button>
                            )}

                            {avatarFile && (
                                <div className="text-sm text-gray-600">
                                    <span>{avatarFile.name}</span>
                                </div>
                            )}

                            {uploadingAvatar && <div className="text-sm text-gray-500">Uploading avatar…</div>}
                        </div>
                    </div>
                </div>

                {/* Basic info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Short bio shown on your public profile.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Are You born Again</label>
                    <select
                        defaultValue={profile.is_born_again ? 'yes' : 'no'}
                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm bg-gray-100 cursor-not-allowed"
                    >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                    {/* this will be implemented in the future */}
                    {/* <p className="text-xs text-gray-500 mt-1">This field is set by admins based on your profile and activity.</p> */}
                </div>

                {/* Socials */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Socials</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <input
                                placeholder="Twitter handle or url"
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
                            />
                        </div>
                        <div>
                            <input
                                placeholder="Facebook"
                                value={facebook}
                                onChange={(e) => setFacebook(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
                            />
                        </div>
                        <div>
                            <input
                                placeholder="Website"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                        {saving ? 'Saving…' : 'Save profile'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            // reset form to last saved profile
                            setName(profile.name ?? '');
                            setBio(profile.bio ?? '');
                            setTwitter(profile.socials?.twitter ?? '');
                            setFacebook(profile.socials?.facebook ?? '');
                            setWebsite(profile.socials?.website ?? '');
                            setAvatarFile(null);
                            setPreviewUrl(null);
                            setMessage(null);
                            setError(null);
                        }}
                        className="text-sm text-gray-600"
                    >
                        Reset
                    </button>
                </div>

                {/* Feedback */}
                {message && <div className="text-sm text-green-600">{message}</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
            </form>
        </div>
    );
}