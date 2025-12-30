import { useState } from "react";

export default function Filters({ onFilterChange }) {
  const [category, setCategory] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [availability, setAvailability] = useState("");
  const [minRating, setMinRating] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    onFilterChange({ category: value });
  };

  const handleSkillLevelChange = (level) => {
    const newLevel = skillLevel === level ? "" : level;
    setSkillLevel(newLevel);
    onFilterChange({ skillLevel: newLevel });
  };

  const handleAvailabilityChange = (avail) => {
    const newAvail = availability === avail ? "" : avail;
    setAvailability(newAvail);
    onFilterChange({ availability: newAvail });
  };

  const handleRatingChange = (rating) => {
    const newRating = minRating === rating ? "" : rating;
    setMinRating(newRating);
    onFilterChange({ minRating: newRating });
  };

  const handleVerifiedChange = () => {
    const newVerified = !verifiedOnly;
    setVerifiedOnly(newVerified);
    onFilterChange({ verifiedOnly: newVerified });
  };

  return (
    <div className="
    p-6
      bg-white/50 backdrop-blur-xl
      rounded-3xl shadow-xl border border-white/30
      h-fit
      text-left
    ">
      {/* Title */}
      <h2 className="text-base font-bold text-gray-700 mb-2">
        Filters
      </h2>

      {/* Category */}
      <div className="mb-6">
        <p className="text-base font-bold text-gray-700 mb-2">Category</p>
        <input
          type="text"
          value={category}
          onChange={handleCategoryChange}
          className="w-full px-3 py-2 rounded-xl border border-purple-300 outline-none"
          placeholder="Search category..."
        />
        <hr className="border-gray-300 mt-4" />
      </div>
      

      {/* Skill Level */}
      <div className="mb-6">
        <p className="text-base font-bold text-gray-700 mb-2">Skill Level</p>
        <div className="flex flex-col gap-2">
          {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer"
              onClick={() => handleSkillLevelChange(level)}
            >
              <input
                type="radio"
                checked={skillLevel === level}
                onChange={() => handleSkillLevelChange(level)}
                className="cursor-pointer"
              />
              {level}
            </label>
          ))}
        </div>
        <hr className="border-gray-300 mt-4" />

      </div>

      {/* Availability */}
      <div className="mb-6">
        <p className="text-base font-bold text-gray-700 mb-2">Availability</p>
        <div className="flex flex-col gap-2">
          {["Available Now", "Busy"].map((item) => (
            <label
              key={item}
              className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer"
              onClick={() => handleAvailabilityChange(item)}
            >
              <input
                type="radio"
                checked={availability === item}
                onChange={() => handleAvailabilityChange(item)}
                className="cursor-pointer"
              />
              {item}
            </label>
          ))}
        </div>
        <hr className="border-gray-300 mt-4" />

      </div>

      {/* Maximum Rating */}
      <div className="mb-6">
        <p className="text-base font-bold text-gray-700 mb-2">Minimum Rating</p>
        <div className="flex flex-col gap-2 text-yellow-400 text-xl">
          {[
            { stars: 5, label: " & up", value: "5" },
            { stars: 4, label: " & up", value: "4" },
            { stars: 3, label: " & up", value: "3" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => handleRatingChange(item.value)}
            >
              <input
                type="radio"
                checked={minRating === item.value}
                onChange={() => handleRatingChange(item.value)}
                className="cursor-pointer"
              />
              {Array.from({ length: item.stars }).map((_, i) => (
                <span key={i}>★</span>
              ))}
              <span className="text-xs text-black ml-1">{item.label}</span>
            </div>
          ))}
        </div>
        <hr className="border-gray-300 mt-4" />

      </div>

      {/* Verified / Other */}
      <div className="mb-2">
        <p className="text-base font-bold text-gray-700 mb-2">Other</p>

        <label className="flex items-center gap-2 text-gray-700 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={handleVerifiedChange}
            className="cursor-pointer"
          />
          Verified Only
        </label>
      </div>
    </div>
  );
}
