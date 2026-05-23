import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, Tag, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import cache from '../utils/cache';

export default function AddStandaloneDocument() {
  const navigate = useNavigate();
  const [conditions, setConditions] = useState(cache.get('conditions') || []);
  
  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('prescription');
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  
  // Status state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const cachedConditions = cache.get('conditions');
    if (cachedConditions) {
      setConditions(cachedConditions);
    }
    fetch(`${process.env.REACT_APP_API_URL}/conditions`)
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load conditions: ${res.status}`);
          return [];
        }
        return res.json();
      })
      .then(data => {
        // Defensive check: ensure data is an array
        const conditionsData = Array.isArray(data) ? data : [];
        setConditions(conditionsData);
        cache.set('conditions', conditionsData);
      })
      .catch(err => {
        console.error("Error loading conditions", err);
        setConditions([]);
      });
  }, []);

  const handleConditionToggle = (id) => {
    setSelectedConditions(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    setSaving(true);
    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('type', type);
    formData.append('notes', notes);
    formData.append('date', date);
    formData.append('condition_ids', selectedConditions.join(','));
    formData.append('file', file);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/documents`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      setSuccess("Document uploaded successfully!");
      // Reset form
      setDate(new Date().toISOString().split('T')[0]);
      setType('prescription');
      setSelectedConditions([]);
      setNotes('');
      setFile(null);
      setUploadProgress(0);
      
      // Invalidate standalone documents cache
      cache.clear('standaloneDocs');

      // Redirect after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.detail || err.message || "An unexpected error occurred during upload.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Upload Standalone Document</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 text-green-800 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Document Date
            </label>
            <input 
              type="date" 
              required 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Document Type
            </label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="prescription">Prescription</option>
              <option value="lab_report">Lab Report</option>
              <option value="scan">Scan / Imaging</option>
              <option value="referral">Referral Letter</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Condition Tags */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-blue-600" />
            Tag Conditions (Optional)
          </label>
          {conditions.length === 0 ? (
            <p className="text-sm text-slate-500">No conditions configured yet. Please add conditions first.</p>
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {conditions.map(c => {
                const isSelected = selectedConditions.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => handleConditionToggle(c.id)}
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
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Notes / Details
          </label>
          <textarea
            rows="3"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add any summaries, test results, or doctor instructions..."
            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-blue-600" />
            Upload File (PDF, Image)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <div className="flex text-sm text-slate-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input type="file" required onChange={handleFileChange} className="sr-only" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500">PDF, PNG, JPG, GIF up to 10MB</p>
              {file && (
                <div className="mt-2 text-sm font-semibold text-blue-600 bg-blue-50 py-1 px-3 rounded inline-block">
                  Selected: {file.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="w-full bg-slate-50 p-4 border border-slate-200 rounded-md">
            <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
              <span>Uploading File...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white font-medium py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Uploading...' : 'Upload Document'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
