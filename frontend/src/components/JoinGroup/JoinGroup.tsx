import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function JoinGroup() {
  const [query, setQuery] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = () => {
    
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-4">Please Enter your invitation code.</h3>
      <div className="flex items-center border border-gray-300 rounded-full overflow-hidden shadow-md w-full max-w-md mb-4">
        {/* Search Input */}
        <input
          type="text"
          className="flex-1 px-10 py-2 outline-none bg-white rounded-l-full"
          placeholder="Enter invitation code..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {/* Join Group Button */}
        <div
          onClick={handleSubmit}
          className="w-[124px] h-[40px] flex items-center justify-center"
        >
          <div
            className={`h-[42px] mt-1 mb-1 mr-1 transition-all duration-500 ease-in-out ${
              isHovered ? 'w-[200px]' : 'w-[124px]'
            } bg-gradient-to-r rounded-3xl from-[#3859ba] to-[#0a3281] text-white flex items-center justify-center`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Button Text */}
            

            {/* Icon visible on hover */}
            <ArrowRight
              className="w-4 h-4 text-white ml-2 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
