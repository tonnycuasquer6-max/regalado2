import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import UserManagementView from './UserManagementView';
import ApprovalsView from './ApprovalsView';
import MasterCalendarView from './MasterCalendarView';
import ReportsView from './ReportsView';
import AdminHome from './AdminHome';
import TimeBillingMaestro from './TimeBillingMaestro'; // <-- Importamos tu súper calendario
import ListaPerfiles from './ListaPerfiles';

interface ViewConfig {
    name: string;
    params?: { [key: string]: any };
}

const AdminDashboard: React.FC<{ session: Session }> = ({ session }) => {
    const [activeViewConfig, setActiveViewConfig] = useState<ViewConfig>({ name: 'HOME' });

    const { name: activeView, params = {} } = activeViewConfig;

    const renderContent = () => {
        switch (activeView) {
            case 'USERS':
                return <UserManagementView {...params} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'PROFILES':
                return <ListaPerfiles {...params} onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            case 'APPROVALS':
                return <ApprovalsView setActiveView={setActiveViewConfig} />;
            case 'CALENDAR':
                return <MasterCalendarView />;
            case 'REPORTS':
                return <ReportsView />;
            case 'TIME_BILLING': // <-- AQUÍ ESTÁ LA MAGIA: Ahora escucha exactamente lo que tu botón manda
                return <TimeBillingMaestro onCancel={() => setActiveViewConfig({ name: 'HOME' })} />;
            default:
                return null;
        }
    };
    
    if (activeView === 'HOME') {
        return <AdminHome setActiveView={setActiveViewConfig} />;
    }

    return (
        <div className="bg-black min-h-screen text-white">
            <main className="py-8 px-4 sm:px-8 w-full">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;