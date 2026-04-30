import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, Plus } from 'lucide-react';

const DeployForm = ({ onUploadSuccess }: { onUploadSuccess: () => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', price: '', category: '', file_format: 'PDF' });

  const handleAddDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        price_cents: Math.round(parseFloat(formData.price) * 100)
      };
      await axios.post('http://localhost:5000/api/datasets', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Deployment initialized! Awaiting protocol audit.');
      setShowAdd(false);
      setFormData({ title: '', description: '', price: '', category: '', file_format: 'PDF' });
      onUploadSuccess();
    } catch (err) {
      console.error(err);
      alert('Deployment failed. Check network status.');
    }
  };

  return (
    <div className="mb-10">
      <button 
        onClick={() => setShowAdd(!showAdd)}
        className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(13,148,136,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] flex items-center gap-3 border border-primary-400/20 hover:-translate-y-1 mb-6"
      >
        <Plus size={24} /> {showAdd ? 'Cancel Upload' : 'Deploy New Dataset'}
      </button>

      {showAdd && (
        <div className="glass-card p-10 rounded-3xl border-primary-500/30 animate-fade-up relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full"></div>
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 relative z-10">
            <UploadCloud className="text-primary-400" size={24} /> Asset Specification
          </h2>
          <form onSubmit={handleAddDataset} className="grid md:grid-cols-2 gap-8 relative z-10">
            <div>
              <label className="block text-xs font-bold text-surface-400 mb-3 uppercase tracking-widest">Dataset Title</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-surface-900/50 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-white transition-all shadow-inner" placeholder="E.g., Neural Network Training Data" />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-400 mb-3 uppercase tracking-widest">Sector / Category</label>
              <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-surface-900/50 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-white transition-all shadow-inner" placeholder="E.g., Artificial Intelligence" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-surface-400 mb-3 uppercase tracking-widest">Technical Overview</label>
              <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-surface-900/50 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-white transition-all shadow-inner resize-none" placeholder="Explain the data structure and utility..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-400 mb-3 uppercase tracking-widest">Valuation (INR)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-surface-400 font-bold">₹</span>
                <input required type="number" step="1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-5 py-4 bg-surface-900/50 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-white transition-all shadow-inner" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-surface-400 mb-3 uppercase tracking-widest">Data Protocol / Format</label>
              <select 
                value={formData.file_format} 
                onChange={e => setFormData({...formData, file_format: e.target.value})}
                className="w-full px-5 py-4 bg-surface-900/50 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none text-white transition-all shadow-inner appearance-none custom-select"
              >
                <option value="PDF">Document (PDF)</option>
                <option value="CSV">Spreadsheet (CSV)</option>
                <option value="JSON">Raw Data (JSON)</option>
                <option value="EXCEL">Business Sheet (XLSX)</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <button type="submit" className="w-full bg-white text-surface-900 hover:bg-primary-400 py-5 px-6 rounded-xl font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]">
                Initiate Deployment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DeployForm;
