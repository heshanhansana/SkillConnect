import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import Filters from "./Filters";
import ProfileCard from "./ProfileCard";
import NavBar from "../../../components/NavBar";

export default function SkillSearch() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    skillLevel: "",
    availability: "",
    minRating: "",
    verifiedOnly: false,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.query) params.append("query", filters.query);
      if (filters.category) params.append("category", filters.category);
      if (filters.skillLevel) params.append("skillLevel", filters.skillLevel);
      if (filters.availability) params.append("availability", filters.availability);
      if (filters.minRating) params.append("minRating", filters.minRating);
      if (filters.verifiedOnly) params.append("verifiedOnly", "true");

      const response = await fetch(`http://localhost:5000/api/search/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleSearch = (searchQuery) => {
    setFilters({ ...filters, query: searchQuery });
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#F3E8FF] to-white w-full">
      <NavBar />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <SearchBar onSearch={handleSearch} />

        <div className="mt-8 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-64 shrink-0">
            <Filters onFilterChange={handleFilterChange} />
          </div>

          <div className="flex-1">
            {loading ? (
              <p className="text-gray-700 mb-4 text-sm">Loading...</p>
            ) : (
              <>
                <p className="text-gray-700 mb-4 text-sm">{users.length} results found</p>
                <div className="flex flex-col gap-6">
                  {users.map((u) => (
                    <ProfileCard key={u._id} user={u} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

