import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Upload, Trash2, Edit, BookOpen } from "lucide-react";

const Sidebar = ({ children }) => {

    // State untuk toggle submenu
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (menu) => {
        setOpenMenu(openMenu === menu ? null : menu);
    };

    return (
        <div className=" text-white bg-gray-500 flex h-screen">
            <div className="border sticky top-0 h-screen bg-white text-black">
                <div className="flex items-center space-x-3">
                    <BookOpen className="text-blue-500 w-8 h-8" />
                    <h2 className="text-xl font-bold">KomikAdmin</h2>
                </div>
                {["Manga", "Manhua", "Manhwa"].map((category) => (
                    <div key={category}>
                        {/* Parent Menu */}
                        <button
                            className={`flex items-center justify-between w-full p-3 rounded-lg text-gray-700 font-medium ${openMenu === category ? "bg-gray-100" : "hover:bg-gray-100"
                                }`}
                            onClick={() => toggleMenu(category)}
                        >
                            <span className="flex items-center space-x-2">
                                <BookOpen className="w-5 h-5" />
                                <span>{category}</span>
                            </span>
                            {openMenu === category ? <ChevronUp /> : <ChevronDown />}
                        </button>

                        {/* Submenu */}
                        {openMenu === category && (
                            <ul className="ml-6 mt-2 space-y-2">
                                <li className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span>Upload</span>
                                </li>
                                <li className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                                    <Trash2 className="w-5 h-5 text-gray-500" />
                                    <span>Delete</span>
                                </li>
                                <li className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                                    <Edit className="w-5 h-5 text-gray-500" />
                                    <span>Edit</span>
                                </li>
                            </ul>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col">
                {/* Navbar */}
                <nav className=" shadow p-4 sticky top-0 z-10 w-full">
                    <h2 className="text-xl font-semibold">Dashboard</h2>
                </nav>

                {/* Scrollable Main Content */}
                <main className="flex-1 overflow-y-auto p-6 ">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Sidebar;
