import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { db } from "../../../BE/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 15;

export default function ComicPaginationPage() {
    const router = useRouter();
    const { page } = router.query;
    const [comics, setComics] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredComics, setFilteredComics] = useState([]);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [lastHoveredCard, setLastHoveredCard] = useState(null);
    const headerRef = useRef(null);

    // Detect scroll position for showing/hiding scroll to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.scrollY > 300);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const fetchComics = async () => {
            if (!page) return;
            setIsLoading(true);
            try {
                const querySnapshot = await getDocs(collection(db, "comics"));
                const allComics = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Add default values for properties that might not exist
                    genre: doc.data().genre || "Manga",
                    rating: doc.data().rating || ((Math.random() * 2 + 3).toFixed(1)), // Random rating between 3.0-5.0
                    tags: doc.data().tags || ["Komik", "Manga"],
                    author: doc.data().author || "Penulis Populer",
                    publishDate: doc.data().publishDate || new Date().toISOString().split('T')[0]
                }));

                // Sort comics alphabetically by title
                allComics.sort((a, b) => a.title.localeCompare(b.title));

                const startIndex = (parseInt(page) - 1) * ITEMS_PER_PAGE;
                const paginated = allComics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                setComics(paginated);
                setFilteredComics(paginated);
                setTotalPages(Math.ceil(allComics.length / ITEMS_PER_PAGE));
            } catch (error) {
                console.error("Error fetching comics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchComics();
    }, [page]);

    // Filter comics based on search term and active filter
    useEffect(() => {
        let results = [...comics];

        // Apply search filter
        if (searchTerm.trim() !== "") {
            results = results.filter(comic =>
                comic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                comic.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply genre filter
        if (activeFilter !== "all") {
            results = results.filter(comic =>
                comic.genre && comic.genre.toLowerCase() === activeFilter.toLowerCase()
            );
        }

        setFilteredComics(results);
    }, [searchTerm, comics, activeFilter]);

    const currentPage = parseInt(page || "1");

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Get unique genres from comics
    const genres = ["all", ...new Set(comics.map(comic => comic.genre?.toLowerCase()).filter(Boolean))];

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.4,
                ease: "easeOut"
            }
        }
    };

    const fadeIn = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    const shimmer = {
        hidden: {
            backgroundPosition: "200% 0"
        },
        show: {
            backgroundPosition: "-200% 0",
            transition: {
                duration: 2,
                ease: "linear",
                repeat: Infinity
            }
        }
    };

    return (
        <>
            <Head>
                <title>Daftar Komik - Halaman {currentPage}</title>
                <meta name="description" content={`Jelajahi koleksi komik kami - Halaman ${currentPage}`} />
            </Head>

            <div className="min-h-screen bg-gray-900 py-6 px-3 sm:py-12 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <motion.div
                        ref={headerRef}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 sm:mb-12"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-800"></div>
                        <div className="absolute inset-0 opacity-20 bg-[url('/comic-pattern.svg')] bg-repeat"
                            style={{ backgroundSize: "100px 100px", animation: "patternMove 60s linear infinite" }}>
                        </div>

                        <motion.div
                            className="relative py-10 px-4 text-center sm:py-16 sm:px-12 overflow-hidden"
                            whileInView={{ scale: [0.95, 1], opacity: [0.8, 1] }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl drop-shadow-lg">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                        Galeri Komik
                                    </span>
                                </h1>
                                <p className="mt-4 text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
                                    Jelajahi dunia fantasi melalui berbagai genre komik terbaik
                                </p>
                            </motion.div>

                            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-4xl mx-auto">
                                <div className="relative w-full max-w-md">
                                    <motion.div
                                        whileTap={{ scale: 0.98 }}
                                        className="relative"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Cari judul atau deskripsi komik..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-5 py-3 rounded-full text-gray-800 bg-white/90 backdrop-blur-sm border-2 border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent placeholder-gray-500 shadow-lg"
                                        />
                                        <div className="absolute right-4 top-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex overflow-x-auto gap-2 w-full justify-center sm:max-w-md px-1 py-2 rounded-full bg-white/30 backdrop-blur-sm">
                                    {genres.map((genre) => (
                                        <motion.button
                                            key={genre}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setActiveFilter(genre)}
                                            className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${activeFilter === genre
                                                ? 'bg-purple-600 text-white shadow-md'
                                                : 'bg-white/70 text-gray-700 hover:bg-white hover:text-purple-600'
                                                } transition-all duration-200`}
                                        >
                                            {genre === "all" ? "Semua" : genre.charAt(0).toUpperCase() + genre.slice(1)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Loading State */}
                    <AnimatePresence>
                        {isLoading ? (
                            <motion.div
                                className="flex justify-center items-center h-64"
                                initial="hidden"
                                animate="show"
                                exit={{ opacity: 0 }}
                                variants={fadeIn}
                            >
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        className="h-16 w-16 relative"
                                        animate={{
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                    >
                                        <div className="absolute top-0 left-0 right-0 bottom-0 rounded-full border-8 border-purple-200 border-t-8 border-t-purple-600"></div>
                                    </motion.div>
                                    <motion.div
                                        className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 bg-[length:400%_100%] rounded-lg"
                                        variants={shimmer}
                                        initial="hidden"
                                        animate="show"
                                    >
                                        <p className="font-medium text-purple-700">Memuat koleksi komik...</p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : filteredComics.length === 0 ? (
                            <motion.div
                                className="text-center py-16 bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </motion.div>
                                <p className="text-xl text-gray-300">Tidak ada komik yang ditemukan</p>
                                {(searchTerm || activeFilter !== "all") && (
                                    <motion.button
                                        onClick={() => {
                                            setSearchTerm("");
                                            setActiveFilter("all");
                                        }}
                                        className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Reset Pencarian
                                    </motion.button>
                                )}
                            </motion.div>
                        ) : (
                            /* Comics Grid */
                            <motion.div
                                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 md:gap-8"
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {filteredComics.map((comic) => (
                                    <motion.div
                                        key={comic.id}
                                        variants={item}
                                        className="group bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-purple-500/20 hover:-translate-y-2 relative"
                                        onHoverStart={() => setLastHoveredCard(comic.id)}
                                        onHoverEnd={() => setLastHoveredCard(null)}
                                    >
                                        <Link href={`/comic/${comic.id}`}>
                                            <div className="relative h-44 sm:h-64 overflow-hidden">
                                                <img
                                                    src={comic.imageUrl || "/comic-placeholder.jpg"}
                                                    alt={comic.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/comic-placeholder.jpg";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                    <p className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                        {comic.genre || 'Genre tidak tersedia'}
                                                    </p>
                                                </div>

                                                {/* New Badge */}
                                                <div className="absolute top-2 left-2 z-20">
                                                    <motion.div
                                                        className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md"
                                                        animate={{
                                                            scale: [1, 1.1, 1],
                                                            rotate: [0, 3, -3, 0]
                                                        }}
                                                        transition={{
                                                            duration: 1.5,
                                                            repeat: Infinity,
                                                            repeatDelay: 1
                                                        }}
                                                    >
                                                        NEW
                                                    </motion.div>
                                                </div>

                                                {/* Author Badge */}
                                                <div className="absolute top-2 right-2 z-20">
                                                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
                                                        {comic.author?.split(' ')[0] || 'Author'}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                                                    {comic.title}
                                                </h3>
                                                <div className="flex items-center text-yellow-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="ml-1 text-xs font-medium">{comic.rating || '4.5'}</span>
                                                </div>
                                            </div>

                                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{comic.description}</p>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {comic.tags?.slice(0, 2).map((tag, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded-full"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <Link href={`/comic/${comic.id}`}>
                                                <motion.span
                                                    className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg w-full transition-all duration-300 relative overflow-hidden"
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                >
                                                    <span className="relative z-10">Baca Selengkapnya</span>
                                                    <motion.span
                                                        className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 opacity-0"
                                                        whileHover={{ opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </motion.span>
                                            </Link>

                                            {/* Card Spotlight Effect */}
                                            {lastHoveredCard === comic.id && (
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-x -z-10"></div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <motion.div
                            className="mt-10 flex justify-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <nav className="flex items-center gap-2">
                                <Link
                                    href={`/comic/page/${Math.max(1, currentPage - 1)}`}
                                    className={`px-4 py-2 rounded-lg ${currentPage === 1
                                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                        } transition-colors`}
                                >
                                    Sebelumnya
                                </Link>
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <Link
                                            key={page}
                                            href={`/comic/page/${page}`}
                                            className={`px-4 py-2 rounded-lg ${currentPage === page
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                                                } transition-colors`}
                                        >
                                            {page}
                                        </Link>
                                    ))}
                                </div>
                                <Link
                                    href={`/comic/page/${Math.min(totalPages, currentPage + 1)}`}
                                    className={`px-4 py-2 rounded-lg ${currentPage === totalPages
                                        ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                        } transition-colors`}
                                >
                                    Selanjutnya
                                </Link>
                            </nav>
                        </motion.div>
                    )}

                    {/* Go to Top Button */}
                    <AnimatePresence>
                        {showScrollButton && (
                            <motion.button
                                onClick={scrollToTop}
                                className="fixed bottom-8 right-8 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:from-purple-700 hover:to-pink-700 transition-colors duration-200 z-50"
                                aria-label="Scroll to top"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Mobile Navigation */}
                    <div className="sm:hidden fixed bottom-0 inset-x-0 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 shadow-lg z-40">
                        <div className="flex justify-around py-2 px-2">
                            <Link href="/comic/page/1">
                                <motion.div
                                    className="flex flex-col items-center p-2"
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="text-xs text-gray-300 mt-1">Home</span>
                                </motion.div>
                            </Link>

                            <motion.button
                                className="flex flex-col items-center p-2"
                                onClick={() => {
                                    setSearchTerm("");
                                    setActiveFilter("all");
                                }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="text-xs text-gray-300 mt-1">Reset</span>
                            </motion.button>

                            <Link href={currentPage > 1 ? `/comic/page/${currentPage - 1}` : `/comic/page/1`}>
                                <motion.div
                                    className={`flex flex-col items-center p-2 ${currentPage === 1 ? 'opacity-50' : ''}`}
                                    whileTap={currentPage !== 1 ? { scale: 0.9 } : {}}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span className="text-xs text-gray-300 mt-1">Prev</span>
                                </motion.div>
                            </Link>

                            <Link href={currentPage < totalPages ? `/comic/page/${currentPage + 1}` : `/comic/page/${totalPages}`}>
                                <motion.div
                                    className={`flex flex-col items-center p-2 ${currentPage === totalPages ? 'opacity-50' : ''}`}
                                    whileTap={currentPage !== totalPages ? { scale: 0.9 } : {}}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    <span className="text-xs text-gray-300 mt-1">Next</span>
                                </motion.div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes patternMove {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }
                
                @keyframes animate-gradient-x {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                .animate-gradient-x {
                    animation: animate-gradient-x 3s ease infinite;
                }
                
                .line-clamp-1 {
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </>
    );
}