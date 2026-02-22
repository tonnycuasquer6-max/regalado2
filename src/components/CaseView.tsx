import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// --- Iconos Premium ---
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const statusStyles: any = {
    'abierto': 'bg-green-500 text-green-100',
    'pendiente': 'bg-yellow-500 text-yellow-100',
    'cerrado': 'bg-zinc-700 text-zinc-100',
};

// --- Componente Tarjeta Censurable ---
const CaseCard: React.FC<{ 
    caseItem: any; 
    isAssigned: boolean; 
    personalInfoStatus: string | null; 
    caseAccessStatus: string | null;
    onRequestInfo: (clientId: string) => void;
    onRequestCase: (clientId: string, caseId: string) => void;
    actionLoading: boolean;
}> = ({ caseItem, isAssigned, personalInfoStatus, caseAccessStatus, onRequestInfo, onRequestCase, actionLoading }) => {
    
    // Reglas de Desbloqueo (La magia de la censura)
    const showPersonal = isAssigned || personalInfoStatus === 'aprobado';
    const showCase = isAssigned || caseAccessStatus === 'aprobado';

    const clientName = showPersonal ? `${caseItem.cliente?.primer_nombre} ${caseItem.cliente?.primer_apellido}` : '********* *********';
    const caseTitle = showCase ? caseItem.titulo : 'CASO ******************';
    const caseDesc = showCase ? caseItem.descripcion : '*********************************************************************************************************';

    return (
        <div className={`bg-black border p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${showCase ? 'border-green-900/50 hover:border-green-500' : 'border-zinc-800'}`}>
            {/* Barra lateral de estado de desbloqueo */}
            <div className={`absolute left-0 top-0 w-1 h-full ${showCase ? 'bg-green-500' : showPersonal ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            
            <div className="pl-2">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center">
                        {showCase ? <UnlockIcon /> : <LockIcon />}
                        {caseTitle}
                    </h3>
                    {showCase && (
                        <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded ${statusStyles[caseItem.estado] || 'bg-zinc-700 text-zinc-300'}`}>
                            {caseItem.estado}
                        </span>
                    )}
                </div>

                <div className="mb-4">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-1">Cliente</p>
                    <p className={`text-sm ${showPersonal ? 'text-white font-bold' : 'text-zinc-600 font-mono'}`}>
                        {clientName}
                    </p>
                </div>

                <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-1">Descripción</p>
                    <p className={`text-xs leading-relaxed line-clamp-3 ${showCase ? 'text-zinc-300' : 'text-zinc-700 font-mono'}`}>
                        {caseDesc}
                    </p>
                </div>
            </div>

            {/* --- ZONA DE BOTONES DE PETICIÓN (LÓGICA DE 2 PASOS) --- */}
            {!showCase && (
                <div className="mt-6 pt-4 border-t border-zinc-900 pl-2">
                    
                    {/* PASO 1: Pedir Información Personal */}
                    {!showPersonal ? (
                        personalInfoStatus === 'pendiente' ? (
                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest flex items-center">
                                <ClockIcon /> Permiso de Info Pendiente
                            </span>
                        ) : personalInfoStatus === 'rechazado' ? (
                            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Petición Denegada</span>
                        ) : (
                            <button 
                                onClick={() => onRequestInfo(caseItem.cliente_id)}
                                disabled={actionLoading}
                                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 py-2 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                Pedir Acceso a Información
                            </button>
                        )
                    ) : (
                        /* PASO 2: Pedir Acceso al Caso (Solo si el paso 1 ya se aprobó) */
                        caseAccessStatus === 'pendiente' ? (
                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest flex items-center">
                                <ClockIcon /> Permiso de Caso Pendiente
                            </span>
                        ) : caseAccessStatus === 'rechazado' ? (
                            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Petición de Caso Denegada</span>
                        ) : (
                            <button 
                                onClick={() => onRequestCase(caseItem.cliente_id, caseItem.id)}
                                disabled={actionLoading}
                                className="w-full bg-yellow-900/30 hover:bg-yellow-900/50 text-yellow-500 border border-yellow-900 py-2 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                            >
                                Pedir Acceso al Caso
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
};


// --- VISTA PRINCIPAL ---
const CaseView: React.FC<{ title: string }> = ({ title }) => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [cases, setCases] = useState<any[]>([]);
    
    // Control de accesos
    const [assignedCaseIds, setAssignedCaseIds] = useState<string[]>([]);
    const [petitions, setPetitions] = useState<any[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");
            setCurrentUser(user);

            // 2. Traer todos los casos con el nombre del cliente
            const { data: casesData, error: casesError } = await supabase
                .from('cases')
                .select('*, cliente:profiles!cliente_id(primer_nombre, primer_apellido)')
                .order('created_at', { ascending: false });
            if (casesError) throw casesError;
            setCases(casesData || []);

            // 3. Traer asignaciones directas de este trabajador
            const { data: assignments } = await supabase
                .from('asignaciones_casos')
                .select('case_id')
                .eq('abogado_id', user.id);
            setAssignedCaseIds(assignments ? assignments.map(a => a.case_id) : []);

            // 4. Traer historial de peticiones de este trabajador
            const { data: userPetitions } = await supabase
                .from('peticiones_acceso')
                .select('*')
                .eq('trabajador_id', user.id);
            setPetitions(userPetitions || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- FUNCIONES PARA PEDIR ACCESO ---
    const handleRequestInfo = async (clientId: string) => {
        setActionLoading(true);
        const { error } = await supabase.from('peticiones_acceso').insert({
            trabajador_id: currentUser.id,
            cliente_id: clientId,
            tipo: 'info_personal',
            estado: 'pendiente'
        });
        
        if (error) alert(`Error: ${error.message}`);
        else await fetchAllData(); // Recargamos para que salga el relojito "Pendiente"
        
        setActionLoading(false);
    };

    const handleRequestCase = async (clientId: string, caseId: string) => {
        setActionLoading(true);
        const { error } = await supabase.from('peticiones_acceso').insert({
            trabajador_id: currentUser.id,
            cliente_id: clientId,
            caso_id: caseId,
            tipo: 'acceso_caso',
            estado: 'pendiente'
        });
        
        if (error) alert(`Error: ${error.message}`);
        else await fetchAllData();
        
        setActionLoading(false);
    };

    // Funciones helper para saber el estado de las peticiones
    const getPersonalInfoStatus = (clientId: string) => {
        const pet = petitions.find(p => p.cliente_id === clientId && p.tipo === 'info_personal');
        return pet ? pet.estado : null;
    };

    const getCaseAccessStatus = (caseId: string) => {
        const pet = petitions.find(p => p.caso_id === caseId && p.tipo === 'acceso_caso');
        return pet ? pet.estado : null;
    };

    return (
        <div className="font-mono animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h1>
                <button 
                    onClick={fetchAllData} 
                    disabled={loading || actionLoading} 
                    className="text-zinc-500 hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors flex items-center disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
                    Refrescar Datos
                </button>
            </div>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-black border border-zinc-900 p-6 shadow-lg animate-pulse">
                            <div className="h-4 bg-zinc-900 rounded w-1/2 mb-6"></div>
                            <div className="h-3 bg-zinc-900 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-zinc-900 rounded w-full mb-6"></div>
                            <div className="h-8 bg-zinc-900 mt-6"></div>
                        </div>
                    ))}
                </div>
            )}
            
            {error && !loading && (
                <div className="bg-red-950/30 border border-red-900 text-red-400 p-4 text-xs uppercase tracking-widest">
                    <strong className="block mb-1 font-black">Error de Conexión</strong>
                    {error}
                </div>
            )}

            {!loading && !error && cases.length === 0 && (
                 <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500 uppercase tracking-widest text-xs">
                    No existen casos registrados en el sistema.
                </div>
            )}

            {!loading && !error && cases.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cases.map((caseItem) => (
                        <CaseCard 
                            key={caseItem.id} 
                            caseItem={caseItem} 
                            isAssigned={assignedCaseIds.includes(caseItem.id)}
                            personalInfoStatus={getPersonalInfoStatus(caseItem.cliente_id)}
                            caseAccessStatus={getCaseAccessStatus(caseItem.id)}
                            onRequestInfo={handleRequestInfo}
                            onRequestCase={handleRequestCase}
                            actionLoading={actionLoading}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CaseView;