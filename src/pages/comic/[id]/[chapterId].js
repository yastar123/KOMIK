import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { db } from "../../../BE/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import {
    ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Menu, X,
    ChevronUp, ChevronDown, BookOpen, List, Home, Share2,
    Heart, Sun, Moon, Maximize, Minimize, Play, Pause
} from 'lucide-react';
import Head from "next/head";
import Layout from "../../../components/Layout";

export default function ChapterDetail() {
    const router = useRouter();
    const { id: comicId, chapterId } = router.query;

    const [detailKomikId, setDetailKomikId] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [chapterList, setChapterList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChapterListOpen, setIsChapterListOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isLiked, setIsLiked] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [tooltipMessage, setTooltipMessage] = useState("");
    const [isAutoScrolling, setIsAutoScrolling] = useState(false);
    const [scrollSpeed, setScrollSpeed] = useState(50);
    const [isLoading, setIsLoading] = useState(true);
    const [showScrollHint, setShowScrollHint] = useState(true);
    const [chapterImages, setChapterImages] = useState([]);
    const autoScrollRef = useRef(null);
    const scrollIntervalRef = useRef(null);
    const scrollHintTimeoutRef = useRef(null);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [lastInteraction, setLastInteraction] = useState(Date.now());
    const hideTimeoutRef = useRef(null);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [currentMood, setCurrentMood] = useState('calm');
    const [volume, setVolume] = useState(0.5);
    const [showMusicControls, setShowMusicControls] = useState(false);
    const audioRef = useRef(null);

    const moodTracks = {
        calm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        action: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        suspense: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        emotional: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        adventure: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
    };

    // Theme variables
    const theme = {
        bg: darkMode ? 'bg-gray-900' : 'bg-gray-50',
        text: darkMode ? 'text-gray-100' : 'text-gray-900',
        headerBg: darkMode ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm',
        cardBg: darkMode ? 'bg-gray-800' : 'bg-white',
        hoverBg: darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
        border: darkMode ? 'border-gray-700' : 'border-gray-200',
        buttonBg: darkMode ? 'bg-gray-700' : 'bg-gray-100',
        accent: 'text-blue-400',
        accentBg: 'bg-blue-500',
        accentHover: 'hover:bg-blue-600',
        menuBg: darkMode ? 'bg-gray-800' : 'bg-white',
        shadow: darkMode ? 'shadow-lg shadow-black/30' : 'shadow-lg shadow-gray-300/30'
    };

    // Add a helper function to clean URLs
    const cleanImageUrl = (url) => {
        return url.replace(/^["']|["']$/g, '').trim();
    };

    // Update the useEffect for fetching chapter data
    useEffect(() => {
        if (!router.isReady || !comicId || !chapterId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const detailSnap = await getDocs(collection(db, "comics", comicId, "detailKomik"));
                if (!detailSnap.empty) {
                    const detailId = detailSnap.docs[0].id;
                    setDetailKomikId(detailId);

                    const chapterSnap = await getDocs(
                        collection(db, "comics", comicId, "detailKomik", detailId, "chapters")
                    );

                    const chapters = chapterSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                    })).sort((a, b) => a.timestamp - b.timestamp);

                    setChapterList(chapters);

                    const index = chapters.findIndex(ch => ch.id === chapterId);
                    setCurrentIndex(index);

                    if (index !== -1) {
                        const currentChapter = chapters[index];
                        setChapter(currentChapter);

                        // Handle both old and new image formats
                        if (currentChapter.images && currentChapter.images.length > 0) {
                            // If images is an array of objects with order
                            if (typeof currentChapter.images[0] === 'object') {
                                const sortedImages = [...currentChapter.images]
                                    .sort((a, b) => a.order - b.order)
                                    .map(img => cleanImageUrl(img.imageUrl));
                                setChapterImages(sortedImages);
                            } else {
                                // If images is an array of URLs
                                setChapterImages(currentChapter.images.map(url => cleanImageUrl(url)));
                            }
                        } else if (currentChapter.url) {
                            // Fallback for old format
                            setChapterImages([cleanImageUrl(currentChapter.url)]);
                        }
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            } finally {
                setIsLoading(false);

                // Show scroll hint for new visitors
                const hasVisited = localStorage.getItem('hasVisitedChapterReader');
                if (!hasVisited) {
                    setShowScrollHint(true);
                    localStorage.setItem('hasVisitedChapterReader', 'true');
                    scrollHintTimeoutRef.current = setTimeout(() => {
                        setShowScrollHint(false);
                    }, 5000);
                }
            }
        };

        fetchData();

        return () => {
            if (scrollHintTimeoutRef.current) {
                clearTimeout(scrollHintTimeoutRef.current);
            }
        };
    }, [router.isReady, comicId, chapterId]);

    // Set body background based on dark mode
    useEffect(() => {
        document.body.className = theme.bg;
    }, [darkMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAutoScroll();
            if (scrollHintTimeoutRef.current) {
                clearTimeout(scrollHintTimeoutRef.current);
            }
        };
    }, []);

    // Auto-hide header and navigation after 3 seconds of inactivity
    useEffect(() => {
        const handleInteraction = () => {
            setLastInteraction(Date.now());
            setIsHeaderVisible(true);
            setIsNavVisible(true);

            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }

            hideTimeoutRef.current = setTimeout(() => {
                setIsHeaderVisible(false);
                setIsNavVisible(false);
            }, 3000);
        };

        window.addEventListener('mousemove', handleInteraction);
        window.addEventListener('scroll', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    // Handle click outside music controls
    useEffect(() => {
        const handleClickOutside = (event) => {
            const musicControls = document.getElementById('music-controls');
            const musicButton = document.getElementById('music-button');
            if (musicControls && musicButton &&
                !musicControls.contains(event.target) &&
                !musicButton.contains(event.target)) {
                setShowMusicControls(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Chapter navigation
    const prevChapter = currentIndex > 0 ? chapterList[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;

    // UI Control Functions
    const handleChapterChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId !== chapterId) {
            router.push(`/comic/${comicId}/${selectedId}`);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        if (isChapterListOpen) setIsChapterListOpen(false);
    };

    const toggleChapterList = () => {
        setIsChapterListOpen(!isChapterListOpen);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const toggleLike = () => {
        setIsLiked(!isLiked);
    };

    const zoomIn = () => {
        if (zoomLevel < 2) {
            setZoomLevel(Number((zoomLevel + 0.1).toFixed(1)));
        }
    };

    const zoomOut = () => {
        if (zoomLevel > 0.5) {
            setZoomLevel(Number((zoomLevel - 0.1).toFixed(1)));
        }
    };

    const resetZoom = () => {
        setZoomLevel(1);
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    };

    const goToComicDetails = () => {
        router.push(`/comic/${comicId}`);
    };

    const shareChapter = async () => {
        const shareData = {
            title: chapter?.title || 'Comic Chapter',
            text: `Check out this comic chapter: ${chapter?.title}`,
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                showTooltip("Link copied to clipboard!");
            }
        } catch (err) {
            console.error('Error sharing:', err);
            showTooltip("Failed to share");
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                showTooltip("Error enabling fullscreen");
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const showTooltip = (message) => {
        setTooltipMessage(message);
        setIsTooltipVisible(true);
        setTimeout(() => setIsTooltipVisible(false), 2000);
    };

    // Auto Scroll Functions
    const toggleAutoScroll = () => {
        if (isAutoScrolling) {
            stopAutoScroll();
        } else {
            startAutoScroll();
        }
    };

    const startAutoScroll = () => {
        setIsAutoScrolling(true);
        const speed = (101 - scrollSpeed) * 10;
        scrollIntervalRef.current = setInterval(() => {
            window.scrollBy(0, 1);
        }, speed);
    };

    const stopAutoScroll = () => {
        setIsAutoScrolling(false);
        if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const handleSpeedChange = (e) => {
        const newSpeed = parseInt(e.target.value);
        setScrollSpeed(newSpeed);
        if (isAutoScrolling) {
            stopAutoScroll();
            startAutoScroll();
        }
    };

    // Initialize audio
    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio(moodTracks[currentMood]);
            audioRef.current.volume = volume;
            audioRef.current.loop = true;

            // Cleanup function
            return () => {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
            };
        }
    }, []);

    const toggleMusic = () => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(error => {
                    console.error('Error playing audio:', error);
                    showTooltip('Failed to play music');
                });
            }
            setIsMusicPlaying(!isMusicPlaying);
        }
    };

    const changeMood = (mood) => {
        if (audioRef.current) {
            const wasPlaying = isMusicPlaying;
            audioRef.current.pause();
            audioRef.current.src = moodTracks[mood];
            audioRef.current.load();
            if (wasPlaying) {
                audioRef.current.play().catch(error => {
                    console.error('Error playing audio:', error);
                    showTooltip('Failed to play music');
                });
            }
            setCurrentMood(mood);
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    if (isLoading) return (
        <div className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}>
            <Head>
                <title>Loading Chapter...</title>
            </Head>
            <div className="flex flex-col items-center gap-4">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-10 w-10 bg-gray-600 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-600 rounded"></div>
                </div>
                <p className="text-center mt-4">Loading your chapter...</p>
            </div>
        </div>
    );

    if (!chapter) return (
        <div className={`${theme.bg} ${theme.text} min-h-screen flex items-center justify-center`}>
            <Head>
                <title>Chapter Not Found</title>
            </Head>
            <div className="text-center p-6 max-w-md">
                <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
                <p className="mb-6">The chapter you're looking for doesn't exist or may have been removed.</p>
                <button
                    onClick={() => router.push(`/comic/${comicId}`)}
                    className={`px-6 py-2 rounded-lg ${theme.accentBg} text-white font-medium hover:${theme.accentHover} transition-colors`}
                >
                    Back to Comic
                </button>
            </div>
        </div>
    );

    const { title, url, content } = chapter;

    return (
        <Layout>
            <div className={`${theme.bg} ${theme.text} min-h-screen flex flex-col relative transition-colors duration-300`}>
                <Head>
                    <title>{title || `Chapter ${currentIndex + 1}`} - Comic Reader</title>
                    <meta name="theme-color" content={darkMode ? "#111827" : "#f9fafb"} />
                </Head>

                {/* Scroll Hint */}
                {showScrollHint && !isHeaderVisible && (
                    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800/95 backdrop-blur-md text-white rounded-lg shadow-lg z-50 flex items-center gap-2 animate-bounce border border-gray-700/50">
                        <ChevronDown size={18} className="text-purple-400" />
                        <span>Scroll to read</span>
                    </div>
                )}

                {/* Audio Element */}
                <audio ref={audioRef} loop />

                {/* Header */}
                <header
                    className={`${theme.headerBg} p-4 hidden sm:flex justify-between items-center sticky top-0 z-30 border-b ${theme.border} transition-all duration-300 shadow-lg`}
                >
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToComicDetails}
                            className={`p-2 rounded-full ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                            aria-label="Back to comic"
                        >
                            <ChevronLeft size={20} className="text-purple-400" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold truncate max-w-[180px] sm:max-w-xs md:max-w-md bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {title || `Chapter ${currentIndex + 1}`}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls */}
                        <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full ${theme.buttonBg} ${theme.shadow} border border-gray-700/50`}>
                            <button
                                onClick={zoomOut}
                                className={`p-1.5 rounded-full ${zoomLevel <= 0.5 ? 'opacity-50 cursor-not-allowed' : theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                disabled={zoomLevel <= 0.5}
                            >
                                <ZoomOut size={18} className="text-purple-400" />
                            </button>
                            <button
                                onClick={resetZoom}
                                className="text-sm font-medium px-1.5 hover:text-purple-400 transition-colors"
                            >
                                {Math.round(zoomLevel * 100)}%
                            </button>
                            <button
                                onClick={zoomIn}
                                className={`p-1.5 rounded-full ${zoomLevel >= 2 ? 'opacity-50 cursor-not-allowed' : theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                disabled={zoomLevel >= 2}
                            >
                                <ZoomIn size={18} className="text-purple-400" />
                            </button>
                        </div>

                        {/* Auto Scroll Controls */}
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full ${theme.buttonBg} ${theme.shadow} border border-gray-700/50`}>
                            <button
                                onClick={toggleAutoScroll}
                                className={`p-1 rounded-full ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                aria-label={isAutoScrolling ? "Stop auto scroll" : "Start auto scroll"}
                            >
                                {isAutoScrolling ? <Pause size={18} className="text-purple-400" /> : <Play size={18} className="text-purple-400" />}
                            </button>
                            {isAutoScrolling && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={scrollSpeed}
                                        onChange={handleSpeedChange}
                                        className="w-20 accent-purple-500"
                                    />
                                    <span className="text-xs font-medium text-purple-400">{scrollSpeed}%</span>
                                </div>
                            )}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`hidden sm:block p-2 rounded-full ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {darkMode ? <Sun size={18} className="text-purple-400" /> : <Moon size={18} className="text-purple-400" />}
                        </button>

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className={`hidden sm:block p-2 rounded-full ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullscreen ? <Minimize size={18} className="text-purple-400" /> : <Maximize size={18} className="text-purple-400" />}
                        </button>

                        {/* Mobile Menu Toggle */}
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto w-full">
                    {/* Chapter Select - Desktop */}
                    <div className={`hidden md:block w-full ${theme.cardBg} rounded-lg ${theme.shadow} p-4 my-4 border ${theme.border} transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="flex items-center gap-4">
                            <label htmlFor="chapterSelect" className="font-medium flex items-center gap-2 text-purple-400">
                                <BookOpen size={18} />
                                <span>Select Chapter</span>
                            </label>
                            <select
                                id="chapterSelect"
                                value={chapterId}
                                onChange={handleChapterChange}
                                className={`flex-1 p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${theme.border} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300`}
                            >
                                {chapterList.map((ch, idx) => (
                                    <option key={ch.id} value={ch.id}>
                                        {ch.title || `Chapter ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Comic View */}
                    <div className="w-full flex flex-col items-center justify-center relative">
                        <div
                            className={`${theme.shadow} transition-transform overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'} border-0`}
                            style={{
                                transform: `scale(${zoomLevel})`,
                                width: '100%',
                                maxWidth: '100%',
                                transition: 'transform 0.2s ease-out'
                            }}
                        >
                            {chapterImages.map((imageUrl, index) => (
                                <div key={index} className="w-full">
                                    <img
                                        src={imageUrl}
                                        alt={`Page ${index + 1} of ${chapterImages.length}`}
                                        className="w-full h-auto object-contain"
                                        loading="lazy"
                                        onLoad={() => {
                                            if (index === chapterImages.length - 1) {
                                                setIsLoading(false);
                                            }
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            if (index === chapterImages.length - 1) {
                                                setIsLoading(false);
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Description */}
                    {content && (
                        <div className={`w-full ${theme.cardBg} rounded-lg ${theme.shadow} p-4 my-6 border ${theme.border} transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
                            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Description</h2>
                            <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-line`}>
                                {content}
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Navigation */}
                <div
                    className={`fixed bottom-0 left-0 right-0 ${theme.headerBg} border-t ${theme.border} p-3 z-20 transition-all duration-300 ${theme.shadow} ${isHeaderVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                >
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        {prevChapter ? (
                            <Link href={`/comic/${comicId}/${prevChapter.id}`} legacyBehavior>
                                <a className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/20`}>
                                    <ChevronLeft size={20} />
                                    <span className="hidden sm:inline">Previous</span>
                                </a>
                            </Link>
                        ) : (
                            <div className="px-4 py-2 rounded-lg bg-gray-600/50 backdrop-blur-md opacity-50 cursor-not-allowed text-white font-medium border border-gray-700/50">
                                <span className="flex items-center gap-2">
                                    <ChevronLeft size={20} />
                                    <span className="hidden sm:inline">Previous</span>
                                </span>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={goToComicDetails}
                                className={`p-2 rounded-lg ${theme.buttonBg} ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                                aria-label="Go to comic details"
                            >
                                <Home size={20} className="text-purple-400" />
                            </button>
                            <button
                                onClick={toggleMenu}
                                className={`sm:hidden p-2 rounded-lg ${theme.buttonBg} ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                                aria-label="Open chapter list"
                            >
                                <List size={20} className="text-purple-400" />
                            </button>
                            <button
                                onClick={toggleLike}
                                className={`p-2 rounded-lg ${theme.buttonBg} ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                                aria-label={isLiked ? "Unlike this chapter" : "Like this chapter"}
                            >
                                <Heart size={20} fill={isLiked ? "#ef4444" : "none"} stroke={isLiked ? "#ef4444" : "currentColor"} className="text-purple-400" />
                            </button>
                            <button
                                onClick={shareChapter}
                                className={`p-2 rounded-lg ${theme.buttonBg} ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                                aria-label="Share chapter"
                            >
                                <Share2 size={20} className="text-purple-400" />
                            </button>
                        </div>

                        {nextChapter ? (
                            <Link href={`/comic/${comicId}/${nextChapter.id}`} legacyBehavior>
                                <a className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/20`}>
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight size={20} />
                                </a>
                            </Link>
                        ) : (
                            <div className="px-4 py-2 rounded-lg bg-gray-600/50 backdrop-blur-md opacity-50 cursor-not-allowed text-white font-medium border border-gray-700/50">
                                <span className="flex items-center gap-2">
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight size={20} />
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Action Buttons */}
                <div className={`fixed bottom-20 right-4 flex flex-col gap-3 z-30 transition-opacity duration-300 ${isHeaderVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Music Controls */}
                    <div className="relative">
                        <button
                            id="music-button"
                            onClick={() => setShowMusicControls(!showMusicControls)}
                            className={`p-3 ${theme.buttonBg} rounded-full ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                            aria-label={isMusicPlaying ? "Pause music" : "Play music"}
                        >
                            {isMusicPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                    <rect x="6" y="4" width="4" height="16"></rect>
                                    <rect x="14" y="4" width="4" height="16"></rect>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                            )}
                        </button>

                        {/* Music Controls Panel */}
                        {showMusicControls && (
                            <div
                                id="music-controls"
                                className={`absolute bottom-full right-0 mb-2 ${theme.buttonBg} rounded-lg ${theme.shadow} p-3 w-48 animate-fade-in border border-gray-700/50`}
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Volume Control */}
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                        </svg>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={volume}
                                            onChange={handleVolumeChange}
                                            className="flex-1 accent-purple-500"
                                        />
                                        <span className="text-xs font-medium w-10 text-right text-purple-400">
                                            {Math.round(volume * 100)}%
                                        </span>
                                    </div>

                                    {/* Mood Selector */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.keys(moodTracks).map((mood) => (
                                            <button
                                                key={mood}
                                                onClick={() => changeMood(mood)}
                                                className={`px-2 py-1.5 text-xs rounded-lg transition-all duration-300 ${currentMood === mood
                                                    ? `bg-gradient-to-r from-purple-600 to-pink-600 text-white`
                                                    : `${theme.hoverBg} text-purple-400`
                                                    }`}
                                            >
                                                {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Play/Pause Button */}
                                    <button
                                        onClick={toggleMusic}
                                        className={`w-full py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${isMusicPlaying
                                            ? `bg-gradient-to-r from-purple-600 to-pink-600 text-white`
                                            : `${theme.hoverBg} text-purple-400`
                                            }`}
                                    >
                                        {isMusicPlaying ? (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="6" y="4" width="4" height="16"></rect>
                                                    <rect x="14" y="4" width="4" height="16"></rect>
                                                </svg>
                                                <span className="text-sm">Pause</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                                <span className="text-sm">Play</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Existing buttons */}
                    <button
                        onClick={() => {
                            setIsHeaderVisible(!isHeaderVisible);
                            setIsNavVisible(!isNavVisible);
                        }}
                        className={`p-3 ${theme.buttonBg} rounded-full ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                        aria-label={isHeaderVisible ? "Hide controls" : "Show controls"}
                    >
                        {isHeaderVisible ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                <path d="M18 6L6 18"></path>
                                <path d="M6 6l12 12"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={scrollToTop}
                        className={`p-3 ${theme.buttonBg} rounded-full ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                        aria-label="Scroll to top"
                    >
                        <ChevronUp size={24} className="text-purple-400" />
                    </button>
                    <button
                        onClick={scrollToBottom}
                        className={`p-3 ${theme.buttonBg} rounded-full ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                        aria-label="Scroll to bottom"
                    >
                        <ChevronDown size={24} className="text-purple-400" />
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col sm:hidden animate-fade-in">
                        <div className="p-4 flex justify-between items-center border-b border-gray-700">
                            <h2 className="text-xl font-bold truncate max-w-[70%] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{title || `Chapter ${currentIndex + 1}`}</h2>
                            <button
                                onClick={toggleMenu}
                                className={`p-2 rounded-full ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                aria-label="Close menu"
                            >
                                <X size={24} className="text-purple-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">

                            <button
                                onClick={toggleMenu}
                                className={`sm:hidden mb-3 p-2 rounded-lg ${theme.buttonBg} ${theme.shadow} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border border-gray-700/50`}
                                aria-label="Open chapter list"
                            >
                                <X size={20} className="text-purple-400" />
                            </button>

                            <div className="grid gap-4">
                                {/* Chapter Select */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-purple-400">
                                        <BookOpen size={18} />
                                        <span>Chapters</span>
                                    </h3>
                                    <select
                                        value={chapterId}
                                        onChange={handleChapterChange}
                                        className={`w-full p-3 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border ${theme.border} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300`}
                                    >
                                        {chapterList.map((ch, idx) => (
                                            <option key={ch.id} value={ch.id}>
                                                {ch.title || `Chapter ${idx + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Zoom Controls */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Zoom</h3>
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            onClick={zoomOut}
                                            className={`p-3 rounded-lg ${zoomLevel <= 0.5 ? 'opacity-50 cursor-not-allowed' : theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                            disabled={zoomLevel <= 0.5}
                                        >
                                            <ZoomOut size={24} className="text-purple-400" />
                                        </button>
                                        <span className="text-lg font-medium flex-1 text-center text-purple-400">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                        <button
                                            onClick={zoomIn}
                                            className={`p-3 rounded-lg ${zoomLevel >= 2 ? 'opacity-50 cursor-not-allowed' : theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                            disabled={zoomLevel >= 2}
                                        >
                                            <ZoomIn size={24} className="text-purple-400" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={resetZoom}
                                        className={`w-full mt-3 py-2 rounded-lg ${theme.buttonBg} ${theme.hoverBg} transition-all duration-300 hover:scale-105 border ${theme.border}`}
                                    >
                                        Reset Zoom
                                    </button>
                                </div>

                                {/* Auto Scroll */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Auto Scroll</h3>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={toggleAutoScroll}
                                            className={`p-3 rounded-lg ${isAutoScrolling ? 'bg-gradient-to-r from-purple-600 to-pink-600' : theme.buttonBg} ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                        >
                                            {isAutoScrolling ? <Pause size={24} className="text-white" /> : <Play size={24} className="text-purple-400" />}
                                        </button>
                                        <div className="flex-1">
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={scrollSpeed}
                                                onChange={handleSpeedChange}
                                                className="w-full accent-purple-500"
                                            />
                                            <div className="flex justify-between text-sm mt-1">
                                                <span className="text-gray-400">Slow</span>
                                                <span className="text-purple-400">Speed: {scrollSpeed}%</span>
                                                <span className="text-gray-400">Fast</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Theme Toggle */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Theme</h3>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`w-full py-3 px-4 rounded-lg flex items-center justify-between ${theme.buttonBg} ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                    >
                                        <span className={darkMode ? 'text-purple-400' : 'text-gray-400'}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                        {darkMode ? <Sun size={20} className="text-purple-400" /> : <Moon size={20} className="text-purple-400" />}
                                    </button>
                                </div>

                                {/* Fullscreen Toggle */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Display</h3>
                                    <button
                                        onClick={toggleFullscreen}
                                        className={`w-full py-3 px-4 rounded-lg flex items-center justify-between ${theme.buttonBg} ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                    >
                                        <span className="text-purple-400">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                                        {isFullscreen ? <Minimize size={20} className="text-purple-400" /> : <Maximize size={20} className="text-purple-400" />}
                                    </button>
                                </div>

                                {/* Music Controls */}
                                <div className={`p-4 ${theme.cardBg} rounded-lg ${theme.shadow} border ${theme.border}`}>
                                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Background Music</h3>
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={toggleMusic}
                                            className={`p-3 rounded-lg ${isMusicPlaying ? 'bg-gradient-to-r from-purple-600 to-pink-600' : theme.buttonBg} ${theme.hoverBg} transition-all duration-300 hover:scale-105`}
                                        >
                                            {isMusicPlaying ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                                    <rect x="6" y="4" width="4" height="16"></rect>
                                                    <rect x="14" y="4" width="4" height="16"></rect>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                            )}
                                        </button>
                                        {isMusicPlaying && (
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="1"
                                                    step="0.1"
                                                    value={volume}
                                                    onChange={handleVolumeChange}
                                                    className="w-full accent-purple-500"
                                                />
                                                <div className="flex justify-between text-sm mt-1">
                                                    <span className="text-gray-400">0%</span>
                                                    <span className="text-purple-400">Volume: {Math.round(volume * 100)}%</span>
                                                    <span className="text-gray-400">100%</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {isMusicPlaying && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.keys(moodTracks).map((mood) => (
                                                <button
                                                    key={mood}
                                                    onClick={() => changeMood(mood)}
                                                    className={`py-2 px-3 rounded-lg text-sm transition-all duration-300 ${currentMood === mood
                                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                                        : `${theme.buttonBg} text-purple-400 ${theme.hoverBg}`
                                                        }`}
                                                >
                                                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}