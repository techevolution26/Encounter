// components/QuotesEditor.tsx
'use client';
import React, { useEffect, useState } from 'react';
import type { Quote } from '../types';
import { listMyQuotes, addMyQuote, deleteMyQuote } from '../lib/api';

export default function QuotesEditor() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [text, setText] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const q = await listMyQuotes();
                setQuotes(q);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function add() {
        if (!text.trim()) return;
        const r = await addMyQuote({ text, source: '' });
        setQuotes((s) => [r.quote, ...s]);
        setText('');
    }

    async function remove(id: string) {
        await deleteMyQuote(id);
        setQuotes((s) => s.filter((q) => q.id !== id));
    }

    if (loading) return <div>Loading quotes…</div>;

    return (
        <section>
            <h3>Quotes</h3>
            <div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}></textarea>
                <div>
                    <button onClick={add}>Add</button>
                </div>
            </div>

            <ul>
                {quotes.map((q) => (
                    <li key={q.id}>
                        <div>{q.text}</div>
                        <small>{q.source}</small>
                        <div><button onClick={() => remove(q.id)}>Delete</button></div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
