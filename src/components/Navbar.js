'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ArrowUp, Menu, X, Home, Compass, Library, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db } from '../BE/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Navbar() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [filteredComics, setFilteredComics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [allComics, setAllComics] = useState([]);
    const [scrolled, setScrolled] = useState(false);
    const router = useRouter();
    const searchRef = useRef(null);
    const mobileSearchRef = useRef(null);

    // Handle scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch comics from Firestore
    useEffect(() => {
        const fetchComics = async () => {
            try {
                setLoading(true);
                const snapshot = await getDocs(collection(db, "comics"));
                const comics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllComics(comics);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching comics:", error);
                setLoading(false);
            }
        };
        fetchComics();
    }, []);

    // Add this effect for search functionality
    useEffect(() => {
        if (searchTerm.length >= 2) {
            setLoading(true);
            const result = allComics.filter(comic =>
                comic.title?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredComics(result);
            setLoading(false);
        } else {
            setFilteredComics([]);
        }
    }, [searchTerm, allComics]);

    // Add this effect for auto-focus search input
    useEffect(() => {
        if (isSearchOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isSearchOpen]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
            setSearchTerm("");
            setIsSearchOpen(false);
        }
    };

    const handleComicSelect = () => {
        setShowResults(false);
        setSearchTerm('');
        setIsSearchOpen(false);
    };

    // Keyboard shortcut for search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (window.innerWidth < 768) {
                    setIsSearchOpen(true);
                } else if (searchRef.current) {
                    searchRef.current.focus();
                }
            } else if (e.key === 'Escape') {
                setShowResults(false);
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {/* Main Navbar */}
            <header className={`fixed w-full z-50 transition-all border-b border-gray-800 inner-shadow duration-300 ${scrolled ? 'bg-gray-900/95 backdrop-blur-md py-2 shadow-lg' : 'bg-gray-900/80 backdrop-blur-sm py-3'}`}>
                <div className="container mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-sm">KK</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all">
                            KomikKuy
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="flex items-center gap-1 text-white hover:text-purple-300 transition-colors">
                            <Home size={18} className="mr-1" />
                            Home
                        </Link>
                        <Link href="/genre" className="flex items-center gap-1 text-gray-300 hover:text-purple-300 transition-colors">
                            <Compass size={18} className="mr-1" />
                            Explore
                        </Link>
                        <Link href="/library" className="flex items-center gap-1 text-gray-300 hover:text-purple-300 transition-colors">
                            <Library size={18} className="mr-1" />
                            Library
                        </Link>
                    </nav>

                    {/* Search and User Section */}
                    <div className="flex items-center gap-4">
                        {/* Desktop Search */}
                        <div className="relative hidden md:block">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <div className="flex items-center bg-gray-800 rounded-full px-4 py-2 hover:ring-2 hover:ring-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                                    <Search className="w-5 h-5 text-gray-400" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Cari Komik..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent outline-none ml-2 w-48 text-gray-300 placeholder-gray-500 focus:w-64 transition-all duration-300"
                                    />
                                    <kbd className="ml-2 hidden lg:flex items-center gap-1 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                        <span className="text-xs">⌘</span>K
                                    </kbd>
                                </div>
                            </form>

                            {/* Search Results Dropdown */}
                            {searchTerm.length >= 2 && (
                                <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-xl overflow-hidden z-50 border border-gray-700/50 animate-fadeIn">
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {loading ? (
                                            <div className="p-4 flex justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                            </div>
                                        ) : filteredComics.length > 0 ? (
                                            <div>
                                                {filteredComics.map(comic => (
                                                    <Link
                                                        key={comic.id}
                                                        href={`/comic/${comic.id}`}
                                                        onClick={() => {
                                                            setSearchTerm("");
                                                            setIsSearchOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors border-b border-gray-700/50 last:border-none group"
                                                    >
                                                        <div className="flex-shrink-0 w-12 h-16 bg-gray-700 rounded overflow-hidden relative">
                                                            {comic.imageUrl && (
                                                                <Image
                                                                    src={comic.imageUrl}
                                                                    alt={comic.title}
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                                    loading="lazy"
                                                                    
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h4 className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">{comic.title}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {comic.genres && comic.genres.slice(0, 2).map((genre, index) => (
                                                                    <span key={index} className="px-1.5 py-0.5 bg-gray-700/50 text-xs text-gray-300 rounded-full">
                                                                        {genre}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-400">
                                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-700/50 rounded-full mb-3">
                                                    <X className="w-6 h-6" />
                                                </div>
                                                <p>Tidak ada hasil yang ditemukan</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Search Button */}
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="md:hidden p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5 text-gray-300" />
                        </button>

                        {/* User Profile */}
                        <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition-all shadow-md">
                            <User className="w-5 h-5 text-white" />
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-gray-800 transition-colors"
                            aria-label="Menu"
                        >
                            {isOpen ? (
                                <X className="w-5 h-5 text-gray-300" />
                            ) : (
                                <Menu className="w-5 h-5 text-gray-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-gray-900 shadow-lg animate-slideDown">
                        <div className="container mx-auto px-4 py-3">
                            <nav className="flex flex-col space-y-4">
                                <Link
                                    href="/"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800 text-purple-400"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Home size={18} />
                                    <span>Home</span>
                                </Link>
                                <Link
                                    href="/genre"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Compass size={18} />
                                    <span>Explore</span>
                                </Link>
                                <Link
                                    href="/library"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Library size={18} />
                                    <span>Library</span>
                                </Link>
                            </nav>
                        </div>
                    </div>
                )}
            </header>

            {/* Mobile Search Modal */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm animate-fadeIn">
                    <div className="container mx-auto px-4 pt-20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Cari Komik</h2>
                            <button
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchTerm("");
                                }}
                                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="mb-6">
                            <div className="relative">
                                <div className="flex items-center bg-gray-800 rounded-full px-5 py-3 ring-2 ring-purple-500/50 shadow-lg">
                                    <Search className="w-5 h-5 text-gray-400" />
                                    <input
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Ketik judul komik..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="bg-transparent outline-none ml-3 w-full text-white placeholder-gray-500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </form>

                        {searchTerm.length < 2 ? (
                            <div className="text-center py-10">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-full mb-4">
                                    <Search className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-gray-400">Ketik minimal 2 huruf untuk memulai pencarian</p>
                            </div>
                        ) : loading ? (
                            <div className="flex justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
                            </div>
                        ) : (
                            <div className="pb-20 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {filteredComics.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {filteredComics.map(comic => (
                                            <Link
                                                key={comic.id}
                                                href={`/comic/${comic.id}`}
                                                onClick={() => {
                                                    setSearchTerm("");
                                                    setIsSearchOpen(false);
                                                }}
                                                className="flex items-center gap-4 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
                                            >
                                                <div className="flex-shrink-0 w-14 h-20 bg-gray-700 rounded overflow-hidden relative">
                                                    {comic.imageUrl && (
                                                        <Image
                                                            src={comic.imageUrl}
                                                            alt={comic.title}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            width={48}
                                                            height={64}
                                                            priority={false}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                </div>
                                                <div className="flex-grow">
                                                    <h4 className="text-white font-medium group-hover:text-purple-400 transition-colors">{comic.title}</h4>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {comic.genres && comic.genres.slice(0, 2).map((genre, index) => (
                                                            <span key={index} className="px-1.5 py-0.5 bg-gray-700/50 text-xs text-gray-300 rounded-full">
                                                                {genre}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/50 rounded-full mb-4">
                                            <X className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400">Tidak ada hasil untuk {searchTerm}</p>
                                        <p className="text-gray-500 text-sm mt-1">Coba kata kunci yang berbeda</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add some global styles for the custom scrollbar */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.3);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
} 