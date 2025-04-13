import Image from "next/image";
import { useState } from "react";

export default function HeroSection() {
    const [currentSlide, setCurrentSlide] = useState(1);

    return (
        <div className="bg-black text-white p-3 md:p-6 flex flex-col lg:flex-row gap-6">
            {/* Hero Section */}
            <div className="w-full lg:w-2/3 bg-gray-900 p-6 rounded-lg relative">
                <Image
                    src="/character.png" // Ganti dengan path gambar yang sesuai
                    width={500}
                    height={300}
                    alt="Character Image"
                    className="w-full lg:h-0 rounded-lg"
                />
                <h2 className="text-2xl font-bold mt-4">The Beginning After the End</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-orange-400 font-bold">⭐ 10.0</span>
                    <span className="bg-orange-500 text-white px-2 py-1 text-xs rounded">Overpower</span>
                    <span className="bg-blue-700 text-white px-2 py-1 text-xs rounded">Reincarnation</span>
                </div>
                <p className="mt-2 text-gray-400 text-sm lg:text-base">
                    Raja Gray memiliki kekuatan, kekayaan, dan prestise yang tak tertandingi di dunia yang diatur oleh kemampuan bela diri. Namun...
                </p>
                <div className="flex justify-center gap-2 mt-4">
                    <button className="bg-gray-700 p-2 rounded">❮</button>
                    <span className={currentSlide === 1 ? "w-3 h-3 bg-purple-500 rounded-full" : "w-3 h-3 bg-gray-600 rounded-full"}></span>
                    <span className={currentSlide === 2 ? "w-3 h-3 bg-purple-500 rounded-full" : "w-3 h-3 bg-gray-600 rounded-full"}></span>
                    <span className={currentSlide === 3 ? "w-3 h-3 bg-purple-500 rounded-full" : "w-3 h-3 bg-gray-600 rounded-full"}></span>
                    <button className="bg-gray-700 p-2 rounded">❯</button>
                </div>
            </div>

            {/* Announcements */}
            <div className="w-full lg:w-1/3">
                <h3 className="text-xl font-semibold">Pengumuman</h3>
                <div className="bg-gray-800 p-4 rounded-lg mt-2 flex items-center gap-4">
                    <Image src="/announcement.png" width={50} height={50} alt="Announcement" className="rounded-lg" />
                    <div>
                        <span className="text-red-500 text-xs font-bold">NEW</span>
                        <p className="font-medium flex items-center gap-2">Error Tadi Siang dan Sebabnya</p>
                        <span className="text-gray-400 text-sm">16 March 2025</span>
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg mt-2 flex items-center gap-4">
                    <Image src="/announcement.png" width={50} height={50} alt="Announcement" className="rounded-lg" />
                    <div>
                        <p className="font-medium">Info: Fitur Baru yang Sudah Aktif</p>
                        <span className="text-gray-400 text-sm">04 March 2025</span>
                    </div>
                </div>
            </div>
        </div>
    );
}