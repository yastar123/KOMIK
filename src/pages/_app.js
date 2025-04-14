import "../styles/globals.css";
import { AuthProvider } from '../context/AuthContext';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <meta name="google-site-verification" content="kode-verifikasi-anda" />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
