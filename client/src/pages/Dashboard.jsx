import React, { useEffect, useState } from "react";
import { Gem, Sparkles, RefreshCw } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Dashboard = () => {
  // ✅ FIX 1: Initialize as an empty array to prevent .length errors
  const [creation, setCreation] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // Sync metadata on load to catch plan updates from Clerk dashboard
  useEffect(() => {
    if (isLoaded && user) {
      user.reload(); 
    }
  }, [isLoaded]);

  const getDashboardData = async () => {
  try {
    const token = await getToken();
    const { data } = await axios.get("/api/user/get-user-creations", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data.success) {
      // ✅ FIX: Change 'data.creation' to 'data.creations'
      setCreation(data.creations || []); 
    } else {
      toast.error(data.message || "Failed to fetch creations");
    }
  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    getDashboardData();
  }, []);

  // Normalize plan status for display
  const planStatus = user?.publicMetadata?.plan?.toLowerCase() === "premium" ? "Premium" : "Free";

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-50/50">
      <div className="flex flex-wrap gap-6 justify-start">
        {/* Total Creation Card */}
        <div className="flex justify-between items-center w-full sm:w-72 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-slate-600">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Creation</p>
            {/* ✅ FIX 2: Optional chaining added just in case */}
            <h2 className="text-2xl font-bold text-slate-800">{creation?.length || 0}</h2>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="flex justify-between items-center w-full sm:w-72 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-slate-600">
            <div className="flex items-center gap-2">
               <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Active Plan</p>
               <RefreshCw 
                size={12} 
                className="cursor-pointer text-gray-300 hover:text-purple-500 transition-all" 
                onClick={() => user?.reload()}
              />
            </div>
            <h2 className={`text-2xl font-bold ${planStatus === "Premium" ? 'text-purple-600' : 'text-slate-800'}`}>
              {planStatus} Plan
            </h2>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center shadow-md">
            <Gem className="w-6 h-6" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-3 mt-6">
          <p className="text-lg font-semibold text-slate-700">Recent Creations</p>
          {creation.length > 0 ? (
            creation.map((item) => <CreationItem key={item.id} item={item} />)
          ) : (
            <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
              No creations yet. Start generating!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;