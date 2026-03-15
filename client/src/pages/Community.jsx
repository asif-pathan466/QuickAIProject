import React, { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Create axios instance (better practice)
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

const Community = () => {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingLikeId, setUpdatingLikeId] = useState(null);

  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();

  // Fetch creations
  const fetchCreations = useCallback(async () => {
    if (!authLoaded) return;

    try {
      setLoading(true);
      const token = await getToken();

      const { data } = await api.get(
        "/api/user/get-published-creations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setCreations(data.creations || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch creations"
      );
    } finally {
      setLoading(false);
    }
  }, [authLoaded, getToken]);

  // Toggle Like (Optimistic + Protected)
  const imageLikeToggle = async (id) => {
    if (!user) {
      toast.error("Please log in to like creations");
      return;
    }

    if (updatingLikeId === id) return; // Prevent spam clicks

    setUpdatingLikeId(id);

    // Optimistic Update
    setCreations((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;

        const currentLikes = c.likes || [];
        const isLiked = currentLikes.includes(user.id);

        return {
          ...c,
          likes: isLiked
            ? currentLikes.filter((uid) => uid !== user.id)
            : [...currentLikes, user.id],
        };
      })
    );

    try {
      const token = await getToken();

      const { data } = await api.post(
        "/api/user/toggle-like-creations",
        { id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        fetchCreations(); // rollback
        toast.error(data.message);
      }
    } catch {
      fetchCreations(); // rollback
      toast.error("Failed to update like");
    } finally {
      setUpdatingLikeId(null);
    }
  };

  useEffect(() => {
    if (userLoaded && authLoaded) {
      fetchCreations();
    }
  }, [userLoaded, authLoaded, fetchCreations]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">
            Loading gallery...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col gap-6 p-6 bg-gray-50 overflow-hidden">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Community Gallery
        </h1>
        <p className="text-sm text-gray-500">
          {creations.length} shared creations
        </p>
      </div>

      <div className="bg-white h-full w-full rounded-2xl overflow-y-auto p-6 shadow-sm border border-gray-100">
        {creations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <p className="text-lg">The gallery is empty.</p>
            <p className="text-sm italic">
              Be the first to publish a creation!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {creations.map((creation) => {
              const isLiked = creation.likes?.includes(user?.id);

              return (
                <div
                  key={creation.id}
                  className="relative group rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-gray-100"
                >
                  <img
                    src={creation.content}
                    alt="AI Creation"
                    className="w-full object-cover h-64 lg:h-80"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 flex flex-col justify-end p-4 
                    bg-gradient-to-t from-black/80 via-black/20 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300">

                    <p className="text-xs text-gray-200 mb-3 line-clamp-4 italic bg-black/20 p-2 rounded backdrop-blur-sm">
                      "{creation.prompt}"
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
                        By {creation.authorName || "Creator"}
                      </span>

                      <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md">
                        <span className="text-xs font-medium">
                          {creation.likes?.length || 0}
                        </span>

                        <Heart
                          onClick={(e) => {
                            e.stopPropagation();
                            imageLikeToggle(creation.id);
                          }}
                          className={`w-5 h-5 cursor-pointer transition-all active:scale-125
                            ${updatingLikeId === creation.id
                              ? "opacity-50 pointer-events-none"
                              : ""}
                            ${
                              isLiked
                                ? "fill-red-500 text-red-500"
                                : "text-white hover:text-red-400"
                            }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;