import React, { useState, useEffect } from 'react';
import AdminHeader from './AdminHeader';

interface AdminHomeProps {
    setActiveView: (viewConfig: { name: string; params?: any }) => void;
}

const AdminHome: React.FC<AdminHomeProps> = ({ setActiveView }) => {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 1200);
        return () => clearTimeout(timer);
    }, []);
    
    return (
        <div className="bg-black min-h-screen text-white overflow-hidden">
            <AdminHeader setActiveView={setActiveView} />
            <main className="flex items-center justify-center h-screen">
                <div className="text-center font-black text-6xl relative h-20 w-full flex items-center justify-center">
                    <h1 className={`absolute transition-all duration-1000 ease-in-out ${isAnimated ? 'opacity-0 -tracking-tighter' : 'opacity-100 tracking-[1em]'}`}>
                        R&R
                    </h1>
                    <h1 className={`absolute transition-all duration-1000 ease-in-out ${isAnimated ? 'opacity-100 tracking-[.2em]' : 'opacity-0 tracking-tighter'}`}>
                        Regalado & Regalado
                    </h1>
                </div>
            </main>
        </div>
    );
};

export default AdminHome;