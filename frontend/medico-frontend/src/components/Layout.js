import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, ClipboardList, Pill, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const navItems = [
    { name: 'Visits', path: '/', icon: ClipboardList },
    { name: 'Conditions', path: '/conditions', icon: Activity },
    { name: 'Medications', path: '/medications', icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
                  <Activity className="h-6 w-6" />
                  Medico
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/visits/'));
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-blue-500 text-slate-900'
                          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Desktop Logout Button */}
            <div className="hidden sm:flex sm:items-center">
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-1.5 border border-slate-300 text-xs font-semibold rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="sm:hidden flex overflow-x-auto p-2 border-t border-slate-100 bg-slate-50 gap-2 hide-scrollbar">
           {navItems.map((item) => {
             const Icon = item.icon;
             const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/visits/'));
             return (
               <Link
                 key={item.name}
                 to={item.path}
                 className={`flex-shrink-0 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    isActive 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                 }`}
               >
                 <Icon className="w-4 h-4 mr-2" />
                 {item.name}
               </Link>
             )
           })}
           {/* Mobile Logout Button */}
           <button
             onClick={logout}
             className="flex-shrink-0 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 transition-colors"
           >
             <LogOut className="w-4 h-4 mr-2" />
             Sign Out
           </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
