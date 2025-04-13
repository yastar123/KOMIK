import Link from "next/link";
import { motion } from "framer-motion";
import {
    Book,
    Heart,
    Mail,
    Twitter,
    Instagram,
    Facebook,
    Github,
    ArrowUp
} from "lucide-react";

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    return (
        <footer className="bg-gray-900/50 backdrop-blur-md border-t border-gray-700/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Book className="w-8 h-8 text-purple-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                MangaReader
                            </span>
                        </Link>
                        <p className="text-gray-300 text-sm">
                            Temukan dan baca manga, manhua, dan manhwa favoritmu dengan mudah dan gratis.
                        </p>
                        <div className="flex space-x-4">
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-purple-400 transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-purple-400 transition-colors"
                            >
                                <Instagram className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-purple-400 transition-colors"
                            >
                                <Facebook className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-purple-400 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </motion.a>
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4"
                    >
                        <h3 className="text-white font-semibold text-lg">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Beranda
                                </Link>
                            </li>
                            <li>
                                <Link href="/comic/page/1" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Semua Komik
                                </Link>
                            </li>
                            <li>
                                <Link href="/genres" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Genre
                                </Link>
                            </li>
                            <li>
                                <Link href="/popular" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Populer
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Categories */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h3 className="text-white font-semibold text-lg">Kategori</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/type/manga" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Manga
                                </Link>
                            </li>
                            <li>
                                <Link href="/type/manhua" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Manhua
                                </Link>
                            </li>
                            <li>
                                <Link href="/type/manhwa" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Manhwa
                                </Link>
                            </li>
                            <li>
                                <Link href="/latest" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">
                                    Terbaru
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <h3 className="text-white font-semibold text-lg">Kontak</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:support@mangareader.com" className="hover:text-purple-400 transition-colors">
                                    support@mangareader.com
                                </a>
                            </li>
                            <li className="flex items-center gap-2 text-gray-300 text-sm">
                                <Heart className="w-4 h-4 text-pink-500" />
                                <span>Dibuat dengan ❤️ untuk para penggemar manga</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-700/30">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-300 text-sm">
                            © {new Date().getFullYear()} MangaReader. All rights reserved.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={scrollToTop}
                            className="flex items-center gap-2 text-gray-300 hover:text-purple-400 transition-colors text-sm"
                        >
                            <ArrowUp className="w-4 h-4" />
                            Kembali ke Atas
                        </motion.button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer; 