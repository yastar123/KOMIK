import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { db } from "../../BE/firebase";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    updateDoc,
    increment,
    Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { Play, Bookmark, ListPlus, Star, Eye, MessageSquare, ChevronLeft, Search, Info, FileText, List, ChevronDown, Home } from "lucide-react";
import Layout from "../../components/Layout";

export default function ComicDetail() {
    const router = useRouter();
    const { id } = router.query;

    const [comic, setComic] = useState(null);
    const [detailKomik, setDetailKomik] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [selectedTab, setSelectedTab] = useState("chapters");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!id) return;

        const fetchComicData = async () => {
            try {
                const comicRef = doc(db, "comics", id);
                const comicSnap = await getDoc(comicRef);

                if (!comicSnap.exists()) {
                    console.log("Komik tidak ditemukan!");
                    return;
                }

                const comicData = comicSnap.data();
                const now = new Date();

                const lastDailyReset = comicData.lastDailyReset?.toDate?.() || null;
                const lastWeeklyReset = comicData.lastWeeklyReset?.toDate?.() || null;

                const isNewDay =
                    !lastDailyReset ||
                    lastDailyReset.toDateString() !== now.toDateString();

                const isNewWeek =
                    !lastWeeklyReset ||
                    getWeekNumber(lastWeeklyReset) !== getWeekNumber(now);

                // Buat data update
                const updatedViews = {
                    views: (comicData.views || 0) + 1,
                    dailyViews: isNewDay ? 1 : (comicData.dailyViews || 0) + 1,
                    weeklyViews: isNewWeek ? 1 : (comicData.weeklyViews || 0) + 1,
                };

                if (isNewDay) {
                    updatedViews.lastDailyReset = Timestamp.fromDate(now);
                }

                if (isNewWeek) {
                    updatedViews.lastWeeklyReset = Timestamp.fromDate(now);
                }

                await updateDoc(comicRef, updatedViews);

                setComic({ id: comicSnap.id, ...comicData });

                const detailKomikCollection = collection(db, "comics", id, "detailKomik");
                const detailKomikSnapshot = await getDocs(detailKomikCollection);

                if (!detailKomikSnapshot.empty) {
                    const firstDetail = detailKomikSnapshot.docs[0];
                    setDetailKomik({ id: firstDetail.id, ...firstDetail.data() });

                    const chaptersCollection = collection(
                        db,
                        "comics",
                        id,
                        "detailKomik",
                        firstDetail.id,
                        "chapters"
                    );
                    const chaptersSnapshot = await getDocs(chaptersCollection);

                    const allChapters = chaptersSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));

                    setChapters(allChapters);
                } else {
                    console.log("Detail komik tidak ditemukan!");
                }
            } catch (error) {
                console.error("Error fetching comic details:", error);
            }
        };

        fetchComicData();
    }, [id]);

    const filteredChapters = chapters
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(chapter => {
            if (!searchQuery) return true;
            return chapter.title.toLowerCase().includes(searchQuery.toLowerCase());
        });

    if (!comic) return (
        <div className="flex items-center justify-center h-screen bg-gray-900">
            <div className="text-white text-xl">Loading...</div>
        </div>
    );

    return (
        <Layout>
            <div className="flex flex-col min-h-screen bg-gray-900/50 text-white overflow-hidden">
                {/* Header with enhanced blur and gradient */}
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-gray-900 z-10"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-gray-900/90 to-transparent z-10"></div>
                    <img
                        src={comic.imageUrl || "/api/placeholder/1600/400"}
                        className="w-full h-52  md:h-64 object-cover blur-[2px]"
                        alt={comic.title}
                    />

                    {/* Navigation buttons with enhanced hover effects */}
                    <div className="absolute top-4 left-4 z-20">
                        <button
                            className="bg-gray-900/50 backdrop-blur-md rounded-full p-2 hover:bg-gray-700/60 transition-all duration-300 hover:scale-105"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft size={24} className="text-gray-300" />
                        </button>
                    </div>
                    <div className="absolute top-4 right-4 z-20">
                        <Link href="/">
                            <button className="bg-gray-900/50 backdrop-blur-md rounded-full p-2 hover:bg-gray-700/60 transition-all duration-300 hover:scale-105">
                                <Home size={24} className="text-gray-300" />
                            </button>
                        </Link>
                    </div>

                    {/* Main content with improved layout */}
                    <div className="relative -mt-28 md:-mt-36  px-4 z-20 ">
                        <div className="md:flex gap-6 bg-gray">
                            {/* Enhanced manga cover */}
                            <div className="md:w-36 md:h-52 w-32 h-48 mx-auto md:mx-0 rounded-lg overflow-hidden flex-shrink-0 shadow-xl border border-gray-700/50 relative flex justify-center items-center group ">
                                <img
                                    src={comic.imageUrl || "/api/placeholder/240/360"}
                                    alt={comic.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>

                            {/* Title and info with enhanced typography */}
                            <div className="md:flex-1 mt-4 md:pt-14">
                                <h1 className="text-2xl md:text-3xl text-center md:text-left font-bold md:mb-1 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {comic.title}
                                </h1>
                                <p className="text-gray-300 mb-4 text-center md:text-left">{detailKomik?.title || ""}</p>

                                {/* Action buttons with enhanced styling */}
                                <div className="flex flex-col md:flex-row gap-3 ">
                                    {chapters.length > 0 && (
                                        <Link href={`/comic/${id}/${chapters[0].id}`}>
                                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg px-6 py-2.5 flex items-center justify-center gap-2 w-full md:w-fit hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/20">
                                                <Play size={18} />
                                                <span>Baca</span>
                                            </button>
                                        </Link>
                                    )}

                                    <button className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 w-full md:w-fit hover:bg-gray-700/95 transition-all duration-300 shadow-lg">
                                        <Bookmark size={18} className="text-purple-400" />
                                        <span>Bookmark</span>
                                    </button>

                                    <button className="bg-gray-900/50 backdrop-blur-md border border-gray-700/50 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 w-full md:w-fit hover:bg-gray-700/95 transition-all duration-300 shadow-lg">
                                        <ListPlus size={18} className="text-purple-400" />
                                        <span>Tambah ke Readlist</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced stats display */}
                        <div className="flex flex-wrap gap-4 mt-4  justify-center md:justify-start  ">
                            <div className="flex items-center gap-1.5 bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/50">
                                <Star size={18} className="text-amber-400" />
                                <span className="font-bold">8.6</span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/50">
                                <Eye size={18} className="text-blue-400" />
                                <span className="font-bold">{comic.dailyViews || 1}</span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/50">
                                <Eye size={18} className="text-purple-400" />
                                <span className="font-bold">{comic.views || 1}</span>
                            </div>

                            <div className="flex items-center gap-1.5 bg-gray-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-700/50">
                                <MessageSquare size={18} className="text-pink-400" />
                                <span className="font-bold">{comic.weeklyViews || 1}</span>
                            </div>
                        </div>

                        {/* Enhanced description box */}
                        <div className="mt-4 bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 shadow-lg">
                            <p className="text-sm text-gray-300">
                                {comic.description}
                                <span className="text-purple-400 cursor-pointer ml-1 hover:text-purple-300 transition-colors">Read More</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Enhanced info cards */}
                <div className="px-4 py-4 ">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 shadow-lg">
                            <span className="text-gray-400 text-xs md:text-sm">Genre</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {comic.genres?.map((genre, index) => (
                                    <Link key={index} href={`/genre/${genre.toLowerCase()}`} className="my-1">
                                        <span className="bg-gray-700/50 backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm rounded-full cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/50">
                                            {genre}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 shadow-lg">
                            <span className="text-gray-400 text-xs md:text-sm">Author</span>
                            <div className="flex mt-2">
                                <span className="bg-gray-700/50 backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm rounded-full border border-gray-600/50">
                                    {comic.author || "Unknown"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 shadow-lg">
                            <span className="text-gray-400 text-xs md:text-sm">Format</span>
                            <div className="flex mt-2">
                                <span className="bg-gray-700/50 backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm rounded-full border border-gray-600/50">
                                    {comic.format || "Manhwa"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur-md p-4 rounded-lg border border-gray-700/50 shadow-lg">
                            <span className="text-gray-400 text-xs md:text-sm">Type</span>
                            <div className="flex mt-2">
                                <span className="bg-gray-700/50 backdrop-blur-sm px-3 py-1.5 text-xs md:text-sm rounded-full border border-gray-600/50">
                                    {comic.type || "Project"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced tabs */}
                <div className="flex border-b border-gray-900/50">
                    <button
                        className={`flex items-center gap-2 py-3 px-4 relative ${selectedTab === 'chapters' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                        onClick={() => setSelectedTab("chapters")}
                    >
                        <List size={18} />
                        <span>Chapters</span>
                        {selectedTab === 'chapters' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                        )}
                    </button>

                    <button
                        className={`flex items-center gap-2 py-3 px-4 relative ${selectedTab === 'info' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                        onClick={() => setSelectedTab("info")}
                    >
                        <Info size={18} />
                        <span>Info</span>
                        {selectedTab === 'info' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                        )}
                    </button>

                    <button
                        className={`flex items-center gap-2 py-3 px-4 relative ${selectedTab === 'novel' ? 'text-purple-400' : 'text-gray-400 hover:text-gray-300'} transition-colors`}
                        onClick={() => setSelectedTab("novel")}
                    >
                        <FileText size={18} />
                        <span>Novel</span>
                        {selectedTab === 'novel' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                        )}
                    </button>
                </div>

                {/* Enhanced search bar */}
                <div className="p-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Chapter, Contoh: 69 atau 76"
                            className="w-full bg-gray-900/50 backdrop-blur-md rounded-lg p-3 pl-10 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 shadow-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                            <button className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors">
                                <ChevronDown size={18} className="text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Enhanced chapters list */}
                {selectedTab === 'chapters' && (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                            {filteredChapters.length > 0 ? (
                                filteredChapters.map((chapter) => (
                                    <Link key={chapter.id} href={`/comic/${id}/${chapter.id}`}>
                                        <div className="bg-gray-900/50 backdrop-blur-md hover:bg-gray-700/50 transition-all duration-300 rounded-lg overflow-hidden cursor-pointer border border-gray-700/50 shadow-lg group">
                                            <div className="relative h-40">
                                                <img
                                                    src={chapter.coverImage || "/api/placeholder/240/160"}
                                                    alt={chapter.title}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                {chapter.isLatest && (
                                                    <div className="absolute top-2 right-2 bg-purple-600/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold uppercase">
                                                        NEW
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="font-medium group-hover:text-purple-400 transition-colors">{chapter.title}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {chapter.timestamp ? formatTimestamp(chapter.timestamp) : "Unknown date"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-900/50 backdrop-blur-md rounded-full mb-4">
                                        <Search className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-gray-400">
                                        {searchQuery ? "No chapters found matching your search." : "Belum ada chapter."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

// Helper untuk ambil minggu ke-berapa dalam tahun
function getWeekNumber(date) {
    const firstJan = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor(
        (date - firstJan + (firstJan.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000) /
        (24 * 60 * 60 * 1000)
    );
    return Math.ceil((days + firstJan.getDay() + 1) / 7);
}

// Helper to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return "Unknown";

    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}