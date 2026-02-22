
import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';
import { LogoutIcon } from './Icons';

interface NavItem {
    icon: React.ReactNode;
    label: string;
    view: string;
}

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeView: string;
    setActiveView: (view: string) => void;
    session: Session;
    navItems: NavItem[];
}

const NavLink: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <a href="#" onClick={onClick} className={`flex items-center py-3 px-4 rounded transition-colors text-lg ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800'}`}>
      <span className="mr-4">{icon}</span>
      {label}
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeView, setActiveView, session, navItems }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const userEmail = session.user?.email || 'usuario@regalado.com';

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-80 z-40 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      <div className={`fixed top-0 left-0 h-full w-72 bg-black text-white z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 flex flex-col border-r border-zinc-800`}>
        <div className="p-6 flex-grow">
          <nav className="mt-8">
            <ul>
              {navItems.map((item) => (
                <li key={item.view} className="mb-4">
                  <NavLink 
                      icon={item.icon} 
                      label={item.label} 
                      isActive={activeView === item.view}
                      onClick={() => setActiveView(item.view)}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-6 border-t border-zinc-800">
            <div className="text-sm text-zinc-500 mb-4">
                <p className="font-semibold text-white">Sesión activa como:</p>
                <p className="truncate">{userEmail}</p>
            </div>
           <button onClick={handleLogout} className="w-full flex items-center text-left py-3 px-4 rounded bg-zinc-800 hover:bg-zinc-700 transition-all text-lg border border-zinc-700">
             <LogoutIcon />
             <span className="ml-2">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
