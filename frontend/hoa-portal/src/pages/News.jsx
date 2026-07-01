import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, X, Pin, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../services/api';

// ── Category Badge ────────────────────────────
const CategoryBadge = ({ category }) => {
  const map = {
    GENERAL:     'bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400',
    MEETING:     'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    MAINTENANCE: 'bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
    EMERGENCY:   'bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400',
    EVENT:       'bg-purple-50 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[category] || 'bg-slate-100 text-slate-600 dark:bg-gray-500/20 dark:text-gray-400'}`}>
      {category}
    </span>
  );
};

// ── Add News Modal ────────────────────────────
const NewsModal = ({ communityId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'GENERAL', is_pinned: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/news', { ...form, community_id: communityId });
      onSuccess(); onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error posting news');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Post News / Update</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Title</label>
            <input required type="text" placeholder="News title..." value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Content</label>
            <textarea required rows={5} placeholder="Write your announcement..." value={form.content}
              onChange={e => setForm({...form, content: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Category</label>
              <select 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-teal-500"
              >
                {['GENERAL','MEETING','MAINTENANCE','EMERGENCY','EVENT'].map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-[#0D1B2A] text-slate-900 dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_pinned}
                  onChange={e => setForm({...form, is_pinned: e.target.checked})}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-teal-500" />
                <span className="text-sm text-slate-600 dark:text-gray-300">📌 Pin this post</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium text-slate-700 dark:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Posting...' : 'Post News'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Add FAQ Modal ─────────────────────────────
const FAQModal = ({ communityId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ question: '', answer: '', doc_url: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/faq', { ...form, community_id: communityId, doc_url: form.doc_url || null });
      onSuccess(); onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error adding FAQ');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add FAQ</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Question</label>
            <input required type="text" placeholder="Enter question..." value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Answer</label>
            <textarea required rows={4} placeholder="Enter answer..." value={form.answer}
              onChange={e => setForm({...form, answer: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">Document Link (optional)</label>
            <input type="url" placeholder="https://..." value={form.doc_url}
              onChange={e => setForm({...form, doc_url: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium text-slate-700 dark:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Adding...' : 'Add FAQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────
const News = ({ community, user }) => {
  const [activeTab, setActiveTab]   = useState('news');
  const [news, setNews]             = useState([]);
  const [faqs, setFaqs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showFaqModal, setShowFaqModal]   = useState(false);
  const [expandedFaq, setExpandedFaq]     = useState(null);
  const [faqPage, setFaqPage]       = useState(1);
  const [faqTotal, setFaqTotal]     = useState({ pages: 1, total: 0 });
  const [categoryFilter, setCategoryFilter] = useState('');

  const role    = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  useEffect(() => {
    if (community?.community_id) {
      activeTab === 'news' ? fetchNews() : fetchFaqs();
    }
  }, [community, activeTab, faqPage, categoryFilter]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const url = categoryFilter
        ? `/news/${community.community_id}?category=${categoryFilter}&limit=20`
        : `/news/${community.community_id}?limit=20`;
      const res = await API.get(url);
      setNews(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/faq/${community.community_id}?page=${faqPage}&per_page=10`);
      setFaqs(res.data.items || []);
      setFaqTotal({ pages: res.data.pages, total: res.data.total });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDeleteNews = async (newsId) => {
    if (!window.confirm('Delete this news post?')) return;
    try {
      await API.delete(`/news/${newsId}`);
      fetchNews();
    } catch (err) { alert('Error deleting news'); }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const categories = ['', 'GENERAL', 'MEETING', 'MAINTENANCE', 'EMERGENCY', 'EVENT'];

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">News & FAQ</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community?.name}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={() => setShowFaqModal(true)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-2xl text-sm font-semibold text-slate-700 dark:text-white transition flex items-center gap-2">
              <Plus size={15} /> Add FAQ
            </button>
            <button onClick={() => setShowNewsModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-blue-500/25">
              <Plus size={15} /> Post News
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['news', 'faq'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${
              activeTab === tab ? 'bg-blue-600 hover:bg-blue-700 text-white hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20'
            }`}>
            {tab === 'news' ? '📢 News & Updates' : '❓ FAQs'}
          </button>
        ))}
      </div>

      {/* ── NEWS TAB ── */}
      {activeTab === 'news' && (
        <div>
          {/* Category filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${
                  categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20'
                }`}>
                {c || 'All'}
              </button>
            ))}
          </div>

          {loading && news.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">📢 No news posts yet.</div>
          ) : (
            <div className="space-y-4">
              {news.map(n => (
                <div key={n.news_id} className={`bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border rounded-3xl p-6 shadow-sm ${
                  n.is_pinned ? 'border-blue-500/40' : 'border-slate-200/80 dark:border-white/10'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {n.is_pinned && <span className="text-blue-600 dark:text-blue-400 text-xs flex items-center gap-1 font-semibold"><Pin size={11} /> Pinned</span>}
                        <CategoryBadge category={n.category} />
                        <span className="text-xs text-slate-400 dark:text-gray-500">{formatDate(n.created_date)}</span>
                        {n.created_by_name && <span className="text-xs text-slate-400 dark:text-gray-500">by {n.created_by_name}</span>}
                      </div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{n.title}</h3>
                      <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-line">{n.content}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDeleteNews(n.news_id)}
                        className="text-slate-400 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition flex-shrink-0">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── FAQ TAB ── */}
      {activeTab === 'faq' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-500 dark:text-gray-400 text-sm">{faqTotal.total} FAQs total</p>
          </div>

          {loading && faqs.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-20 text-slate-500 dark:text-gray-400">❓ No FAQs yet.</div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={faq.faq_id} className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.faq_id ? null : faq.faq_id)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600 dark:text-blue-400 font-mono text-sm font-bold w-6">{((faqPage - 1) * 10) + i + 1}.</span>
                      <span className="font-medium text-slate-800 dark:text-white">{faq.question}</span>
                    </div>
                    <span className={`text-slate-400 transition-transform ${expandedFaq === faq.faq_id ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {expandedFaq === faq.faq_id && (
                    <div className="px-6 pb-6 border-t border-slate-100 dark:border-white/10 pt-4">
                      <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                      {faq.doc_url && (
                        <a href={faq.doc_url} target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm hover:underline">
                          📄 View Document →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination — max 10 per page */}
          {faqTotal.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setFaqPage(p => Math.max(1, p - 1))} disabled={faqPage === 1}
                className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/20 transition text-slate-700 dark:text-white">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-slate-500 dark:text-gray-400">Page {faqPage} of {faqTotal.pages}</span>
              <button onClick={() => setFaqPage(p => Math.min(faqTotal.pages, p + 1))} disabled={faqPage === faqTotal.pages}
                className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-white/20 transition text-slate-700 dark:text-white">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {showNewsModal && <NewsModal communityId={community?.community_id} onClose={() => setShowNewsModal(false)} onSuccess={fetchNews} />}
      {showFaqModal && <FAQModal communityId={community?.community_id} onClose={() => setShowFaqModal(false)} onSuccess={fetchFaqs} />}
    </div>
  );
};

export default News;