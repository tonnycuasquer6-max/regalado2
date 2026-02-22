
import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './shared/Sidebar';
import { HamburgerIcon, FolderIcon } from './shared/Icons';
import CaseView from './CaseView';

const navItems = [
    {
        icon: <FolderIcon />,
        label: "Estado de mis Casos",
        view: "CASES"
    }
];

interface DashboardProps {
  session: Session;
}

const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Para los clientes, la vista activa siempre será 'CASES'.
  const [activeView, setActiveView] = useState("CASES");

  return (
    <div className="relative min-h-screen bg-black flex">
      <Sidebar 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
        session={session}
        navItems={navItems}
      />
      <div className="flex-1 lg:pl-72">
        <header className="absolute top-0 left-0 p-3 z-30 lg:hidden">
            <HamburgerIcon onClick={() => setIsMenuOpen(prev => !prev)} />
        </header>
        
        <main className="p-4 sm:p-8 text-white w-full">
            <CaseView title="Estado de mis Casos" />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
