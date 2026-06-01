'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { categoryLabels, Category } from '@/lib/data';

interface EditorInitial {
  id: string;
  title: string;
  category: Category;
  excerpt: string;
  bodyMarkdown: string;
  images: string[];
  cardImage: string;
  heroImage: string;
  status: string;
  reviewNote?: string;
}

const categories = Object.entries(categoryLabels) as [Category, string][];

export default function ArticleEditor({ initial }: { initial: EditorInitial }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState<Category>(initial.category);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [body, setBody] = useState(initial.bodyMarkdown);
  const [images, setImages] = useState<string[]>(initial.images || []);
  const [cardImage, setCardImage] = useState(initial.cardImage);
  const [heroImage, setHeroImage] = useState(initial.heroImage);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const readOnly = initial.status === 'pending' || initial.status === 'published';

  function fields() {
    return { title, category, excerpt, bodyMarkdown: body, images, cardImage, heroImage };
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await fetch(`/api/articles/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields()),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setMessage('Saved.');
      return true;
    }
    setError(data.error || 'Could not save');
    return false;
  }

  async function submit() {
    if (!(await save())) return;
    setSaving(true);
    const res = await fetch(`/api/articles/${initial.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit' }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      router.push('/writer');
      router.refresh();
    } else {
      setError(data.error || 'Could not submit');
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok && data.url) {
      setImages((prev) => [...prev, data.url]);
      if (!cardImage) setCardImage(data.url);
      if (!heroImage) setHeroImage(data.url);
    } else {
      setError(data.error || 'Upload failed');
    }
  }

  function insertIntoBody(url: string) {
    const ta = bodyRef.current;
    const snippet = `\n\n![image](${url})\n\n`;
    if (!ta) {
      setBody((b) => b + snippet);
      return;
    }
    const start = ta.selectionStart;
    const next = body.slice(0, start) + snippet + body.slice(ta.selectionEnd);
    setBody(next);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333]">
          {readOnly ? 'View article' : 'Edit article'}
        </h1>
        <div className="flex items-center gap-3">
          {message && <span className="text-sm text-green-600">{message}</span>}
          {!readOnly && (
            <>
              <button
                onClick={save}
                disabled={saving}
                className="bg-white border border-gray-200 text-[#555] font-semibold rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save draft'}
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="bg-[#e2b26f] text-white font-semibold rounded-lg px-5 py-2 hover:bg-[#d6a45c] disabled:opacity-50"
              >
                Submit for review
              </button>
            </>
          )}
        </div>
      </div>

      {readOnly && (
        <p className="text-sm bg-amber-50 text-amber-700 rounded-lg p-3 mb-6">
          This article is {initial.status} and can&apos;t be edited
          {initial.status === 'pending' ? ' while it awaits review.' : '.'}
        </p>
      )}
      {initial.reviewNote && (
        <p className="text-sm bg-red-50 text-red-600 rounded-lg p-3 mb-6">
          Editor note: {initial.reviewNote}
        </p>
      )}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: form */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={readOnly}
              placeholder="A catchy headline"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={readOnly}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 disabled:bg-gray-50"
            >
              {categories.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">
              Excerpt <span className="text-[#ccc] normal-case">(shown on the card)</span>
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={readOnly}
              rows={3}
              placeholder="A one or two sentence teaser."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 disabled:bg-gray-50"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-2">Images</label>
            {!readOnly && (
              <label className="inline-block cursor-pointer bg-white border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-[#888] hover:border-[#e2b26f] hover:text-[#e2b26f]">
                {uploading ? 'Uploading…' : '+ Upload an image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) upload(f);
                    e.target.value = '';
                  }}
                />
              </label>
            )}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {images.map((url) => {
                  const isCard = url === cardImage;
                  const isHero = url === heroImage;
                  return (
                    <div key={url} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-24 object-cover" />
                      <div className="p-2 space-y-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCardImage(url)}
                            disabled={readOnly}
                            className={`flex-1 text-[10px] font-semibold rounded px-1 py-1 ${isCard ? 'bg-[#e2b26f] text-white' : 'bg-gray-100 text-[#666] hover:bg-gray-200'}`}
                          >
                            {isCard ? '✓ Card' : 'Card'}
                          </button>
                          <button
                            onClick={() => setHeroImage(url)}
                            disabled={readOnly}
                            className={`flex-1 text-[10px] font-semibold rounded px-1 py-1 ${isHero ? 'bg-[#e2b26f] text-white' : 'bg-gray-100 text-[#666] hover:bg-gray-200'}`}
                          >
                            {isHero ? '✓ Hero' : 'Hero'}
                          </button>
                        </div>
                        {!readOnly && (
                          <button
                            onClick={() => insertIntoBody(url)}
                            className="w-full text-[10px] font-semibold rounded px-1 py-1 bg-gray-100 text-[#666] hover:bg-gray-200"
                          >
                            Insert in text
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-[#bbb] mt-2">
              <b>Card</b> = thumbnail on listings. <b>Hero</b> = big image atop the article. Use “Insert in text” to place images in the body.
            </p>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-1">
              Body <span className="text-[#ccc] normal-case">(Markdown: ## heading, **bold**, - list)</span>
            </label>
            <textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={readOnly}
              rows={18}
              placeholder={'Write your article here.\n\n## A heading\n\nA paragraph of text...'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[#333] font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#e2b26f]/50 disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* Right: live preview */}
        <div className="lg:sticky lg:top-6 self-start">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#aaa] mb-2">Live preview</p>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroImage} alt="" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-sm text-[#bbb]">
                Hero image
              </div>
            )}
            <div className="p-6">
              <p className="text-[#e2b26f] text-[11px] font-bold uppercase tracking-widest mb-2">
                {categoryLabels[category]}
              </p>
              <h2 className="text-2xl font-bold text-[#333] mb-3">{title || 'Untitled'}</h2>
              {excerpt && <p className="text-[#555] text-lg font-medium mb-5">{excerpt}</p>}
              <div className="prose max-w-none text-[#444]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ src, alt }) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={typeof src === 'string' ? src : ''} alt={alt || ''} className="my-6 w-full rounded-lg" />
                    ),
                  }}
                >
                  {body || '_Start writing to see a preview._'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
