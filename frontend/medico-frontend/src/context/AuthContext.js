import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Global Authorization Interceptor for Fetch
  useEffect(() => {
    const originalFetch = window.originalFetch || window.fetch;
    window.originalFetch = originalFetch;

    window.fetch = async (url, options = {}) => {
      const currentSession = await supabase.auth.getSession();
      const token = currentSession?.data?.session?.access_token;
      
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        };
      }
      return originalFetch(url, options);
    };
  }, []);

  // 4. Global Authorization Interceptor for Axios
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(async (config) => {
      const currentSession = await supabase.auth.getSession();
      const token = currentSession?.data?.session?.access_token;
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  const login = async (password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@medico.app',
      password: password
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
