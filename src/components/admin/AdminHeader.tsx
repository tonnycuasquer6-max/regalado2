
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { BellIcon, LogoutIcon } from '../shared/Icons';

// Subcomponente para los ítems de navegación con submenú
interface NavItemWithDropdownProps {
    label: string;
    children: React.ReactNode;
}
const NavItemWithDropdown: React.FC<NavItemWithDropdownProps> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (node.current && !node.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={node} className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="nav-button">{label}</button>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-40 bg-black py-2 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                {React.Children.map(children, child => 
                    React.isValidElement(child) ? React.cloneElement(child, { onClick: () => {
                        if (child.props.onClick) child.props.onClick();
                        setIsOpen(false);
                    }} as React.Attributes) : child
                )}
            </div>
        </div>
    );
};

// Dropdown para el perfil de usuario
const ProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const node = useRef<HTMLDivElement>(null);
    const handleLogout = async () => await supabase.auth.signOut();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (node.current && !node.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={node} className="relative">
            <img onClick={() => setIsOpen(!isOpen)} src="https://via.placeholder.com/150" alt="Admin" className="w-10 h-10 rounded-full border-2 border-zinc-700 hover:border-white transition-all cursor-pointer"/>
            {isOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-black border border-zinc-800 rounded-md shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                    <a onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 cursor-pointer">
                        <LogoutIcon /> Cerrar Sesión
                    </a>
                </div>
            )}
        </div>
    );
};

interface AdminHeaderProps {
    setActiveView: (viewConfig: { name: string; params?: any }) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ setActiveView }) => {
    const handleNavigation = (viewName: string, params?: any) => {
        setActiveView({ name: viewName, params });
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg">
            <nav className="px-8 flex items-center justify-between h-20">
                <button onClick={() => handleNavigation('HOME')} className="text-2xl font-black tracking-widest">R&R</button>
                
                <div className="flex-grow flex justify-center items-center gap-12">
                   <NavItemWithDropdown label="Registrar">
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'abogado' })} className="dropdown-item">Abogado</a>
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'estudiante' })} className="dropdown-item">Estudiante</a>
                       <a onClick={() => handleNavigation('USERS', { preselectedRole: 'cliente' })} className="dropdown-item">Cliente</a>
                   </NavItemWithDropdown>

                   <NavItemWithDropdown label="Perfiles">
                       <a onClick={() => handleNavigation('PROFILES', { role: 'abogado' })} className="dropdown-item">Abogados</a>
                       <a onClick={() => handleNavigation('PROFILES', { role: 'estudiante' })} className="dropdown-item">Estudiantes</a>
                       <a onClick={() => handleNavigation('PROFILES', { role: 'cliente' })} className="dropdown-item">Clientes</a>
                   </NavItemWithDropdown>

                   <button onClick={() => handleNavigation('TIME_BILLING')} className="nav-button">Time Billing</button>
                   <button onClick={() => handleNavigation('APPROVALS')} className="nav-button">Aprobaciones</button>
                   <button onClick={() => handleNavigation('REPORTS')} className="nav-button">Reportes</button>
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-zinc-400 hover:text-white transition-colors"><BellIcon /></button>
                    <ProfileDropdown />
                </div>
            </nav>
            <style>{`
              .nav-button {
                background: none; border: none; cursor: pointer;
                color: #a1a1aa; font-size: 0.9rem; font-weight: 600;
                transition: color 0.3s;
              }
              .nav-button:hover { color: #ffffff; }

              .dropdown-item {
                display: block; text-align: center;
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
                color: #a1a1aa;
                cursor: pointer;
                transition: color 0.2s;
              }
              .dropdown-item:hover {
                color: #ffffff;
              }
            `}</style>
        </header>
    );
};

export default AdminHeader;
