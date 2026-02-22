
import React, { useState } from 'react';
import { supabase } from './services/supabaseClient';

interface LoginPageProps {
    setIsAwaitingMfa: (isAwaiting: boolean) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsAwaitingMfa }) => {
    enum LoginStep {
        Credentials,
        EmailOtp
    }
    
    const [loginStep, setLoginStep] = useState<LoginStep>(LoginStep.Credentials);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsAwaitingMfa(true);
        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
            setError(signInError.message);
            setIsAwaitingMfa(false);
            setLoading(false);
            return;
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false },
        });

        if (otpError) {
            setError("Error al enviar código. Reintente.");
            setIsAwaitingMfa(false);
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        setLoginStep(LoginStep.EmailOtp);
        setLoading(false);
    };

    const verificarCodigo = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email'
        });

        if (verifyError) {
            setError(verifyError.message);
            setLoading(false);
            return;
        }
        
        if (data.session) {
            setIsAwaitingMfa(false);
        } else {
            setError("Fallo de sesión.");
            setLoading(false);
        }
    };
    
    const handleReturnToLogin = () => {
        setError(null);
        setOtp('');
        setPassword('');
        setLoginStep(LoginStep.Credentials);
        setIsAwaitingMfa(false);
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-black">
            <div className="w-full max-w-md">
                {loginStep === LoginStep.Credentials && (
                    <img 
                        src="https://esolamojbxosnwqbtmbe.supabase.co/storage/v1/object/public/Imagen/IMG_20260218_115214.png" 
                        alt="Logo"
                        className="max-w-[220px] mx-auto mb-10 grayscale"
                    />
                )}
                <div className="bg-black border border-zinc-800 shadow-2xl px-10 pt-10 pb-10 mb-6">
                    {error && (
                        <div className="bg-zinc-950 border-l-4 border-zinc-700 text-white px-6 py-4 mb-6 text-xs uppercase font-bold" role="alert">
                            {error}
                        </div>
                    )}

                    {loginStep === LoginStep.Credentials ? (
                        <form onSubmit={handleLogin}>
                            <div className="mb-6">
                                <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Email Corporativo</label>
                                <input
                                    className="w-full py-4 px-0 bg-transparent border-b border-zinc-700 text-white focus:outline-none focus:border-zinc-500 transition-all text-lg font-medium tracking-tight"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-10">
                                <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Contraseña</label>
                                <input
                                    className="w-full py-4 px-0 bg-transparent border-b border-zinc-700 text-white focus:outline-none focus:border-zinc-500 transition-all text-lg font-medium tracking-tight"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 px-4 w-full transition-all uppercase text-[10px] tracking-[0.4em]" type="submit" disabled={loading}>
                                {loading ? 'Validando...' : 'Acceder'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verificarCodigo}>
                             <p className="text-center text-zinc-500 text-xs mb-10 uppercase tracking-widest">
                                Ingrese código de seguridad.
                            </p>
                            <div className="mb-10">
                                <input
                                    className="w-full py-4 px-0 bg-transparent border-b border-zinc-700 text-white text-center tracking-[0.8em] text-2xl font-black focus:outline-none focus:border-zinc-500 transition-all"
                                    type="text"
                                    inputMode="numeric"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 px-4 w-full transition-all uppercase text-[10px] tracking-[0.4em] mb-6" type="submit" disabled={loading}>
                                {loading ? 'Sincronizando...' : 'Verificar'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={handleReturnToLogin} className="text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-colors">
                                    Regresar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <p className="text-center text-zinc-700 text-[10px] font-bold uppercase tracking-[0.3em]">
                    &copy;{new Date().getFullYear()} Regalado & Regalado Abogados.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
