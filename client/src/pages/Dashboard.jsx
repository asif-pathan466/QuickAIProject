import React, { useEffect, useState, useCallback } from "react";
import { Gem, Sparkles, RefreshCw } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance (better than global defaults)
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

const Dashboard = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();

  // Fetch Dashboard Data
  const getDashboardData = useCallback(async () => {
    if (!authLoaded) return;

    try {
      setLoading(true);

      const token = await getToken();

      const { data } = await api.get(
        "/api/user/get-user-creations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        toast.error(data.message || "Failed to fetch creations");
        return;
      }

      setCreations(data.creations || []);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, [authLoaded, getToken]);

  // Initial fetch (clean dependency control)
  useEffect(() => {
    if (userLoaded && authLoaded) {
      getDashboardData();
    }
  }, [userLoaded, authLoaded, getDashboardData]);

  // Plan Status
  const planStatus =
    user?.publicMetadata?.plan?.toLowerCase() === "premium"
      ? "Premium"
      : "Free";

  // Refresh Handler
  const handleRefresh = async () => {
    if (!user) return;
    toast.success("Syncing...");
    await user.reload();
    getDashboardData();
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50/50">
      {/* Top Cards */}
      <div className="flex flex-wrap gap-6 justify-start mb-8">

        {/* Total Creation Card */}
        <div className="flex justify-between items-center w-full sm:w-72 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
              Total Creations
            </p>
            <h2 className="text-3xl font-extrabold text-slate-800">
              {creations.length}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex justify-center items-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="flex justify-between items-center w-full sm:w-72 p-5 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Active Plan
              </p>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-1 hover:bg-slate-100 rounded-full transition"
                title="Refresh Data"
              >
                <RefreshCw
                  size={14}
                  className={`text-gray-400 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            <h2
              className={`text-2xl font-bold ${
                planStatus === "Premium"
                  ? "text-purple-600"
                  : "text-slate-800"
              }`}
            >
              {planStatus}
            </h2>
          </div>

          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 text-white flex justify-center items-center">
            <Gem className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Creations Section */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          <p className="text-slate-400 text-sm">
            Fetching your masterpieces...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xl font-bold text-slate-800 tracking-tight">
            Recent Creations
          </p>

          {creations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creations.map((item) => (
                <CreationItem
                  key={item.id}
                  item={item}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-2xl border-2 border-dashed border-gray-200 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="text-gray-300 w-8 h-8" />
              </div>
              <h3 className="text-slate-700 font-medium">
                No creations yet
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Your generated content will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;