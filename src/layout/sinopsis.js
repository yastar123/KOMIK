import Head from 'next/head';
import Image from 'next/image';

export default function Sinopsis() {
    const images = [
        '/demon-king1.jpg',
        '/demon-king2.jpg',
        '/demon-king3.jpg',
        '/demon-king4.jpg'
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>Player Who Returned 10,000 Years Later | Manga</title>
                <meta name="description" content="Read Player Who Returned 10,000 Years Later online" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto px-4 py-8">
                {/* Image Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                    {images.map((src, index) => (
                        <div key={index} className="border border-gray-300 bg-white overflow-hidden">
                            <Image
                                src={src}
                                alt={`Manga panel ${index + 1}`}
                                width={300}
                                height={400}
                                layout="responsive"
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>

                {/* Ringkasan Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ringkasan</h2>
                    <p className="text-gray-700 mb-4">
                        Manhwa Player Who Returned 10,000 Years Later yang dibuat oleh komikus bernama Butterfly Valley ini bercerita tentang Suatu hari, dia tiba-tiba
                        jatuh ke neraka, apa yang dimiliki Hanya keinginan untuk hidup dan kekuatan predasi. Dari seribu neraka menjadi sembilan ribu neraka.
                    </p>
                    <p className="text-gray-700 mb-4">
                        Itu memakan puluhan ribu dan ratusan ribu iblis. Bahkan tujuh archdukes bertutut di depannya. "Kenapa kamu ingin kembali? Raja sudah memiliki
                        segalanya di Neraka." "Apa yang kamu punya?" Tidak ada yang bisa dimakan, tidak ada yang bisa dinikmatil!
                    </p>
                    <p className="text-gray-700">
                        Satu-satunya hal di Neraka adalah tanah tandus dan iblis yang mengerikan! "Aku akan kembali." Setelah sepuluh ribu tahun, dia kembali ke Bumi.
                    </p>
                </div>

                {/* Sinopsis Lengkap Section */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sinopsis Lengkap</h2>
                    <p className="text-gray-700">
                        Manhwa Player Who Returned 10,000 Years Later yang dibuat oleh komikus bernama Butterfly Valley ini bercerita tentang Suatu hari, dia tiba-tiba
                        jatuh ke neraka, apa yang dimiliki Hanya keinginan untuk hidup dan kekuatan predasi. Dari seribu neraka menjadi sembilan ribu neraka. Itu memakan
                        puluhan ribu dan ratusan ribu iblis. Bahkan tujuh archdukes bertutut di depannya. "Kenapa kamu ingin kembali? Raja sudah memiliki segalanya di
                        Neraka." "Apa yang kamu punya?" Tidak ada yang bisa dimakan, tidak ada yang bisa dinikmatil! Satu-satunya hal di Neraka adalah tanah tandus dan
                        iblis yang mengerikan! "Aku akan kembali." Setelah sepuluh ribu tahun, dia kembali ke Bumi.
                    </p>
                </div>
            </main>
        </div>
    );
}