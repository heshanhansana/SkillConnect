import Tag from "./Tag";
import PriorityBadge from "./PriorityBadge";
import Button2 from '../../../components/ui/button';
import { useAuth } from "../../../AuthContext";

export default function RequestCard({ data, isOwner, onUpdate }) {
  const { user, isAuthenticated } = useAuth();

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return "Just now";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    
    return `${Math.floor(days / 30)}mo ago`;
  };

  const handleApplyToHelp = async () => {
    if (!isAuthenticated) {
      alert("Please login to apply for this request");
      return;
    }

    const message = prompt("Why would you like to help with this request?");
    if (!message) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/skill-requests/${data._id}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId: user.id || user.userId,
            message,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Your response has been submitted!");
        if (onUpdate) onUpdate();
      } else {
        alert(result.message || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error applying to help:", error);
      alert("Failed to submit response");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/skill-requests/${data._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId: user.id || user.userId,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Request deleted successfully");
        if (onUpdate) onUpdate();
      } else {
        alert(result.message || "Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Failed to delete request");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/skill-requests/${data._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            userId: user.id || user.userId,
            status: newStatus,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`Request marked as ${newStatus}`);
        if (onUpdate) onUpdate();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <div className="w-full bg-white backdrop-blur-xl border border-purple-200 shadow-xl rounded-2xl p-6 mb-6">
      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-900 text-left">{data.title}</h2>

      {/* Description */}
      <p className="text-gray-700 mt-1 text-left">{data.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        {data.tags?.map((t, i) => (
          <Tag key={i} text={t} />
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-6 mt-4 text-sm text-gray-700">
        {data.estimatedTime && (
          <div className="flex items-center gap-1">⏱ {data.estimatedTime}</div>
        )}
        <div className="flex items-center gap-1">
          💬 {data.responses?.length || 0} responses
        </div>
        <div className="flex items-center gap-1">
          📊 Status: <span className="font-semibold capitalize">{data.status}</span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between items-center mt-5 flex-wrap gap-3">
        <PriorityBadge level={data.priority} />

        <div className="flex gap-2 flex-wrap">
          {isOwner ? (
            <>
              {data.status === "open" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 transition"
                >
                  Mark Complete
                </button>
              )}
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <Button2>View Details</Button2>
              <button
                onClick={handleApplyToHelp}
                className="px-4 py-2 rounded-xl border border-purple-300 transition hover:brightness-90"
                style={{ backgroundColor: "#b4a4e7ff", color: "white" }}
              >
                Apply to Help
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-3 text-left">
        Posted by{" "}
        <b>
          {data.author?.firstName} {data.author?.lastName}
        </b>{" "}
        • {getTimeAgo(data.createdAt)}
      </p>
    </div>
  );
}
