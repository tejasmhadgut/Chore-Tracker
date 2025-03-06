import React, { useState } from 'react';

const ChoreTracker = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex justify-center items-center w-full h-screen">
      <div className="w-12 h-12 ">
        <div
          className={`h-12 bg-red-500 transition-all duration-500 ${
            isHovered ? '-ml-24' : ''
          }`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        ></div>
      </div>
    </div>
  );
};

export default ChoreTracker;
