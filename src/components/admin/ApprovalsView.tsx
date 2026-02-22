import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

// --- Iconos para la línea de tiempo ---
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

// --- Sub-Componente Modal Reutilizable ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">{children}</div></div>;
};

interface ApprovalsViewProps {
    setActiveView: (viewConfig: { name: string; params?: any }) => void;
}

const ApprovalsView: React.FC<ApprovalsViewProps> = ({ setActiveView }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados para la Línea de Tiempo dentro de Aprobaciones
    const [activeCaseHistory, setActiveCaseHistory] = useState<any | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<any[]>([]);
    const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; updateId: string }>({ isOpen: false, updateId: '' });
    const [rejectReason, setRejectReason] = useState('');

    const fetchApprovals = async () => {
        setLoading(true);
        const { data: updatesData } = await supabase
            .from('case_updates')
            .select(`
                id, created_at, estado_aprobacion,
                perfil:profiles!case_updates_perfil_id_fkey(primer_nombre, primer_apellido, rol),
                caso:cases!case_id(id, titulo, cliente:profiles!cliente_id(primer_nombre, primer_apellido))
            `)
            .eq('estado_aprobacion', 'pendiente');

        const { data: petitionsData } = await supabase
            .from('peticiones_acceso')
            .select(`
                id, tipo, created_at,
                trabajador:profiles!peticiones_acceso_trabajador_id_fkey(primer_nombre, primer_apellido, rol),
                cliente:profiles!peticiones_acceso_cliente_id_fkey(primer_nombre, primer_apellido),
                caso:cases!peticiones_acceso_caso_id_fkey(titulo)
            `)
            .eq('estado', 'pendiente');

        let combined: any[] = [];
        if (updatesData) combined = [...combined, ...updatesData.map(u => ({ ...u, _type: 'update' }))];
        if (petitionsData) combined = [...combined, ...petitionsData.map(p => ({ ...p, _type: 'petition' }))];

        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setNotifications(combined);
        setLoading(false);
    };

    useEffect(() => {
        fetchApprovals();
    }, []);

    // --- FUNCIONES PARA PETICIONES (PERMISOS DE CENSURA) ---
    const handleApprovePetition = async (id: string) => {
        const { error } = await supabase.from('peticiones_acceso').update({ estado: 'aprobado' }).eq('id', id);
        if (!error) setNotifications(prev => prev.filter(n => !(n._type === 'petition' && n.id === id)));
        else alert(error.message);
    };

    const handleRejectPetition = async (id: string) => {
        const { error } = await supabase.from('peticiones_acceso').update({ estado: 'rechazado' }).eq('id', id);
        if (!error) setNotifications(prev => prev.filter(n => !(n._type === 'petition' && n.id === id)));
        else alert(error.message);
    };

    // --- FUNCIONES PARA HISTORIAL DE CASOS (ARCHIVOS SUBIDOS) ---
    const openCaseHistory = async (caso: any) => {
        setActiveCaseHistory(caso);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
        setCaseUpdates(data || []);
    };

    const handleApproveUpdate = async (updateId: string) => {
        await supabase.from('case_updates').update({ estado_aprobacion: 'aprobado', observacion: null }).eq('id', updateId);
        setCaseUpdates(prev => prev.map(u => u.id === updateId ? { ...u, estado_aprobacion: 'aprobado', observacion: null } : u));
        fetchApprovals(); // Refresca la lista de notificaciones de fondo
    };

    const confirmRejectUpdate = async () => {
        if (!rejectReason.trim()) return;
        await supabase.from('case_updates').update({ estado_aprobacion: 'rechazado', observacion: rejectReason }).eq('id', rejectDialog.updateId);
        setCaseUpdates(prev => prev.map(u => u.id === rejectDialog.updateId ? { ...u, estado_aprobacion: 'rechazado', observacion: rejectReason } : u));
        setRejectDialog({ isOpen: false, updateId: '' });
        setRejectReason('');
        fetchApprovals(); // Refresca la lista de notificaciones
    };

    const handleDeleteUpdate = async (update: any) => {
        if (!window.confirm("¿Eliminar permanentemente este registro?")) return;
        if (update.file_url) { const path = update.file_url.split('case_files/')[1]; if (path) await supabase.storage.from('case_files').remove([path]); }
        await supabase.from('case_updates').delete().eq('id', update.id);
        setCaseUpdates(prev => prev.filter(u => u.id !== update.id));
        fetchApprovals(); // Refresca la lista
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-mono text-white">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Centro de Aprobaciones</h1>
            </header>

            {loading ? (
                <p className="text-zinc-500">Buscando notificaciones...</p>
            ) : notifications.length === 0 ? (
                <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500">
                    <p>No hay aprobaciones ni peticiones pendientes en este momento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {notifications.map((item) => {
                        
                        // RENDERIZAR NOTIFICACIÓN DE ARCHIVO SUBIDO
                        if (item._type === 'update') {
                            const trabajador = item.perfil;
                            const caso = item.caso;
                            const cliente = caso?.cliente;

                            return (
                                <div key={`upd-${item.id}`} className="bg-zinc-950 border border-yellow-900/30 p-6 relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        <strong className="text-white uppercase">TRABAJADOR: {trabajador?.primer_nombre} {trabajador?.primer_apellido}</strong> requiere aprobación en nuevo archivo cargado con el cliente <strong className="text-white uppercase">{cliente?.primer_nombre} {cliente?.primer_apellido}</strong> en el caso <strong className="text-white uppercase">{caso?.titulo}</strong>.
                                    </p>
                                    
                                    {/* BOTÓN PARA ABRIR EL MODAL DIRECTAMENTE */}
                                    <button 
                                        onClick={() => openCaseHistory(caso)}
                                        className="text-yellow-500 hover:text-yellow-400 text-[10px] uppercase font-bold mt-4 tracking-widest transition-colors"
                                    >
                                        REVISAR REQUERIMIENTO ›
                                    </button>
                                </div>
                            );
                        }

                        // RENDERIZAR NOTIFICACIÓN DE PETICIÓN DE ACCESO (CENSURA)
                        if (item._type === 'petition') {
                            const trabajador = item.trabajador;
                            const cliente = item.cliente;
                            const tipoMsg = item.tipo === 'info_personal' ? 'INFORMACIÓN PERSONAL' : `ACCESO AL CASO: ${item.caso?.titulo}`;

                            return (
                                <div key={`pet-${item.id}`} className="bg-zinc-950 border border-blue-900/30 p-6 relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        <strong className="text-white uppercase">TRABAJADOR: {trabajador?.primer_nombre} {trabajador?.primer_apellido}</strong> solicita acceso a <strong className="text-white uppercase">{tipoMsg}</strong> del cliente <strong className="text-white uppercase">{cliente?.primer_nombre} {cliente?.primer_apellido}</strong>.
                                    </p>
                                    
                                    {/* BOTONES CONECTADOS Y FUNCIONALES */}
                                    <div className="flex gap-6 mt-4">
                                        <button onClick={() => handleApprovePetition(item.id)} className="text-[10px] font-bold uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors">
                                            Aprobar Permiso
                                        </button>
                                        <button onClick={() => handleRejectPetition(item.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">
                                            Denegar
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {/* MODAL HISTORIAL DEL CASO (Incrustado directamente en Aprobaciones) */}
            <Modal isOpen={!!activeCaseHistory} onClose={() => setActiveCaseHistory(null)}>
                {activeCaseHistory && (
                    <div className="flex flex-col h-[85vh]">
                        <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                            <button onClick={() => setActiveCaseHistory(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                ‹ Cerrar Panel
                            </button>
                            <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">PANEL DE REVISIÓN: {activeCaseHistory.titulo}</h2>
                        </div>
                        
                        <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                            {caseUpdates.map((u) => {
                                const isPending = u.estado_aprobacion === 'pendiente';
                                const isRejected = u.estado_aprobacion === 'rechazado';
                                const isApproved = u.estado_aprobacion === 'aprobado';
                                
                                return (
                                    <div key={u.id} className={`relative pl-6 border-l group/item ${isRejected ? 'border-red-900' : 'border-zinc-800'}`}>
                                        <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${isRejected ? 'bg-red-600' : (isPending ? 'bg-yellow-500' : 'bg-green-500')}`}></div>
                                        
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-zinc-600 font-mono">{new Date(u.created_at).toLocaleString()}</p>
                                                {isPending && <span className="bg-yellow-900/30 text-yellow-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Pendiente de Revisión</span>}
                                                {isRejected && <span className="bg-red-900/30 text-red-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Rechazado</span>}
                                                {isApproved && <span className="bg-green-900/30 text-green-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Aprobado</span>}
                                            </div>
                                            
                                            {/* BOTONES DE APROBACIÓN */}
                                            {!isApproved && (
                                                <div className="flex gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity items-center">
                                                    <button onClick={() => handleApproveUpdate(u.id)} className="text-green-600 hover:text-green-400" title="Aprobar"><CheckIcon /></button>
                                                    <button onClick={() => setRejectDialog({ isOpen: true, updateId: u.id })} className="text-red-500 hover:text-red-400" title="Rechazar"><XMarkIcon /></button>
                                                    <button onClick={() => handleDeleteUpdate(u)} className="text-zinc-600 hover:text-red-500 transition-colors ml-2" title="Eliminar"><TrashIcon /></button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                        
                                        {u.file_url && (
                                            <a href={u.file_url} target="_blank" rel="noreferrer" className={`inline-flex items-center text-[10px] bg-zinc-900 border px-3 py-1.5 mt-3 uppercase tracking-widest transition-colors ${isRejected ? 'border-red-900 text-red-400 hover:bg-red-950' : 'border-zinc-800 text-blue-400 hover:bg-zinc-800'}`}>
                                                <DocumentIcon /> {u.file_name}
                                            </a>
                                        )}

                                        {isRejected && u.observacion && (
                                            <div className="mt-3 bg-red-950/30 border border-red-900 p-2 text-xs text-red-400">
                                                <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>
                                                {u.observacion}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL MOTIVO DE RECHAZO */}
            <Modal isOpen={rejectDialog.isOpen} onClose={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Motivo de Rechazo</h2>
                    <div className="mb-8">
                        <div>
                            <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Escribe el motivo para el trabajador</label>
                            <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                        <button type="button" onClick={confirmRejectUpdate} disabled={!rejectReason.trim()} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ApprovalsView;