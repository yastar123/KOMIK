'use client';

import Image from 'next/image';

const favoritList = [
    {
        rank: 2,
        title: 'Eleceed',
        genres: ['Action', 'Fantasy', 'Supernatural'],
        year: 2018,
        image: '/eleceed.jpg',
    },
    {
        rank: 3,
        title: 'Rebirth Of The Urban Immortal Cultivator',
        genres: ['Drama', 'Magic', 'School Life', 'Seinen', 'Supernatural'],
        year: 2018,
        image: '/rebirth.jpg',
    },
    {
        rank: 4,
        title: 'God of Martial Arts',
        genres: ['Action', 'Adventure', 'Fantasy', 'Harem', 'Isekai', 'Martial Arts', 'Romance', 'Seinen'],
        year: 2017,
        image: '/godofmartialarts.jpg',
    },
    {
        rank: 5,
        title: 'Kimetsu no Yaiba',
        genres: ['Action', 'Demons', 'Historical', 'Shounen', 'Supernatural'],
        year: 'Feb 15, 2016',
        image: '/kimetsu.jpg',
    },
    {
        rank: 6,
        title: 'Spirit Sword Sovereign',
        genres: ['Action', 'Adventure', 'Fantasy', 'Martial Arts', 'Romance', 'Webtoons'],
        year: 2017,
        image: '/spiritsword.jpg',
    },
];

export default function FavoritList() {
    return (
        <div className="max-w-fit mx-auto p-4 bg-gray-900 text-white rounded-lg shadow-lg">
            <p className='text-white'>
                Populer
            </p>
            {favoritList.map((anime) => (
                <div key={anime.rank} className="flex items-center gap-3 p-3 border-b border-gray-700">
                    <div>
                        <span className="text-gray-400 text-lg font-bold w-6">{anime.rank}</span>
                        <Image src={anime.image} alt={anime.title} width={50} height={50} className="rounded-md" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">{anime.title}</h3>
                        <p className="text-sm text-gray-400">Genres: {anime.genres.join(', ')}</p>
                        <p className="text-sm text-gray-500">{anime.year}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
