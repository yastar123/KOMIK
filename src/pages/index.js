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
import { ChevronLeft, ChevronRight, Bookmark, Star, Clock, Eye, Fire, Book, Calendar, TrendingUp, ArrowRight, Filter, Search, Menu } from "lucide-react";

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

          comicsData.push({ ...comicData, latestChapters });
        } else {
          comicsData.push({ ...comicData, latestChapters: [] });
        }
      }

      setComics(comicsData.slice(0, 10));
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
      <div>
        {/* Hero Section with Carousel */}
        <div>
          <div>
            <div>
              <h2>
                <span>🔥</span>
                <p>Top 10 Komik Populer</p>
              </h2>

              <div>
                <button
                  onClick={() => setViewType("daily")}
                >
                  Harian
                </button>
                <button
                  onClick={() => setViewType("weekly")}
                >
                  Mingguan
                </button>
                <button
                  onClick={() => setViewType("all")}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Carousel Container */}
            <div>
              <div ref={carouselRef}>
                <div
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {popularComics.map((comic, index) => (
                    <Link key={comic.id} href={`/comics/${comic.id}`}>
                      <div>
                        <img
                          src={comic.imageUrl || "/api/placeholder/1200/500"}
                          alt={comic.title}
                        />
                        <div>
                          <div>
                            <div>
                              <div>
                                #{index + 1}
                              </div>
                              {comic.origin && (
                                <div>
                                  {comic.origin}
                                </div>
                              )}
                            </div>

                            <h2>
                              {comic.title}
                            </h2>

                            {comic.description && (
                              <p>
                                {comic.description}
                              </p>
                            )}

                            <div>
                              {comic.latestChapters?.length > 0 ? (
                                comic.latestChapters.slice(0, 2).map((chapter) => (
                                  <Link
                                    key={chapter.id}
                                    href={`/comic/${comic.id}/${chapter.id}`}
                                  >
                                    <span>
                                      Ch {chapter.title || chapter.chapter}
                                    </span>
                                    {chapter.timestamp && (
                                      <span>
                                        <Clock />
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
                                <p>Belum ada chapter.</p>
                              )}
                            </div>

                            <div>
                              <div>
                                <Star />
                                <span>
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
                              <Link
                                href={`/comic/${comic.id}`}
                              >
                                <Book />
                                Baca Sekarang
                              </Link>
                            </div>
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
              >
                <ChevronLeft />
              </button>

              <button
                onClick={nextSlide}
              >
                <ChevronRight />
              </button>

              {/* Dot indicators */}
              <div>
                {popularComics.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main>
          {/* Comics List Section */}
          <section>
            <h2>
              <span>📚</span>
              Komik Terbaru
            </h2>

            <div>
              <div>
                <div>
                  {comics.map((comic) => (
                    <div key={comic.id}>
                      <div>
                        <div>
                          <div>
                            <img
                              src={comic.imageUrl || "/api/placeholder/240/340"}
                              alt={comic.title}
                            />

                            <div>
                              <div>
                                <div>
                                  <Star />
                                  <span>{comic.rating || "4.5"}</span>
                                  <span>•</span>
                                  <span>
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

                                {comic.genres && (
                                  <div>
                                    {comic.genres.slice(0, 2).map((genre) => (
                                      <span
                                        key={genre}
                                      >
                                        {genre}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <Link
                                  href={`/comic/${comic.id}`}
                                >
                                  Baca Sekarang
                                </Link>
                              </div>
                            </div>

                            {/* Origin Badge */}
                            {comic.origin && (
                              <div>
                                {comic.origin}
                              </div>
                            )}

                            <button>
                              <Bookmark />
                            </button>
                          </div>

                          <div>
                            <h3>{comic.title}</h3>

                            {comic.latestChapters?.length > 0 && (
                              <div>
                                {comic.latestChapters.slice(0, 2).map((chapter) => (
                                  <Link
                                    key={chapter.id}
                                    href={`/comic/${comic.id}/${chapter.id}`}
                                  >
                                    <span>
                                      Ch {chapter.title || chapter.chapter}
                                    </span>
                                    {chapter.timestamp && (
                                      <span>
                                        <Clock />
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* View More Link */}
                <div>
                  <Link
                    href="/comic/page/1"
                  >
                    <ArrowRight />
                    Lihat Lebih Banyak
                  </Link>
                </div>
              </div>

              {/* Genres Section */}
              <div>
                <div>
                  <h3>
                    <Filter />
                    Genres
                  </h3>
                  <div>
                    {genres.map((genre) => (
                      <div key={genre}>
                        <Link
                          href={`/genre/${genre.toLowerCase()}`}
                        >
                          {genre}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}