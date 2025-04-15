import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { db } from "../../../BE/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { ChevronLeft, ChevronRight, List, Home } from 'lucide-react';
import Layout from "../../../components/Layout";
import Image from 'next/image';
import Head from "next/head"; // Import Head for SEO meta tags

export default function ChapterDetail() {
    const router = useRouter();
    const { id: comicId, chapterId } = router.query;
    const [detailKomikId, setDetailKomikId] = useState(null);
    const [comicInfo, setComicInfo] = useState(null); // Add comic info for metadata
    const [chapter, setChapter] = useState(null);
    const [chapterList, setChapterList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [chapterImages, setChapterImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Improved image URL cleaning
    const cleanImageUrl = (url) => {
        return url?.replace(/^["']|["']$/g, '').trim() || '';
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
            setIsLoading(true);
            try {
                // Get comic main information for SEO
                const comicDocRef = doc(db, "comics", comicId);
                const comicSnap = await getDoc(comicDocRef);
                if (comicSnap.exists()) {
                    setComicInfo(comicSnap.data());
                }

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
            } finally {
                setIsLoading(false);
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

    // Generate SEO-friendly metadata
    const chapterTitle = chapter?.title || `Chapter ${currentIndex !== null ? currentIndex + 1 : ''}`;
    const comicTitle = comicInfo?.title || '';
    const pageTitle = `${chapterTitle} - ${comicTitle} | Read Online Free`;
    const description = `Read ${comicTitle} ${chapterTitle} online for free. ${comicInfo?.description?.substring(0, 150) || ''}`;
    const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'}/comic/${comicId}/${chapterId}`;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": pageTitle,
        "description": description,
        "image": chapterImages.length > 0 ? chapterImages[0] : "",
        "datePublished": chapter?.createdAt || "",
        "dateModified": chapter?.updatedAt || chapter?.createdAt || "",
        "author": {
            "@type": "Person",
            "name": comicInfo?.author || "Comic Author"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Your Comic Website Name",
            "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'}/logo.png`
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl
        }
    };

    return (
        <Layout>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={canonicalUrl} />
                {chapterImages.length > 0 && <meta property="og:image" content={chapterImages[0]} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={description} />
                {chapterImages.length > 0 && <meta name="twitter:image" content={chapterImages[0]} />}
                <link rel="canonical" href={canonicalUrl} />
                {/* Add prev/next for better SEO and UX */}
                {prevChapter && <link rel="prev" href={`/comic/${comicId}/${prevChapter.id}`} />}
                {nextChapter && <link rel="next" href={`/comic/${comicId}/${nextChapter.id}`} />}
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Head>
            <div className="min-h-screen bg-gray-900 text-white">
                {/* Header */}
                <header className={`fixed w-full top-0 z-30 transition-all duration-300 border-b border-gray-800 ${scrolled ? 'bg-gray-900/95 backdrop-blur-md py-2 shadow-lg' : 'bg-gray-900/80 backdrop-blur-sm py-3'}`}>
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Link
                                    href={`/comic/${comicId}`}
                                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                                    aria-label="Back to comic details"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <h1 className="text-lg font-bold truncate">
                                        {comicTitle && chapterTitle ? `${comicTitle} - ${chapterTitle}` : 'Loading...'}
                                    </h1>
                                </Link>
                            </div>
                            <Link
                                href="/"
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                                aria-label="Back to home"
                            >
                                <Home className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Breadcrumbs for SEO */}
                <div className="container mx-auto px-4 pt-20 pb-2">
                    <nav aria-label="breadcrumb" className="text-sm text-gray-400">
                        <ol className="flex flex-wrap items-center gap-2">
                            <li>
                                <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>/</span>
                                <Link href="/comics" className="hover:text-purple-400 transition-colors">Comics</Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>/</span>
                                <Link href={`/comic/${comicId}`} className="hover:text-purple-400 transition-colors">
                                    {comicTitle || 'Comic'}
                                </Link>
                            </li>
                            <li className="flex items-center gap-2">
                                <span>/</span>
                                <span className="text-purple-400">{chapterTitle}</span>
                            </li>
                        </ol>
                    </nav>
                </div>

                {/* Chapter List */}
                <div className="container mx-auto px-4 mb-4">
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
                                aria-label="Select chapter"
                            >
                                {chapterList.map((ch, idx) => (
                                    <option key={ch.id} value={ch.id}>
                                        {ch.title || `Chapter ${idx + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="container mx-auto px-4 py-12 text-center">
                        <div className="inline-block w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-lg text-gray-300">Loading chapter content...</p>
                    </div>
                )}

                {/* Comic Images */}
                <main className="container mx-auto">
                    <div className="w-full md:max-w-4xl mx-auto">
                        {chapterImages.map((imageUrl, index) => (
                            <div key={index} className="relative bg-gray-800/30 overflow-hidden mb-2">
                                <Image
                                    src={imageUrl}
                                    alt={`${comicTitle} ${chapterTitle} - Page ${index + 1}`} // SEO-friendly alt text
                                    className="w-full h-auto"
                                    loading="lazy"
                                    width={800}
                                    height={1200}
                                    unoptimized={true}
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 text-sm rounded">
                                    {index + 1} / {chapterImages.length}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                {/* Chapter Info and Description for SEO */}
                {!isLoading && chapter && (
                    <div className="container mx-auto px-4 py-6 mb-16">
                        <div className="w-full md:max-w-4xl mx-auto bg-gray-800/50 p-4 rounded-lg">
                            <h2 className="text-xl font-bold text-purple-400 mb-2">{`${comicTitle} - ${chapterTitle}`}</h2>
                            {chapter.description && (
                                <div className="text-gray-300 mb-3">
                                    <h3 className="text-lg font-semibold mb-1">Chapter Summary</h3>
                                    <p>{chapter.description}</p>
                                </div>
                            )}
                            <div className="text-gray-400 text-sm flex flex-wrap gap-x-4 gap-y-2">
                                {chapter.createdAt && (
                                    <div>
                                        <span className="font-semibold">Released:</span> {new Date(chapter.createdAt).toLocaleDateString()}
                                    </div>
                                )}
                                {comicInfo?.genre && (
                                    <div>
                                        <span className="font-semibold">Genre:</span> {comicInfo.genre}
                                    </div>
                                )}
                                {comicInfo?.author && (
                                    <div>
                                        <span className="font-semibold">Author:</span> {comicInfo.author}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 p-4 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center max-w-4xl mx-auto">
                            {prevChapter ? (
                                <Link
                                    href={`/comic/${comicId}/${prevChapter.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/90 hover:bg-purple-600/90 rounded-lg transition-colors"
                                    aria-label={`Previous chapter: ${prevChapter.title || `Chapter ${currentIndex}`}`}
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
                                    aria-label={`Next chapter: ${nextChapter.title || `Chapter ${currentIndex + 2}`}`}
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