
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Login() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle, error: authError } = useAuth();
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            router.push('/dashboard');
        } catch (err) {
            setLoading(false);
            setError(err.message === 'Unauthorized email address' 
                ? 'Email tidak diizinkan untuk mengakses dashboard.'
                : 'Gagal login dengan Google. Silakan coba lagi.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Admin Login</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Gunakan akun Google yang terdaftar untuk masuk
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {(error || authError) && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <span className="block sm:inline">{error || authError}</span>
                        </div>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="#EA4335"
                                        d="M12 5c1.6167 0 3.1334.5333 4.3334 1.4333l3.2666-3.2666C17.4667 1.5334 14.9334.3334 12 .3334c-4.9333 0-9.2 2.9333-11.0666 7.1333l3.8 2.9333C5.8667 7.2667 8.6667 5 12 5z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M23.6667 12.3334c0-.8667-.0667-1.7333-.2-2.5666H12v4.8666h6.5333c-.2666 1.4667-1.1333 2.7334-2.3666 3.5667l3.6666 2.8333c2.1334-1.9666 3.3667-4.8666 3.3667-8.7z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.0667 14.1667C4.8667 13.4667 4.7334 12.7334 4.7334 12s.1333-1.4667.3333-2.1667L1.2667 6.9C.4667 8.4667 0 10.1667 0 12s.4667 3.5333 1.2667 5.1l3.8-2.9333z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23.6667c3.2667 0 6-1.0667 8-2.9333l-3.6666-2.8333c-1.0667.7333-2.4334 1.1-4.3334 1.1-3.3333 0-6.1333-2.2667-7.1333-5.3L1.2667 17.1C3.1333 21.3 7.4 23.6667 12 23.6667z"
                                    />
                                </svg>
                                {loading ? 'Memuat...' : 'Login dengan Google'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
