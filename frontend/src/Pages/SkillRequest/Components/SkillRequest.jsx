import { useState, useEffect } from "react";
import NavBar from "../../../components/NavBar";
import CreateRequestButton from "./CreateRequestButton";
import RequestCard from "./RequestCard";
import { useAuth } from "../../../AuthContext";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SkillRequests() {
  const { user, isAuthenticated } = useAuth();
  const [myRequests, setMyRequests] = useState([]);
  const [otherRequests, setOtherRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "All Categories",
    priority: "All Urgencies",
    status: "",
  });
  const [showMyRequests, setShowMyRequests] = useState(true);
  const [showOtherRequests, setShowOtherRequests] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, [filters, user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch my requests
      if (isAuthenticated && user) {
        const myResponse = await fetch(
          `http://localhost:5000/api/skill-requests/my/${user.id || user.userId}`
        );
        const myData = await myResponse.json();
        if (myData.success) {
          setMyRequests(myData.requests);
        }
      }

      // Fetch other requests
      const params = new URLSearchParams();
      if (filters.category !== "All Categories") params.append("category", filters.category);
      if (filters.priority !== "All Urgencies") params.append("priority", filters.priority);
      if (user) params.append("userId", user.id || user.userId);

      const othersResponse = await fetch(
        `http://localhost:5000/api/skill-requests?${params}`
      );
      const othersData = await othersResponse.json();
      if (othersData.success) {
        setOtherRequests(othersData.requests);
      }
    } catch (error) {
      console.error("Error fetching skill requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E8FF] to-white w-full">
      <NavBar />

      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-gray-900">Skill Request Board</p>
          <CreateRequestButton onRequestCreated={fetchRequests} />
        </div>

        {/* Search Row (Dropdowns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="h-12 rounded-xl bg-white border border-purple-300 shadow-sm flex items-center px-4 text-sm font-medium text-gray-700">
            <select
              className="w-full bg-transparent outline-none text-gray-700 text-sm cursor-pointer"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              <option>All Categories</option>
              <option>Frontend</option>
              <option>Backend</option>
              <option>Design</option>
              <option>Marketing</option>
              <option>Academic</option>
              <option>General</option>
            </select>
          </div>

          <div className="h-12 rounded-xl bg-white border border-purple-300 shadow-sm flex items-center px-4 text-sm font-medium text-gray-700">
            <select
              className="w-full bg-transparent outline-none text-gray-700 text-sm cursor-pointer"
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
            >
              <option>All Urgencies</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 text-center text-gray-500">Loading requests...</div>
        ) : (
          <>
            {/* My Requests Section - Accordion */}
            {isAuthenticated && (
              <div className="mt-10">
                <button
                  onClick={() => setShowMyRequests(!showMyRequests)}
                  className="w-full flex justify-between items-center bg-gradient-to-r from-[#7D4DF4] to-[#A589FD] text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="text-lg font-bold">
                    My Skill Requests ({myRequests.length})
                  </span>
                  {showMyRequests ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </button>

                {showMyRequests && (
                  <div className="mt-4 space-y-4">
                    {myRequests.length === 0 ? (
                      <div className="bg-white rounded-2xl border border-purple-200 p-8 text-center text-gray-500">
                        You haven't created any skill requests yet.
                      </div>
                    ) : (
                      myRequests.map((request) => (
                        <RequestCard
                          key={request._id}
                          data={request}
                          isOwner={true}
                          onUpdate={fetchRequests}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Other Requests Section - Accordion */}
            <div className="mt-10">
              <button
                onClick={() => setShowOtherRequests(!showOtherRequests)}
                className="w-full flex justify-between items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <span className="text-lg font-bold">
                  Available Skill Requests ({otherRequests.length})
                </span>
                {showOtherRequests ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>

              {showOtherRequests && (
                <div className="mt-4 space-y-4 pb-10">
                  {otherRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-purple-200 p-8 text-center text-gray-500">
                      No skill requests available at the moment.
                    </div>
                  ) : (
                    otherRequests.map((request) => (
                      <RequestCard
                        key={request._id}
                        data={request}
                        isOwner={false}
                        onUpdate={fetchRequests}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
