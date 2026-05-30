import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Upload, Send, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API from '../services/api';

const SearchAndJoinHOA = () => {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHOA, setSelectedHOA] = useState(null);
    const [passCode, setPassCode] = useState('');
    const [unitNo, setUnitNo] = useState('');
    const [idProof, setIdProof] = useState(null);
    const [addressProof, setAddressProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // 1. Fetch Communities Logic
    useEffect(() => {
        const fetchHOAs = async () => {
            try {
                setApiError('');
                const token = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const res = await API.get('/community');
                
                const data = Array.isArray(res.data) ? res.data : (res.data.communities || []);
                setCommunities(data);
            } catch (err) {
                console.error("🚨 Full Axios Error Object:", err);
                if (err.response) {
                    setApiError(`Backend Error: ${err.response.data?.detail || err.response.statusText}`);
                } else if (err.request) {
                    setApiError("Cannot connect to Backend Server! Check if Uvicorn is running on port 9999.");
                } else {
                    setApiError(`Request Setup Error: ${err.message}`);
                }
            }
        };
        fetchHOAs();
    }, [navigate]);

    const filteredHOAs = communities.filter(hoa => 
        hoa.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Submit Request
    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idProof || !addressProof) {
        alert("Please upload both Identity and Address proofs.");
        return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('community_id', selectedHOA.community_id);
    formData.append('pass_code', passCode);
    formData.append('unit_no', unitNo);
    formData.append('id_proof', idProof);
    formData.append('address_proof', addressProof);

    try {
        const res = await API.post('/community/join-request', formData, {
            headers: { 
                'Content-Type': 'multipart/form-data'
            }
        });
        
        alert("✅ " + (res.data.message || "Request submitted successfully!"));
        
        // 🔥 FIXED THE TYPO HERE:
        setPassCode('');
        setUnitNo('');
        setIdProof(null);
        setAddressProof(null); // <-- Yeh pehle addressProof(null) tha, ab setAddressProof kar diya
        setSelectedHOA(null);

        // Ab user perfectly automatic Is screen par navigate kar jayega
        navigate('/waiting-approval');

    } catch (err) {
        console.error("Submission Error:", err);
        if (err.response?.status === 401) {
            alert("Session expired. Please login again.");
            navigate('/login');
        } else {
            alert("❌ " + (err.response?.data?.detail || "Submission failed. Please try again."));
        }
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0D1B2A] text-slate-900 dark:text-white p-8 flex flex-col items-center font-sans">
            <div className="max-w-2xl w-full">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-slate-900 dark:text-white">
                    <ShieldCheck className="text-teal-600 dark:text-teal-400" size={32} />
                    Join Your Community
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm tracking-wide">Resident Registration & Verification</p>

                {apiError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-mono">
                        <span className="font-bold text-red-500 block mb-1">⚠️ Connection Issue:</span>
                        {apiError}
                    </div>
                )}

                {!selectedHOA ? (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xl">
                        <label className="block text-sm font-medium mb-4 text-slate-700 dark:text-slate-300">Search your HOA / Building Name</label>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-500" size={20} />
                            <input 
                                type="text"
                                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
                                placeholder="Start typing name..."
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredHOAs.length === 0 ? (
                                <p className="text-xs text-slate-500 p-3 text-center">
                                    {apiError ? "Failed to load due to URL mismatch or configuration issue." : "No matching communities found."}
                                </p>
                            ) : (
                                filteredHOAs.map(hoa => (
                                    <div 
                                        key={hoa.community_id}
                                        onClick={() => setSelectedHOA(hoa)}
                                        className="p-3.5 bg-slate-50 dark:bg-white/5 rounded-xl hover:bg-teal-500/10 cursor-pointer border border-slate-200 dark:border-transparent hover:border-teal-500/30 transition-all flex justify-between items-center text-sm"
                                    >
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{hoa.name}</span> 
                                        <span className="text-xs font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">Zip: {hoa.address?.zip_code || hoa.zip_code || 'N/A'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-[#1E2E42] dark:to-[#162535] p-6 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-6 shadow-xl text-slate-900 dark:text-white">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/10 pb-4">
                            <h2 className="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight">{selectedHOA.name}</h2>
                            <button type="button" onClick={() => setSelectedHOA(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors">Change</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">HOA Pass Code</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
                                    placeholder="Enter code provided by Board"
                                    value={passCode}
                                    onChange={(e) => setPassCode(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Unit / Apartment Number</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500"
                                    placeholder="e.g. Unit 4B, Apt 102"
                                    value={unitNo}
                                    onChange={(e) => setUnitNo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Identity Proof (ID Card)</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-5 text-center hover:border-teal-500 bg-slate-50 dark:bg-[#0D1B2A]/50 cursor-pointer transition-all relative group">
                                    <Upload className="mx-auto text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors" size={24} />
                                    <span className="text-xs block text-slate-500 dark:text-slate-400 truncate max-w-full px-2">
                                        {idProof ? idProof.name : "Click to upload ID"}
                                    </span>
                                    <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setIdProof(e.target.files[0])} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Address Proof</label>
                                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-5 text-center hover:border-teal-500 bg-slate-50 dark:bg-[#0D1B2A]/50 cursor-pointer transition-all relative group">
                                    <Upload className="mx-auto text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-2 transition-colors" size={24} />
                                    <span className="text-xs block text-slate-500 dark:text-slate-400 truncate max-w-full px-2">
                                        {addressProof ? addressProof.name : "Click to upload Proof"}
                                    </span>
                                    <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setAddressProof(e.target.files[0])} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex gap-3 items-start">
                            <Info className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-700 dark:text-amber-200/80 leading-relaxed">
                                <span className="font-bold text-amber-600 dark:text-amber-400">Document Rule:</span> Your request will be securely processed and reviewed by the HOA Board members. Platform access features will unlock immediately upon live verification.
                            </p>
                        </div>

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 text-sm"
                        >
                            {loading ? "Submitting..." : <><Send size={16} /> Submit Join Request</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SearchAndJoinHOA;