import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import LoginPage from './components/LoginPage';
import ClientDashboard from './components/client/ClientDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import WorkerDashboard from './components/worker/WorkerDashboard';
import AccessDenied from './components/AccessDenied';

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Cargando Portal Seguro..." }) => (
    <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-xl animate-pulse">{message}</div>
    </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAwaitingMfa, setIsAwaitingMfa] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (_event === 'SIGNED_OUT') {
          setIsAwaitingMfa(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchUserRole = async (user: User) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('rol')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data?.rol || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      }
    };

    if (session?.user && !isAwaitingMfa) {
      setLoading(true);
      fetchUserRole(session.user).finally(() => setLoading(false));
    } else if (!session) {
      setUserRole(null);
      setLoading(false);
    }
  }, [session, isAwaitingMfa]);

  if (loading) {
    return <LoadingScreen />;
  }
  
  const showLogin = !session || isAwaitingMfa;

  const renderDashboard = () => {
    if (!session) return null;

    switch (userRole) {
      case 'admin':
        return <AdminDashboard session={session} />;
      case 'trabajador':
        return <WorkerDashboard session={session} />;
      case 'cliente':
        return <ClientDashboard key={session.user.id} session={session} />;
      default:
        return <AccessDenied />;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {showLogin ? (
        <LoginPage setIsAwaitingMfa={setIsAwaitingMfa} />
      ) : (
        renderDashboard()
      )}
    </div>
  );
};

export default App;