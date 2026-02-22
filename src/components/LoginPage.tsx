
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

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
        
        // Clear previous errors and signal that the MFA process is starting.
        // This prevents the parent component from unmounting this page prematurely.
        setError(null);
        setIsAwaitingMfa(true);
        setLoading(true);

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message);
            setIsAwaitingMfa(false); // Reset MFA state on error
            setLoading(false);
            return;
        }

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            setError("A temporary session conflict occurred. Please try again.");
            setIsAwaitingMfa(false); // Reset MFA state on error
            setLoading(false);
            return;
        }

        const { error: otpError } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false,
            },
        });

        if (otpError) {
            setError("Could not send verification code. Please try again later.");
            setIsAwaitingMfa(false); // Reset MFA state on error
            setLoading(false);
            return;
        }

        // On success, transition to the OTP step.
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
        
        // On successful verification, a session is created.
        // The onAuthStateChange listener in App.tsx will receive it.
        // We signal that the MFA flow is now complete.
        if (data.session) {
            setIsAwaitingMfa(false);
        } else {
            setError("No se pudo verificar la sesión. Por favor, intente de nuevo.");
            setLoading(false);
        }
    };
    
    const handleReturnToLogin = () => {
        setError(null);
        setOtp('');
        setPassword('');
        setLoginStep(LoginStep.Credentials);
        setIsAwaitingMfa(false); // Reset MFA state
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-black">
            <div className="w-full max-w-md">
                {loginStep === LoginStep.Credentials && (
                    <img 
                        src="https://esolamojbxosnwqbtmbe.supabase.co/storage/v1/object/public/Imagen/IMG_20260218_115214.png" 
                        alt="Logo del Despacho"
                        className="max-w-[250px] mx-auto mb-[30px]"
                    />
                )}
                <div className="bg-black border border-zinc-800 shadow-2xl px-8 pt-6 pb-8 mb-4">
                    {error && (
                        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {loginStep === LoginStep.Credentials ? (
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label className="block text-zinc-500 text-sm font-bold mb-2">Usuario (Email)</label>
                                <input
                                    className="shadow appearance-none border border-zinc-800 w-full py-3 px-4 bg-transparent text-white leading-tight focus:outline-none focus:shadow-outline focus:border-zinc-600"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-zinc-500 text-sm font-bold mb-2">Contraseña</label>
                                <input
                                    className="shadow appearance-none border border-zinc-800 w-full py-3 px-4 bg-transparent text-white leading-tight focus:outline-none focus:shadow-outline focus:border-zinc-600"
                                    type="password"
                                    placeholder="******************"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 w-full disabled:opacity-50 transition-colors" type="submit" disabled={loading}>
                                {loading ? 'Verificando...' : 'Ingresar'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verificarCodigo}>
                             <p className="text-center text-zinc-400 mb-8">
                                Ingrese el código enviado a su correo.
                            </p>
                            <div className="mb-6">
                                <label className="block text-zinc-500 text-sm font-bold mb-2">Código de Verificación</label>
                                <input
                                    className="shadow appearance-none border border-zinc-800 w-full py-3 px-4 bg-transparent text-white text-center tracking-[0.5em] font-mono text-lg leading-tight focus:outline-none focus:shadow-outline focus:border-zinc-600"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-4 w-full disabled:opacity-50 transition-colors mb-4" type="submit" disabled={loading}>
                                {loading ? 'Validando...' : 'Verificar e Ingresar'}
                            </button>
                            <div className="text-center">
                                <button type="button" onClick={handleReturnToLogin} className="text-sm text-zinc-500 hover:text-white">
                                    ¿Problemas con el código? Volver al inicio
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                <p className="text-center text-zinc-700 text-xs">
                    &copy;{new Date().getFullYear()} Regalado & Regalado Abogados.
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
