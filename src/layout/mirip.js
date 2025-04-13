// pages/index.js
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';

export default function Mirip() {
    const manhwaData = [
        {
            id: 1,
            title: "Spare Me, Great Lord!",
            views: "5.4jt",
            type: "Manhwa Fantasi",
            description: "Setelah hidup kembali dan mengembalikan energi roh, pria dan wanita~",
            image: "/manhwa1.jpg"
        },
        {
            id: 2,
            title: "A Dragonslayer's Peerless Regression",
            views: "429rb",
            type: "Manhwa Fantasi",
            description: "Zeke Draker, adalah orang pertama dari keturunan langsung keluarga Dragon~",
            image: "/manhwa2.jpg"
        },
        {
            id: 3,
            title: "Academy's Undercover Professor",
            views: "1.7jt",
            type: "Manhwa Fantasi",
            description: "Saya tidak dilahirkan kembali dengan bakat atau kemampuan, tetapi~",
            image: "/manhwa3.jpg"
        },
        {
            id: 4,
            title: "The Hero Became The Duke's Eldest Son",
            views: "1.8jt",
            type: "Manhwa Fantasi",
            description: "Aden Albireo dijuluki Dragon Slayer  pahlawan yang membunuh~",
            image: "/manhwa4.jpg"
        },
        {
            id: 5,
            title: "Sekai ni Hitori, Zenzokusei Mahou no Tsukaite",
            views: "294rb",
            type: "Manga Fantasi",
            description: "After a traffic accident, Zenichi Kiyama, a humble office worker, was~",
            image: "/manhwa5.jpg"
        },
        {
            id: 6,
            title: "Legendary Youngest Son of the Marquis House",
            views: "276rb",
            type: "Manhwa Fantasi",
            description: "Aku datang kemari hanya dengan satu tujuan yaitu balas dendam. Aku~",
            image: "/manhwa6.jpg"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <Head>
                <title>Manhwa & Manga Collection</title>
                <meta name="description" content="Popular Manhwa and Manga Collection" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="container mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-8 text-center">Popular Manhwa & Manga</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {manhwaData.map((item) => (
                        <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div className="relative h-60 w-full">
                                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-sm z-10">
                                    {item.views}
                                </div>
                                {/* In a real application, replace with actual images */}
                                <div className="w-full h-full bg-gray-300 relative">
                                    {/* This would be an actual Image component in production */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-gray-500">Image Placeholder</span>
                                    </div>
                                    <div className="absolute bottom-0 right-0 bg-black bg-opacity-70 text-white px-3 py-1">
                                        {item.type}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}