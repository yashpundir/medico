import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, MapPin, ChevronRight } from 'lucide-react';

export default function VisitList() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/visits')
      .then(res => res.json())
      .then(data => {
        setVisits(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load visits", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading visits...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">All Visits</h1>
        <Link to="/add-visit" className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
          + New Visit
        </Link>
      </div>

      {visits.length === 0 ? (
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
                      <div className="flex items-center gap-3 mb-1">
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
                          <Calendar className="w-4 h-4" />
                          {new Date(visit.date).toLocaleDateString()}
                        </div>
                        {visit.hospital_or_clinic && (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-4 h-4" />
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
    </div>
  );
}
