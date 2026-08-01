import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Upload, Send, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { validateUnitNo } from '../../utils/fieldValidators';
import ConfirmModal from '../../components/ConfirmModal';

const SearchAndJoinCondo = () => {
    const navigate = useNavigate();
    const [communities, setCommunities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHOA, setSelectedHOA] = useState(null);
    const [passCode, setPassCode] = useState('');
    const [unitNo, setUnitNo] = useState('');
    const [unitError, setUnitError] = useState('');
    const [idProof, setIdProof] = useState(null);
    const [addressProof, setAddressProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const [confirmConfig, setConfirmConfig] = useState({ 
        isOpen: false, 
        title: '', 
        message: '', 
        confirmText: 'OK', 
        cancelText: 'Cancel', 
        onConfirm: null, 
        onCancel: null, 
        type: 'info', 
        singleButton: false 
    });

    const showAlert = (title, message, type = 'info', onConfirm = null) => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            confirmText: 'OK',
            singleButton: true,
            type,
            onConfirm: () => {
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                if (onConfirm) onConfirm();
            }
        });
    };

    useEffect(() => {
        const checkStatusAndFetchHOAs = async () => {
            const storedUser = localStorage.getItem('condo_user') || sessionStorage.getItem('condo_user');
            if (storedUser) {
                try {
                    const u = JSON.parse(storedUser);
                    if (u.account_status === 'PENDING_APPROVAL') {
                        navigate('/condo/waiting-approval');
                        return;
                    }
                } catch (_) {}
            }

            try {
                setApiError('');
                const token = localStorage.getItem('condo_token') || sessionStorage.getItem('condo_token');
                if (!token) {
                    navigate('/condo/login');
                    return;
                }

                const meRes = await API.get('/condo/auth/me');
                if (meRes.data && meRes.data.account_status === 'PENDING_APPROVAL') {
                    localStorage.setItem('condo_user', JSON.stringify(meRes.data));
                    navigate('/condo/waiting-approval');
                    return;
                }

                const res = await API.get('/condo/community');
                const data = Array.isArray(res.data) ? res.data : (res.data.communities || []);
                setCommunities(data);
            } catch (err) {
                console.error("🚨 Condo Fetch Error:", err);
                if (err.response) {
                    setApiError(`Backend Error: ${err.response.data?.detail || err.response.statusText}`);
                } else if (err.request) {
                    setApiError("Cannot connect to Backend Server! Check if Uvicorn is running on port 9999.");
                } else {
                    setApiError(`Request Setup Error: ${err.message}`);
                }
            }
        };
        checkStatusAndFetchHOAs();
    }, [navigate]);

    const filteredHOAs = communities.filter(hoa => 
        hoa.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        const check = validateUnitNo(unitNo);
        if (check !== true) {
            setUnitError(check);
            showAlert("Validation Error", check, "warning");
            return;
        }
        if (!idProof || !addressProof) {
            showAlert("Required Documents", "Please upload both Identity and Address proofs.", "warning");
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
            const res = await API.post('/condo/community/join-request', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            showAlert("Success", res.data.message || "Request submitted successfully!", "success", () => {
                setPassCode('');
                setUnitNo('');
                setIdProof(null);
                setAddressProof(null);
                setSelectedHOA(null);
                navigate('/condo/waiting-approval');
            });

        } catch (err) {
            console.error("Submission Error:", err);
            if (err.response?.status === 401) {
                showAlert("Session Expired", "Session expired. Please login again.", "danger", () => {
                    navigate('/condo/login');
                });
            } else {
                showAlert("Submission Failed", err.response?.data?.detail || "Submission failed. Please try again.", "danger");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 flex flex-col items-center font-sans">
            <div className="max-w-2xl w-full">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3 text-slate-900">
                    <ShieldCheck className="text-blue-600" size={32} />
                    Join Your Condo Community
                </h1>
                <p className="text-slate-500 mb-8 text-sm tracking-wide">Resident Registration & Verification</p>

                {apiError && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-700 text-xs rounded-xl font-mono">
                        <span className="font-bold text-red-500 flex items-center gap-1 mb-1"><AlertTriangle size={14} /> Connection Issue:</span>
                        {apiError}
                    </div>
                )}

                {!selectedHOA ? (
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200 shadow-xl">
                        <label className="block text-sm font-medium mb-4 text-slate-700 font-bold">Search your Condo / Building Name</label>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input 
                                type="text"
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm text-slate-900 placeholder-slate-400"
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
                                        className="p-3.5 bg-white rounded-xl hover:bg-blue-500/10 cursor-pointer border border-slate-200 hover:border-blue-500/30 transition-all flex justify-between items-center text-sm"
                                    >
                                        <span className="font-medium text-slate-800">{hoa.name}</span> 
                                        <span className="text-xs font-mono text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">Zip: {hoa.zip_code || 'N/A'}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-gradient-to-br from-slate-50 to-blue-50 p-6 rounded-2xl border border-slate-200 space-y-6 shadow-xl text-slate-900">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                            <h2 className="text-xl font-bold text-blue-600 tracking-tight">{selectedHOA.name}</h2>
                            <button type="button" onClick={() => setSelectedHOA(null)} className="text-xs text-slate-500 hover:text-slate-950 underline transition-colors">Change</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 font-bold">Condo Pass Code</label>
                                <input 
                                    type="text"
                                    required
                                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 placeholder-slate-400"
                                    placeholder="Enter code provided by Condo Board"
                                    value={passCode}
                                    onChange={(e) => setPassCode(e.target.value)}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 font-bold">Unit / Apartment Number</label>
                                <input 
                                    type="text"
                                    required
                                    className={`w-full bg-white border rounded-xl py-2.5 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-900 placeholder-slate-400 ${unitError ? 'border-red-500' : 'border-slate-200'}`}
                                    placeholder="e.g. Unit 4B, Apt 102"
                                    value={unitNo}
                                    onKeyPress={(e) => {
                                        if (!/[A-Za-z0-9\s\-/#]/.test(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUnitNo(val);
                                        const err = validateUnitNo(val);
                                        if (err !== true) {
                                            setUnitError(err);
                                        } else {
                                            setUnitError('');
                                        }
                                    }}
                                />
                                {unitError && <p className="text-red-500 text-xs mt-1">{unitError}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 font-bold">Identity Proof (ID Card)</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-500 bg-white cursor-pointer transition-all relative group">
                                    <Upload className="mx-auto text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" size={24} />
                                    <span className="text-xs block text-slate-500 truncate max-w-full px-2">
                                        {idProof ? idProof.name : "Click to upload ID"}
                                    </span>
                                    <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setIdProof(e.target.files[0])} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700 font-bold">Address Proof</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-blue-500 bg-white cursor-pointer transition-all relative group">
                                    <Upload className="mx-auto text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" size={24} />
                                    <span className="text-xs block text-slate-500 truncate max-w-full px-2">
                                        {addressProof ? addressProof.name : "Click to upload Proof"}
                                    </span>
                                    <input type="file" required className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setAddressProof(e.target.files[0])} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex gap-3 items-start">
                            <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-xs text-amber-800 leading-relaxed">
                                <span className="font-bold text-amber-700">Document Rule:</span> Your request will be securely processed and reviewed by the Condo CAM / Board members. Platform access features will unlock immediately upon verification.
                            </p>
                        </div>

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-[#0F2D59] hover:bg-[#0c2345] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 text-sm cursor-pointer"
                        >
                            {loading ? "Submitting..." : <><Send size={16} /> Submit Join Request</>}
                        </button>
                    </form>
                )}
            </div>
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                confirmText={confirmConfig.confirmText}
                cancelText={confirmConfig.cancelText}
                type={confirmConfig.type}
                singleButton={confirmConfig.singleButton}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default SearchAndJoinCondo;
