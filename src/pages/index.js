import { useState, useEffect, useRef } from "react";
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
  Fire, 
  Book, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  Filter, 
  Search, 
  Menu,
  ArrowUp
} from "lucide-react";

export default function Home() {
  const [comics, setComics] = useState([]);
  const [genres, setGenres] = useState([]);
  const [popularComics, setPopularComics] = useState([]);
  const [viewType, setViewType] = useState("weekly");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const carouselRef = useRef(null);

  // Auto-scroll carousel setiap 3 detik
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, popularComics.length]);

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

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 🔽 Fetch semua komik + 3 chapter terbaru
  useEffect(() => {
    const fetchAllComics = async () => {
      const querySnapshot = await getDocs(collection(db, "comics"));
      const comicsData = [];
      const genreSet = new Set();

      for (const docSnap of querySnapshot.docs) {
        const comicData = { id: docSnap.id, ...docSnap.data() };

        if (comicData.genres && Array.isArray(comicData.genres)) {
          comicData.genres.forEach((genre) => genreSet.add(genre));
        }

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
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((c) => c.timestamp)
            .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds)
            .slice(0, 3);

          if (latestChapters.length > 0) {
            comicsData.push({
              ...comicData,
              latestChapters,
              latestUpdate: latestChapters[0].timestamp.seconds
            });
          } else {
            comicsData.push({
              ...comicData,
              latestChapters: [],
              latestUpdate: 0
            });
          }
        } else {
          comicsData.push({
            ...comicData,
            latestChapters: [],
            latestUpdate: 0
          });
        }
      }

      // Sort comics by latest chapter update
      const sortedComics = comicsData.sort((a, b) => b.latestUpdate - a.latestUpdate);
      setComics(sortedComics.slice(0, 10));
      setGenres(Array.from(genreSet));
    };

    fetchAllComics();
  }, []);

  // 🔥 Fetch Komik Populer
  useEffect(() => {
    const fetchPopularComics = async () => {
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
    };

    fetchPopularComics();
  }, [viewType]);
  
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

            {/* Carousel Container */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-8">
              <div ref={carouselRef} className="relative overflow-hidden h-64 md:h-80 lg:h-96 rounded-xl">
                <div 
                  className="flex transition-transform duration-500 ease-out h-full"
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {popularComics.map((comic, index) => (
                    <Link key={comic.id} href={`/comics/${comic.id}`} className="min-w-full h-full relative group">
                      <div className="relative h-full overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-60"></div>
                        <img
                          src={comic.imageUrl || "/api/placeholder/1200/500"}
                          alt={comic.title}
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-purple-500 text-white px-2 py-1 text-sm font-bold rounded">#{index + 1}</div>
                            {comic.origin && <div className="bg-pink-500 text-white px-2 py-1 text-xs rounded">{comic.origin}</div>}
                          </div>

                          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-1">{comic.title}</h2>

                          {comic.description && <p className="text-gray-200 mb-4 text-sm md:text-base line-clamp-2">{comic.description}</p>}

                          <div className="mb-4 flex flex-col gap-2">
                            {comic.latestChapters?.length > 0 ? (
                              comic.latestChapters.slice(0, 2).map((chapter) => (
                                <Link
                                  key={chapter.id}
                                  href={`/comic/${comic.id}/${chapter.id}`}
                                  className="flex items-center justify-between bg-gray-800/80 hover:bg-gray-700/80 rounded px-3 py-1 text-sm transition"
                                >
                                  <span className="font-medium">
                                    Ch {chapter.title || chapter.chapter}
                                  </span>
                                  {chapter.timestamp && (
                                    <span className="flex items-center text-gray-300 text-xs">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatDistanceToNow(
                                        new Date(chapter.timestamp.seconds * 1000),
                                        { locale: id }
                                      )
                                        .replace("sekitar ", "")
                                        .replace(" hari", "h")
                                        .replace(" jam", "j")}{" "}
                                      lalu
                                    </span>
                                  )}
                                </Link>
                              ))
                            ) : (
                              <p className="text-gray-400 text-sm">Belum ada chapter.</p>
                            )}
                          </div>

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
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                      activeIndex === index ? "bg-purple-500 scale-110" : "bg-gray-400/60 hover:bg-gray-300/60"
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
              {comics.map((comic) => (
                <div key={comic.id} className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-900/20 group">
                  <div className="relative pb-[140%]">
                    <img
                      src={comic.imageUrl || "/api/placeholder/240/340"}
                      alt={comic.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300"
                    />

                    {/* Origin Badge */}
                    {comic.origin && (
                      <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                        {comic.origin}
                      </div>
                    )}

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
                          <Link 
                            key={chapter.id} 
                            href={`/comic/${comic.id}/${chapter.id}`}
                            className="flex items-center justify-between text-xs hover:bg-gray-700/50 rounded px-1.5 py-1 transition"
                          >
                            <span className="font-medium truncate">
                              Ch {chapter.title || chapter.chapter}
                            </span>
                            {chapter.timestamp && (
                              <span className="flex items-center text-gray-400 shrink-0">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDistanceToNow(
                                  new Date(chapter.timestamp.seconds * 1000),
                                  { locale: id }
                                )
                                  .replace("sekitar ", "")
                                  .replace(" hari", "h")
                                  .replace(" jam", "j")}{" "}
                                lalu
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}

                    <Link 
                      href={`/comic/${comic.id}`}
                      className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-medium rounded py-1.5 transition-colors"
                    >
                      Baca Sekarang
                    </Link>
                  </div>
                </div>
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

        {/* Back to Top Button */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-full flex items-center justify-center text-white shadow-lg"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

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
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {Fa
              background: rgba(255, 255, 255, 0.3);
          }
        `}</style>
      </div>
    </Layout>
  );
}