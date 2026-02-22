import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../services/supabaseClient';

// Vistas compartidas
import TimeBillingMaestro from '../admin/TimeBillingMaestro';
import CaseView from '../CaseView';
import ExpensesView from './ExpensesView';

// --- Iconos ---
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const UnlockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

// --- Sub-Componentes Reutilizables ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">{children}</div></div>;
};

const InputField: React.FC<{ label: string, value: string, onChange: (e: any) => void, type?: string, required?: boolean }> = ({ label, value, onChange, type = 'text', required }) => (
    <div><label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label><input type={type} value={value} onChange={onChange} required={required} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" /></div>
);

// ==========================================
// MÓDULO DE CLIENTES (CENSURA Y PETICIONES)
// ==========================================
const WorkerClientsView: React.FC<{ session: Session }> = ({ session }) => {
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [petitions, setPetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal Crear Cliente (Mismos nombres que Admin)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClientData, setNewClientData] = useState({ primer_nombre: '', primer_apellido: '', cedula: '', email: '' });

    // Modal Historial de Caso
    const [activeCaseHistory, setActiveCaseHistory] = useState<any | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [updateDesc, setUpdateDesc] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        // CORRECCIÓN: Filtrar por 'categoria_usuario' = 'cliente' en lugar de 'rol'
        const { data: clientsData } = await supabase.from('profiles').select('*').eq('categoria_usuario', 'cliente').order('created_at', { ascending: false });
        const { data: casesData } = await supabase.from('cases').select('*');
        const { data: petitionsData } = await supabase.from('peticiones_acceso').select('*').eq('trabajador_id', session.user.id);
        
        setClients(clientsData || []);
        setCases(casesData || []);
        setPetitions(petitionsData || []);
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRequestAccess = async (tipo: 'info_personal' | 'acceso_caso', clientId: string, caseId: string | null = null) => {
        setActionLoading(true);
        const { error } = await supabase.from('peticiones_acceso').insert({
            trabajador_id: session.user.id,
            cliente_id: clientId,
            caso_id: caseId,
            tipo: tipo,
            estado: 'pendiente'
        });
        if (error) alert(error.message);
        else await fetchData();
        setActionLoading(false);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        const { error } = await supabase.from('profiles').insert({
            ...newClientData,
            rol: 'cliente',
            categoria_usuario: 'cliente',
            estado_aprobacion: 'pendiente',
            creado_por: session.user.id
        });
        if (error) alert(error.message);
        else {
            setIsCreateModalOpen(false);
            setNewClientData({ primer_nombre: '', primer_apellido: '', cedula: '', email: '' });
            await fetchData();
        }
        setActionLoading(false);
    };

    const openCaseHistory = async (caso: any) => {
        setActiveCaseHistory(caso);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
        setCaseUpdates(data || []);
    };

    const handleAddUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseHistory || (!updateDesc.trim() && !uploadFile)) return;
        setActionLoading(true);
        let final_url = null, final_name = null;

        if (uploadFile) {
            const filePath = `${activeCaseHistory.id}/${Date.now()}_${uploadFile.name}`;
            const { error: uploadError } = await supabase.storage.from('case_files').upload(filePath, uploadFile);
            if (!uploadError) { const { data } = supabase.storage.from('case_files').getPublicUrl(filePath); final_url = data.publicUrl; final_name = uploadFile.name; }
        }

        await supabase.from('case_updates').insert([{ case_id: activeCaseHistory.id, descripcion: updateDesc, file_url: final_url, file_name: final_name, estado_aprobacion: 'pendiente', perfil_id: session.user.id }]);
        setUpdateDesc(''); setUploadFile(null); openCaseHistory(activeCaseHistory);
        setActionLoading(false);
    };

    if (loading) return <div className="text-center p-12 text-zinc-500 animate-pulse">Cargando base de datos segura...</div>;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Directorio de Clientes</h1>
                    <p className="text-zinc-500 text-xs tracking-widest mt-1">Datos protegidos por protocolo Zero-Trust</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors uppercase text-xs tracking-widest">
                    <PlusCircleIcon /> Nuevo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {clients.map(client => {
                    const infoPet = petitions.find(p => p.cliente_id === client.id && p.tipo === 'info_personal');
                    const hasInfoAccess = infoPet?.estado === 'aprobado';
                    const isPendingClient = client.estado_aprobacion === 'pendiente';

                    const clientCases = cases.filter(c => c.cliente_id === client.id);

                    return (
                        <div key={client.id} className={`bg-black border border-zinc-800 p-6 flex flex-col relative overflow-hidden transition-all ${isPendingClient ? 'opacity-50 grayscale' : ''}`}>
                            {isPendingClient && (
                                <div className="absolute top-4 right-4 bg-yellow-900/50 text-yellow-500 border border-yellow-900 px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                                    En Revisión de Admin
                                </div>
                            )}

                            {/* Cabecera del Cliente */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden">
                                        <UserIcon className="w-6 h-6 text-zinc-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
                                            {hasInfoAccess ? <UnlockIcon /> : <LockIcon />}
                                            {client.primer_nombre} {client.primer_apellido}
                                        </h3>
                                        <p className="text-zinc-500 text-xs font-mono mt-1">
                                            {hasInfoAccess ? `${client.cedula} | ${client.email}` : '***-******-* | *********@***.***'}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Botón Pedir Acceso a Información */}
                                {!hasInfoAccess && !isPendingClient && (
                                    <div>
                                        {infoPet?.estado === 'pendiente' ? (
                                            <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">⏳ Revisando</span>
                                        ) : infoPet?.estado === 'rechazado' ? (
                                            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">Denegado</span>
                                        ) : (
                                            <button onClick={() => handleRequestAccess('info_personal', client.id)} disabled={actionLoading} className="bg-white hover:bg-zinc-300 text-black py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50">
                                                Pedir Acceso
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Casos del Cliente (Solo visibles si tiene acceso a la info) */}
                            {hasInfoAccess && (
                                <div className="border-t border-zinc-900 pt-4 flex-grow">
                                    <h4 className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mb-4">Casos Vinculados</h4>
                                    {clientCases.length === 0 ? <p className="text-xs text-zinc-600 italic">No hay casos registrados.</p> : (
                                        <div className="space-y-3">
                                            {clientCases.map(c => {
                                                const casePet = petitions.find(p => p.caso_id === c.id && p.tipo === 'acceso_caso');
                                                const hasCaseAccess = casePet?.estado === 'aprobado';

                                                return (
                                                    <div key={c.id} className="bg-zinc-950 p-4 border border-zinc-800 flex justify-between items-center group">
                                                        <div>
                                                            <h5 className="font-bold text-sm text-white uppercase tracking-widest flex items-center gap-2">
                                                                {hasCaseAccess ? <UnlockIcon /> : <LockIcon />} {c.titulo}
                                                            </h5>
                                                            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">{c.descripcion}</p>
                                                        </div>
                                                        <div>
                                                            {hasCaseAccess ? (
                                                                <button onClick={() => openCaseHistory(c)} className="text-green-500 hover:text-green-400 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-green-900/50 px-3 py-1">
                                                                    Abrir Caso ›
                                                                </button>
                                                            ) : (
                                                                casePet?.estado === 'pendiente' ? <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest">⏳ Revisando</span> :
                                                                <button onClick={() => handleRequestAccess('acceso_caso', client.id, c.id)} disabled={actionLoading} className="text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all border border-zinc-700 px-3 py-1">
                                                                    Pedir Acceso
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* MODAL CREAR CLIENTE (Nombres iguales a Admin) */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                <form onSubmit={handleCreateClient} className="p-8">
                    <h2 className="text-xl font-bold mb-2 italic tracking-widest uppercase text-white">Registrar Nuevo Cliente</h2>
                    <p className="text-zinc-500 text-xs mb-8">El perfil requerirá aprobación del Administrador.</p>
                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="Nombre" value={newClientData.primer_nombre} onChange={(e: any) => setNewClientData({...newClientData, primer_nombre: e.target.value})} required />
                        <InputField label="Apellido" value={newClientData.primer_apellido} onChange={(e: any) => setNewClientData({...newClientData, primer_apellido: e.target.value})} required />
                        <InputField label="Cédula" value={newClientData.cedula} onChange={(e: any) => setNewClientData({...newClientData, cedula: e.target.value})} required />
                        <InputField label="Email" type="email" value={newClientData.email} onChange={(e: any) => setNewClientData({...newClientData, email: e.target.value})} required />
                    </div>
                    <div className="mt-8 flex justify-end gap-4 border-t border-zinc-900 pt-6">
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Enviar a Revisión</button>
                    </div>
                </form>
            </Modal>

            {/* MODAL HISTORIAL DEL CASO */}
            <Modal isOpen={!!activeCaseHistory} onClose={() => setActiveCaseHistory(null)}>
                {activeCaseHistory && (
                    <div className="flex flex-col h-[85vh]">
                        <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                            <button onClick={() => setActiveCaseHistory(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                ‹ Cerrar Historial
                            </button>
                            <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">CASO: {activeCaseHistory.titulo}</h2>
                        </div>
                        <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                            {caseUpdates.map((u) => (
                                <div key={u.id} className="relative pl-6 border-l border-zinc-800">
                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${u.estado_aprobacion === 'pendiente' ? 'bg-yellow-500' : u.estado_aprobacion === 'rechazado' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                    <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleString()}</p>
                                    {u.estado_aprobacion === 'pendiente' && <span className="text-yellow-500 text-[8px] uppercase tracking-widest font-black block mb-2">Pendiente de Aprobación</span>}
                                    {u.estado_aprobacion === 'rechazado' && <div className="text-red-500 text-[8px] uppercase tracking-widest font-black mb-2 p-2 border border-red-900/50 bg-red-950/20">Rechazado: {u.observacion}</div>}
                                    <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                    {u.file_url && (
                                        <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                            <DocumentIcon /> {u.file_name}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                            <form onSubmit={handleAddUpdate} className="flex flex-col gap-3">
                                <div className="flex items-end gap-3">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files![0])} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${uploadFile ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}><PaperClipIcon /></button>
                                    <input type="text" placeholder="Registrar actualización..." className="flex-grow bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none transition-colors" value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} required />
                                    <button disabled={actionLoading} className="bg-white text-black font-black px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">
                                        Enviar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ==========================================
// COMPONENTE PRINCIPAL DEL DASHBOARD
// ==========================================
const UserIcon = ({ className = "w-5 h-5" }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

const WorkerDashboard: React.FC<{ session: Session }> = ({ session }) => {
    const [activeView, setActiveView] = useState('HOME');
    const [isAnimated, setIsAnimated] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
        if (activeView === 'HOME') {
            setIsAnimated(false);
            const timer = setTimeout(() => setIsAnimated(true), 1200);
            return () => clearTimeout(timer);
        }
    }, [activeView]);

    const renderContent = () => {
        switch (activeView) {
            case 'CLIENTS':
                return <WorkerClientsView session={session} />;
            case 'ASSIGNED_CASES':
                return <CaseView title="Mis Casos Asignados" />;
            case 'TIME_BILLING':
                return <TimeBillingMaestro onCancel={() => setActiveView('HOME')} />;
            case 'EXPENSES':
                return <ExpensesView />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-mono">
            
            {/* --- HEADER HORIZONTAL PREMIUM (Centrado y Letras más grandes) --- */}
            <header className="flex justify-between items-center p-6 bg-black sticky top-0 z-50">
                {/* LOGO */}
                <div 
                    className="font-black text-2xl tracking-[0.3em] cursor-pointer hover:text-zinc-300 transition-colors w-32"
                    onClick={() => setActiveView('HOME')}
                >
                    R&R
                </div>
                
                {/* Menú Centrado */}
                <nav className="hidden md:flex flex-grow justify-center gap-8 lg:gap-16">
                    {[
                        { id: 'CLIENTS', label: 'Clientes' },
                        { id: 'ASSIGNED_CASES', label: 'Casos Asignados' },
                        { id: 'TIME_BILLING', label: 'Time Billing' },
                        { id: 'EXPENSES', label: 'Gastos' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`text-base lg:text-lg uppercase font-black tracking-[0.2em] transition-all ${activeView === item.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-300'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Controles Derecha (Campana y Perfil) */}
                <div className="flex items-center justify-end gap-6 w-32 relative">
                    <button className="text-zinc-500 hover:text-white transition-colors relative">
                        <BellIcon />
                        {/* Puntito rojo simulado para notificaciones */}
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)} 
                            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center hover:border-zinc-400 transition-colors overflow-hidden"
                        >
                            <UserIcon className="w-6 h-6 text-zinc-400" />
                        </button>

                        {/* Menú Desplegable Perfil - SE OCULTA AL HACER CLIC */}
                        {profileMenuOpen && (
                            <div className="absolute right-0 mt-4 w-48 bg-black border border-zinc-800 shadow-2xl z-50 flex flex-col">
                                <div className="p-4 border-b border-zinc-900">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Sesión activa</p>
                                    <p className="text-xs font-bold text-white truncate">{session.user.email}</p>
                                </div>
                                <button 
                                    onClick={() => setProfileMenuOpen(false)} 
                                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                                >
                                    Perfil
                                </button>
                                <button 
                                    onClick={() => { setProfileMenuOpen(false); supabase.auth.signOut(); }} 
                                    className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-950/30 transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Navegación Móvil */}
            <nav className="md:hidden flex overflow-x-auto border-b border-zinc-900 bg-zinc-950 p-4 gap-6 [&::-webkit-scrollbar]:hidden">
                {[
                    { id: 'CLIENTS', label: 'Clientes' },
                    { id: 'ASSIGNED_CASES', label: 'Casos' },
                    { id: 'TIME_BILLING', label: 'Time Billing' },
                    { id: 'EXPENSES', label: 'Gastos' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`text-xs uppercase font-bold tracking-[0.2em] whitespace-nowrap transition-colors ${activeView === item.id ? 'text-white' : 'text-zinc-600'}`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* --- ÁREA DE CONTENIDO PRINCIPAL --- */}
            <main className="flex-grow flex flex-col relative">
                {activeView === 'HOME' ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center font-black text-4xl sm:text-6xl relative h-20 w-full flex items-center justify-center">
                            <h1 className={`absolute transition-all duration-1000 ease-in-out ${isAnimated ? 'opacity-0 -tracking-tighter' : 'opacity-100 tracking-[1em]'}`}>
                                R&R
                            </h1>
                            <h1 className={`absolute transition-all duration-1000 ease-in-out ${isAnimated ? 'opacity-100 tracking-[.2em]' : 'opacity-0 tracking-tighter'}`}>
                                Regalado & Regalado
                            </h1>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto flex-grow flex flex-col">
                        {renderContent()}
                    </div>
                )}
            </main>
        </div>
    );
};

export default WorkerDashboard;