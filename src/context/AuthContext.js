
import { createContext, useContext, useEffect, useState } from 'react';
import { 
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth } from '../BE/firebase';

const AuthContext = createContext({});

// Daftar email yang diizinkan
const ALLOWED_EMAILS = [
    // Tambahkan email yang diizinkan di sini
    'webcipta1@gmail.com',  // Email admin yang diizinkan
    'edujpratama@gmail.com',
    'yastariskandar@gmail.com',  // Email yang baru ditambahkan
];

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (ALLOWED_EMAILS.includes(user.email)) {
                    setUser(user);
                    setError('');
                } else {
                    // Jika email tidak diizinkan, logout otomatis
                    signOut(auth);
                    setUser(null);
                    setError('Unauthorized email address');
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            const result = await signInWithPopup(auth, provider);
            if (!ALLOWED_EMAILS.includes(result.user.email)) {
                await signOut(auth);
                throw new Error('Unauthorized email address');
            }
            return result;
        } catch (error) {
            console.error("Error login dengan Google:", error);
            throw error;
        }
    };

    const logout = async () => {
        setUser(null);
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, error, logout, loginWithGoogle }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
