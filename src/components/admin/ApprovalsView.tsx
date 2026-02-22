import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';

interface ApprovalsViewProps {
    setActiveView: (viewConfig: { name: string; params?: any }) => void;
}

const ApprovalsView: React.FC<ApprovalsViewProps> = ({ setActiveView }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApprovals = async () => {
            setLoading(true);
            
            // 1. Traer archivos pendientes de aprobación en los historiales
            const { data: updatesData } = await supabase
                .from('case_updates')
                .select(`
                    id, created_at, estado_aprobacion,
                    perfil:profiles!case_updates_perfil_id_fkey(primer_nombre, primer_apellido, rol),
                    caso:cases!case_id(titulo, cliente:profiles!cliente_id(primer_nombre, primer_apellido))
                `)
                .eq('estado_aprobacion', 'pendiente');

            // 2. Traer peticiones de acceso (censura)
            const { data: petitionsData } = await supabase
                .from('peticiones_acceso')
                .select(`
                    id, tipo, created_at,
                    trabajador:profiles!peticiones_acceso_trabajador_id_fkey(primer_nombre, primer_apellido, rol),
                    cliente:profiles!peticiones_acceso_cliente_id_fkey(primer_nombre, primer_apellido),
                    caso:cases!peticiones_acceso_caso_id_fkey(titulo)
                `)
                .eq('estado', 'pendiente');

            // Unir y ordenar por fecha (las más nuevas primero)
            let combined: any[] = [];
            
            if (updatesData) {
                combined = [...combined, ...updatesData.map(u => ({ ...u, _type: 'update' }))];
            }
            if (petitionsData) {
                combined = [...combined, ...petitionsData.map(p => ({ ...p, _type: 'petition' }))];
            }

            combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setNotifications(combined);
            setLoading(false);
        };

        fetchApprovals();
    }, []);

    const handleNavigate = (item: any) => {
        // Obtenemos si fue un abogado o estudiante para mandarte al panel correcto
        const role = item._type === 'update' ? item.perfil?.rol : item.trabajador?.rol;
        setActiveView({ name: 'PROFILES', params: { role: role || 'abogado' } });
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
                        
                        if (item._type === 'update') {
                            const trabajador = item.perfil;
                            const caso = item.caso;
                            const cliente = caso?.cliente;

                            return (
                                <div key={`upd-${item.id}`} onClick={() => handleNavigate(item)} className="bg-zinc-950 border border-yellow-900/30 hover:border-yellow-500 p-6 cursor-pointer transition-colors group relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        <strong className="text-white uppercase">{trabajador?.rol}: {trabajador?.primer_nombre} {trabajador?.primer_apellido}</strong> requiere aprobación en nuevo archivo cargado con el cliente <strong className="text-white uppercase">{cliente?.primer_nombre} {cliente?.primer_apellido}</strong> en el caso <strong className="text-white uppercase">{caso?.titulo}</strong>.
                                    </p>
                                    <span className="text-yellow-600 text-[10px] uppercase font-bold mt-4 block group-hover:text-yellow-400 transition-colors tracking-widest">Revisar en Perfiles ›</span>
                                </div>
                            );
                        }

                        if (item._type === 'petition') {
                            const trabajador = item.trabajador;
                            const cliente = item.cliente;
                            const tipoMsg = item.tipo === 'info_personal' ? 'INFORMACIÓN PERSONAL' : `ACCESO AL CASO: ${item.caso?.titulo}`;

                            return (
                                <div key={`pet-${item.id}`} className="bg-zinc-950 border border-blue-900/30 p-6 relative overflow-hidden shadow-lg">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        <strong className="text-white uppercase">{trabajador?.rol}: {trabajador?.primer_nombre} {trabajador?.primer_apellido}</strong> solicita acceso a <strong className="text-white uppercase">{tipoMsg}</strong> del cliente <strong className="text-white uppercase">{cliente?.primer_nombre} {cliente?.primer_apellido}</strong>.
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-green-500 hover:text-green-400">Aprobar Permiso</button>
                                        <button className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400">Denegar</button>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default ApprovalsView;