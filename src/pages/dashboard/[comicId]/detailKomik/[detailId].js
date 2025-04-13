import { useState, useEffect } from "react";
import { db } from "../../../../BE/firebase";
import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    addDoc,
    Timestamp
} from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DetailKomik() {
    const [comic, setComic] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [newChapterTitle, setNewChapterTitle] = useState("");
    const [newChapterUrl, setNewChapterUrl] = useState(""); // Keeping this for backward compatibility
    const [newChapterCover, setNewChapterCover] = useState("");
    const [newDescription, setNewDescription] = useState("");

    // For bulk image URL input
    const [chapterImagesText, setChapterImagesText] = useState("");
    const [urlValidationStatus, setUrlValidationStatus] = useState({
        isValid: true,
        message: ""
    });
    const [isPreviewingNewImages, setIsPreviewingNewImages] = useState(false);
    const [parsedImageUrls, setParsedImageUrls] = useState([]);

    // For editing existing chapters
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [isEditingImages, setIsEditingImages] = useState(false);
    const [editingChapterImagesText, setEditingChapterImagesText] = useState("");
    const [editUrlValidationStatus, setEditUrlValidationStatus] = useState({
        isValid: true,
        message: ""
    });
    const [isPreviewingEditImages, setIsPreviewingEditImages] = useState(false);
    const [parsedEditImageUrls, setParsedEditImageUrls] = useState([]);

    const router = useRouter();
    const { comicId, detailId } = router.query;

    useEffect(() => {
        if (!detailId || !comicId) return;

        const fetchComicDetails = async () => {
            const comicRef = doc(db, "comics", comicId);
            const comicSnap = await getDoc(comicRef);

            if (comicSnap.exists()) {
                setComic(comicSnap.data());
            } else {
                console.log("Komik tidak ditemukan!");
            }

            const chapterRef = doc(db, "comics", comicId, "detailKomik", detailId);
            const chapterSnap = await getDoc(chapterRef);

            if (chapterSnap.exists()) {
                setChapter(chapterSnap.data());
                setNewDescription(chapterSnap.data().description || "");
            } else {
                console.log("Detail komik tidak ditemukan!");
            }
        };

        const fetchChapters = async () => {
            const chaptersSnapshot = await getDocs(
                collection(db, "comics", comicId, "detailKomik", detailId, "chapters")
            );
            const chaptersData = chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort chapters by timestamp in ascending order (oldest first)
            const sortedChapters = chaptersData.sort((a, b) => {
                return a.timestamp.seconds - b.timestamp.seconds;
            });
            
            setChapters(sortedChapters);
        };

        fetchComicDetails();
        fetchChapters();
    }, [detailId, comicId]);

    const updateComicDescription = async () => {
        if (!comicId || !detailId) return;
        const chapterRef = doc(db, "comics", comicId, "detailKomik", detailId);
        await updateDoc(chapterRef, { description: newDescription });
        alert("Deskripsi berhasil diperbarui!");
    };

    // Add a helper function to clean URLs
    const cleanImageUrl = (url) => {
        return url.replace(/^["']|["']$/g, '').trim();
    };

    // Update the validateUrl function
    const validateUrl = (url) => {
        try {
            // Check if it's a valid URL
            new URL(url);

            // Check if it's an image URL
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
        } catch (e) {
            return false;
        }
    };

    // Update the validateAllUrls function
    const validateAllUrls = (text, setter) => {
        if (!text.trim()) {
            setter({
                isValid: false,
                message: "Harap masukkan minimal satu URL gambar"
            });
            return false;
        }

        const urls = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (urls.length === 0) {
            setter({
                isValid: false,
                message: "Harap masukkan minimal satu URL gambar"
            });
            return false;           
        }

        // Check each URL
        const invalidUrls = urls
            .filter(url => !validateUrl(url))
            .map((url, idx) => `Baris ${idx + 1}: ${url}`);

        if (invalidUrls.length > 0) {
            setter({
                isValid: false,
                message: `URL tidak valid ditemukan: ${invalidUrls.join(', ')}`
            });
            return false;
        }

        setter({
            isValid: true,
            message: `${urls.length} URL gambar valid`
        });
        return true;
    };

    // Update the parseImagesFromText function
    const parseImagesFromText = (text) => {
        if (!text.trim()) return [];

        return text
            .split('\n')
            .map((line, index) => {
                const cleanedUrl = cleanImageUrl(line);
                if (cleanedUrl) {
                    return {
                        imageUrl: cleanedUrl,
                        order: index + 1
                    };
                }
                return null;
            })
            .filter(Boolean); // Remove null entries
    };

    // Update the previewNewChapterImages function
    const previewNewChapterImages = () => {
        if (validateAllUrls(chapterImagesText, setUrlValidationStatus)) {
            const parsed = parseImagesFromText(chapterImagesText);
            setParsedImageUrls(parsed);
            setIsPreviewingNewImages(true);
        }
    };

    // Update the previewEditChapterImages function
    const previewEditChapterImages = () => {
        if (validateAllUrls(editingChapterImagesText, setEditUrlValidationStatus)) {
            const parsed = parseImagesFromText(editingChapterImagesText);
            setParsedEditImageUrls(parsed);
            setIsPreviewingEditImages(true);
        }
    };

    // Handle adding a new chapter with multiple images from textarea
    const addChapter = async () => {
        if (!validateAllUrls(chapterImagesText, setUrlValidationStatus)) {
            return;
        }

        // Convert textarea content to array of image objects
        const imagesArray = parseImagesFromText(chapterImagesText);

        if (imagesArray.length === 0) {
            setUrlValidationStatus({
                isValid: false,
                message: "Harap tambahkan minimal satu URL gambar!"
            });
            return;
        }

        try {
            // Get the next chapter number based on existing chapters length
            const nextChapterNumber = chapters.length + 1;
            
            await addDoc(collection(db, "comics", comicId, "detailKomik", detailId, "chapters"), {
                title: `${nextChapterNumber}`, // Always use the next chapter number as title
                url: imagesArray[0]?.imageUrl || "", // Keep first URL for backward compatibility
                coverImage: newChapterCover || imagesArray[0]?.imageUrl || "",
                timestamp: Timestamp.now(),
                images: imagesArray, // Store the array of image objects with order
            });

            setNewChapterTitle("");
            setNewChapterUrl("");
            setNewChapterCover("");
            setChapterImagesText("");
            setIsPreviewingNewImages(false);
            setParsedImageUrls([]);
            setUrlValidationStatus({
                isValid: true,
                message: ""
            });

            alert("Chapter berhasil ditambahkan!");

            // Refresh chapter list
            const chaptersSnapshot = await getDocs(
                collection(db, "comics", comicId, "detailKomik", detailId, "chapters")
            );
            setChapters(chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error adding chapter:", error);
            alert("Gagal menambahkan chapter: " + error.message);
        }
    };

    // Handle editing chapter images
    const startEditingImages = (chapter) => {
        setSelectedChapter(chapter);
        setIsEditingImages(true);
        setIsPreviewingEditImages(false);

        // Convert existing image array back to text format for editing
        let imagesText = "";

        if (chapter.images && Array.isArray(chapter.images)) {
            // Sort by order if it exists
            const sortedImages = [...chapter.images].sort((a, b) => {
                // Handle both new format (objects with order) and old format (strings)
                if (typeof a === 'object' && typeof b === 'object') {
                    return a.order - b.order;
                }
                return 0;
            });

            imagesText = sortedImages.map(img =>
                typeof img === 'object' ? img.imageUrl : img
            ).join('\n');
        } else if (chapter.url) {
            // Fallback for old format
            imagesText = chapter.url;
        }

        setEditingChapterImagesText(imagesText);
        setEditUrlValidationStatus({
            isValid: true,
            message: ""
        });
    };

    // Save updated images for existing chapter
    const saveChapterImages = async () => {
        if (!validateAllUrls(editingChapterImagesText, setEditUrlValidationStatus)) {
            return;
        }

        // Convert textarea content to array of image objects
        const imagesArray = parseImagesFromText(editingChapterImagesText);

        if (imagesArray.length === 0) {
            setEditUrlValidationStatus({
                isValid: false,
                message: "Harap tambahkan minimal satu URL gambar!"
            });
            return;
        }

        try {
            const chapterRef = doc(
                db,
                "comics",
                comicId,
                "detailKomik",
                detailId,
                "chapters",
                selectedChapter.id
            );

            await updateDoc(chapterRef, {
                images: imagesArray,
                url: imagesArray[0]?.imageUrl || "", // Keep the first image as the main URL for backward compatibility
            });

            setIsEditingImages(false);
            setSelectedChapter(null);
            setIsPreviewingEditImages(false);
            setParsedEditImageUrls([]);

            alert("Gambar chapter berhasil diperbarui!");

            // Refresh chapter list
            const chaptersSnapshot = await getDocs(
                collection(db, "comics", comicId, "detailKomik", detailId, "chapters")
            );
            setChapters(chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error updating chapter images:", error);
            alert("Gagal memperbarui gambar chapter: " + error.message);
        }
    };

    const deleteChapter = async (chapterId) => {
        if (!confirm("Apakah Anda yakin ingin menghapus chapter ini?")) {
            return;
        }

        try {
            await deleteDoc(doc(db, "comics", comicId, "detailKomik", detailId, "chapters", chapterId));
            alert("Chapter berhasil dihapus!");
            // Refresh chapter list
            const chaptersSnapshot = await getDocs(
                collection(db, "comics", comicId, "detailKomik", detailId, "chapters")
            );
            setChapters(chaptersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error deleting chapter:", error);
            alert("Gagal menghapus chapter: " + error.message);
        }
    };

    // Update the previewChapterImages function
    const previewChapterImages = (chapter) => {
        setSelectedChapter(chapter);
        setIsEditingImages(false);

        // Process the images based on their format
        let imagesToDisplay = [];

        if (chapter.images && Array.isArray(chapter.images)) {
            // Sort by order if available
            if (chapter.images[0] && typeof chapter.images[0] === 'object') {
                imagesToDisplay = [...chapter.images]
                    .sort((a, b) => a.order - b.order)
                    .map(img => cleanImageUrl(img.imageUrl));
            } else {
                imagesToDisplay = chapter.images.map(url => cleanImageUrl(url));
            }
        } else if (chapter.url) {
            // Fallback for old format
            imagesToDisplay = [cleanImageUrl(chapter.url)];
        }

        setEditingChapterImagesText(imagesToDisplay.join('\n'));
    };

    // Get count of images for a chapter
    const getImageCount = (chapter) => {
        if (chapter.images && Array.isArray(chapter.images)) {
            return chapter.images.length;
        } else if (chapter.url) {
            return 1;
        }
        return 0;
    };

    // Function to detect image URLs from clipboard
    const handleImageUrlPaste = (e, setter, validationSetter) => {
        // Get pasted text
        const pasteData = e.clipboardData.getData('text');

        // Check if it contains multiple lines (could be multiple URLs)
        if (pasteData.includes('\n')) {
            // Get the current textarea value and cursor position
            const currentValue = e.target.value;
            const cursorPos = e.target.selectionStart;

            // Insert pasted text at cursor position
            const newValue =
                currentValue.substring(0, cursorPos) +
                pasteData +
                currentValue.substring(e.target.selectionEnd);

            // Update state
            setter(newValue);

            // Validate all URLs
            setTimeout(() => {
                validateAllUrls(newValue, validationSetter);
            }, 100);

            e.preventDefault();
        }
    };

    if (!comic || !chapter) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Memuat data komik...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-0">
                            {comic.title}
                        </h1>
                        <Link href="/dashboard" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition duration-200">
                            Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Sinopsis Section */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center border-b pb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Sinopsis
                    </h2>
                    <div className="space-y-4">
                        <textarea
                            rows="4"
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            placeholder="Masukkan sinopsis komik..."
                        />
                        <button
                            onClick={updateComicDescription}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Update Deskripsi
                        </button>
                    </div>
                </div>

                {/* New Images Preview Modal */}
                {isPreviewingNewImages && parsedImageUrls.length > 0 && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                                <h3 className="text-xl font-bold">Preview Images Sebelum Upload</h3>
                                <button
                                    onClick={() => setIsPreviewingNewImages(false)}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    Total {parsedImageUrls.length} gambar akan ditambahkan
                                </p>
                                <div className="space-y-4">
                                    {parsedImageUrls.map((img, idx) => (
                                        <div key={idx} className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 p-2 text-sm font-medium flex justify-between items-center">
                                                <span>Gambar #{img.order}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-xs">{img.imageUrl}</span>
                                            </div>
                                            <div className="relative pb-[56.25%] h-0">
                                                <img
                                                    src={img.imageUrl}
                                                    alt={`Preview gambar ${img.order}`}
                                                    className="absolute h-full w-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/400x300?text=Error+Loading+Image";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => setIsPreviewingNewImages(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                                    >
                                        Kembali Edit
                                    </button>
                                    <button
                                        onClick={addChapter}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700"
                                    >
                                        Tambahkan Chapter Ini
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Images Preview Modal */}
                {isPreviewingEditImages && parsedEditImageUrls.length > 0 && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                                <h3 className="text-xl font-bold">Preview Perubahan: {selectedChapter?.title}</h3>
                                <button
                                    onClick={() => setIsPreviewingEditImages(false)}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500 mb-4">
                                    Total {parsedEditImageUrls.length} gambar akan disimpan
                                </p>
                                <div className="space-y-4">
                                    {parsedEditImageUrls.map((img, idx) => (
                                        <div key={idx} className="border rounded-lg overflow-hidden">
                                            <div className="bg-gray-100 p-2 text-sm font-medium flex justify-between items-center">
                                                <span>Gambar #{img.order}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-xs">{img.imageUrl}</span>
                                            </div>
                                            <div className="relative pb-[56.25%] h-0">
                                                <img
                                                    src={img.imageUrl}
                                                    alt={`Preview gambar ${img.order}`}
                                                    className="absolute h-full w-full object-contain"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://via.placeholder.com/400x300?text=Error+Loading+Image";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => setIsPreviewingEditImages(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                                    >
                                        Kembali Edit
                                    </button>
                                    <button
                                        onClick={saveChapterImages}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Preview Modal */}
                {selectedChapter && !isEditingImages && !isPreviewingEditImages && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                                <h3 className="text-xl font-bold">Preview: {selectedChapter.title}</h3>
                                <button
                                    onClick={() => setSelectedChapter(null)}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                {editingChapterImagesText.trim() ? (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-4">
                                            Total {editingChapterImagesText.split('\n').filter(line => line.trim()).length} gambar
                                        </p>
                                        <div className="space-y-4">
                                            {editingChapterImagesText.split('\n')
                                                .filter(line => line.trim())
                                                .map((imgUrl, idx) => {
                                                    const cleanedUrl = cleanImageUrl(imgUrl);
                                                    return (
                                                        <div key={idx} className="border rounded-lg overflow-hidden">
                                                            <div className="bg-gray-100 p-2 text-sm font-medium flex justify-between items-center">
                                                                <span>Gambar #{idx + 1}</span>
                                                                <span className="text-xs text-gray-500 truncate max-w-xs">{cleanedUrl}</span>
                                                            </div>
                                                            <img
                                                                src={cleanedUrl}
                                                                alt={`${selectedChapter.title} - Page ${idx + 1}`}
                                                                className="w-full object-contain"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://via.placeholder.com/400x300?text=Error+Loading+Image";
                                                                }}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                        <div className="mt-4 flex justify-between">
                                            <button
                                                onClick={() => setSelectedChapter(null)}
                                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                                            >
                                                Tutup
                                            </button>
                                            <button
                                                onClick={() => startEditingImages(selectedChapter)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                            >
                                                Edit Gambar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-center py-8 text-gray-500">Tidak ada gambar tersedia</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Editing Modal */}
                {isEditingImages && selectedChapter && !isPreviewingEditImages && (
                    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                                <h3 className="text-xl font-bold">Edit Gambar: {selectedChapter.title}</h3>
                                <button
                                    onClick={() => {
                                        setIsEditingImages(false);
                                        setSelectedChapter(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9.293 8.293a1 1 0 011.414 0L12 9.586l1.293-1.293a1 1 0 111.414 1.414L13.414 11l1.293 1.293a1 1 0 01-1.414 1.414L12 12.414l-1.293 1.293a1 1 0 01-1.414-1.414L10.586 11 9.293 9.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-600">Petunjuk Input Massal</h3>
                                                <div className="mt-2 text-sm text-blue-500">
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        <li>Masukkan satu URL gambar per baris</li>
                                                        <li>Urutan baris menentukan urutan tampilan gambar</li>
                                                        <li>Pastikan semua URL valid dan dapat diakses</li>
                                                        <li>Anda dapat copy-paste multiple URL sekaligus</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <textarea
                                        rows="10"
                                        value={editingChapterImagesText}
                                        onChange={(e) => {
                                            setEditingChapterImagesText(e.target.value);
                                            validateAllUrls(e.target.value, setEditUrlValidationStatus);
                                        }}
                                        onPaste={(e) => handleImageUrlPaste(e, setEditingChapterImagesText, setEditUrlValidationStatus)}
                                        className={`w-full p-3 border ${editUrlValidationStatus.isValid ? 'border-gray-300' : 'border-red-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
                                    />

                                    {editUrlValidationStatus.message && (
                                        <div className={`text-sm ${editUrlValidationStatus.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                            {editUrlValidationStatus.message}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setIsEditingImages(false);
                                            setSelectedChapter(null);
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={previewEditChapterImages}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                                        disabled={!editUrlValidationStatus.isValid}
                                    >
                                        Preview Perubahan
                                    </button>
                                    <button
                                        onClick={saveChapterImages}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700"
                                        disabled={!editUrlValidationStatus.isValid}
                                    >
                                        Simpan Langsung
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chapters List */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        Daftar Chapter
                    </h2>

                    {chapters.length === 0 ? (
                        <div className="bg-gray-50 p-8 rounded-xl text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <p className="text-gray-600">Belum ada chapter yang ditambahkan.</p>
                            <p className="text-gray-500 text-sm mt-2">Tambahkan chapter pertama menggunakan form di bawah.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {chapters.map(chapter => (
                                <div key={chapter.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow duration-300 border border-gray-100">
                                    {chapter.coverImage && (
                                        <div className="relative pb-[140%] mb-4 rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={chapter.coverImage}
                                                alt="Cover"
                                                className="absolute h-full w-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/400x560?text=Cover+Error";
                                                }}
                                            />
                                        </div>
                                    )}
                                    <h3 className="font-bold text-lg mb-2 text-gray-800">{chapter.title}</h3>
                                    <div className="flex flex-col space-y-2">
                                        <div className="text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-2">
                                            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-medium">
                                                {getImageCount(chapter)} gambar
                                            </span>
                                            {chapter.timestamp && (
                                                <span className="text-gray-500">
                                                    {new Date(chapter.timestamp.toDate()).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => previewChapterImages(chapter)}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg font-medium hover:bg-blue-700 transition duration-200"
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => startEditingImages(chapter)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition duration-200"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteChapter(chapter.id)}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition duration-200"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add Chapter Form */}
                <div className="bg-white rounded-2xl shadow-md text-black p-6">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center border-b pb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Tambah Chapter Baru
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Chapter</label>
                            <input
                                type="text"
                                placeholder="Masukkan judul chapter"
                                value={newChapterTitle}
                                onChange={(e) => setNewChapterTitle(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL Cover Image</label>
                            <input
                                type="text"
                                placeholder="Masukkan URL cover image"
                                value={newChapterCover}
                                onChange={(e) => setNewChapterCover(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                *Jika kosong, gambar pertama akan digunakan sebagai cover
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">URL Gambar (Input Massal)</label>
                                <span className="text-xs text-gray-500">
                                    Masukkan satu URL per baris
                                </span>
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-600">Petunjuk Upload CSV</h3>
                                        <div className="mt-2 text-sm text-blue-500">
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li>Upload file CSV yang berisi URL gambar</li>
                                                <li>URL ke-4 akan otomatis dijadikan cover chapter</li>
                                                <li>Pastikan semua URL valid dan dapat diakses</li>
                                                <li>Urutan URL menentukan urutan tampilan gambar</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) {
                                            setUrlValidationStatus({
                                                isValid: false,
                                                message: "Silakan unggah file CSV terlebih dahulu."
                                            });
                                            return;
                                        }

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const content = event.target.result;
                                            const lines = content.split('\n');
                                            const extractedUrls = [];

                                            lines.forEach((line) => {
                                                const match = line.match(/https?:\/\/[^'"]+\.jpg/g);
                                                if (match) {
                                                    extractedUrls.push(...match);
                                                }
                                            });

                                            const uniqueUrls = [...new Set(extractedUrls)].sort();

                                            if (uniqueUrls.length === 0) {
                                                setUrlValidationStatus({
                                                    isValid: false,
                                                    message: "Tidak ditemukan URL gambar .jpg dalam file CSV."
                                                });
                                                return;
                                            }

                                            // Set URL ke-4 sebagai cover chapter
                                            if (uniqueUrls.length >= 4) {
                                                setNewChapterCover(uniqueUrls[3]);
                                            }

                                            setChapterImagesText(uniqueUrls.join('\n'));
                                            setUrlValidationStatus({
                                                isValid: true,
                                                message: `${uniqueUrls.length} URL gambar valid ditemukan${uniqueUrls.length >= 4 ? ' dan cover chapter telah diatur' : ''}`
                                            });
                                        };

                                        reader.onerror = () => {
                                            setUrlValidationStatus({
                                                isValid: false,
                                                message: "Terjadi kesalahan saat membaca file CSV"
                                            });
                                        };

                                        reader.readAsText(file);
                                    }}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100"
                                />

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">URL yang Terdeteksi:</h4>
                                    <pre className="text-sm text-gray-600 whitespace-pre-wrap break-all">
                                        {chapterImagesText}
                                    </pre>
                                </div>
                            </div>

                            {urlValidationStatus.message && (
                                <div className={`mt-2 text-sm ${urlValidationStatus.isValid ? 'text-green-600' : 'text-red-600'}`}>
                                    {urlValidationStatus.message}
                                </div>
                            )}

                            <div className="mt-4 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        // Clear the form
                                        setNewChapterTitle("");
                                        setNewChapterCover("");
                                        setChapterImagesText("");
                                        setUrlValidationStatus({
                                            isValid: true,
                                            message: ""
                                        });
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
                                >
                                    Reset Form
                                </button>
                                <button
                                    onClick={previewNewChapterImages}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                                    disabled={!urlValidationStatus.isValid || !chapterImagesText.trim()}
                                >
                                    Preview Images
                                </button>
                                <button
                                    onClick={addChapter}
                                    className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                    disabled={!urlValidationStatus.isValid || !chapterImagesText.trim()}
                                >
                                    Tambah Chapter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}