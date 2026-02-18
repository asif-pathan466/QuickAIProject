import { Image, Sparkles } from "lucide-react";
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
  const imageStyle = [
    "Realistic",
    "Ghibli style",
    "Anime style",
    "Cartoon style",
    "Fantasy style",
    "Realistic style",
    "3D style",
    "Portrait style",
  ];

  const [selectedStyle, setSelectedStyle] = useState("Realistic");
  const [input, setInput] = useState("");
  const [publish, setPublish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");

  const { getToken } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      setContent("");

      const prompt = `Generate an image of ${input} in the style ${selectedStyle}`;

      const token = await getToken();

      const { data } = await axios.post(
        "/api/ai/generate-image",
        { prompt, publish },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.success) {
        setContent(data.content);
      } else {
        toast.error(data?.message || "Failed to generate image");
      }
    } catch (error) {
      console.error("Generate Image Error:", error);
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 h-full min-h-0 overflow-y-auto p-6 flex items-start flex-wrap gap-4 text-slate-700 bg-slate-50/50">
      {/* Left Column */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full lg:w-[420px] p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">AI Image Generator</h1>
        </div>

        {/* Prompt Input */}
        <p className="mt-6 text-sm font-medium">Describe your image</p>

        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-200 focus:border-green-400"
          placeholder="Describe what you want to see in the image..."
          required
        />

        {/* Style Selection */}
        <p className="mt-4 text-sm font-medium">Style</p>

        <div className="mt-3 flex gap-3 flex-wrap">
          {imageStyle.map((item) => (
            <span
              key={item}
              onClick={() => setSelectedStyle(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer transition
              ${
                selectedStyle === item
                  ? "bg-green-50 text-green-700 border-green-300"
                  : "text-gray-500 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {item}
            </span>
          ))}
        </div>

        {/* Publish Toggle */}
        <div className="my-6 flex items-center gap-2">
          <label className="relative cursor-pointer">
            <input
              type="checkbox"
              onChange={(e) => setPublish(e.target.checked)}
              checked={publish}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>

            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
          </label>
          <p className="text-sm">Make this image public</p>
        </div>

        {/* Submit Button */}
        <button
          disabled={loading}
          type="submit"
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-[#00AD25] to-[#04FF50]
          text-white px-4 py-2 mt-6 text-sm rounded-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span>
          ) : (
            <Image className="w-5 h-5" />
          )}
          {loading ? "Generating..." : "Generate Image"}
        </button>
      </form>

      {/* Right Column */}
      <div className="w-full flex-1 min-w-0 p-4 bg-white rounded-xl flex flex-col border border-gray-200 shadow-sm min-h-[420px]">
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5 text-[#00AD25]" />
          <h1 className="text-xl font-semibold">Generated Image</h1>
        </div>

        {!content ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm flex flex-col items-center gap-5 text-gray-400 text-center">
              <Image className="w-9 h-9" />
              <p>
                Enter a prompt and click <b>Generate Image</b> to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex-1 rounded-xl overflow-hidden border border-gray-200">
            <img
              src={content}
              alt="Generated"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateImages;
