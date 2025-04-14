import { useState, useEffect } from "react";
import Image from 'next/image';
import { db } from "../BE/firebase";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    setDoc
} from "firebase/firestore";
import Link from "next/link";

export default function AdminDashboard() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [comics, setComics] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredComics, setFilteredComics] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("add");
    const [previewImage, setPreviewImage] = useState("");
    const [selectedComic, setSelectedComic] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editGenres, setEditGenres] = useState([]);
    const [editStatus, setEditStatus] = useState("");
    const [editType, setEditType] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const genres = [
        "Action", "Adventure", "Comedy", "Fantasy", "Horror", "Romance", "Sci-Fi", "Mystery",
        "Drama", "Slice of Life", "Supernatural", "Thriller", "Sports", "Martial Arts",
        "Historical", "Mecha", "Psychological", "School Life", "Shoujo", "Shounen",
        "Seinen", "Josei", "Isekai", "Music", "Tragedy", "Parody", "Magic", "Ecchi",
        "Military", "Game", "Vampire", "Dementia", "Harem", "Police", "Samurai",
        "Demons", "Space"
    ];

    const statuses = ["Ongoing", "Completed"];
    const types = ["Manga", "Manhwa", "Manhua"];

    useEffect(() => {
        const fetchComics = async () => {
            try {
                setIsLoading(true);
                const querySnapshot = await getDocs(collection(db, "comics"));
                const comicsWithDetails = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const comicData = doc.data();
                        const detailSnapshot = await getDocs(collection(db, "comics", doc.id, "detailKomik"));
                        const details = detailSnapshot.docs.map(detailDoc => ({
                            id: detailDoc.id,
                            ...detailDoc.data()
                        }));

                        return { id: doc.id, ...comicData, details };
                    })
                );
                setComics(comicsWithDetails);
                setFilteredComics(comicsWithDetails);
            } catch (error) {
                console.error("Error fetching comics:", error);
                setError("Failed to load comics. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchComics();
    }, []);

    useEffect(() => {
        const filterComics = () => {
            let filtered = [...comics];

            // Apply search query filter
            if (searchQuery) {
                filtered = filtered.filter(comic =>
                    comic.title.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            setFilteredComics(filtered);
        };

        filterComics();
    }, [searchQuery, comics]);

    useEffect(() => {
        if (imageUrl) {
            setPreviewImage(imageUrl);
        }
    }, [imageUrl]);

    const handleGenreChange = (e) => {
        const genre = e.target.value;
        setSelectedGenres((prevGenres) =>
            prevGenres.includes(genre)
                ? prevGenres.filter((item) => item !== genre)
                : [...prevGenres, genre]
        );
    };

    const validateForm = () => {
        if (!title.trim()) return "Judul komik tidak boleh kosong";
        if (!description.trim()) return "Deskripsi komik tidak boleh kosong";
        if (!imageUrl.trim()) return "URL gambar tidak boleh kosong";
        if (selectedGenres.length === 0) return "Pilih minimal satu genre";
        if (!selectedStatus) return "Status komik harus dipilih";
        if (!selectedType) return "Tipe komik harus dipilih";
        return "";
    };

    const addComic = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setSuccess("");
            setTimeout(() => setError(""), 5000);
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            // 1. Tambahkan dokumen komik
            const docRef = await addDoc(collection(db, "comics"), {
                title,
                description,
                imageUrl,
                genres: selectedGenres,
                status: selectedStatus,
                type: selectedType,
                views: 0,
                dailyViews: 0,
                weeklyViews: 0,
                monthlyViews: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                rating: 0,
                totalRatings: 0,
                isFeatured: false,
                isPopular: false,
                isNew: true
            });

            // 2. Tambahkan subcollection detailKomik
            const detailCollectionRef = collection(db, "comics", docRef.id, "detailKomik");
            const detailDocRef = await addDoc(detailCollectionRef, {
                title: "Chapter 1",
                chapterNumber: 1,
                description: "Chapter pertama dari komik ini",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                views: 0,
                isPublished: true
            });

            // 3. Tambahkan field detailId ke dokumen komik utama
            const comicDocRef = doc(db, "comics", docRef.id);
            await setDoc(comicDocRef, {
                detailId: detailDocRef.id,
                lastChapterId: detailDocRef.id,
                lastChapterNumber: 1,
                lastChapterTitle: "Chapter 1",
                lastUpdated: new Date().toISOString()
            }, { merge: true });

            // 4. Reset form
            setTitle("");
            setDescription("");
            setImageUrl("");
            setPreviewImage("");
            setSelectedGenres([]);
            setSelectedStatus("");
            setSelectedType("");

            setSuccess("Komik berhasil ditambahkan!");
            setTimeout(() => setSuccess(""), 5000);

            // 5. Refresh comics list
            const querySnapshot = await getDocs(collection(db, "comics"));
            const comicsWithDetails = await Promise.all(
                querySnapshot.docs.map(async (doc) => {
                    const comicData = doc.data();
                    const detailSnapshot = await getDocs(collection(db, "comics", doc.id, "detailKomik"));
                    const details = detailSnapshot.docs.map(detailDoc => ({
                        id: detailDoc.id,
                        ...detailDoc.data()
                    }));

                    return { id: doc.id, ...comicData, details };
                })
            );
            setComics(comicsWithDetails);
            setFilteredComics(comicsWithDetails);

            // 6. Switch to list tab
            setActiveTab("list");
        } catch (err) {
            console.error("Gagal menambahkan komik:", err);
            setError("Terjadi kesalahan saat menambahkan komik. Silakan coba lagi.");
            setTimeout(() => setError(""), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateComic = async () => {
        // Implementasi update comic
    };

    const handleDeleteComic = async () => {
        // Implementasi delete comic
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Navbar */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <div className="container mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-0">
                            Comic Admin Dashboard
                        </h1>
                        <div className="flex space-x-2">
                            <Link href="/"
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition duration-200"
                            >
                                Home
                            </Link>
                            <button
                                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium shadow-md hover:bg-gray-100 transition duration-200"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Tabs */}
            <div className="sm:hidden bg-white border-b shadow-sm">
                <div className="flex justify-center">
                    <button
                        onClick={() => setActiveTab("add")}
                        className={`px-4 py-3 font-medium text-sm flex-1 text-center ${activeTab === "add" ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500"}`}
                    >
                        Add Comic
                    </button>
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-4 py-3 font-medium text-sm flex-1 text-center ${activeTab === "list" ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-500"}`}
                    >
                        Comics List
                    </button>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6 sm:py-8">
                {/* Search Bar */}
                <div className="mb-8 max-w-2xl mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for comics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-4 pl-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-gray-700"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-black">
                    {/* Form Section */}
                    <div className={`lg:col-span-4 ${activeTab !== "add" && "hidden sm:block"}`}>
                        <div className="bg-white rounded-2xl shadow-md p-6 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                                Tambah Komik Baru
                            </h2>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p>{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <p>{success}</p>
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Komik</label>
                                    <input
                                        type="text"
                                        placeholder="Masukkan judul komik"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Komik</label>
                                    <textarea
                                        placeholder="Masukkan deskripsi komik"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition h-28"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Cover Gambar</label>
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.jpg"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    />
                                </div>

                                {/* Image Preview */}
                                {previewImage && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Preview Gambar:</p>
                                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                            <Image
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                width={320}
                                                height={160}
                                                onError={() => setPreviewImage("/placeholder-image.jpg")}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Genre Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {genres.map((genre) => (
                                            <label key={genre} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition">
                                                <input
                                                    type="checkbox"
                                                    value={genre}
                                                    checked={selectedGenres.includes(genre)}
                                                    onChange={handleGenreChange}
                                                    className="rounded text-purple-600 focus:ring-purple-500 focus:ring-offset-0 h-4 w-4"
                                                />
                                                <span>{genre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div className="flex flex-wrap gap-4">
                                        {statuses.map((status) => (
                                            <label key={status} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition w-full sm:w-auto">
                                                <input
                                                    type="radio"
                                                    value={status}
                                                    checked={selectedStatus === status}
                                                    onChange={() => setSelectedStatus(status)}
                                                    className="text-purple-600 focus:ring-purple-500 focus:ring-offset-0 h-4 w-4"
                                                />
                                                <span className="flex items-center">
                                                    {status === "Ongoing" ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                                    )}
                                                    {status}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Komik</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {types.map((type) => (
                                            <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition">
                                                <input
                                                    type="radio"
                                                    value={type}
                                                    checked={selectedType === type}
                                                    onChange={() => setSelectedType(type)}
                                                    className="text-purple-600 focus:ring-purple-500 focus:ring-offset-0 h-4 w-4"
                                                />
                                                <span>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={addComic}
                                        disabled={isLoading}
                                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isLoading
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                                </svg>
                                                Tambah Komik
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comics List Section - Hidden on mobile when add tab is active */}
                    <div className={`lg:col-span-8 ${activeTab !== "list" && "hidden sm:block"}`}>
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                </svg>
                                Daftar Komik
                                <span className="text-sm font-normal text-gray-500 ml-2">({filteredComics.length} komik)</span>
                            </h2>

                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="flex flex-col items-center">
                                        <svg className="animate-spin h-8 w-8 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="text-gray-500">Memuat data komik...</p>
                                    </div>
                                </div>
                            ) : filteredComics.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredComics.map(comic => (
                                        <div key={comic.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                                            {comic.details.map(detail => (
                                                <Link key={detail.id} href={`/dashboard/${comic.id}/detailKomik/${detail.id}`} className="block h-full">
                                                    <div className="relative pb-[140%] overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={comic.imageUrl}
                                                            alt={comic.title}
                                                            className="absolute h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = "/placeholder-image.jpg" }}
                                                        />
                                                        <div className="absolute top-0 right-0 p-2">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${comic.status === "Ongoing"
                                                                ? "bg-green-500 text-white"
                                                                : "bg-blue-500 text-white"
                                                                }`}>
                                                                {comic.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-lg mb-2 text-gray-800 line-clamp-1">{comic.title}</h3>
                                                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{comic.description}</p>
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {comic.genres && comic.genres.slice(0, 3).map(genre => (
                                                                <span key={genre} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                                                                    {genre}
                                                                </span>
                                                            ))}
                                                            {comic.genres && comic.genres.length > 3 && (
                                                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                                                    +{comic.genres.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                            <div className="flex items-center text-gray-500 text-sm">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                                {comic.views || 0}
                                                            </div>
                                                            <span className="text-xs py-1 px-2 bg-indigo-100 text-indigo-800 rounded-md font-medium">
                                                                {comic.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-lg p-8 text-center">
                                    <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">Tidak ada komik yang ditemukan</h3>
                                    <p className="text-gray-500 mb-4">Coba gunakan kata kunci pencarian yang berbeda atau tambahkan komik baru.</p>
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setActiveTab("add");
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                        </svg>
                                        Tambah Komik Baru
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Comic Modal */}
            {selectedComic && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">Edit Komik</h2>
                                <button
                                    onClick={() => setSelectedComic(null)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul Komik</label>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Komik</label>
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Cover Gambar</label>
                                    <input
                                        type="text"
                                        value={editImageUrl}
                                        onChange={(e) => setEditImageUrl(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Image Preview */}
                                {editImageUrl && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Preview Gambar:</p>
                                        <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                            <Image
                                                src={editImageUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={() => setEditImageUrl("/placeholder-image.jpg")}
                                                width={320}
                                                height={160}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Genre Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {genres.map((genre) => (
                                            <label key={genre} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded-md transition">
                                                <input
                                                    type="checkbox"
                                                    value={genre}
                                                    checked={editGenres.includes(genre)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setEditGenres([...editGenres, genre]);
                                                        } else {
                                                            setEditGenres(editGenres.filter(g => g !== genre));
                                                        }
                                                    }}
                                                    className="rounded text-purple-600 focus:ring-purple-500"
                                                />
                                                <span>{genre}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <div className="flex flex-wrap gap-4">
                                        {statuses.map((status) => (
                                            <label key={status} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition">
                                                <input
                                                    type="radio"
                                                    value={status}
                                                    checked={editStatus === status}
                                                    onChange={() => setEditStatus(status)}
                                                    className="text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="flex items-center">
                                                    {status === "Ongoing" ? (
                                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                                    ) : (
                                                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                                    )}
                                                    {status}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Komik</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {types.map((type) => (
                                            <label key={type} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-md transition">
                                                <input
                                                    type="radio"
                                                    value={type}
                                                    checked={editType === type}
                                                    onChange={() => setEditType(type)}
                                                    className="text-purple-600 focus:ring-purple-500"
                                                />
                                                <span>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        onClick={() => setSelectedComic(null)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleUpdateComic}
                                        disabled={isLoading}
                                        className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${isLoading
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                            }`}
                                    >
                                        {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 text-center mb-2">Hapus Komik</h3>
                            <p className="text-sm text-gray-500 text-center mb-6">
                                Apakah Anda yakin ingin menghapus komik ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleDeleteComic}
                                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}