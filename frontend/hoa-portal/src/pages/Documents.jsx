import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Plus, Trash2, Download, FileText, Folder, File, ShieldAlert } from 'lucide-react';
import API, { getBaseUrl } from '../services/api';

const DocumentModal = ({ communityId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    document_name: '',
    document_type: 'CC&R'
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const docTypes = ["CC&R", "BYLAWS", "RULES", "BUDGET", "MEETING_MINUTES", "OTHER"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.document_name.trim()) return setErrorMsg('Document name is required');
    if (!file) return setErrorMsg('Please select a file to upload');

    try {
      setLoading(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('document_name', form.document_name.trim());
      formData.append('document_type', form.document_type);
      formData.append('file', file);

      await API.post(`/community/${communityId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Error uploading document. Only PDF, DOC, Images are allowed (Max 10MB).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus size={18} className="text-teal-500" /> Upload HOA Document
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-655 dark:hover:text-white font-semibold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Document Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Community Rules 2026"
              value={form.document_name}
              onChange={e => setForm({ ...form, document_name: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Document Type *</label>
            <select
              value={form.document_type}
              onChange={e => setForm({ ...form, document_type: e.target.value })}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              {docTypes.map(type => (
                <option key={type} value={type}>{type.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select File *</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition relative cursor-pointer group">
              <input
                type="file"
                required
                onChange={e => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <FileText className="mx-auto text-slate-400 group-hover:text-teal-500 transition mb-2" size={32} />
              <p className="text-sm text-slate-600 dark:text-gray-300 font-medium">
                {file ? file.name : "Drag & drop or click to choose"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Allowed: PDF, DOC, DOCX, Images (Max 10MB)</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white text-slate-600 dark:text-gray-300 rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-505 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Documents = ({ community, user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const role = user?.role_name || user?.role || 'resident';
  const isManagement = ['super_admin', 'property_manager', 'board_member'].includes(role);

  const docTypes = ["ALL", "CC&R", "BYLAWS", "RULES", "BUDGET", "MEETING_MINUTES", "OTHER"];

  useEffect(() => {
    if (community?.community_id) {
      fetchDocuments();
    }
  }, [community]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/community/${community.community_id}/documents`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Documents fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await API.delete(`/community/documents/${docId}`);
      fetchDocuments();
    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDocTypeIcon = (type) => {
    switch (type) {
      case 'CC&R': return '📜';
      case 'BYLAWS': return '⚖️';
      case 'RULES': return '📋';
      case 'BUDGET': return '💰';
      case 'MEETING_MINUTES': return '📝';
      default: return '📁';
    }
  };

  const filteredDocs = documents.filter(doc => {
    const q = search.toLowerCase();
    const matchesSearch = !search || doc.document_name.toLowerCase().includes(q);
    const matchesType = typeFilter === 'ALL' || doc.document_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">HOA Documents</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community?.name || 'Community Portal'}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchDocuments}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl transition flex items-center justify-center disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {isManagement && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-teal-500/25"
            >
              <Plus size={15} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 custom-scrollbar scrollbar-thin">
        {docTypes.map(type => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium transition whitespace-nowrap ${
              typeFilter === type
                ? 'bg-teal-600 hover:bg-teal-700 text-white hover:text-white shadow-md shadow-teal-500/10'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400 dark:hover:bg-white/20'
            }`}
          >
            {type === 'ALL' ? '📂 All Documents' : `${getDocTypeIcon(type)} ${type.replace('_', ' ')}`}
          </button>
        ))}
      </div>

      {/* Search Filter */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-[#162535] border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* Documents Layout */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Folder size={18} className="text-teal-500" /> Document Repository
          </h2>
          <span className="text-xs font-mono bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-xl font-bold">
            {filteredDocs.length} Documents
          </span>
        </div>

        {loading && documents.length === 0 ? (
          <div className="p-20 text-center text-slate-500 dark:text-gray-400">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading repository files...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-20 text-center text-slate-500 dark:text-gray-400">
            <ShieldAlert size={36} className="mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="text-base font-medium">No documents found</p>
            <p className="text-xs text-slate-400 mt-1">There are no uploaded documents in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left p-5">Name</th>
                  <th className="text-left p-5">Category</th>
                  <th className="text-left p-5">Uploaded Date</th>
                  <th className="text-right p-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map(doc => (
                  <tr key={doc.document_id} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-all">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center text-lg font-bold">
                          📄
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{doc.document_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{doc.document_url.split('/').pop()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 rounded-full text-xs font-semibold uppercase tracking-wider">
                        {getDocTypeIcon(doc.document_type)} {doc.document_type}
                      </span>
                    </td>
                    <td className="p-5 text-slate-500 dark:text-gray-400 text-xs">
                      {formatDate(doc.created_date)}
                    </td>
                    <td className="p-5">
                      <div className="flex justify-end gap-2">
                        <a
                          href={getBaseUrl(doc.document_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-teal-500/10 hover:bg-teal-500/20 dark:bg-teal-500/20 dark:hover:bg-teal-500/30 text-teal-600 dark:text-teal-400 rounded-xl transition-all"
                          title="Download / View"
                        >
                          <Download size={16} />
                        </a>
                        {isManagement && (
                          <button
                            onClick={() => handleDelete(doc.document_id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 dark:bg-[#3B1C1C] dark:hover:bg-[#5C2323] text-red-655 dark:text-red-400 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentModal
          communityId={community?.community_id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
};

export default Documents;
