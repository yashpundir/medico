import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddCondition() {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');
  const [diagnosedOn, setDiagnosedOn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('status', status);
      if (diagnosedOn) formData.append('diagnosed_on', diagnosedOn);

      const res = await fetch('http://localhost:8000/conditions', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to create condition');
      
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Add New Health Condition</h2>
      
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Condition Name</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hypertension, Type 2 Diabetes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosed On (Optional)</label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={diagnosedOn}
            onChange={(e) => setDiagnosedOn(e.target.value)}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving...' : 'Save Condition'}
          </button>
        </div>
      </form>
    </div>
  );
}
