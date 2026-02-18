import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { SignIn, useUser } from "@clerk/clerk-react";

const Layout = () => {
  const navigate = useNavigate();
  const [sidebar, setSidebar] = useState(false);
  const { user, isLoaded } = useUser();

  // Loader while Clerk loads user
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="w-10 h-10 border-4 border-t-transparent border-gray-300 rounded-full animate-spin"></span>
      </div>
    );
  }

  return user ? (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="w-full px-6 sm:px-8 h-16 flex items-center justify-between border-b border-gray-200 bg-white shrink-0">
        <img
          src={assets.logo}
          alt="logo"
          className="cursor-pointer w-32 sm:w-44"
          onClick={() => navigate("/")}
        />

        {/* Mobile toggle */}
        {sidebar ? (
          <X
            onClick={() => setSidebar(false)}
            className="h-6 w-6 text-gray-600 sm:hidden cursor-pointer"
          />
        ) : (
          <Menu
            onClick={() => setSidebar(true)}
            className="h-6 w-6 text-gray-600 sm:hidden cursor-pointer"
          />
        )}
      </nav>

      {/* Body */}
      <div className="flex-1 min-h-0 w-full flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar sidebar={sidebar} setSidebar={setSidebar} />

        {/* Main Content */}
        <div className="flex-1 min-w-0 min-h-0 bg-[#F4F7FB] overflow-y-auto">
          {/* outlet means show child route of layout pages */}
          <Outlet />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <SignIn />
    </div>
  );
};

export default Layout;
