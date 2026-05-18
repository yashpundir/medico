import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Calendar, MapPin, ChevronRight, Download, Trash2, Tag, Activity } from 'lucide-react';
import cache from '../utils/cache';

export default function VisitList() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('visits');
  const [visits, setVisits] = useState(cache.get('visits') || []);
  const [loadingVisits, setLoadingVisits] = useState(!cache.get('visits'));
  
  // Standalone Document states
  const [documents, setDocuments] = useState(cache.get('standaloneDocs') || []);
  const [loadingDocs, setLoadingDocs] = useState(activeTab === 'documents' && !cache.get('standaloneDocs'));
  const [conditions, setConditions] = useState(cache.get('conditions') || []);
  
  // Feedback
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (location.state?.message) {
      setFeedback({ type: 'success', message: location.state.message });
      setTimeout(() => setFeedback(null), 4000);
    }

    // Always fetch conditions to resolve tags, using cache first
    const cachedConditions = cache.get('conditions');
    if (cachedConditions) {
      setConditions(cachedConditions);
    }
    
    fetch(`${process.env.REACT_APP_API_URL}/conditions`)
      .then(res => res.json())
      .then(data => {
        setConditions(data || []);
        cache.set('conditions', data || []);
      })
      .catch(err => console.error("Failed to load conditions", err));

    fetchVisits();
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab]);

  const fetchVisits = () => {
    const cachedVisits = cache.get('visits');
    if (cachedVisits) {
      setVisits(cachedVisits);
      setLoadingVisits(false);
    } else {
      setLoadingVisits(true);
    }

    fetch(`${process.env.REACT_APP_API_URL}/visits`)
      .then(res => res.json())
      .then(data => {
        setVisits(data || []);
        cache.set('visits', data || []);
        setLoadingVisits(false);
      })
      .catch(err => {
        console.error("Failed to load visits", err);
        setLoadingVisits(false);
      });
  };

  const fetchDocuments = () => {
    const cachedDocs = cache.get('standaloneDocs');
    if (cachedDocs) {
      setDocuments(cachedDocs);
      setLoadingDocs(false);
    } else {
      setLoadingDocs(true);
    }

    fetch(`${process.env.REACT_APP_API_URL}/standalone-documents`)
      .then(res => res.json())
      .then(data => {
        setDocuments(data || []);
        cache.set('standaloneDocs', data || []);
        setLoadingDocs(false);
      })
      .catch(err => {
        console.error("Failed to load standalone documents", err);
        setLoadingDocs(false);
      });
  };

  const handleDeleteDocument = async (id) => {
    if (!window.confirm("Are you sure you want to delete this standalone document?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/documents/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete document");
      setFeedback({ type: 'success', message: 'Document deleted successfully!' });
      cache.clear('standaloneDocs');
      fetchDocuments();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const getConditionName = (id) => {
    const cond = conditions.find(c => c.id === id);
    return cond ? cond.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-lg border shadow-sm ${
          feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Health Records</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track your medical visits and health documents.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/add-visit" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm">
            + New Visit
          </Link>
          <Link to="/standalone-upload" className="bg-slate-800 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-900 transition-colors shadow-sm text-sm">
            + Upload Document
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('visits')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'visits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Medical Visits ({visits.length})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Standalone Documents ({documents.length})
          </button>
        </nav>
      </div>

      {/* Visits Tab */}
      {activeTab === 'visits' && (
        <>
          {loadingVisits ? (
            <div className="p-12 text-center text-slate-500">Loading visits...</div>
          ) : visits.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800">No visits logged</h3>
              <p className="text-slate-500 mt-2">Log your first medical visit to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <ul className="divide-y divide-slate-200">
                {visits.map(visit => (
                  <li key={visit.id}>
                    <Link to={`/visits/${visit.id}`} className="block hover:bg-slate-50 transition-colors">
                      <div className="px-6 py-5 flex items-center justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <p className="text-lg font-semibold text-slate-900 truncate">
                              {visit.doctor_name || "Unknown Doctor"}
                            </p>
                            {visit.specialty && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {visit.specialty}
                              </span>
                            )}
                            {visit.echs_referred && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ECHS
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {new Date(visit.date).toLocaleDateString()}
                            </div>
                            {visit.hospital_or_clinic && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                {visit.hospital_or_clinic}
                              </div>
                            )}
                          </div>
                          
                          {visit.reason && (
                            <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                              <span className="font-medium text-slate-700">Reason:</span> {visit.reason}
                            </p>
                          )}
                        </div>
                        <div>
                          <ChevronRight className="w-6 h-6 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Standalone Documents Tab */}
      {activeTab === 'documents' && (
        <>
          {loadingDocs ? (
            <div className="p-12 text-center text-slate-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-800">No standalone documents</h3>
              <p className="text-slate-500 mt-2">Upload separate lab reports, prescriptions, or scans not associated with any visit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded uppercase tracking-wider">
                        {doc.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {doc.date ? new Date(doc.date).toLocaleDateString() : 'No Date'}
                      </span>
                    </div>

                    {doc.notes && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                        {doc.notes}
                      </p>
                    )}

                    {doc.condition_ids && doc.condition_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {doc.condition_ids.map(cId => (
                          <span key={cId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                            <Activity className="w-3 h-3" />
                            {getConditionName(cId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View / Open File
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
