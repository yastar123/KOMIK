// components/FilterBar.jsx
import React from 'react';

const FilterItem = ({ label, options, selectedOption = null }) => {
    return (
        <div className=" flex gap-3 justify-start lg:justify-center items-start lg:items-center">
            <div className=''>
                <span className="text-white font-medium text-lg flex justify-start top-0  ">{label}</span>
            </div>
            <div className="flex flex-wrap gap-2 justify-start w-full">
                {options.map((option) => (
                    <button
                        key={option}
                        className={`px-4 py-2 rounded-md bg-gray-800`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};

const FilterBar = () => {
    return (
        <div className="w-full bg-black py-6 px-8 ">
            <div className="flex flex-wrap gap-x-8 gap-y-4 ">
                <FilterItem
                    label="Genre"
                    options={["Action", "Adventure", "Demon", "Shounen", "Isekai"]}
                    selectedOption="Action"
                />

                <FilterItem
                    label="Author"
                    options={["TurtleMe"]}
                    selectedOption="TurtleMe"
                />

                <FilterItem
                    label="Artist"
                    options={["Fuyuki23"]}
                    selectedOption="Fuyuki23"
                />

                <FilterItem
                    label="Format"
                    options={["Manhwa"]}
                    selectedOption="Manhwa"
                />

                <FilterItem
                    label="Type"
                    options={["Project"]}
                    selectedOption="Project"
                />
            </div>
        </div>
    );
};

export default FilterBar;