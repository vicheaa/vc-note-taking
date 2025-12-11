import { useState, useRef } from "react";
import { Search, Grid3x3, List, LogOut, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const clearSearch = () => {
    onSearchChange("");
    searchInputRef.current?.focus();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left: Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-900">KeepClone</h1>
          </div>

          {/* Middle: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-12 w-full rounded-lg bg-slate-100 pl-10 pr-10 text-sm outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-slate-300"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-slate-200 transition-colors"
                  title="Clear search"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              )}
            </div>
          </div>

          {/* Right: View Toggle & Logout */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <button
              onClick={() =>
                onViewModeChange(viewMode === "grid" ? "list" : "grid")
              }
              className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              title={
                viewMode === "grid"
                  ? "Switch to list view"
                  : "Switch to grid view"
              }
            >
              {viewMode === "grid" ? (
                <List className="h-5 w-5 text-slate-700" />
              ) : (
                <Grid3x3 className="h-5 w-5 text-slate-700" />
              )}
            </button>

            {/* Logout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="rounded-full p-2 hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-sm font-medium">
                  U
                </div>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white shadow-lg border border-slate-200 py-2 z-20">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
