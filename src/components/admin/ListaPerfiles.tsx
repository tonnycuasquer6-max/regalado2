import React, { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { PencilIcon, TrashIcon, SearchIcon } from '../shared/Icons';

const PlusCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const DocumentAssignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

interface Profile { id: string; primer_nombre: string; primer_apellido: string; cedula: string; email: string; foto_url: string | null; rol: string; categoria_usuario: 'abogado' | 'estudiante' | 'cliente'; }
interface Case { id: string; created_at: string; titulo: string; descripcion: string; estado: string; cliente_id: string; }
interface CaseUpdate { id: string; created_at: string; descripcion: string; file_url: string | null; file_name: string | null; estado_aprobacion: string; observacion: string | null; }

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">{children}</div></div>;
};

const InputField: React.FC<{ label: string, value: string, onChange: (e: any) => void, type?: string, required?: boolean }> = ({ label, value, onChange, type = 'text', required }) => (
    <div><label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label><input type={type} value={value} onChange={onChange} required={required} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" /></div>
);

const ListaPerfiles: React.FC<{ role: 'abogado' | 'estudiante' | 'cliente'; onCancel: () => void }> = ({ role, onCancel }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
    const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<Profile>>({});
    const [createCaseClient, setCreateCaseClient] = useState<Profile | null>(null);
    const [caseTitle, setCaseTitle] = useState('');
    const [caseDesc, setCaseDesc] = useState('');
    
    const [viewCasesClient, setViewCasesClient] = useState<Profile | null>(null);
    const [clientCases, setClientCases] = useState<Case[]>([]);
    const [activeCaseHistory, setActiveCaseHistory] = useState<Case | null>(null);
    const [caseUpdates, setCaseUpdates] = useState<CaseUpdate[]>([]);
    const [loadingUpdates, setLoadingUpdates] = useState(false);
    
    const [editingUpdate, setEditingUpdate] = useState<CaseUpdate | null>(null);
    const [updateDesc, setUpdateDesc] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadingUpdate, setUploadingUpdate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [assignLawyer, setAssignLawyer] = useState<Profile | null>(null);
    const [allClients, setAllClients] = useState<Profile[]>([]);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [selectedAssignClient, setSelectedAssignClient] = useState<Profile | null>(null);
    const [assignCasesList, setAssignCasesList] = useState<Case[]>([]);
    const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

    const [viewAssignedProfile, setViewAssignedProfile] = useState<Profile | null>(null);
    const [assignedClientsDict, setAssignedClientsDict] = useState<{ [key: string]: { client: Profile, cases: Case[] } }>({});
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; updateId: string }>({ isOpen: false, updateId: '' });
    const [rejectReason, setRejectReason] = useState('');

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('profiles').select('*').eq('categoria_usuario', role);
        setProfiles(data || []);
        setLoading(false);
    }, [role]);

    useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

    const handleUpdateProfile = async (e: React.FormEvent) => { e.preventDefault(); if (!profileToEdit) return; setActionLoading(true); const { data } = await supabase.from('profiles').update(editFormData).eq('id', profileToEdit.id).select().single(); if (data) { setProfiles(prev => prev.map(p => (p.id === data.id ? data : p))); setProfileToEdit(null); } setActionLoading(false); };
    
    const handleDeleteProfile = async () => { 
        if (!profileToDelete) return; 
        setActionLoading(true); 
        const { error } = await supabase.from('profiles').delete().eq('id', profileToDelete.id); 
        if (error) {
            alert(`No se puede eliminar: El perfil aún tiene casos vinculados.`);
        } else {
            setProfiles(prev => prev.filter(p => p.id !== profileToDelete.id)); 
        }
        setProfileToDelete(null); 
        setActionLoading(false); 
    };
    
    const handleCreateCase = async (e: React.FormEvent) => { e.preventDefault(); if (!createCaseClient || !caseTitle) return; setActionLoading(true); const { error } = await supabase.from('cases').insert([{ titulo: caseTitle, descripcion: caseDesc, cliente_id: createCaseClient.id, estado: 'abierto' }]); if (!error) setCreateCaseClient(null); else alert(error.message); setActionLoading(false); };

    const handleOpenViewCases = async (client: Profile) => {
        setViewCasesClient(client);
        const { data } = await supabase.from('cases').select('*').eq('cliente_id', client.id).order('created_at', { ascending: false });
        setClientCases(data || []);
    };

    const handleOpenCaseHistory = async (caso: Case) => {
        setActiveCaseHistory(caso);
        setLoadingUpdates(true);
        const { data } = await supabase.from('case_updates').select('*').eq('case_id', caso.id).order('created_at', { ascending: false });
        setCaseUpdates(data || []);
        setLoadingUpdates(false);
    };

    const handleAddOrEditUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCaseHistory || (!updateDesc.trim() && !uploadFile)) return;
        setUploadingUpdate(true);
        let final_url = editingUpdate?.file_url || null;
        let final_name = editingUpdate?.file_name || null;

        if (uploadFile) {
            if (editingUpdate?.file_url) { const oldPath = editingUpdate.file_url.split('case_files/')[1]; if (oldPath) await supabase.storage.from('case_files').remove([oldPath]); }
            const fileName = `${Date.now()}_${uploadFile.name}`;
            const filePath = `${activeCaseHistory.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('case_files').upload(filePath, uploadFile);
            if (!uploadError) { const { data } = supabase.storage.from('case_files').getPublicUrl(filePath); final_url = data.publicUrl; final_name = uploadFile.name; }
        }

        const payload = { case_id: activeCaseHistory.id, descripcion: updateDesc, file_url: final_url, file_name: final_name, estado_aprobacion: 'aprobado' };
        const { error } = editingUpdate ? await supabase.from('case_updates').update(payload).eq('id', editingUpdate.id) : await supabase.from('case_updates').insert([payload]);

        if (error) { alert(`Error: ${error.message}`); } else { setUpdateDesc(''); setUploadFile(null); setEditingUpdate(null); handleOpenCaseHistory(activeCaseHistory); }
        setUploadingUpdate(false);
    };

    const handleApproveUpdate = async (updateId: string) => {
        await supabase.from('case_updates').update({ estado_aprobacion: 'aprobado', observacion: null }).eq('id', updateId);
        setCaseUpdates(prev => prev.map(u => u.id === updateId ? { ...u, estado_aprobacion: 'aprobado', observacion: null } : u));
    };

    const confirmRejectUpdate = async () => {
        if (!rejectReason.trim()) return;
        setActionLoading(true);
        const { error } = await supabase.from('case_updates').update({ estado_aprobacion: 'rechazado', observacion: rejectReason }).eq('id', rejectDialog.updateId);
        if (!error) setCaseUpdates(prev => prev.map(u => u.id === rejectDialog.updateId ? { ...u, estado_aprobacion: 'rechazado', observacion: rejectReason } : u));
        
        setRejectDialog({ isOpen: false, updateId: '' });
        setRejectReason('');
        setActionLoading(false);
    };

    const handleDeleteUpdate = (update: CaseUpdate) => {
        setConfirmDialog({
            isOpen: true,
            title: '¿ELIMINAR REGISTRO?',
            message: 'Esta acción eliminará permanentemente este registro de la línea de tiempo.',
            onConfirm: async () => {
                setActionLoading(true);
                if (update.file_url) { const path = update.file_url.split('case_files/')[1]; if (path) await supabase.storage.from('case_files').remove([path]); }
                await supabase.from('case_updates').delete().eq('id', update.id);
                setCaseUpdates(prev => prev.filter(u => u.id !== update.id));
                setActionLoading(false);
            }
        });
    };

    const handleOpenAssignLawyer = async (profile: Profile) => {
        setAssignLawyer(profile);
        setSelectedAssignClient(null);
        setAssignCasesList([]);
        setSelectedCaseIds([]);
        const { data } = await supabase.from('profiles').select('*').eq('categoria_usuario', 'cliente');
        setAllClients(data || []);
    };

    const handleSelectClientForAssignment = async (client: Profile) => {
        setSelectedAssignClient(client);
        const { data: cases } = await supabase.from('cases').select('*').eq('cliente_id', client.id);
        setAssignCasesList(cases || []);
        const { data: misAsignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', assignLawyer?.id);
        setSelectedCaseIds(misAsignaciones ? misAsignaciones.map(a => a.case_id) : []);
    };

    const handleSaveAssignments = async () => {
        if (!assignLawyer || !selectedAssignClient) return;
        setActionLoading(true);
        const unassignedCases = assignCasesList.filter(c => !selectedCaseIds.includes(c.id));
        for (let c of unassignedCases) { await supabase.from('asignaciones_casos').delete().match({ case_id: c.id, abogado_id: assignLawyer.id }); }
        for (let caseId of selectedCaseIds) { await supabase.from('asignaciones_casos').insert({ case_id: caseId, abogado_id: assignLawyer.id }); }
        setActionLoading(false);
        setAssignLawyer(null);
    };

    const handleOpenViewAssignedCases = async (profile: Profile) => {
        setViewAssignedProfile(profile);
        setExpandedClientId(null);
        const { data: asignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', profile.id);
        if (asignaciones && asignaciones.length > 0) {
            const caseIds = asignaciones.map(a => a.case_id);
            const { data: cases } = await supabase.from('cases').select('*').in('id', caseIds);
            if (cases && cases.length > 0) {
                const clientIds = [...new Set(cases.map(c => c.cliente_id))];
                const { data: clients } = await supabase.from('profiles').select('*').in('id', clientIds);
                const dict: any = {};
                clients?.forEach(client => { dict[client.id] = { client, cases: cases.filter(c => c.cliente_id === client.id) }; });
                setAssignedClientsDict(dict);
            } else { setAssignedClientsDict({}); }
        } else { setAssignedClientsDict({}); }
    };

    const handleUnassignCase = (e: React.MouseEvent, caseId: string, clientId: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: '¿DESASIGNAR CASO?',
            message: 'Se quitará este caso de la lista del personal asignado.',
            onConfirm: async () => {
                setActionLoading(true);
                await supabase.from('asignaciones_casos').delete().match({ case_id: caseId, abogado_id: viewAssignedProfile?.id });
                setAssignedClientsDict(prev => {
                    const newDict = { ...prev };
                    if (newDict[clientId]) {
                        const newCases = newDict[clientId].cases.filter(c => c.id !== caseId);
                        if (newCases.length === 0) delete newDict[clientId];
                        else newDict[clientId] = { ...newDict[clientId], cases: newCases };
                    }
                    return newDict;
                });
                setActionLoading(false);
            }
        });
    };

    const handleUnassignClient = (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: '¿DESASIGNAR CLIENTE?',
            message: 'Se quitarán TODOS los casos de este cliente de la lista.',
            onConfirm: async () => {
                setActionLoading(true);
                const casesToRemove = assignedClientsDict[clientId]?.cases || [];
                setAssignedClientsDict(prev => {
                    const newDict = { ...prev };
                    delete newDict[clientId];
                    return newDict;
                });
                for (let c of casesToRemove) {
                    await supabase.from('asignaciones_casos').delete().match({ case_id: c.id, abogado_id: viewAssignedProfile?.id });
                }
                setActionLoading(false);
            }
        });
    };

    const filteredProfiles = profiles.filter(p => { const term = searchTerm.toLowerCase(); return (p.primer_nombre + ' ' + p.primer_apellido).toLowerCase().includes(term) || (p.cedula && p.cedula.toLowerCase().includes(term)); });
    const filteredAssignClients = allClients.filter(p => (p.primer_nombre + ' ' + p.primer_apellido).toLowerCase().includes(clientSearchTerm.toLowerCase()));

    return (
        <Fragment>
            <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-mono text-white">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                    <h1 className="text-3xl font-black uppercase tracking-tighter italic">Perfiles: {role.toUpperCase()}S</h1>
                    <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>
                </header>

                <div className="relative flex items-center mb-8">
                    <SearchIcon className="absolute left-0 h-5 w-5 text-zinc-600 pointer-events-none" />
                    <input type="text" placeholder="Buscar por nombre o cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent pl-8 pb-2 text-white placeholder-zinc-700 focus:outline-none border-b border-zinc-800 focus:border-zinc-500 transition-colors" />
                </div>

                <div className="bg-black border border-zinc-900 divide-y divide-zinc-900">
                    {filteredProfiles.map(p => (
                        <div key={p.id} className="group flex items-center p-4 hover:bg-zinc-900/50 transition-colors">
                            <img src={p.foto_url || 'https://via.placeholder.com/150'} className="w-14 h-14 rounded-full border-2 border-zinc-800 object-cover" />
                            <div className="ml-6 flex-grow">
                                <p className="text-lg font-bold">{p.primer_nombre} {p.primer_apellido}</p>
                                <p className="text-sm text-zinc-500">{p.cedula} | {p.email}</p>
                            </div>
                            <div className="flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                {role === 'cliente' && (
                                    <>
                                        <button onClick={() => handleOpenViewCases(p)} className="text-zinc-500 hover:text-blue-500 transition-colors" title="Ver Casos"><EyeIcon /></button>
                                        <button onClick={() => {setCreateCaseClient(p); setCaseTitle(''); setCaseDesc('');}} className="text-zinc-500 hover:text-green-400 transition-colors" title="Nuevo Caso"><PlusCircleIcon /></button>
                                    </>
                                )}
                                {(role === 'abogado' || role === 'estudiante') && (
                                    <>
                                        <button onClick={() => handleOpenViewAssignedCases(p)} className="text-zinc-500 hover:text-blue-500 transition-colors" title="Ver Casos Asignados"><EyeIcon /></button>
                                        <button onClick={() => handleOpenAssignLawyer(p)} className="text-zinc-500 hover:text-green-500 transition-colors" title="Asignar Cliente/Caso"><DocumentAssignIcon /></button>
                                    </>
                                )}
                                <button onClick={() => {setProfileToEdit(p); setEditFormData(p);}} className="text-zinc-500 hover:text-white transition-colors" title="Editar Perfil"><PencilIcon /></button>
                                <button onClick={() => setProfileToDelete(p)} className="text-zinc-500 hover:text-red-500 transition-colors" title="Eliminar Perfil"><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={!!viewCasesClient || !!viewAssignedProfile} onClose={() => { setViewCasesClient(null); setViewAssignedProfile(null); setActiveCaseHistory(null); setEditingUpdate(null); }}>
                {!activeCaseHistory ? (
                    <div className="p-8 flex flex-col h-full max-h-[85vh]">
                        <div className="flex flex-col mb-6">
                            <button onClick={() => {setViewCasesClient(null); setViewAssignedProfile(null);}} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.3em] mb-4 w-fit flex items-center gap-2 transition-colors">
                                ‹ Volver a Clientes
                            </button>
                            <h2 className="text-xl font-bold italic tracking-widest uppercase text-white">
                                {viewCasesClient ? `CASOS DE ${viewCasesClient.primer_nombre}` : `CASOS ASIGNADOS: ${viewAssignedProfile?.primer_nombre}`}
                            </h2>
                            <p className="text-zinc-500 text-[10px] uppercase mt-2 tracking-widest">Doble clic en el caso para ver historial</p>
                        </div>
                        
                        <div className={`space-y-4 flex-grow pr-2 ${scrollbarStyle}`}>
                            
                            {viewCasesClient && clientCases.map(c => (
                                <div key={c.id} onDoubleClick={() => handleOpenCaseHistory(c)} className="bg-zinc-900 border border-zinc-800 p-5 hover:border-zinc-500 cursor-pointer transition-colors relative">
                                    <span className="absolute top-4 right-4 text-[10px] font-black uppercase bg-zinc-800 px-2 py-1 text-zinc-400">{c.estado}</span>
                                    <h3 className="text-lg font-bold">{c.titulo}</h3>
                                    <p className="text-sm text-zinc-400 line-clamp-2 mt-2">{c.descripcion}</p>
                                </div>
                            ))}

                            {/* VISTA CASCADA: LA SOLUCIÓN DEFINITIVA A LOS RECUADROS */}
                            {viewAssignedProfile && Object.values(assignedClientsDict).length === 0 && <p className="text-zinc-500">No hay casos asignados.</p>}
                            {viewAssignedProfile && Object.values(assignedClientsDict).map(({client, cases}) => (
                                <div key={client.id} className="bg-zinc-950 mb-4">
                                    
                                    {/* Aplicamos hover al padre (flex) para que toda la fila cambie de color sin recuadros */}
                                    <div className="flex bg-zinc-900 group items-center pr-6 hover:bg-zinc-800 transition-colors">
                                        <div onClick={() => setExpandedClientId(expandedClientId === client.id ? null : client.id)} className="flex-grow p-4 cursor-pointer">
                                            <h3 className="font-bold text-white uppercase tracking-widest">CLIENTE: {client.primer_nombre} {client.primer_apellido}</h3>
                                            <span className="text-zinc-500 text-xs">{cases.length} caso(s) asignado(s)</span>
                                        </div>
                                        <button type="button" onClick={(e) => handleUnassignClient(e, client.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 z-10 relative" title="Desasignar todos los casos">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                    
                                    {expandedClientId === client.id && (
                                        <div>
                                            {cases.map(c => (
                                                /* Aplicamos hover al padre (flex) para que toda la fila cambie de color sin recuadros */
                                                <div key={c.id} className="flex bg-black group/case items-center pr-6 hover:bg-zinc-900 transition-colors">
                                                    <div className="flex-grow p-4 pl-8 cursor-pointer" onDoubleClick={() => handleOpenCaseHistory(c)}>
                                                        <h4 className="font-bold text-sm text-white">{c.titulo}</h4>
                                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{c.descripcion}</p>
                                                    </div>
                                                    <button type="button" onClick={(e) => handleUnassignCase(e, c.id, client.id)} className="p-2 text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover/case:opacity-100 z-10 relative" title="Desasignar solo este caso">
                                                        <XMarkIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <Fragment>
                        {viewCasesClient && (
                            <div className="flex flex-col h-[85vh]">
                                <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                                    <button onClick={() => {setActiveCaseHistory(null); setEditingUpdate(null);}} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                        ‹ Volver a la Lista
                                    </button>
                                    <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">HISTORIAL: {activeCaseHistory.titulo}</h2>
                                </div>
                                <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                                    {loadingUpdates ? <p className="text-zinc-500 text-sm">Cargando historial...</p> : 
                                        caseUpdates.filter(u => u.estado_aprobacion === 'aprobado' || !u.estado_aprobacion).length === 0 ? <p className="text-zinc-600 text-sm italic">El historial visible está vacío.</p> :
                                        caseUpdates.filter(u => u.estado_aprobacion === 'aprobado' || !u.estado_aprobacion).map((u) => (
                                            <div key={u.id} className="relative pl-6 border-l border-zinc-800 group/item">
                                                <div className="absolute w-2 h-2 bg-zinc-700 rounded-full -left-[5px] top-1.5 ring-4 ring-black"></div>
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[10px] text-zinc-600 font-mono mb-1">{new Date(u.created_at).toLocaleString()}</p>
                                                    <div className="flex gap-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => { setEditingUpdate(u); setUpdateDesc(u.descripcion); }} className="text-zinc-600 hover:text-white transition-colors" title="Editar"><PencilIcon /></button>
                                                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u); }} className="text-zinc-600 hover:text-red-500 transition-colors" title="Eliminar"><TrashIcon /></button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-zinc-300 mt-1">{u.descripcion}</p>
                                                {u.file_url && (
                                                    <a href={u.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-zinc-900 border border-zinc-800 px-3 py-1.5 mt-3 text-blue-400 hover:bg-zinc-800 uppercase tracking-widest transition-colors">
                                                        <DocumentIcon /> {u.file_name}
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                                <div className="p-4 bg-zinc-950 border-t border-zinc-900">
                                    <form onSubmit={handleAddOrEditUpdate} className="flex flex-col gap-3">
                                        {editingUpdate && <div className="text-[10px] text-yellow-500 uppercase font-black tracking-widest px-2">Modificando Registro... <button type="button" onClick={() => {setEditingUpdate(null); setUpdateDesc('');}} className="ml-4 text-zinc-500 hover:text-white">Cancelar</button></div>}
                                        <div className="flex items-end gap-3">
                                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setUploadFile(e.target.files![0])} />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${uploadFile ? 'text-green-500' : 'text-zinc-500 hover:text-white'}`}><PaperClipIcon /></button>
                                            <input type="text" placeholder="Registrar actualización directa..." className="flex-grow bg-transparent border-b border-zinc-800 py-2 text-white focus:outline-none transition-colors" value={updateDesc} onChange={(e) => setUpdateDesc(e.target.value)} />
                                            <button disabled={uploadingUpdate} className="bg-white text-black font-black px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-300 transition-colors disabled:opacity-50">
                                                {uploadingUpdate ? '...' : (editingUpdate ? 'Guardar' : 'Enviar')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {viewAssignedProfile && (
                            <div className="flex flex-col h-[85vh]">
                                <div className="p-6 bg-zinc-950 border-b border-zinc-900">
                                    <button onClick={() => setActiveCaseHistory(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors">
                                        ‹ Volver a la Lista
                                    </button>
                                    <h2 className="text-lg font-bold italic tracking-widest uppercase text-white">PANEL DE REVISIÓN: {activeCaseHistory.titulo}</h2>
                                </div>
                                
                                <div className={`p-6 flex-grow bg-black space-y-8 ${scrollbarStyle}`}>
                                    {loadingUpdates ? <p className="text-zinc-500 text-sm">Cargando historial...</p> : caseUpdates.length === 0 ? <p className="text-zinc-600 text-sm italic">No hay actividad para revisar en este caso.</p> : (
                                        caseUpdates.map((u) => {
                                            const status = u.estado_aprobacion || 'pendiente';
                                            const isPending = status === 'pendiente';
                                            const isRejected = status === 'rechazado';
                                            const isApproved = status === 'aprobado';
                                            
                                            return (
                                                <div key={u.id} className={`relative pl-6 border-l group/item ${isRejected ? 'border-red-900' : 'border-zinc-800'}`}>
                                                    <div className={`absolute w-2 h-2 rounded-full -left-[5px] top-1.5 ring-4 ring-black ${isRejected ? 'bg-red-600' : (isPending ? 'bg-yellow-500' : 'bg-green-500')}`}></div>
                                                    
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] text-zinc-600 font-mono">{new Date(u.created_at).toLocaleString()}</p>
                                                            {isPending && <span className="bg-yellow-900/30 text-yellow-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Pendiente de Revisión</span>}
                                                            {isRejected && <span className="bg-red-900/30 text-red-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Rechazado (En Corrección)</span>}
                                                            {isApproved && <span className="bg-green-900/30 text-green-500 text-[8px] uppercase px-1 py-0.5 rounded font-bold">Aprobado</span>}
                                                        </div>
                                                        
                                                        {!isApproved && (
                                                            <div className="flex gap-4 opacity-0 group-hover/item:opacity-100 transition-opacity items-center">
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleApproveUpdate(u.id); }} className="text-green-600 hover:text-green-400" title="Aprobar (Dar Visto)"><CheckIcon /></button>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); setRejectDialog({ isOpen: true, updateId: u.id }); }} className="text-red-500 hover:text-red-400" title="Mandar a corregir (Rechazar)"><XMarkIcon /></button>
                                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u); }} className="text-zinc-600 hover:text-red-500 transition-colors ml-2" title="Eliminar permanentemente"><TrashIcon /></button>
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
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </Fragment>
                )}
            </Modal>

            {/* MODAL: ASIGNAR ABOGADO A CLIENTE/CASOS */}
            <Modal isOpen={!!assignLawyer} onClose={() => setAssignLawyer(null)}>
                <div className="p-8 flex flex-col max-h-[85vh]">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-white">ASIGNAR A: {assignLawyer?.primer_nombre}</h2>
                    
                    {!selectedAssignClient ? (
                        <div className="flex-grow overflow-hidden flex flex-col">
                            <p className="text-zinc-500 text-xs mb-4 uppercase tracking-widest">1. Selecciona un Cliente</p>
                            <input type="text" placeholder="Buscar cliente..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-3 text-white focus:outline-none focus:border-zinc-500 mb-4" />
                            
                            <div className={`space-y-2 pr-2 ${scrollbarStyle}`}>
                                {filteredAssignClients.map(client => (
                                    <div key={client.id} onClick={() => handleSelectClientForAssignment(client)} className="p-4 border border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors flex justify-between items-center group">
                                        <div>
                                            <p className="text-white font-bold">{client.primer_nombre} {client.primer_apellido}</p>
                                            <p className="text-zinc-500 text-xs font-mono">{client.cedula}</p>
                                        </div>
                                        <span className="text-zinc-600 group-hover:text-green-500 transition-colors">Seleccionar ›</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow overflow-hidden flex flex-col">
                            <button onClick={() => setSelectedAssignClient(null)} className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-[0.3em] mb-4 w-fit flex items-center gap-2">‹ Volver a buscar clientes</button>
                            <p className="text-white mb-6">Cliente seleccionado: <span className="font-bold">{selectedAssignClient.primer_nombre}</span></p>
                            <p className="text-zinc-500 text-xs mb-4 uppercase tracking-widest">2. Selecciona los casos para asignar</p>
                            
                            <div className={`space-y-2 pr-2 flex-grow mb-6 ${scrollbarStyle}`}>
                                {assignCasesList.length === 0 && <p className="text-zinc-500 italic">Este cliente no tiene casos registrados.</p>}
                                {assignCasesList.map(c => {
                                    const isSelected = selectedCaseIds.includes(c.id);
                                    return (
                                        <div key={c.id} onClick={() => setSelectedCaseIds(prev => isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id])} className={`p-4 border cursor-pointer transition-colors flex items-center gap-4 ${isSelected ? 'border-green-500 bg-green-900/10' : 'border-zinc-800 hover:bg-zinc-900'}`}>
                                            <div className={`w-5 h-5 border flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500 text-black' : 'border-zinc-600'}`}>
                                                {isSelected && <CheckIcon />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${isSelected ? 'text-green-400' : 'text-white'}`}>{c.titulo}</h3>
                                                <p className="text-zinc-500 text-xs line-clamp-1">{c.descripcion}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-4 border-t border-zinc-900 pt-4">
                                <button type="button" onClick={() => setAssignLawyer(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                                <button onClick={handleSaveAssignments} disabled={actionLoading} className="bg-green-600 text-white font-bold py-2 px-6 hover:bg-green-500 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Guardar Asignación</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={!!createCaseClient} onClose={() => setCreateCaseClient(null)}>
                <form onSubmit={handleCreateCase} className="p-8">
                    <h2 className="text-xl font-bold mb-8 italic tracking-widest uppercase text-white">Nuevo Caso: {createCaseClient?.primer_nombre}</h2>
                    <div className="space-y-6">
                        <InputField label="Título" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} required />
                        <InputField label="Descripción" value={caseDesc} onChange={(e) => setCaseDesc(e.target.value)} />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={() => setCreateCaseClient(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors disabled:opacity-50">Crear</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!profileToEdit} onClose={() => setProfileToEdit(null)}>
                <form onSubmit={handleUpdateProfile} className="p-8">
                    <h2 className="text-xl font-bold mb-8 italic tracking-widest uppercase text-white">Editar Perfil</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <InputField label="Nombre" value={editFormData.primer_nombre || ''} onChange={(e) => setEditFormData({...editFormData, primer_nombre: e.target.value})} />
                        <InputField label="Apellido" value={editFormData.primer_apellido || ''} onChange={(e) => setEditFormData({...editFormData, primer_apellido: e.target.value})} />
                        <InputField label="Cédula" value={editFormData.cedula || ''} onChange={(e) => setEditFormData({...editFormData, cedula: e.target.value})} />
                        <InputField label="Email" value={editFormData.email || ''} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
                    </div>
                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={() => setProfileToEdit(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 hover:bg-zinc-200 transition-colors disabled:opacity-50">Guardar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!profileToDelete} onClose={() => setProfileToDelete(null)}>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-4 italic tracking-widest uppercase">¿Eliminar Perfil?</h2>
                    <p className="text-zinc-400 mb-8">Esta acción no se puede deshacer.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setProfileToDelete(null)} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
                        <button onClick={handleDeleteProfile} disabled={actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Eliminar</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-white mb-4 italic tracking-widest uppercase">{confirmDialog.title}</h2>
                    <p className="text-zinc-400 mb-8">{confirmDialog.message}</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
                        <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} disabled={actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Confirmar</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={rejectDialog.isOpen} onClose={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Motivo de Rechazo</h2>
                    <div className="mb-8">
                        <InputField label="Escribe el motivo para el trabajador" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => { setRejectDialog({ isOpen: false, updateId: '' }); setRejectReason(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                        <button type="button" onClick={confirmRejectUpdate} disabled={!rejectReason.trim() || actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar</button>
                    </div>
                </div>
            </Modal>
        </Fragment>
    );
};

export default ListaPerfiles;