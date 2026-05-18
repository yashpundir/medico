import React, { useState, useEffect } from 'react';
import { Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import cache from '../utils/cache';

export default function MedicationList() {
  const [medications, setMedications] = useState(cache.get('medications') || []);
  const [loading, setLoading] = useState(!cache.get('medications'));

  useEffect(() => {
    const cachedMeds = cache.get('medications');
    if (cachedMeds) {
      setMedications(cachedMeds);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetch(`${process.env.REACT_APP_API_URL}/medications`)
      .then(res => res.json())
      .then(data => {
        setMedications(data || []);
        cache.set('medications', data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load medications", err);
        setLoading(false);
      });
  }, []);

  if (loading && medications.length === 0) return <div className="p-8 text-center text-slate-500">Loading medications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Medications</h1>
      </div>

      {medications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-800">No medications logged</h3>
          <p className="text-slate-500 mt-2">Medications added from a visit will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Medication</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dosage & Freq</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Origin Visit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {medications.map(med => (
                  <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Pill className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{med.name}</div>
                          {med.conditions?.name && (
                            <div className="text-xs text-slate-500">For: {med.conditions.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{med.dosage || '-'}</div>
                      <div className="text-sm text-slate-500">{med.frequency || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        med.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        med.status === 'stopped' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {med.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {med.visit_id ? (
                        <Link to={`/visits/${med.visit_id}`} className="text-blue-600 hover:text-blue-900 flex flex-col">
                          <span>{med.visits?.doctor_name || 'Visit'}</span>
                          <span className="text-xs text-slate-400">{med.visits?.date && new Date(med.visits.date).toLocaleDateString()}</span>
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
