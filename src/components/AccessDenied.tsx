
import React from 'react';
import { supabase } from '../services/supabaseClient';

const AccessDenied: React.FC = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
            <div className="text-center p-8 border border-red-700 rounded-lg bg-red-900 bg-opacity-30 shadow-xl max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-lg text-zinc-300 mb-8">
                    No tiene los permisos necesarios para acceder a este recurso o su rol no está definido. 
                    Por favor, contacte al administrador.
                </p>
                <button
                    onClick={handleLogout}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
};

export default AccessDenied;
