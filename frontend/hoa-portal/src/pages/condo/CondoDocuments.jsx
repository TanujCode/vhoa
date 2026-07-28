import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { 
  RefreshCw, Search, Plus, Trash2, Download, FileText, ChevronDown, 
  LayoutGrid, List, FileSpreadsheet, BookOpen, FileCheck, HelpCircle, User, Calendar
} from 'lucide-react';
import API, { getBaseUrl } from '../../services/api';

export default function CondoDocuments({ community, user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload Form state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('CC&R');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const role = (user?.role_name || user?.role || '').toLowerCase();
  const canManage = ['super_admin', 'property_manager', 'board_member'].includes(role);
  const commId = community?.community_id;

  const docTypes = ["CC&R", "BYLAWS", "RULES", "BUDGET", "MEETING_MINUTES", "OTHER"];

  useEffect(() => {
    if (commId) {
      fetchDocuments();
    }
  }, [commId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await API.get(`/condo/operations/documents?community_id=${commId}`);
      setDocuments(res.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!docName.trim()) return setErrorMsg('Document name is required');
    if (!file) return setErrorMsg('Please select a file');
    if (file.size > 10 * 1024 * 1024) return setErrorMsg('File size must be less than 10MB');

    try {
      setUploading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const formData = new FormData();
      formData.append('community_id', commId);
      formData.append('document_name', docName.trim());
      formData.append('document_type', docType);
      formData.append('file', file);

      await API.post('/condo/operations/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMsg("Document uploaded successfully!");
      setDocName('');
      setFile(null);
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await API.delete(`/condo/operations/documents/${docId}`);
      setSuccessMsg("Document deleted successfully");
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to delete document.");
    }
  };

  // Helper to get matching category icon
  const getFileIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'CC&R':
        return <BookOpen className="text-violet-500" size={24} />;
      case 'BYLAWS':
        return <FileCheck className="text-indigo-500" size={24} />;
      case 'RULES':
        return <BookOpen className="text-blue-500" size={24} />;
      case 'BUDGET':
        return <FileSpreadsheet className="text-emerald-500" size={24} />;
      case 'MEETING_MINUTES':
        return <Calendar className="text-amber-500" size={24} />;
      default:
        return <FileText className="text-slate-400 dark:text-slate-300" size={24} />;
    }
  };

  // Filter logic
  const filteredDocs = documents.filter(d => {
    const matchesSearch = 
      d.document_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.document_type?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      activeCategory === 'ALL' || d.document_type?.toUpperCase() === activeCategory.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-white font-sans p-2 animate-fade-in-up">
      

      {/* System alert messages */}
      {(errorMsg || successMsg) && (
        <div className="space-y-2 animate-fade-in-scale">
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-455 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Search and Filters Hub */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50/50 dark:bg-[#1E2E42]/20 p-4 rounded-2xl border border-slate-200/60 dark:border-white/5">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search documents..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E2E42] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-all shadow-xs"
            />
          </div>

          {/* Categories Carousel / List */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1 scrollbar-none">
            {['ALL', ...docTypes].map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-650 text-white shadow-xs shadow-indigo-650/15'
                      : 'bg-white dark:bg-[#1E2E42]/40 text-slate-500 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-[#1E2E42]/80 border border-slate-200/60 dark:border-white/5'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode & Upload Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 dark:bg-[#1E2E42] p-1 rounded-xl border border-slate-200 dark:border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white dark:bg-[#162535] text-indigo-500 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white dark:bg-[#162535] text-indigo-500 shadow-xs' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
            >
              <List size={15} />
            </button>
          </div>

          {canManage && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} /> Upload Document
            </button>
          )}
        </div>
      </div>

      {/* Grid or List Displays */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-indigo-500 mb-3" />
          <span className="text-xs text-slate-450 font-mono">LOADING DIGITAL VAULT...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-[#162535] rounded-3xl border border-dashed border-slate-200 dark:border-white/10 text-slate-450 flex flex-col items-center justify-center p-6 animate-fade-in-scale">
          <FileText size={40} className="stroke-[1.5] mb-3 text-slate-350 dark:text-slate-600" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No community documents found.</p>
          <p className="text-xs mt-1">Files uploaded by property managers or board directors will appear here.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc, idx) => (
            <div 
              key={doc.document_id}
              className="premium-card p-5 rounded-3xl flex flex-col justify-between min-h-[170px] border border-slate-200/80 dark:border-white/10 relative overflow-hidden animate-fade-in-scale"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-white/5">
                  {getFileIcon(doc.document_type)}
                </div>
                
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                  ID-{doc.document_id}
                </span>
              </div>

              <div className="my-4">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {doc.document_name}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                  {doc.document_type?.replace('_', ' ')}
                </p>
              </div>

              {/* Bottom Actions Row */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <a 
                  href={getBaseUrl(doc.document_url)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 hover:bg-indigo-500 hover:text-white dark:hover:bg-[#1D68DF] text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Download size={11} /> Download File
                </a>
                
                {canManage && (
                  <button 
                    onClick={() => handleDelete(doc.document_id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 rounded-xl transition cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#162535] rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-gray-400 text-[10px] font-extrabold uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                  <th className="px-6 py-4">Document Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Uploaded By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-white/5 text-xs">
                {filteredDocs.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-slate-50/40 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <span className="truncate max-w-xs">{doc.document_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                        {doc.document_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-450 dark:text-gray-400 font-medium">
                      Property Manager
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <a 
                          href={getBaseUrl(doc.document_url)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2 bg-slate-50 hover:bg-[#F0F7FF] text-slate-700 hover:text-[#1D68DF] dark:bg-slate-900/60 dark:hover:bg-[#1E2E42] dark:text-slate-300 rounded-xl transition border border-slate-200/50 dark:border-white/5 cursor-pointer"
                        >
                          <Download size={13} />
                        </a>
                        {canManage && (
                          <button 
                            onClick={() => handleDelete(doc.document_id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 rounded-xl transition cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal (Glassmorphism overlay) */}
      {showUploadModal && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E2E42] rounded-3xl border border-slate-200 dark:border-white/10 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-[#162535]">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📂</span> Upload Community File
              </h3>
              <button 
                onClick={() => { setShowUploadModal(false); setErrorMsg(''); }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-semibold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Document Title <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Building Fire Safety Code"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select 
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/20 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    {docTypes.map(t => (
                      <option key={t} value={t} className="text-slate-900 dark:text-white">{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2">Select File Attachment <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-white/5 transition relative cursor-pointer group bg-slate-50 dark:bg-[#0D1B2A]">
                  <input 
                    type="file"
                    required
                    onChange={e => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-2">
                    <FileText className="mx-auto text-slate-400 group-hover:text-indigo-500 transition mb-2" size={32} />
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {file ? file.name : "Click to select file"}
                    </p>
                    <p className="text-xs text-slate-450">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Support PDF, DOCX, JPEG, PNG, Excel"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-slate-200 dark:border-white/10 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setShowUploadModal(false); setErrorMsg(''); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-md"
                >
                  {uploading ? "Uploading..." : "Publish Document"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
