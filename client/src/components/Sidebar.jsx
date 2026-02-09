import { useClerk, useUser } from "@clerk/clerk-react";
import {
  Eraser,
  FileText,
  Hash,
  House,
  Scissors,
  SquarePen,
  Users,
  Image,
  LogOut,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/ai", label: "Dashboard", Icon: House },
  { to: "/ai/write-article", label: "Write Article", Icon: SquarePen },
  { to: "/ai/blog-title", label: "Blog Title", Icon: Hash },
  { to: "/ai/generate-images", label: "Generate Images", Icon: Image },
  { to: "/ai/remove-background", label: "Remove Background", Icon: Eraser },
  { to: "/ai/remove-object", label: "Remove Object", Icon: Scissors },
  { to: "/ai/review-resume", label: "Review Resume", Icon: FileText },
  { to: "/ai/community", label: "Community", Icon: Users },
];

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  // ✅ plan from Clerk metadata
  const plan = user?.publicMetadata?.plan || "free";

  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col
      justify-between max-sm:absolute top-14 bottom-0
      transition-all duration-300 ease-in-out
      ${sidebar ? "translate-x-0" : "max-sm:-translate-x-full"}`}
    >
      {/* User Profile Top */}
      <div className="my-7 text-center">
        {user && (
          <>
            <img
              src={user.imageUrl}
              alt="Avatar"
              className="w-12 h-12 rounded-full mx-auto"
            />
            <h1 className="mt-1 text-sm font-medium">{user.fullName}</h1>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="px-3 space-y-2 flex-1">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/ai"}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `px-3.5 py-2.5 flex items-center gap-3 rounded transition ${
                isActive
                  ? "bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Profile Section */}
      {user && (
        <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
          <div
            onClick={openUserProfile}
            className="flex gap-2 items-center cursor-pointer"
          >
            <img src={user.imageUrl} className="w-8 rounded-full" alt="img" />
            <div>
              <h1 className="text-sm font-medium">{user.fullName}</h1>

              {/* ✅ Correct Plan Show */}
              <p className="text-xs text-gray-500 capitalize">
                {plan === "premium" ? "Premium" : "Free"} Plan
              </p>
            </div>
          </div>

          <LogOut
            onClick={signOut}
            className="w-5 text-gray-400 hover:text-gray-700 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};

export default Sidebar;
