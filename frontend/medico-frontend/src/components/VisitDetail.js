import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Activity, FileText, Pill, Trash2 } from 'lucide-react';

export default function VisitDetail() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Medication State
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medUntil, setMedUntil] = useState('');
  const [medSaving, setMedSaving] = useState(false);

  useEffect(() => {
    fetchVisit();
  }, [id]);

  const fetchVisit = () => {
    fetch(`http://localhost:8000/visits/${id}`)
      .then(res => res.json())
      .then(data => {
        setVisit(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching visit detail:", err);
        setLoading(false);
      });
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    setMedSaving(true);
    try {
      const formData = new FormData();
      formData.append('visit_id', id);
      formData.append('name', medName);
      if (medDosage) formData.append('dosage', medDosage);
      if (medFreq) formData.append('frequency', medFreq);
      if (medUntil) formData.append('prescribed_until', medUntil);
      if (visit.doctor_name) formData.append('prescribed_by', visit.doctor_name);
      formData.append('prescribed_on', visit.date);
      
      const res = await fetch('http://localhost:8000/medications', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to add medication');
      
      setMedName('');
      setMedDosage('');
      setMedFreq('');
      setMedUntil('');
      fetchVisit(); // refresh data
    } catch (err) {
      alert("Error adding medication: " + err.message);
    } finally {
      setMedSaving(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`http://localhost:8000/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      fetchVisit(); // refresh
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading visit details...</div>;
  if (!visit) return <div className="p-8 text-center text-red-500">Visit not found.</div>;

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {visit.doctor_name || 'Visit Details'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {new Date(visit.date).toLocaleDateString()}</span>
              {visit.hospital_or_clinic && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {visit.hospital_or_clinic}</span>}
              {visit.specialty && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{visit.specialty}</span>}
              {visit.echs_referred && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">ECHS</span>}
            </div>
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
                  <Activity className="w-3.5 h-3.5" />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Documents */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
                      <p className="font-medium text-slate-900 capitalize">{doc.type.replace('_', ' ')}</p>
                      {doc.notes && <p className="text-sm text-slate-500 truncate mt-1">{doc.notes}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md">
                        View File
                      </a>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md" title="Delete">
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

        {/* Right Column: Medications */}
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
                  <li key={med.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <div className="flex justify-between items-start">
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
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-center py-4 mb-6">No medications logged for this visit.</p>
            )}

            {/* Add Medication Form */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Add Medication from Prescription</h3>
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
                <button type="submit" disabled={medSaving} className="w-full bg-slate-800 text-white font-medium py-2 rounded text-sm hover:bg-slate-900 disabled:opacity-50 transition-colors shadow-sm">
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
