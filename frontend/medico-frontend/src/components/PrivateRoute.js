import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Medico...</p>
        </div>
      </div>
    );
  }

  // Always render the login page if not authenticated
  // This ensures the page never shows blank/white
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
