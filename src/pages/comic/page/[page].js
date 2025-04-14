import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { db } from "../../../BE/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import Head from "next/head";
import { ChevronDown, Search, Grid, LayoutGrid, Download, ChevronUp, Star, Eye, BookOpen, X, Filter, Clock } from "lucide-react";
import Layout from "../../../components/Layout";

const ITEMS_PER_PAGE = 15;

export default function ComicPaginationPage() {
    const router = useRouter();
    const { page } = router.query;
    const [comics, setComics] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // New state variables from GenrePage
    const [allGenres, setAllGenres] = useState([]);
    const [allTypes, setAllTypes] = useState([]);
    const [allStatuses, setAllStatuses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredComics, setFilteredComics] = useState([]);
    const [sortOption, setSortOption] = useState('Terbaru');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

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
                    publishDate: doc.data().publishDate || new Date().toISOString().split('T')[0],
                    views: doc.data().views || Math.floor(Math.random() * 10000),
                    status: doc.data().status || "Ongoing",
                    chapters: doc.data().chapters || Math.floor(Math.random() * 100) + 1
                }));

                // Extract genres, types and statuses
                const genreSet = new Set();
                const typeSet = new Set();
                const statusSet = new Set();

                allComics.forEach(comic => {
                    if (comic.genres) {
                        comic.genres.forEach(g => genreSet.add(g));
                    }
                    if (comic.type) typeSet.add(comic.type);
                    if (comic.status) statusSet.add(comic.status);
                });

                setAllGenres([...genreSet]);
                setAllTypes([...typeSet]);
                setAllStatuses([...statusSet]);

                // Apply initial sorting
                const sortedComics = sortComics(allComics, sortOption);
                
                // Pagination logic from original code
                const startIndex = (parseInt(page) - 1) * ITEMS_PER_PAGE;
                const paginated = sortedComics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                setComics(sortedComics);
                setFilteredComics(paginated);
                setTotalPages(Math.ceil(sortedComics.length / ITEMS_PER_PAGE));
            } catch (error) {
                console.error("Error fetching comics:", error);
                setError("Gagal memuat data komik. Silakan coba lagi.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchComics();
    }, [page, sortOption]);

    // Sort comics function from GenrePage
    const sortComics = (comics, option) => {
        const sortedComics = [...comics];
        switch (option) {
            case 'Popularitas':
                return sortedComics.sort((a, b) => (b.views || 0) - (a.views || 0));
            case 'Terbaru':
                return sortedComics.sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
                    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
                    return dateB - dateA;
                });
            case 'A-Z':
                return sortedComics.sort((a, b) => {
                    const titleA = a.title?.toLowerCase() || '';
                    const titleB = b.title?.toLowerCase() || '';
                    return titleA.localeCompare(titleB);
                });
            default:
                return sortedComics;
        }
    };

    // Search and filter effect
    useEffect(() => {
        if (comics.length === 0) return;
        
        let filtered = comics;
        if (searchTerm !== "") {
            filtered = comics.filter(comic =>
                comic.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Maintain pagination with filtered results
        const startIndex = (parseInt(page || 1) - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        
        setFilteredComics(paginated);
        setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    }, [searchTerm, comics, page]);

    const handleFilterChange = (value, type) => {
        if (value && value !== "all") {
            router.push(`/genre/${value.toLowerCase()}`);
        }
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const toggleViewMode = (mode) => {
        setViewMode(mode);
    };

    const currentPage = parseInt(page || "1");

    // Apply sorting and update comic list
    const applySorting = (option) => {
        setSortOption(option);
        setIsDropdownOpen(false);
        const sorted = sortComics(comics, option);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        setFilteredComics(paginated);
    };

    // Loading state
    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-purple-400 text-lg font-medium">Memuat komik...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Error state
    if (error) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-red-500/50">
                        <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-400 text-lg font-medium">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Head>
                <title>Daftar Komik - Halaman {currentPage}</title>
                <meta name="description" content={`Jelajahi koleksi komik kami - Halaman ${currentPage}`} />
            </Head>

            <main className="container mx-auto px-4 py-8 bg-gray-900/50">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Mobile Filter Toggle Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-500/50 shadow-lg hover:bg-purple-500/30 transition-all duration-300 group"
                    >
                        <Filter className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    </button>

                    {/* Left sidebar with filters */}
                    <div className={`w-full md:w-1/4 transition-all duration-300 ${isFilterOpen ? 'fixed inset-0 z-40 bg-gray-900/95 backdrop-blur-sm p-4 overflow-y-auto' : 'hidden md:block'}`}>
                        <div className="sticky top-24">
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-white bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-lg shadow-lg backdrop-blur-sm">Filter Komik</h1>
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="md:hidden p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* Genre Dropdown */}
                                <div className="relative group">
                                    <select
                                        onChange={(e) => handleFilterChange(e.target.value, 'genre')}
                                        defaultValue="all"
                                        className="w-full bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-3 flex justify-between items-center border border-gray-700/50 appearance-none cursor-pointer hover:border-purple-500/50 focus:border-purple-500 transition-all duration-300 shadow-lg"
                                    >
                                        <option value="all">Genre</option>
                                        {allGenres.map(genre => (
                                            <option key={genre} value={genre}>{genre}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <ChevronDown size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </div>

                                {/* Type Dropdown */}
                                <div className="relative group">
                                    <select
                                        onChange={(e) => handleFilterChange(e.target.value, 'type')}
                                        defaultValue="all"
                                        className="w-full bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-3 flex justify-between items-center border border-gray-700/50 appearance-none cursor-pointer hover:border-purple-500/50 focus:border-purple-500 transition-all duration-300 shadow-lg"
                                    >
                                        <option value="all">Tipe</option>
                                        {allTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <ChevronDown size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </div>

                                {/* Status Dropdown */}
                                <div className="relative group">
                                    <select
                                        onChange={(e) => handleFilterChange(e.target.value, 'status')}
                                        defaultValue="all"
                                        className="w-full bg-gray-800/95 backdrop-blur-sm rounded-lg px-4 py-3 flex justify-between items-center border border-gray-700/50 appearance-none cursor-pointer hover:border-purple-500/50 focus:border-purple-500 transition-all duration-300 shadow-lg"
                                    >
                                        <option value="all">Status</option>
                                        {allStatuses.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <ChevronDown size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right content area */}
                    <div className="w-full bg-gray-900/50 md:w-3/4">
                        <div className="flex flex-col gap-6">
                            {/* Top action bar */}
                            <div className="flex flex-wrap gap-4 items-center bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 shadow-lg">
                                {/* Search bar */}
                                <div className="flex-1 relative min-w-64 group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Search size={20} className="text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Cari komik berdasarkan judul..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-gray-700/50 rounded-lg pl-10 pr-4 py-3 border border-gray-700/50 focus:outline-none focus:border-purple-500 hover:border-purple-500/50 transition-all duration-300"
                                    />
                                </div>

                                {/* Grid view toggle */}
                                <div className="flex items-center gap-2 bg-gray-700/50 backdrop-blur-sm p-1 rounded-lg border border-gray-700/50">
                                    <button
                                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
                                        onClick={() => toggleViewMode('grid')}
                                    >
                                        <Grid size={20} />
                                    </button>
                                    <button
                                        className={`p-2 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-purple-400'}`}
                                        onClick={() => toggleViewMode('list')}
                                    >
                                        <LayoutGrid size={20} />
                                    </button>
                                </div>

                                {/* Sort options */}
                                <div className="relative group">
                                    <button
                                        onClick={toggleDropdown}
                                        className="bg-gray-700/50 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-2 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300"
                                    >
                                        <span>{sortOption}</span>
                                        {isDropdownOpen ? <ChevronUp size={16} className="text-gray-400 group-hover:text-purple-400 transition-colors" /> : <ChevronDown size={16} className="text-gray-400 group-hover:text-purple-400 transition-colors" />}
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 top-full right-0 mt-1 w-full bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-700/50 animate-fadeIn">
                                            <div className="relative z-50">
                                                <ul className="z-50">
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => applySorting('Popularitas')}
                                                    >
                                                        Popularitas
                                                    </li>
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => applySorting('Terbaru')}
                                                    >
                                                        Terbaru
                                                    </li>
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => applySorting('A-Z')}
                                                    >
                                                        A-Z
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Download button */}
                                <button className="p-2 bg-gray-700/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-purple-500/50 hover:text-purple-400 transition-all duration-300">
                                    <Download size={20} />
                                </button>
                            </div>

                            {/* Comic grid */}
                            {filteredComics.length === 0 ? (
                                <div className="bg-gray-900/95 backdrop-blur-sm p-8 rounded-lg text-center border border-gray-700/50 shadow-lg">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                                        <X className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-xl text-gray-300">Tidak ada komik dengan filter ini.</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'grid'
                                    ? 'grid grid-cols-2 bg-gray-900/50 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                                    : 'flex flex-col gap-4 bg-gray-900/50'}>
                                    {filteredComics.map((comic) => (
                                        <Link
                                            key={comic.id}
                                            href={`/comic/${comic.id}`}
                                            className={`group cursor-pointer ${viewMode === 'list'
                                                ? 'flex overflow-hidden bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg'
                                                : 'bg-gray-800/95 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-900/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg'}`}
                                        >
                                            {/* Comic cover/image */}
                                            <div className={`relative ${viewMode === 'grid'
                                                ? 'aspect-[3/4] rounded-t-lg overflow-hidden'
                                                : 'h-36 w-28 flex-shrink-0'}`}>
                                                <img
                                                    src={comic.imageUrl || '/api/placeholder/250/333'}
                                                    alt={comic.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "/comic-placeholder.jpg";
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                                {/* Status indicator */}
                                                {comic.status && (
                                                    <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                                        {comic.status}
                                                    </div>
                                                )}

                                                {/* Country flag */}
                                                {comic.country && viewMode === 'grid' && (
                                                    <div className="absolute bottom-2 right-2">
                                                        <span className="text-sm">
                                                            {comic.country === 'kr' ? '🇰🇷' :
                                                                comic.country === 'cn' ? '🇨🇳' :
                                                                    comic.country === 'jp' ? '🇯🇵' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Comic info */}
                                            <div className={viewMode === 'list'
                                                ? 'flex-1 p-4 flex flex-col'
                                                : 'p-3 flex flex-col'}>
                                                <div className={viewMode === 'list' ? 'flex justify-between items-start mb-2' : ''}>
                                                    <h2 className={`font-medium truncate group-hover:text-purple-400 transition-colors ${viewMode === 'grid' ? 'text-sm' : 'text-lg mb-1'}`}>
                                                        {comic.title}
                                                    </h2>

                                                    {viewMode === 'list' && (
                                                        <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0">
                                                            {comic.status || "Ongoing"}
                                                        </span>
                                                    )}
                                                </div>

                                                {viewMode === 'list' && (
                                                    <div className="text-xs text-gray-400 mb-2">Chapter {comic.chapters || "1"}</div>
                                                )}

                                                <div className={`flex items-center gap-2 text-xs ${viewMode === 'grid' ? 'mt-1' : ''}`}>
                                                    {viewMode === 'list' ? (
                                                        <>
                                                            <div className="flex items-center gap-1 text-gray-400">
                                                                <Eye size={14} />
                                                                <span>{comic.views || '32.1m'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-gray-400">
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-1 text-gray-400">
                                                                <Eye size={14} />
                                                                <span>{comic.views || 0} views</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Show synopsis in list view */}
                                                {viewMode === 'list' && (
                                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                                        {comic.description || "Tidak Ada Sinopsis"}
                                                    </p>
                                                )}

                                                {/* Show genres in grid view */}
                                                {viewMode === 'grid' && comic.genres && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {comic.genres.slice(0, 2).map((g, index) => (
                                                            <span key={index} className="px-2 py-1 bg-gray-700/50 text-xs text-gray-300 rounded-full">
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-8 bg-gray-800/95 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 shadow-lg">
                                    <nav className="flex justify-center">
                                        <ul className="flex items-center gap-2">
                                            <li>
                                                <Link
                                                    href={`/comic/page/${Math.max(1, currentPage - 1)}`}
                                                    className={`flex items-center justify-center px-4 py-2 rounded-lg border ${currentPage === 1 
                                                        ? 'bg-gray-700/30 text-gray-500 border-gray-700/50 cursor-not-allowed' 
                                                        : 'bg-gray-700/50 border-gray-700/50 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-400 transition-all duration-300'}`}
                                                >
                                                    Sebelumnya
                                                </Link>
                                            </li>
                                            
                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                // Show pages around current page
                                                const pageToShow = i + 1;
                                                if (totalPages <= 5 || pageToShow <= 3 || pageToShow > totalPages - 2) {
                                                    return (
                                                        <li key={pageToShow}>
                                                            <Link
                                                                href={`/comic/page/${pageToShow}`}
                                                                className={`flex items-center justify-center w-10 h-10 rounded-lg ${currentPage === pageToShow
                                                                    ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50' 
                                                                    : 'bg-gray-700/50 hover:bg-purple-500/20 hover:text-purple-400 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300'}`}
                                                            >
                                                                {pageToShow}
                                                            </Link>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            })}
                                            
                                            <li>
                                                <Link
                                                    href={`/comic/page/${Math.min(totalPages, currentPage + 1)}`}
                                                    className={`flex items-center justify-center px-4 py-2 rounded-lg border ${currentPage === totalPages 
                                                        ? 'bg-gray-700/30 text-gray-500 border-gray-700/50 cursor-not-allowed' 
                                                        : 'bg-gray-700/50 border-gray-700/50 hover:bg-purple-500/20 hover:border-purple-500/50 hover:text-purple-400 transition-all duration-300'}`}
                                                >
                                                    Selanjutnya
                                                </Link>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </Layout>
    );
}