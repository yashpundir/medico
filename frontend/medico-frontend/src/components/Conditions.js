import React, { useState, useEffect } from 'react';
import { Calendar, Tag, Activity, Edit2, Trash2, CheckCircle, AlertCircle, X, Check } from 'lucide-react';

export default function Conditions() {
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Condition State
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newDiagnosedOn, setNewDiagnosedOn] = useState('');
  
  // Editing Row State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [editDiagnosedOn, setEditDiagnosedOn] = useState('');
  
  // Status feedback
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConditions();
  }, []);

  const fetchConditions = () => {
    setLoading(true);
    fetch('http://localhost:8000/conditions')
      .then(res => res.json())
      .then(data => {
        setConditions(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching conditions:", err);
        setLoading(false);
      });
  };

  const handleAddCondition = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setSaving(true);
    setFeedback(null);
    
    const formData = new FormData();
    formData.append('name', newName);
    formData.append('status', newStatus);
    if (newDiagnosedOn) formData.append('diagnosed_on', newDiagnosedOn);
    
    try {
      const res = await fetch('http://localhost:8000/conditions', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Failed to add condition");
      
      setFeedback({ type: 'success', message: `Condition "${newName}" added successfully!` });
      setNewName('');
      setNewDiagnosedOn('');
      fetchConditions();
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditStatus(c.status);
    setEditDiagnosedOn(c.diagnosed_on ? c.diagnosed_on.split('T')[0] : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateCondition = async (id) => {
    if (!editName.trim()) return;
    setSaving(true);
    setFeedback(null);
    
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('status', editStatus);
    formData.append('diagnosed_on', editDiagnosedOn);
    
    try {
      const res = await fetch(`http://localhost:8000/conditions/${id}`, {
        method: 'PUT',
        body: formData
      });
      if (!res.ok) throw new Error("Failed to update condition");
      
      setFeedback({ type: 'success', message: 'Condition updated successfully!' });
      setEditingId(null);
      fetchConditions();
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCondition = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the condition "${name}"?`)) return;
    setFeedback(null);
    
    try {
      const res = await fetch(`http://localhost:8000/conditions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete condition");
      
      setFeedback({ type: 'success', message: `Condition "${name}" deleted successfully!` });
      fetchConditions();
      
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Form: Add Condition */}
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Add New Condition</h2>
          <p className="text-sm text-slate-500 mt-1">Log a medical condition to track related visits, documents, and medications.</p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-lg border shadow-sm flex items-center gap-3 ${
            feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
            <span className="font-medium text-sm">{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleAddCondition} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Condition Name</label>
            <input 
              type="text" 
              required 
              value={newName} 
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Hypertension, Diabetes"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Status</label>
            <select 
              value={newStatus} 
              onChange={e => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white"
            >
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Diagnosed On (Optional)</label>
            <input 
              type="date" 
              value={newDiagnosedOn} 
              onChange={e => setNewDiagnosedOn(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Add Condition'}
          </button>
        </form>
      </div>

      {/* Right List: Conditions Directory */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Conditions Directory</h2>
          <p className="text-sm text-slate-500 mt-1">Review, update, or remove existing health conditions.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">Loading conditions...</div>
        ) : conditions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-800">No conditions tracked yet</h3>
            <p className="text-slate-500 mt-2">Log a condition on the left to start organizing your files.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnosed Date</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {conditions.map(c => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-slate-900">{c.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select 
                            value={editStatus} 
                            onChange={e => setEditStatus(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                          >
                            <option value="active">Active</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                            c.status === 'resolved' 
                              ? 'bg-green-100 text-green-800' 
                              : c.status === 'active' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Diagnosed On */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {isEditing ? (
                          <input 
                            type="date" 
                            value={editDiagnosedOn} 
                            onChange={e => setEditDiagnosedOn(e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {c.diagnosed_on ? new Date(c.diagnosed_on).toLocaleDateString() : '—'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateCondition(c.id)} 
                              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                              title="Save Changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={cancelEdit} 
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => startEdit(c)} 
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit Condition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCondition(c.id, c.name)} 
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Condition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
