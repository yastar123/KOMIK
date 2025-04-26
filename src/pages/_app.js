import "../styles/globals.css";
import { AuthProvider } from "../context/AuthContext";
import Head from "next/head";
import Script from "next/script";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta
          name="google-site-verification"
          content="l7Wm9u4AZChkT02kada1sN1bddu9oc2b1ChYD2DLmzI"
        />
        <meta
          name="description"
          content="Baca komik manga, manhwa, dan manhua terbaru di Komikkuy secara gratis dengan update tiap hari!"
        />
        <link rel="icon" href="/favicon.png" />

        {/* Tambahin Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              url: "https://www.komikkuy.my.id",
              logo: "https://www.komikkuy.my.id/favicon.png",
            }),
          }}
        />
      </Head>

      {/* Google Analytics Script */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-RLKNCNHXKR"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-RLKNCNHXKR');
        `}
      </Script>

      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}
