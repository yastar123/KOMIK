import { useState, useEffect, useRef, useMemo } from "react";
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../BE/firebase";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Layout from "../components/Layout";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Star,
  Clock,
  Eye,
  Book,
  Filter,
  ArrowRight,
  ArrowUp
} from "lucide-react";

// Helper function to serialize Firestore data
const serializeData = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj.toDate instanceof Function) {
    return obj.toDate().toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeData);
  }

  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      result[key] = serializeData(obj[key]);
      return result;
    }, {});
  }

  return obj;
};

// Helper function to format time distance
const formatTimeDistance = (timestamp) => {
  return formatDistanceToNow(
    new Date(timestamp.seconds * 1000),
    { locale: id }
  )
    .replace("sekitar ", "")
    .replace(" hari", "h")
    .replace(" jam", "j") + " lalu";
};

export const getServerSideProps = async () => {
  try {
    // Parallel data fetching for improved performance
    const [comicsSnapshot, popularSnapshot] = await Promise.all([
      getDocs(collection(db, "comics")),
      getDocs(query(
        collection(db, "comics"),
        orderBy("weeklyViews", "desc"),
        limit(10)
      ))
    ]);

    const comicsData = [];
    const genreSet = new Set();
    const comicPromises = [];

    // Prepare all promises for chapter fetching
    for (const docSnap of comicsSnapshot.docs) {
      const comicData = { id: docSnap.id, ...serializeData(docSnap.data()) };

      if (comicData.genres && Array.isArray(comicData.genres)) {
        comicData.genres.forEach((genre) => genreSet.add(genre));
      }

      comicPromises.push((async () => {
        const detailRef = collection(db, "comics", docSnap.id, "detailKomik");
        const detailSnapshot = await getDocs(detailRef);

        if (!detailSnapshot.empty) {
          const firstDetail = detailSnapshot.docs[0];
          const chaptersCollection = collection(
            db,
            "comics",
            docSnap.id,
            "detailKomik",
            firstDetail.id,
            "chapters"
          );

          const chaptersSnapshot = await getDocs(chaptersCollection);

          const latestChapters = chaptersSnapshot.docs
            .map((doc) => {
              const data = doc.data();
              const timestamp = data.timestamp ? {
                seconds: data.timestamp.seconds || 0,
                nanoseconds: data.timestamp.nanoseconds || 0
              } : null;
              return {
                id: doc.id,
                ...serializeData(data),
                timestamp
              };
            })
            .filter((c) => c.timestamp)
            .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
            .slice(0, 3);

          return {
            ...comicData,
            latestChapters,
            latestUpdate: latestChapters[0]?.timestamp?.seconds || 0
          };
        }
        
        return {
          ...comicData,
          latestChapters: [],
          latestUpdate: 0
        };
      })());
    }

    // Wait for all comic data to be processed
    const processedComics = await Promise.all(comicPromises);
    comicsData.push(...processedComics);

    // Sort comics by latest chapter update
    const sortedComics = comicsData.sort((a, b) => (b.latestUpdate || 0) - (a.latestUpdate || 0));
    const initialComics = sortedComics.slice(0, 10);
    const initialGenres = Array.from(genreSet);

    // Process popular comics
    const initialPopularComics = popularSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...serializeData(doc.data() || {}),
    }));

    // Serialize all data before returning
    return {
      props: {
        initialComics: serializeData(initialComics),
        initialGenres: Array.from(initialGenres),
        initialPopularComics: serializeData(initialPopularComics),
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      props: {
        initialComics: [],
        initialGenres: [],
        initialPopularComics: [],
        error: "Failed to load data"
      }
    };
  }
};

// Memoized formatNumber function to avoid unnecessary recalculations
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export default function Home({ initialComics, initialGenres, initialPopularComics, error }) {
  const [comics, setComics] = useState(initialComics);
  const [genres] = useState(initialGenres); // No need to set genres after initialization
  const [popularComics, setPopularComics] = useState(initialPopularComics);
  const [viewType, setViewType] = useState("weekly");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrollingPaused, setIsScrollingPaused] = useState(false);
  const carouselRef = useRef(null);
  const intervalRef = useRef(null);

  // Memoize expensive computations
  const displayedComics = useMemo(() => comics.slice(0, 4), [comics]);

  // Auto-scroll carousel with improved handling
  useEffect(() => {
    if (isScrollingPaused || popularComics.length === 0) return;
    
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev === popularComics.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeIndex, popularComics.length, isScrollingPaused]);

  // Pause auto-scrolling when hovering over carousel
  const pauseScrolling = () => setIsScrollingPaused(true);
  const resumeScrolling = () => setIsScrollingPaused(false);

  const nextSlide = () => {
    if (popularComics.length === 0) return;
    setActiveIndex((prev) => (prev === popularComics.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (popularComics.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? popularComics.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  // Update popular comics when viewType changes with debounce
  useEffect(() => {
    const fetchPopularComics = async () => {
      try {
        let orderField = "weeklyViews";
        if (viewType === "daily") orderField = "dailyViews";
        if (viewType === "all") orderField = "views";

        const q = query(
          collection(db, "comics"),
          orderBy(orderField, "desc"),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const topComics = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPopularComics(topComics);
      } catch (error) {
        console.error("Error fetching popular comics:", error);
      }
    };

    // Add debounce to prevent excessive calls
    const timerId = setTimeout(() => {
      fetchPopularComics();
    }, 300);

    return () => clearTimeout(timerId);
  }, [viewType]);

  // Function to format time distance
  const formatTimeDistance = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(
      new Date(timestamp.seconds * 1000),
      { locale: id }
    )
      .replace("sekitar ", "")
      .replace(" hari", "h")
      .replace(" jam", "j") + " lalu";
  };

  // Early error handling
  if (error) {
    return (
      <Layout>
        <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Failed to load comics</h1>
            <p className="mt-2">Please try again later</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-900 text-white min-h-screen">
        {/* Hero Section with Carousel */}
        <div className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-900 py-6 px-4 md:py-12 lg:px-8 border-b border-gray-800">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center text-2xl md:text-3xl font-bold">
                <span className="mr-2 text-2xl">🔥</span>
                <p className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Top 10 Komik Populer</p>
              </h2>

              <div className="flex bg-gray-800 rounded-full p-1">
                <button
                  onClick={() => setViewType("daily")}
                  className={`px-3 py-1 text-xs md:text-sm rounded-full transition ${viewType === "daily" ? "bg-purple-500 text-white" : "text-gray-300 hover:text-white"}`}
                >
                  Harian
                </button>
                <button
                  onClick={() => setViewType("weekly")}
                  className={`px-3 py-1 text-xs md:text-sm rounded-full transition ${viewType === "weekly" ? "bg-purple-500 text-white" : "text-gray-300 hover:text-white"}`}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setViewType("all")}
                  className={`px-3 py-1 text-xs md:text-sm rounded-full transition ${viewType === "all" ? "bg-purple-500 text-white" : "text-gray-300 hover:text-white"}`}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Carousel Container with hover pause */}
            <div 
              className="relative rounded-2xl overflow-hidden shadow-2xl mb-8"
              onMouseEnter={pauseScrolling}
              onMouseLeave={resumeScrolling}
            >
              <div ref={carouselRef} className="relative overflow-hidden h-64 md:h-80 lg:h-96 rounded-xl">
                <div
                  className="flex transition-transform duration-500 ease-out h-full"
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {popularComics.map((comic, index) => (
                    <Link key={comic.id} href={`/comic/${comic.id}`} className="min-w-full h-full relative group">
                      <div className="relative h-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-60"></div>
                        <Image
                          src={comic.imageUrl || "/api/placeholder/1200/500"}
                          alt={comic.title}
                          className="w-full h-full object-cover object-center"
                          width={1200}
                          height={500}
                          priority={index === activeIndex}
                          loading={index === activeIndex ? "eager" : "lazy"}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-purple-500 text-white px-2 py-1 text-sm font-bold rounded">#{index + 1}</div>
                            {comic.origin && <div className="bg-pink-500 text-white px-2 py-1 text-xs rounded">{comic.origin}</div>}
                          </div>

                          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-1">{comic.title}</h2>

                          {comic.description && <p className="text-gray-200 mb-4 text-sm md:text-base line-clamp-2">{comic.description}</p>}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-amber-400">
                              <Eye className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {formatNumber(
                                  viewType === "daily"
                                    ? comic.dailyViews || 0
                                    : viewType === "weekly"
                                      ? comic.weeklyViews || 0
                                      : comic.views || 0
                                )}{" "}
                                views
                              </span>
                            </div>
                            <Link href={`/comic/${comic.id}`} className="flex items-center bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 px-3 py-1 rounded text-sm font-medium transition-colors">
                              <Book className="w-4 h-4 mr-1" />
                              Baca Sekarang
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {popularComics.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${activeIndex === index ? "bg-purple-500 scale-110" : "bg-gray-400/60 hover:bg-gray-300/60"
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 lg:px-8">
          <section className="mb-12">
            <h2 className="flex items-center text-2xl md:text-3xl font-bold mb-6">
              <span className="mr-2 text-2xl">📚</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">Komik Terbaru</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
              {displayedComics.map((comic) => (
                <Link
                  href={`/comic/${comic.id}`}
                  key={comic.id}
                  className="block relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-900/20 group"
                >
                  <div className="relative pb-[140%]">
                    <Image
                      src={comic.imageUrl || "/api/placeholder/240/340"}
                      alt={comic.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300"
                      width={240}
                      height={340}
                      loading="lazy"
                    />

                    <button className="absolute top-2 right-2 w-8 h-8 bg-gray-900/70 hover:bg-gray-900 rounded-full flex items-center justify-center text-gray-300 hover:text-purple-400 transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent pt-16 pb-2 px-3">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <div className="flex items-center text-amber-400">
                          <Star className="w-3 h-3 mr-1" />
                          <span>{comic.rating || "4.5"}</span>
                        </div>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center text-gray-300">
                          <Eye className="w-3 h-3 mr-1" />
                          <span>
                            {formatNumber(
                              viewType === "daily"
                                ? comic.dailyViews || 0
                                : viewType === "weekly"
                                  ? comic.weeklyViews || 0
                                  : comic.views || 0
                            )}
                          </span>
                        </div>
                      </div>

                      {comic.genres && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {comic.genres.slice(0, 2).map((genre) => (
                            <span key={genre} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-sm md:text-base line-clamp-1 mb-2 group-hover:text-purple-400 transition-colors">
                      {comic.title}
                    </h3>

                    {comic.latestChapters?.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {comic.latestChapters.slice(0, 2).map((chapter) => (
                          <div key={chapter.id} 
                            onClick={() => window.location.href = `/comic/${comic.id}/${chapter.id}`}
                            className="flex items-center justify-between text-xs hover:bg-gray-700/50 rounded px-1.5 py-1 transition cursor-pointer"
                          >
                            <span className="font-medium truncate">
                              Ch {chapter.title || chapter.chapter}
                            </span>
                            {chapter.timestamp && (
                              <span className="flex items-center text-gray-400 shrink-0">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimeDistance(chapter.timestamp)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-medium rounded py-1.5 transition-colors">
                      Baca Sekarang
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* View More Link */}
            <div className="mt-6">
              <Link
                href="/comic/page/1"
                className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg py-3 transition-colors shadow"
              >
                <span>Lihat Lebih Banyak</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Genres Section */}
            <div className="bg-gray-800 rounded-xl p-4 md:p-6 mt-8 shadow-md">
              <h3 className="flex items-center text-xl font-bold mb-4">
                <Filter className="w-5 h-5 mr-2 text-purple-400" />
                <span>Genres</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <div key={genre} className="bg-gray-700 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 rounded-full transition-colors">
                    <Link
                      href={`/genre/${genre.toLowerCase()}`}
                      className="block px-3 py-1.5 text-sm"
                    >
                      {genre}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Back to Top Button - Add Intersection Observer */}
        <BackToTopButton />

        {/* Custom Scrollbar Styling */}
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
        `}</style>
      </div>
    </Layout>
  );
}

// Separate component for Back to Top button with Intersection Observer
function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show button when user scrolls down 300px
        setIsVisible(!entry.isIntersecting);
      },
      { rootMargin: "-300px 0px 0px 0px" }
    );

    const target = document.getElementById("top-observer");
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return <div id="top-observer" className="absolute top-0" />;

  return (
    <>
      <div id="top-observer" className="absolute top-0" />
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-full flex items-center justify-center text-white shadow-lg z-10 transform transition-transform hover:scale-110"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
}