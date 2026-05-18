import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Activity, FileText, Pill, Trash2, Edit3, CheckCircle, AlertCircle, Save, X, Plus } from 'lucide-react';
import cache from '../utils/cache';

export default function VisitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editDoctor, setEditDoctor] = useState('');
  const [editHospital, setEditHospital] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editEchs, setEditEchs] = useState(false);
  const [editConditions, setEditConditions] = useState([]);
  
  // Directory lookups
  const [allConditions, setAllConditions] = useState([]);
  
  // New Medication State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medUntil, setMedUntil] = useState('');
  const [medSaving, setMedSaving] = useState(false);

  // Status feedback
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    fetchVisit();
    // Load all conditions for editing dropdowns
    fetch(`${process.env.REACT_APP_API_URL}/conditions`)
      .then(res => res.json())
      .then(data => setAllConditions(data || []))
      .catch(err => console.error("Error fetching conditions directory", err));
  }, [id]);

  const fetchVisit = () => {
    fetch(`${process.env.REACT_APP_API_URL}/visits/${id}`)
      .then(res => res.json())
      .then(data => {
        setVisit(data);
        setLoading(false);
        // Prepopulate edit states
        if (data) {
          setEditDate(data.date);
          setEditDoctor(data.doctor_name || '');
          setEditHospital(data.hospital_or_clinic || '');
          setEditSpecialty(data.specialty || '');
          setEditReason(data.reason || '');
          setEditEchs(data.echs_referred || false);
          setEditConditions(data.conditions ? data.conditions.map(c => c.id) : []);
        }
      })
      .catch(err => {
        console.error("Error fetching visit detail:", err);
        setLoading(false);
      });
  };

  const handleUpdateVisit = async (e) => {
    e.preventDefault();
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('date', editDate);
      formData.append('doctor_name', editDoctor);
      formData.append('hospital_or_clinic', editHospital);
      formData.append('specialty', editSpecialty);
      formData.append('reason', editReason);
      formData.append('echs_referred', editEchs);
      formData.append('condition_ids', editConditions.join(','));

      const res = await fetch(`${process.env.REACT_APP_API_URL}/visits/${id}`, {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) throw new Error("Failed to update visit details");
      
      setFeedback({ type: 'success', message: 'Visit updated successfully!' });
      setIsEditing(false);
      cache.clear('visits');
      fetchVisit();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleDeleteVisit = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this entire medical visit and all its attached records?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/visits/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete visit");
      
      setFeedback({ type: 'success', message: 'Visit deleted successfully!' });
      cache.clear('visits');
      cache.clear('medications');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setMedSaving(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('visit_id', id);
      formData.append('name', medName);
      if (medDosage) formData.append('dosage', medDosage);
      if (medFreq) formData.append('frequency', medFreq);
      if (medUntil) formData.append('prescribed_until', medUntil);
      if (visit.doctor_name) formData.append('prescribed_by', visit.doctor_name);
      formData.append('prescribed_on', visit.date);
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/medications`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to add medication');
      
      setMedName('');
      setMedDosage('');
      setMedFreq('');
      setMedUntil('');
      setFeedback({ type: 'success', message: 'Medication added successfully!' });
      cache.clear('medications');
      fetchVisit(); // refresh data
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setMedSaving(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    setFeedback(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setFeedback({ type: 'success', message: 'Document removed successfully!' });
      cache.clear('visits');
      fetchVisit(); // refresh
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const toggleConditionSelect = (cId) => {
    setEditConditions(prev => 
      prev.includes(cId) ? prev.filter(item => item !== cId) : [...prev, cId]
    );
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading visit details...</div>;
  if (!visit) return <div className="p-8 text-center text-red-500">Visit not found.</div>;

  return (
    <div className="space-y-6">
      
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-lg border shadow-sm flex items-center gap-3 animate-fade-in ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <span className="font-semibold text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Main Header / Info Card */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
        {!isEditing ? (
          // View Mode
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {visit.doctor_name || 'Visit Details'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-slate-400"/> {new Date(visit.date).toLocaleDateString()}</span>
                  {visit.hospital_or_clinic && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400"/> {visit.hospital_or_clinic}</span>}
                  {visit.hospital_or_clinic && visit.specialty && <span className="text-slate-300 hidden md:inline">•</span>}
                  {visit.specialty && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{visit.specialty}</span>}
                  {visit.echs_referred && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">ECHS</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Visit
                </button>
                <button
                  onClick={handleDeleteVisit}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Visit
                </button>
              </div>
            </div>

            {visit.reason && (
              <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Reason for Visit</h3>
                <p className="text-slate-800">{visit.reason}</p>
              </div>
            )}

            {visit.conditions?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Related Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {visit.conditions.map((c, idx) => (
                    <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
                      <Activity className="w-3.5 h-3.5 text-red-500" />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Edit Mode Form
          <form onSubmit={handleUpdateVisit} className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Edit Visit Details</h2>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Date</label>
                <input 
                  type="date" 
                  required 
                  value={editDate} 
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Doctor Name</label>
                <input 
                  type="text" 
                  value={editDoctor} 
                  onChange={e => setEditDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Hospital or Clinic</label>
                <input 
                  type="text" 
                  value={editHospital} 
                  onChange={e => setEditHospital(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Specialty</label>
                <input 
                  type="text" 
                  value={editSpecialty} 
                  onChange={e => setEditSpecialty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Reason for Visit</label>
              <textarea 
                rows="3"
                value={editReason} 
                onChange={e => setEditReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>

            {/* Condition multi-select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Tagged Conditions</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {allConditions.map(c => {
                  const isSelected = editConditions.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleConditionSelect(c.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="editEchs"
                checked={editEchs} 
                onChange={e => setEditEchs(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="editEchs" className="text-sm font-semibold text-slate-700">Referred by ECHS</label>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attached Documents Column */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Attached Documents
              </h2>
            </div>
            <div className="p-6">
              {visit.documents?.length > 0 ? (
                <ul className="space-y-4">
                  {visit.documents.map(doc => (
                    <li key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200 rounded-md hover:border-blue-300 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 capitalize">{doc.type.replace('_', ' ')}</p>
                        {doc.notes && <p className="text-sm text-slate-500 truncate mt-1">{doc.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Open PDF / File
                        </a>
                        <button 
                          onClick={() => handleDeleteDoc(doc.id)} 
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" 
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-center py-4">No documents attached.</p>
              )}
            </div>
          </div>
        </div>

        {/* Prescribed Medications Column */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Prescribed Medications
            </h2>
          </div>
          
          <div className="p-6">
            {visit.medications?.length > 0 ? (
              <ul className="space-y-3 mb-8">
                {visit.medications.map(med => (
                  <li key={med.id} className="p-3 bg-slate-50 rounded-md border border-slate-200 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {med.dosage && <span>{med.dosage} </span>}
                        {med.frequency && <span className="text-slate-500">• {med.frequency}</span>}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md uppercase tracking-wider">
                      {med.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-center py-4 mb-6">No medications logged for this visit.</p>
            )}

            {/* Add Medication Form */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1">
                <Plus className="w-4 h-4 text-blue-600" />
                Add Medication from Prescription
              </h3>
              <form onSubmit={handleAddMedication} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Medication Name</label>
                  <input type="text" required value={medName} onChange={e => setMedName(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Dosage (e.g. 50mg)</label>
                    <input type="text" value={medDosage} onChange={e => setMedDosage(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Frequency (e.g. 1-0-1)</label>
                    <input type="text" value={medFreq} onChange={e => setMedFreq(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"/>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Prescribed Until (Optional)</label>
                  <input type="date" value={medUntil} onChange={e => setMedUntil(e.target.value)} className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"/>
                </div>
                <button type="submit" disabled={medSaving} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded text-sm disabled:opacity-50 transition-colors shadow-sm">
                  {medSaving ? 'Saving...' : '+ Add Medication'}
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
