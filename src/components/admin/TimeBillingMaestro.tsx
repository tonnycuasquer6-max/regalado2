import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Case, TimeEntry, Profile } from '../../types';
import { TrashIcon } from '../shared/Icons';

// --- Date Helper Functions ---
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

// --- Form Helper Components (Diseño Premium) ---
const InputField = ({ label, type = 'text', ...props }: any) => (
    <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <input
            type={type}
            className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors"
            {...props}
        />
    </div>
);

const SelectField = ({ label, options, ...props }: any) => (
     <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <select
            className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50"
            {...props}
        >
            <option value="" className="bg-black">Seleccionar...</option>
            {options.map((opt: any) => (
                <option key={opt.id} value={opt.id} className="bg-black">
                    {opt.titulo || `${opt.primer_nombre || ''} ${opt.primer_apellido || ''}`.trim()}
                </option>
            ))}
        </select>
    </div>
);

// --- MODAL BASE PREMIUM ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono">
            <div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {children}
            </div>
        </div>
    );
};

// --- Main Component ---
const TimeBillingMaestro: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clientProfiles, setClientProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);

  // NUEVO ESTADO PARA EL MODAL DE CONFIRMACIÓN
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUserProfile(profile);

      const { data: clients } = await supabase.from('profiles').select('*').eq('rol', 'cliente');
      setClientProfiles(clients || []);

      const { data: allCases } = await supabase.from('cases').select('*');
      setCases(allCases || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeekEntries = useCallback(async () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { data } = await supabase
      .from('time_entries')
      .select('*, profiles(*), cases(*)')
      .gte('fecha_tarea', toYYYYMMDD(startOfWeek))
      .lte('fecha_tarea', toYYYYMMDD(endOfWeek));

    setTimeEntries(data || []);
  }, [currentDate]);

  useEffect(() => {
    fetchInitialData().then(() => fetchWeekEntries());
  }, [fetchInitialData, fetchWeekEntries]);

  // Navegación de semanas
  const changeWeek = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
          return newDate;
      });
  };

  const openNewEntryModal = (date: string, hour: number) => {
    setEditingEntry(null);
    setSelectedSlot({ date, hour });
    setSelectedClientId('');
    setSelectedCaseId('');
    setTaskDescription('');
    setHoursWorked(1);
    setRate(0);
    setIsModalOpen(true);
  };

  const openEditEntryModal = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setSelectedSlot({ date: entry.fecha_tarea, hour: parseInt(entry.hora_inicio.split(':')[0]) });
    setSelectedClientId(entry.cases?.cliente_id || '');
    setSelectedCaseId(entry.caso_id);
    setTaskDescription(entry.descripcion_tarea);
    setHoursWorked(entry.horas);
    setRate(entry.tarifa_personalizada || 0);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedCaseId || !taskDescription || hoursWorked <= 0 || !currentUserProfile) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    setActionLoading(true);
    const entryData = {
      id: editingEntry?.id,
      perfil_id: currentUserProfile.id,
      caso_id: selectedCaseId,
      descripcion_tarea: taskDescription,
      fecha_tarea: selectedSlot.date,
      hora_inicio: `${String(selectedSlot.hour).padStart(2, '0')}:00:00`,
      horas: hoursWorked,
      tarifa_personalizada: rate > 0 ? rate : null,
      estado: 'pending',
    };

    try {
      const { error } = await supabase.from('time_entries').upsert(entryData);
      if (error) throw error;
      setIsModalOpen(false);
      fetchWeekEntries();
    } catch (error: any) {
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // --- LÓGICA DE BORRADO CON MODAL OSCURO ---
  const handleDeleteEntry = () => {
    if (!editingEntry) return;
    
    setConfirmDialog({
        isOpen: true,
        title: '¿ELIMINAR REGISTRO?',
        message: 'Esta acción eliminará permanentemente este registro del Time Billing.',
        onConfirm: async () => {
            setActionLoading(true);
            try {
                const { error } = await supabase.from('time_entries').delete().eq('id', editingEntry.id);
                if (error) throw error;
                setIsModalOpen(false); // Cierra el formulario
                fetchWeekEntries();    // Recarga los datos
            } catch (error: any) {
                alert(`Error al eliminar: ${error.message}`);
            } finally {
                setActionLoading(false);
            }
        }
    });
  };

  const handleDragStart = (e: React.DragEvent, entry: TimeEntry) => {
    e.dataTransfer.setData('text/plain', entry.id.toString());
  };

  // Drag & Drop Sin Rebote (Optimistic UI)
  const handleDrop = async (e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');

    // 1. MAGIA VISUAL: Actualización Inmediata en pantalla
    setTimeEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, fecha_tarea: date, hora_inicio: `${String(hour).padStart(2, '0')}:00:00` }
          : entry
      )
    );

    // 2. GUARDADO SILENCIOSO: En la base de datos
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ fecha_tarea: date, hora_inicio: `${String(hour).padStart(2, '0')}:00:00` })
        .eq('id', entryId);
      if (error) throw error;
    } catch (err: any) {
      alert(`Error al mover: ${err.message}`);
      fetchWeekEntries();
    }
  };

  const filteredCases = cases.filter(c => c.cliente_id === selectedClientId);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = getStartOfWeek(currentDate);
    day.setDate(day.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <Fragment>
      <div className="bg-black w-full animate-in fade-in duration-500 text-white p-4 font-mono">
        
        {/* ENCABEZADO PREMIUM */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Time Billing Semanal</h1>
            {onCancel && <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>}
        </header>

        {/* NAVEGACIÓN DE SEMANAS */}
        <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => changeWeek('prev')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">‹ Semana Anterior</button>
            <h2 className="text-lg font-bold text-white tracking-wider">
                {weekDays.length > 0 && `${weekDays[0].toLocaleDateString('es-ES')} - ${weekDays[6].toLocaleDateString('es-ES')}`}
            </h2>
            <button onClick={() => changeWeek('next')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">Semana Siguiente ›</button>
        </div>

        {loading && <p className="text-center text-zinc-500 mb-4">Cargando actividades...</p>}

        {/* CUADRÍCULA DEL CALENDARIO */}
        <div className="grid grid-cols-[auto_1fr] gap-0 border-t border-l border-zinc-800 bg-black">
          {/* Columna de Horas */}
          <div className="grid grid-rows-[auto_1fr]">
            <div className="p-2 border-r border-b border-zinc-800 h-16"></div>
            <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
              {hours.map(hour => (
                <div key={hour} className="text-xs text-zinc-500 text-center p-2 border-r border-b border-zinc-800 flex items-center justify-center font-bold">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Días de la Semana */}
          <div className="grid grid-cols-7">
            {weekDays.map((day, dayIndex) => (
              <div key={dayIndex} className="border-r border-zinc-800">
                <div className="text-center p-2 border-b border-zinc-800 h-16 flex flex-col justify-center">
                  <div className="text-xs uppercase text-zinc-500 font-bold">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold text-white">{day.getDate()}</div>
                </div>
                
                <div className="relative" onDragOver={(e) => e.preventDefault()}>
                  <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
                    {hours.map((hour, hourIndex) => (
                      <div 
                        key={hourIndex} 
                        className="h-[60px] border-b border-zinc-800 hover:bg-zinc-900 cursor-pointer transition-colors"
                        onClick={() => openNewEntryModal(toYYYYMMDD(day), hour)}
                        onDrop={(e) => handleDrop(e, toYYYYMMDD(day), hour)}
                        onDragOver={(e) => e.preventDefault()}
                      ></div>
                    ))}
                  </div>

                  {/* Tarjetas Absolutas (Drag & Drop) */}
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {timeEntries
                      .filter(entry => entry.fecha_tarea === toYYYYMMDD(day))
                      .map(entry => {
                        const entryHour = parseInt(entry.hora_inicio.split(':')[0]);
                        const top = (entryHour - 6) * 60;
                        const height = entry.horas * 60;
                        return (
                          <div 
                            key={entry.id} 
                            className="absolute w-full p-2 rounded-lg bg-indigo-600 text-xs overflow-hidden shadow-lg border border-indigo-400 cursor-move z-10 pointer-events-auto hover:bg-indigo-500 transition-colors"
                            style={{ top: `${top}px`, height: `${height}px`, left: '2px', right: '2px', width: 'calc(100% - 4px)' }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, entry)}
                            onClick={(e) => { e.stopPropagation(); openEditEntryModal(entry); }}
                          >
                            <p className="font-bold text-white truncate">{entry.cases?.titulo}</p>
                            <p className="text-indigo-200 truncate">{entry.descripcion_tarea}</p>
                            <p className="text-indigo-100 italic opacity-80 mt-1">{entry.profiles?.primer_nombre}</p>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMULARIO MODAL */}
      <Modal isOpen={isModalOpen && !!selectedSlot} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSaveEntry}>
            <div className="p-8">
                <h2 className="text-xl font-bold text-white mb-8 italic tracking-widest">{editingEntry ? 'EDITAR' : 'REGISTRAR'} TAREA</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    
                    <InputField label="Fecha" type="date" value={selectedSlot?.date || ''} readOnly />
                    
                    <div>
                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Abogado</label>
                        <div className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white opacity-70">
                            {currentUserProfile?.primer_nombre} {currentUserProfile?.primer_apellido}
                        </div>
                    </div>
                    
                    <SelectField 
                        label="Cliente" 
                        value={selectedClientId} 
                        onChange={(e: any) => setSelectedClientId(e.target.value)} 
                        options={clientProfiles} 
                        required
                    />
                    
                    <SelectField 
                        label="Caso" 
                        value={selectedCaseId} 
                        onChange={(e: any) => setSelectedCaseId(e.target.value)} 
                        options={filteredCases} 
                        disabled={!selectedClientId} 
                        required
                    />
                    
                    <div className="md:col-span-2">
                        <InputField 
                            label="Descripción Tarea" 
                            value={taskDescription} 
                            onChange={(e: any) => setTaskDescription(e.target.value)} 
                            required 
                        />
                    </div>
                    
                    <InputField 
                        label="Horas" 
                        type="number" 
                        step="0.25" 
                        min="0.25"
                        value={hoursWorked} 
                        onChange={(e: any) => setHoursWorked(parseFloat(e.target.value) || 0)} 
                        required 
                    />
                    
                    <InputField 
                        label="Tarifa ($/hr)" 
                        type="number" 
                        step="1" 
                        min="0"
                        value={rate} 
                        onChange={(e: any) => setRate(parseFloat(e.target.value) || 0)} 
                    />
                </div>
            </div>
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center border-t border-zinc-800">
                <div>
                    {editingEntry && (
                        <button type="button" onClick={handleDeleteEntry} className="text-zinc-600 hover:text-red-500 hover:bg-red-950/30 p-3 transition-colors rounded-full" title="Eliminar Registro">
                            <TrashIcon />
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="font-bold py-2 px-6 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button type="submit" disabled={actionLoading} className="bg-white text-black hover:bg-zinc-200 font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">
                        {actionLoading ? '...' : (editingEntry ? 'GUARDAR CAMBIOS' : 'REGISTRAR')}
                    </button>
                </div>
            </div>
        </form>
      </Modal>

      {/* NUEVO MODAL OSCURO DE CONFIRMACIÓN DE ELIMINACIÓN */}
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

    </Fragment>
  );
};

export default TimeBillingMaestro;