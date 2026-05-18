import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddVisit() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [hospital, setHospital] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [reason, setReason] = useState('');
  const [echsReferred, setEchsReferred] = useState(false);
  
  const [conditions, setConditions] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  
  const [documents, setDocuments] = useState([{ file: null, type: 'prescription', notes: '' }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/conditions')
      .then(res => res.json())
      .then(data => setConditions(data))
      .catch(err => console.error("Failed to load conditions:", err));
  }, []);

  const handleDocChange = (index, field, value) => {
    const newDocs = [...documents];
    newDocs[index][field] = value;
    setDocuments(newDocs);
  };

  const addDocField = () => {
    setDocuments([...documents, { file: null, type: 'prescription', notes: '' }]);
  };
  
  const removeDocField = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleConditionToggle = (id) => {
    setSelectedConditions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const visitData = new FormData();
      visitData.append('date', date);
      if (doctorName) visitData.append('doctor_name', doctorName);
      if (hospital) visitData.append('hospital_or_clinic', hospital);
      if (specialty) visitData.append('specialty', specialty);
      if (reason) visitData.append('reason', reason);
      visitData.append('echs_referred', echsReferred);
      if (selectedConditions.length > 0) visitData.append('condition_ids', selectedConditions.join(','));

      const visitRes = await fetch('http://localhost:8000/visits', {
        method: 'POST',
        body: visitData,
      });

      if (!visitRes.ok) throw new Error('Failed to create visit');
      const visit = await visitRes.json();

      for (const doc of documents) {
        if (doc.file) {
          const docData = new FormData();
          docData.append('visit_id', visit.id);
          docData.append('type', doc.type);
          if (doc.notes) docData.append('notes', doc.notes);
          docData.append('file', doc.file);

          const docRes = await fetch('http://localhost:8000/documents', {
            method: 'POST',
            body: docData,
          });
          if (!docRes.ok) throw new Error('Failed to upload document');
        }
      }

      navigate('/', { state: { message: "Visit logged successfully!" } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Log a New Visit</h2>
      
      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Doctor Name</label>
            <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hospital or Clinic</label>
            <input type="text" value={hospital} onChange={(e) => setHospital(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Specialty</label>
            <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit</label>
          <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"></textarea>
        </div>

        <div className="flex items-center">
          <input type="checkbox" id="echs" checked={echsReferred} onChange={(e) => setEchsReferred(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="echs" className="ml-2 block text-sm text-slate-700">
            ECHS Referred Visit
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tag Related Conditions</label>
          <div className="flex flex-wrap gap-2">
            {conditions.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleConditionToggle(c.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedConditions.includes(c.id) 
                    ? 'bg-blue-100 border-blue-300 text-blue-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-200" />

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800">Attach Documents</h3>
            <button type="button" onClick={addDocField} className="text-sm text-blue-600 font-medium hover:text-blue-800">
              + Add Another File
            </button>
          </div>
          
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border border-slate-200 rounded-md bg-slate-50">
                <div className="flex-1">
                  <input type="file" onChange={(e) => handleDocChange(index, 'file', e.target.files[0])}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                </div>
                <div className="flex-1">
                  <select value={doc.type} onChange={(e) => handleDocChange(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                    <option value="prescription">Prescription</option>
                    <option value="lab_report">Lab Report</option>
                    <option value="scan">Scan / X-Ray</option>
                    <option value="referral">Referral</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input type="text" placeholder="Short note (optional)" value={doc.notes} onChange={(e) => handleDocChange(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                {documents.length > 1 && (
                  <button type="button" onClick={() => removeDocField(index)} className="text-red-500 hover:text-red-700 p-2">
                    &times;
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-lg shadow-sm"
          >
            {loading ? 'Saving Visit & Uploading...' : 'Save Complete Visit'}
          </button>
        </div>
      </form>
    </div>
  );
}
