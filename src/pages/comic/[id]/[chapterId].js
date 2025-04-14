import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../../../BE/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import Layout from "../../../components/Layout";
import Image from 'next/image';

export default function ChapterDetail() {
    const router = useRouter();
    const { id: comicId, chapterId } = router.query;
    const [detailKomikId, setDetailKomikId] = useState(null);
    const [chapter, setChapter] = useState(null);
    const [chapterList, setChapterList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [chapterImages, setChapterImages] = useState([]);

    const cleanImageUrl = (url) => {
        return url.replace(/^["']|["']$/g, '').trim();
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!router.isReady || !comicId || !chapterId) return;

        const fetchData = async () => {
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

                        if (currentChapter.images?.length > 0) {
                            if (typeof currentChapter.images[0] === 'object') {
                                const sortedImages = [...currentChapter.images]
                                    .sort((a, b) => a.order - b.order)
                                    .map(img => cleanImageUrl(img.imageUrl));
                                setChapterImages(sortedImages);
                            } else {
                                setChapterImages(currentChapter.images.map(url => cleanImageUrl(url)));
                            }
                        } else if (currentChapter.url) {
                            setChapterImages([cleanImageUrl(currentChapter.url)]);
                        }
                    } else {
                        setChapter(null);
                        setChapterImages([]);
                    }
                }
            } catch (err) {
                console.error("Error:", err);
            }
        };

        fetchData();
    }, [router.isReady, comicId, chapterId]);

    const prevChapter = currentIndex > 0 ? chapterList[currentIndex - 1] : null;
    const nextChapter = currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null;

    const handleChapterChange = (e) => {
        const selectedId = e.target.value;
        if (selectedId !== chapterId) {
            router.push(`/comic/${comicId}/${selectedId}`);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-900 text-white">
                {/* Header */}
                <header className={`fixed w-full top-0 z-30 transition-all duration-300 border-b border-gray-800 ${scrolled ? 'bg-gray-900/95 backdrop-blur-md py-2 shadow-lg' : 'bg-gray-900/80 backdrop-blur-sm py-3'}`}>
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center">
                            <Link
                                href={`/comic/${comicId}`}
                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <h1 className="text-lg font-bold truncate">
                                    {chapter?.title || `Chapter ${currentIndex + 1 || ''}`}
                                </h1>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Chapter List */}
                <div className="container mx-auto px-4 mt-20 mb-4">
                    <div className="bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg border border-gray-700/50 shadow-lg">
                        <div className="flex items-center gap-4">
                            <label htmlFor="chapterSelect" className="flex items-center gap-2 text-purple-400">
                                <List className="w-5 h-5" />
                                <span>Pilih Chapter</span>
                            </label>
                            <select
                                id="chapterSelect"
                                value={chapterId}
                                onChange={handleChapterChange}
                                className="flex-1 p-2 rounded-lg bg-gray-700/90 text-white border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                            >
                                {chapterList.map((ch, idx) => (
                                    <option key={ch.id} value={ch.id}>
                                        Chapter {ch.title || `Chapter ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Comic Images */}
                <main className="container mx-auto">
                    <div className="w-full md:max-w-4xl mx-auto">
                        {chapterImages.map((imageUrl, index) => (
                            <div key={index} className="relative bg-gray-800/30 overflow-hidden">
                                <Image
                                    src={imageUrl}
                                    alt={`Page ${index + 1}`}
                                    className="w-full h-auto"
                                    loading="lazy"
                                    width={800}
                                    height={1200}
                                    unoptimized={true} 
                                />
                            </div>
                        ))}
                    </div>
                </main>

                {/* Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center max-w-4xl mx-auto">
                            {prevChapter ? (
                                <Link
                                    href={`/comic/${comicId}/${prevChapter.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/90 hover:bg-purple-600/90 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span>Previous</span>
                                </Link>
                            ) : (
                                <div className="px-4 py-2 bg-gray-800/90 rounded-lg opacity-50 cursor-not-allowed">
                                    <span className="flex items-center gap-2">
                                        <ChevronLeft className="w-5 h-5" />
                                        <span>Previous</span>
                                    </span>
                                </div>
                            )}

                            {nextChapter ? (
                                <Link
                                    href={`/comic/${comicId}/${nextChapter.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/90 hover:bg-purple-600/90 rounded-lg transition-colors"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            ) : (
                                <div className="px-4 py-2 bg-gray-800/90 rounded-lg opacity-50 cursor-not-allowed">
                                    <span className="flex items-center gap-2">
                                        <span>Next</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
