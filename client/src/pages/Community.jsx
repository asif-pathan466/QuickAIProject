import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Community = () => {
  const [creations, setCreations] = useState([]);
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchCreations = async () => {
    try {
      const { data } = await axios.get("/api/user/get-published-creations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setCreations(data.creations || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const imageLikeToggle = async (id) => {
    try {
      const { data } = await axios.post(
        "/api/user/toggle-like-creations",
        { id },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message);
        fetchCreations();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (user) fetchCreations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span className="w-8 h-8 border-4 border-t-transparent border-gray-300 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full min-w-0 flex flex-col gap-6 p-6 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800">
        Community Creations
      </h1>

      <div className="bg-white flex-1 min-h-0 w-full rounded-2xl overflow-y-auto p-4 shadow-lg">
        {creations.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No community posts found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creations.map((creation) => (
              <div
                key={creation.id}
                className="relative group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Image */}
                <img
                  src={creation.content}
                  alt="creation"
                  className="w-full object-cover h-60 sm:h-64 lg:h-72"
                />

                {/* Overlay */}
                <div
                  className="absolute inset-0 flex flex-col justify-between p-3
                  bg-gradient-to-b from-transparent to-black/70
                  text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  {/* Prompt */}
                  <p className="text-sm line-clamp-3">{creation.prompt}</p>

                  {/* Likes */}
                  <div className="flex justify-end items-center gap-2">
                    <p className="text-sm">{creation.likes?.length || 0}</p>

                    <button
                      type="button"
                      onClick={() => imageLikeToggle(creation.id)}
                      className="cursor-pointer"
                    >
                      <Heart
                        className={`w-5 h-5 hover:scale-110 transition-transform
                        ${
                          creation.likes?.includes(user?.id)
                            ? "fill-red-500 text-red-500"
                            : "text-white"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
