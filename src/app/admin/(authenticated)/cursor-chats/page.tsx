'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';

interface ChatItem {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

export default function AdminCursorChatsPage() {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cursor-chats');
      const data = await res.json();
      if (data.success) setChats(data.chats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const upload = async () => {
    if (!title || !content) return;
    setUploading(true);
    try {
      const res = await fetch('/api/admin/cursor-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, filename, content, metadata: { enabled: true } })
      });
      const data = await res.json();
      if (data.success) {
        setTitle('');
        setFilename('');
        setContent('');
        await load();
      }
    } finally {
      setUploading(false);
    }
  };

  const toggle = async (id: string) => {
    await fetch(`/api/admin/cursor-chats/${id}/toggle`, { method: 'POST' });
    await load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/admin/cursor-chats/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Cursor Chats</h1>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-8">
          <h2 className="text-lg text-white mb-3">Upload New Chat</h2>
          <div className="grid gap-3">
            <input className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Filename (optional)" value={filename} onChange={e => setFilename(e.target.value)} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                const text = await file.text();
                setContent(text);
                if (!title) setTitle(file.name.replace(/\.md$/i,'').replace(/[_-]+/g,' ').trim());
                if (!filename) setFilename(file.name);
              }}
              className="bg-gray-700 border-2 border-dashed border-gray-600 rounded px-3 py-6 text-gray-300 text-sm text-center cursor-pointer"
              onClick={async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.md,text/markdown,text/plain';
                input.onchange = async () => {
                  const file = (input.files && input.files[0]) as File | undefined;
                  if (!file) return;
                  const text = await file.text();
                  setContent(text);
                  if (!title) setTitle(file.name.replace(/\.md$/i,'').replace(/[_-]+/g,' ').trim());
                  if (!filename) setFilename(file.name);
                };
                input.click();
              }}
            >
              Click to upload or drag & drop your exported chat (.md)
            </div>
            <textarea className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white h-48" placeholder="Or paste chat markdown here..." value={content} onChange={e => setContent(e.target.value)} />
            <div>
              <Button onClick={upload} disabled={uploading || !title || !content}> {uploading ? 'Uploading...' : 'Upload Chat'} </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-4 border-b border-gray-700 text-white font-semibold">Chats</div>
          {loading ? (
            <div className="p-4 text-gray-400">Loading...</div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-gray-400">No chats found.</div>
          ) : (
            <div className="divide-y divide-gray-700">
              {chats.map(c => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{c.title}</div>
                    <div className="text-xs text-gray-400">{c.filename} • {(c.fileSize || 0).toLocaleString()} chars • Updated {(new Date(c.updatedAt)).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggle(c.id)} className={`px-3 py-1 rounded text-sm ${c.enabled ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>{c.enabled ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => remove(c.id)} className="px-3 py-1 rounded text-sm bg-red-600 text-white">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


