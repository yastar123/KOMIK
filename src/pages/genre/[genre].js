import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { db } from "../../BE/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { ChevronDown, Search, Grid, LayoutGrid, Download, ChevronUp, Star, Eye, BookOpen, X, Filter } from "lucide-react";
import Layout from "../../components/Layout";
import Image from "next/image";

export default function GenrePage() {
    const router = useRouter();
    const { genre } = router.query;

    const [komikList, setKomikList] = useState([]);
    const [allGenres, setAllGenres] = useState([]);
    const [allTypes, setAllTypes] = useState([]);
    const [allStatuses, setAllStatuses] = useState([]);
    const [activeFilter, setActiveFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredComics, setFilteredComics] = useState([]);

    // New state for UI controls
    const [sortOption, setSortOption] = useState('Popularitas');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        if (!genre) return;

        const fetchData = async () => {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "comics"));
            const comics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const genreSet = new Set();
            const typeSet = new Set();
            const statusSet = new Set();

            comics.forEach(comic => {
                comic.genres?.forEach(g => genreSet.add(g));
                if (comic.type) typeSet.add(comic.type);
                if (comic.status) statusSet.add(comic.status);
            });

            setAllGenres([...genreSet]);
            setAllTypes([...typeSet]);
            setAllStatuses([...statusSet]);

            const filtered = comics.filter(comic =>
                comic.genres?.map(g => g.toLowerCase()).includes(genre.toLowerCase()) ||
                comic.type?.toLowerCase() === genre.toLowerCase() ||
                comic.status?.toLowerCase() === genre.toLowerCase()
            );

            setKomikList(filtered);
            setFilteredComics(filtered);
            setActiveFilter(genre);
            setLoading(false);
        };

        fetchData();
    }, [genre]);

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

    useEffect(() => {
        let filtered = komikList;
        if (searchTerm !== "") {
            filtered = komikList.filter(comic =>
                comic.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply sorting to filtered results
        const sortedResults = sortComics(filtered, sortOption);
        setFilteredComics(sortedResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, komikList]);

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

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
            <p className="text-xl font-medium">Loading...</p>
        </div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-gray-900/50  text-white">
                <main className="container mx-auto px-4 py-8">
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
                                    <h1 className="text-2xl font-bold text-white bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-lg shadow-lg backdrop-blur-sm">Filter: {activeFilter}</h1>
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
                                            <option value="all">Semua Genre</option>
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
                                            <option value="all">Semua Tipe</option>
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
                                            <option value="all">Semua Status</option>
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
                        <div className="w-full md:w-3/4">
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
                                            className="w-full bg-gray-700/50 backdrop-blur-sm rounded-lg pl-10 pr-4 py-3 border border-gray-700/50 focus:outline-none focus:border-purple-500 hover:border-purple-500/50 transition-all duration-300"
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
                                                <ul>
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => {
                                                            setSortOption('Popularitas');
                                                            setIsDropdownOpen(false);
                                                            const sorted = sortComics(filteredComics, 'Popularitas');
                                                            setFilteredComics(sorted);
                                                        }}
                                                    >
                                                        Popularitas
                                                    </li>
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => {
                                                            setSortOption('Terbaru');
                                                            setIsDropdownOpen(false);
                                                            const sorted = sortComics(filteredComics, 'Terbaru');
                                                            setFilteredComics(sorted);
                                                        }}
                                                    >
                                                        Terbaru
                                                    </li>
                                                    <li
                                                        className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer transition-colors duration-300"
                                                        onClick={() => {
                                                            setSortOption('A-Z');
                                                            setIsDropdownOpen(false);
                                                            const sorted = sortComics(filteredComics, 'A-Z');
                                                            setFilteredComics(sorted);
                                                        }}
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
                                    <div className="bg-gray-800/95 backdrop-blur-sm p-8 rounded-lg text-center border border-gray-700/50 shadow-lg">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700/50 rounded-full mb-4">
                                            <X className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-xl text-gray-300">Tidak ada komik dengan filter ini.</p>
                                    </div>
                                ) : (
                                    <div className={viewMode === 'grid'
                                        ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                                        : 'flex flex-col gap-4'}>
                                        {filteredComics.map(comic => (
                                            <Link
                                                key={comic.id}
                                                href={`/comic/${comic.id}`}
                                                className={`group cursor-pointer ${viewMode === 'list'
                                                    ? 'flex overflow-hidden bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg'
                                                    : 'bg-gray-800/95 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg'}`}
                                            >
                                                {/* Comic cover/image */}
                                                <div className={`relative ${viewMode === 'grid'
                                                    ? 'aspect-[3/4] rounded-t-lg overflow-hidden'
                                                    : 'h-36 w-28 flex-shrink-0'}`}>
                                                    <Image
                                                        src={comic.imageUrl || '/api/placeholder/250/333'}
                                                        alt={comic.title}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        loading="lazy"
                                                        width={250}
                                                        height={333}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                                    {/* Daily updated indicator */}
                                                    {comic.dailyViews > 0 && (
                                                        <div className="absolute top-2 right-2 bg-red-600 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                                            {comic.status || "Ongoing"}
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
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="flex items-center gap-1 text-gray-400">
                                                                    <span>{comic.views || 0} views</span>
                                                                </div>
                                                                {comic.chapters && (
                                                                    <div>
                                                                        <span className="text-gray-300">CH.{comic.chapters}</span>
                                                                    </div>
                                                                )}
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
                                                    {viewMode === 'grid' && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {comic.genres && comic.genres.slice(0, 2).map((g, index) => (
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
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Layout>
    );
}