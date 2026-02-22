
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { CheckIcon } from '../shared/Icons';
import { createClient } from '@supabase/supabase-js';

// --- Constantes de Configuración ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://esolamojbxosnwqbtmbe.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_zY7uEsSMSw-JMorX5KCBWw_A05KsnFa";

// --- Cliente Supabase Temporal ---
const tempSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// --- Type Definitions ---
interface ProfileFormState {
    primer_nombre: string;
    segundo_nombre: string;
    primer_apellido: string;
    segundo_apellido: string;
    cedula: string;
    matricula_nro: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface PasswordValidation {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
}

interface RoleConfig {
    rol: 'trabajador' | 'cliente';
    categoria_usuario: 'abogado' | 'estudiante' | 'cliente' | null;
    title: string;
}

interface UserManagementViewProps {
    preselectedRole?: 'abogado' | 'estudiante' | 'cliente';
    onCancel: () => void;
}

// --- Initial States ---
const initialFormState: ProfileFormState = {
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    cedula: '',
    matricula_nro: '',
    email: '',
    password: '',
    confirmPassword: '',
};

const initialPasswordValidation: PasswordValidation = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
};

const roleConfigs: RoleConfig[] = [
    { rol: 'trabajador', categoria_usuario: 'abogado', title: 'Registro: ABOGADO' },
    { rol: 'trabajador', categoria_usuario: 'estudiante', title: 'Registro: ESTUDIANTE' },
    { rol: 'cliente', categoria_usuario: 'cliente', title: 'Registro: CLIENTE' },
];

const findConfigForRole = (role?: string): RoleConfig | null => {
    if (!role) return null;
    return roleConfigs.find(c => c.categoria_usuario === role) || null;
};

// --- Main Component ---
const UserManagementView: React.FC<UserManagementViewProps> = ({ preselectedRole, onCancel }) => {
    const [selectedRoleConfig] = useState<RoleConfig | null>(() => findConfigForRole(preselectedRole));
    const [view, setView] = useState<'form' | 'success'>('form');
    
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ProfileFormState>(initialFormState);
    const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>(initialPasswordValidation);
    const [passwordsMatch, setPasswordsMatch] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const allPasswordRequirementsMet = Object.values(passwordValidation).every(Boolean);

    useEffect(() => {
        const { password } = formData;
        setPasswordValidation({
            length: password.length >= 8 && password.length <= 20,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    }, [formData.password]);

    useEffect(() => {
        setPasswordsMatch(formData.password !== '' && formData.password === formData.confirmPassword);
    }, [formData.password, formData.confirmPassword]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPhotoFile(file);
        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        } else {
            setPhotoPreview(null);
        }
    };
    
    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedRoleConfig || !allPasswordRequirementsMet || !passwordsMatch) return;

        setLoading(true);
        setError(null);
        
        let final_foto_url: string | null = null;

        if (photoFile) {
            try {
                const fileName = `profile_${Date.now()}_${photoFile.name.replace(/\s/g, '_')}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from('archivos_perfil').upload(fileName, photoFile);
                if (uploadError) throw uploadError;
                const { data: urlData } = supabase.storage.from('archivos_perfil').getPublicUrl(uploadData.path);
                final_foto_url = urlData.publicUrl;
            } catch (err) {
                console.warn("WARN: Subida de foto omitida o fallida.", err);
            }
        }

        try {
            const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (signUpError) throw new Error(signUpError.message);

            if (signUpData.user) {
                const profileData: any = {
                    primer_nombre: formData.primer_nombre,
                    segundo_nombre: formData.segundo_nombre || null,
                    primer_apellido: formData.primer_apellido,
                    segundo_apellido: formData.segundo_apellido || null,
                    cedula: formData.cedula,
                    rol: selectedRoleConfig.rol,
                    categoria_usuario: selectedRoleConfig.categoria_usuario,
                    foto_url: final_foto_url,
                };
                
                if (selectedRoleConfig.categoria_usuario === 'abogado') {
                    profileData.matricula_nro = formData.matricula_nro;
                }

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(profileData)
                    .eq('id', signUpData.user.id);

                if (updateError) throw new Error(`Error en actualización de perfil: ${updateError.message}`);
                
                setView('success');
            }
        } catch (err: any) {
            setError(err.message || "Error crítico en el proceso de registro.");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedRoleConfig) {
        return (
            <div className="text-center text-red-500 bg-black border border-zinc-800 p-10">
                <h2 className="text-2xl font-bold mb-4">Error de Configuración</h2>
                <p>Rol de usuario no válido o no especificado.</p>
                <button onClick={onCancel} className="mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2 px-6">
                    Volver al inicio
                </button>
            </div>
        );
    }
    
    if (view === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[75vh] py-16 px-6 bg-black animate-in fade-in duration-1000">
                <div className="mb-14 relative group">
                    <div className="absolute inset-0 bg-white rounded-full blur-[60px] opacity-20 animate-pulse"></div>
                    <div className="relative flex items-center justify-center bg-black rounded-full w-48 h-48 border-[2px] border-white shadow-[0_0_80px_rgba(255,255,255,0.4)]">
                        <CheckIcon className="text-white h-28 w-28 stroke-[3] drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                    </div>
                </div>
                
                <h1 className="text-5xl font-black mb-8 text-white text-center tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] uppercase italic">
                    USUARIO REGISTRADO CORRECTAMENTE
                </h1>
                
                <div className="flex flex-col sm:flex-row gap-8 w-full max-w-2xl mt-14">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-6 px-10 rounded-none border border-zinc-700 transition-all active:scale-95 shadow-xl uppercase tracking-[0.4em] text-[10px]"
                    >
                        Registrar otro
                    </button>
                    <button 
                        onClick={onCancel}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-6 px-10 rounded-none transition-all active:scale-95 shadow-xl uppercase tracking-[0.4em] text-[10px]"
                    >
                        Panel Principal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-10 flex items-center justify-between border-b border-zinc-900 pb-6">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">{selectedRoleConfig.title}</h1>
                <div className="text-[10px] font-black text-white tracking-[0.3em] uppercase opacity-80">Sincronización Segura</div>
            </header>

             <div className="bg-black border border-zinc-800 p-8 sm:p-16 shadow-[0_0_100px_rgba(0,0,0,1)] relative">
                <div className="mb-16">
                    <div className="flex justify-between items-center relative">
                       <div className={`flex-1 text-center py-5 border-b-[6px] transition-all duration-700 ${step === 1 ? 'border-zinc-700 text-white font-black' : 'border-zinc-900 text-zinc-700'}`}>01. PERFIL</div>
                       <div className={`flex-1 text-center py-5 border-b-[6px] transition-all duration-700 ${step === 2 ? 'border-zinc-700 text-white font-black' : 'border-zinc-900 text-zinc-700'}`}>02. ACCESO</div>
                    </div>
                </div>

                {error && (
                    <div className="bg-zinc-950 border-l-[10px] border-zinc-600 text-white text-sm font-bold px-10 py-6 mb-12 animate-in slide-in-from-top-6 duration-500 uppercase tracking-tight shadow-2xl" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col items-center space-y-10">
                                <div className="relative w-56 h-56 rounded-full bg-black border-[2px] border-zinc-900 flex items-center justify-center overflow-hidden">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center opacity-40">
                                            <span className="text-white text-[9px] font-black uppercase tracking-[0.5em]">No Image</span>
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="photo-upload" className="cursor-pointer bg-zinc-800 text-white font-black py-5 px-16 rounded-none transition-all shadow-xl uppercase text-[11px] tracking-[0.4em] hover:bg-zinc-700 active:scale-95">
                                    Cargar Fotografía
                                </label>
                                <input id="photo-upload" name="photo" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <InputField label="Primer Nombre" name="primer_nombre" value={formData.primer_nombre} onChange={handleInputChange} required />
                                <InputField label="Segundo Nombre" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleInputChange} />
                                <InputField label="Primer Apellido" name="primer_apellido" value={formData.primer_apellido} onChange={handleInputChange} required />
                                <InputField label="Segundo Apellido" name="segundo_apellido" value={formData.segundo_apellido} onChange={handleInputChange} />
                                <InputField label="DNI / Cédula" name="cedula" value={formData.cedula} onChange={handleInputChange} required />
                                {selectedRoleConfig.categoria_usuario === 'abogado' && (
                                    <InputField label="Matrícula Prof." name="matricula_nro" value={formData.matricula_nro} onChange={handleInputChange} required />
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-10 pt-12">
                                 <button type="button" onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-3 px-8 transition-colors uppercase text-[10px] tracking-[0.3em]">
                                    Cancelar
                                </button>
                                <button type="button" onClick={nextStep} className="bg-zinc-800 text-white font-black py-5 px-16 rounded-none transition-all shadow-xl uppercase text-[11px] tracking-[0.5em] hover:bg-zinc-700 active:scale-95">
                                    Continuar
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-12 animate-in fade-in slide-in-from-right-10 duration-700">
                            <InputField label="Email Corporativo" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                            <div className="space-y-8">
                                <InputField label="Contraseña Maestra" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                <div className="p-8 bg-zinc-950 border border-zinc-900 shadow-inner">
                                    <PasswordValidator validation={passwordValidation} />
                                </div>
                                <div>
                                    <InputField label="Confirmación" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
                                    <PasswordMatchIndicator passwordsMatch={passwordsMatch} confirmPasswordValue={formData.confirmPassword} />
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-10 pt-12">
                                <button type="button" onClick={prevStep} className="text-zinc-400 hover:text-white font-black py-3 px-8 transition-colors uppercase text-[10px] tracking-[0.3em]">
                                    Regresar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading || !allPasswordRequirementsMet || !passwordsMatch} 
                                    className="bg-zinc-800 text-white font-black py-5 px-20 rounded-none transition-all shadow-xl disabled:opacity-20 active:scale-95 uppercase text-[11px] tracking-[0.5em] hover:bg-zinc-700"
                                >
                                    {loading ? 'Sincronizando...' : 'Finalizar'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
             </div>
        </div>
    );
};

// --- Helpers ---
const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: any) => void; type?: string; required?: boolean }> = ({ label, name, value, onChange, type = 'text', required = false }) => (
    <div className="relative flex flex-col">
        <label htmlFor={name} className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em] mb-2">
            {label}
        </label>
        <input 
            id={name} 
            name={name} 
            type={type} 
            value={value} 
            onChange={onChange} 
            required={required} 
            className={`w-full py-2 px-0 bg-transparent border-b-2 ${value ? 'border-transparent' : 'border-zinc-800'} text-white focus:outline-none focus:border-zinc-500 transition-all text-xl font-bold tracking-tight`}
        />
    </div>
);

const PasswordValidator: React.FC<{ validation: PasswordValidation }> = ({ validation }) => (
    <div className="text-[12px] grid grid-cols-1 gap-y-4">
        <ValidationItem text="8-20 caracteres" isValid={validation.length} />
        <ValidationItem text="Mayúsculas" isValid={validation.uppercase} />
        <ValidationItem text="Minúsculas" isValid={validation.lowercase} />
        <ValidationItem text="Números" isValid={validation.number} />
        <ValidationItem text="Especial" isValid={validation.specialChar} />
    </div>
);

const ValidationItem: React.FC<{ text: string; isValid: boolean }> = ({ text, isValid }) => (
    <div className={`flex items-center transition-all duration-700 ${isValid ? 'text-white' : 'text-zinc-700'}`}>
        <CheckIcon className={`mr-3 h-5 w-5 transition-all duration-700 ${isValid ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : 'opacity-20'}`} />
        <span className={`${isValid ? 'font-semibold' : 'font-normal'}`}>{text}</span>
    </div>
);

const PasswordMatchIndicator: React.FC<{ passwordsMatch: boolean; confirmPasswordValue: string }> = ({ passwordsMatch, confirmPasswordValue }) => {
    if (!confirmPasswordValue) {
        return null;
    }

    return (
        <div className={`flex items-center mt-4 text-xs font-semibold transition-all duration-500 ${passwordsMatch ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]' : 'text-red-500'}`}>
            {passwordsMatch && <CheckIcon className="mr-2 h-4 w-4" />}
            {passwordsMatch ? 'Contraseña idéntica' : 'Las contraseñas no coinciden'}
        </div>
    );
};

export default UserManagementView;
