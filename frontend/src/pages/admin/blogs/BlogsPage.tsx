import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, Globe, EyeOff,
  FileText, ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/config';

// ── Types ──────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author_name: string;
  author_avatar: string;
  read_time: string;
  image_url: string;
  date: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  author_name: string;
  read_time: string;
  image_url: string;
  date: string;
  published: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function todayDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function emptyForm(): FormState {
  return {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '',
    tags: '',
    author_name: 'BuyRealViews Team',
    read_time: '5 min read',
    image_url: '',
    date: todayDisplay(),
    published: true,
  };
}

function postToForm(post: BlogPost): FormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    tags: post.tags.join(', '),
    author_name: post.author_name,
    read_time: post.read_time,
    image_url: post.image_url,
    date: post.date,
    published: post.published,
  };
}

// ── Blog Form Panel ────────────────────────────────────────────────────────────

interface FormPanelProps {
  editing: BlogPost | null;
  onClose: () => void;
  onSaved: (post: BlogPost) => void;
}

function FormPanel({ editing, onClose, onSaved }: FormPanelProps) {
  const [form, setForm] = useState<FormState>(editing ? postToForm(editing) : emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugManual, setSlugManual] = useState(!!editing);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && !slugManual) {
        next.slug = generateSlug(value as string);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;
    setLoading(true);
    setError('');
    const payload = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      let res: { data: BlogPost };
      if (editing) {
        res = await api.patch<BlogPost>(`${API_ENDPOINTS.ADMIN_BLOGS}/${editing.id}`, payload);
      } else {
        res = await api.post<BlogPost>(API_ENDPOINTS.ADMIN_BLOGS, payload);
      }
      onSaved(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{editing ? 'Edit Post' : 'New Blog Post'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="Post title"
                className={inputCls}
                required
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Slug *</label>
              <input
                value={form.slug}
                onChange={e => { setSlugManual(true); setField('slug', e.target.value); }}
                placeholder="post-slug-url"
                className={inputCls + ' font-mono'}
                required
              />
              <p className="text-xs text-gray-400 mt-0.5">Auto-generated from title. Edit to customise.</p>
            </div>

            <div>
              <label className={labelCls}>Category *</label>
              <input
                value={form.category}
                onChange={e => setField('category', e.target.value)}
                placeholder="e.g. YouTube Growth"
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Date</label>
              <input
                value={form.date}
                onChange={e => setField('date', e.target.value)}
                placeholder="Jun 9, 2026"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Author</label>
              <input
                value={form.author_name}
                onChange={e => setField('author_name', e.target.value)}
                placeholder="BuyRealViews Team"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Read Time</label>
              <input
                value={form.read_time}
                onChange={e => setField('read_time', e.target.value)}
                placeholder="5 min read"
                className={inputCls}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Image URL</label>
              <input
                value={form.image_url}
                onChange={e => setField('image_url', e.target.value)}
                placeholder="https://... or /assets/..."
                className={inputCls}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Tags (comma separated)</label>
              <input
                value={form.tags}
                onChange={e => setField('tags', e.target.value)}
                placeholder="youtube, views, growth"
                className={inputCls}
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Excerpt *</label>
              <textarea
                value={form.excerpt}
                onChange={e => setField('excerpt', e.target.value)}
                placeholder="Short description shown in the blog list..."
                rows={3}
                className={inputCls + ' resize-none'}
                required
              />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Content *</label>
              <p className="text-xs text-gray-400 mb-1">Supports ## headings, ### sub-headings, - bullet lists, plain paragraphs.</p>
              <textarea
                value={form.content}
                onChange={e => setField('content', e.target.value)}
                placeholder="## Introduction&#10;&#10;Write your blog content here..."
                rows={20}
                className={inputCls + ' resize-y font-mono text-xs'}
                required
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                checked={form.published}
                onChange={e => setField('published', e.target.checked)}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="published" className="text-sm text-gray-700 cursor-pointer">
                Published (visible on the public blog)
              </label>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={loading || !form.title.trim() || !form.slug.trim()}
            className="px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {editing ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  post: BlogPost;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

function DeleteConfirm({ post, onClose, onDeleted }: DeleteConfirmProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`${API_ENDPOINTS.ADMIN_BLOGS}/${post.id}`);
      onDeleted(post.id);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Delete Post</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-medium text-gray-800">"{post.title}"</span>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const BlogsPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ posts: BlogPost[]; total: number }>(API_ENDPOINTS.ADMIN_BLOGS, {
        params: { page, page_size: PAGE_SIZE },
      });
      setPosts(res.data.posts);
      setTotal(res.data.total);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function handleSaved(post: BlogPost) {
    setPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = post;
        return next;
      }
      return [post, ...prev];
    });
    if (!editingPost) setTotal(t => t + 1);
    setShowForm(false);
    setEditingPost(null);
  }

  function handleDeleted(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id));
    setTotal(t => t - 1);
    setDeletingPost(null);
  }

  function openNew() { setEditingPost(null); setShowForm(true); }
  function openEdit(post: BlogPost) { setEditingPost(post); setShowForm(true); }

  const published = posts.filter(p => p.published).length;
  const drafts = posts.length - published;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total · {published} published · {drafts} drafts</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Category</th>
              <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </td></tr>
            ) : posts.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No blog posts yet. Create your first one.</p>
              </td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-xs">{post.title}</p>
                      <p className="text-xs text-gray-400 font-mono truncate max-w-xs">{post.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                    {post.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{post.date}</td>
                <td className="px-4 py-3">
                  {post.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                      <Globe className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
                      <EyeOff className="w-3 h-3" /> Draft
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/blogs/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      title="View post"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEdit(post)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPost(post)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-gray-400 text-sm">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Panel */}
      {showForm && (
        <FormPanel
          editing={editingPost}
          onClose={() => { setShowForm(false); setEditingPost(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      {deletingPost && (
        <DeleteConfirm
          post={deletingPost}
          onClose={() => setDeletingPost(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
};

export default BlogsPage;
