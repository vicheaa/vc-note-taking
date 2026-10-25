import { useState } from "react";
import { AlignLeft, Archive, LogOut, Search, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  isSearching: boolean;
  onSearchToggle: () => void;
  onShowNotes: () => void;
  onNavigate?: (path: string) => void;
  beforeSignOut?: () => Promise<boolean>;
}

export function Header({ isSearching, onSearchToggle, onShowNotes, onNavigate, beforeSignOut }: HeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showAccount, setShowAccount] = useState(false);

  const handleLogout = async () => {
    if (beforeSignOut && !await beforeSignOut()) return;
    await signOut();
    navigate("/login");
  };

  return (
    <aside className="notes-sidebar" aria-label="Main navigation">
      <Link to="/dashboard" className="notes-logo" aria-label="VC Notes home" onClick={(event) => { if (onNavigate) { event.preventDefault(); onNavigate("/dashboard"); } else onShowNotes(); }}>
        <span />
      </Link>
      <nav className="sidebar-navigation" aria-label="Notes">
        <button className={`sidebar-button ${!isSearching ? "is-active" : ""}`} onClick={onShowNotes} title="All notes" aria-label="All notes" aria-current={!isSearching ? "page" : undefined}>
          <AlignLeft size={18} />
        </button>
        <button className={`sidebar-button ${isSearching ? "is-active" : ""}`} onClick={onSearchToggle} title="Search notes (⌘/Ctrl K)" aria-label="Search notes" aria-pressed={isSearching}>
          <Search size={19} />
        </button>
        <Link to="/trash" className="sidebar-button" title="Trash" aria-label="Trash" onClick={(event) => { if (onNavigate) { event.preventDefault(); onNavigate("/trash"); } }}>
          <Trash2 size={18} />
        </Link>
      </nav>
      <div className="sidebar-account">
        {showAccount && (
          <>
            <button className="account-dismiss" aria-label="Close account menu" onClick={() => setShowAccount(false)} />
            <div className="account-menu">
              <p>{user?.email || "Your account"}</p>
              <Link to="/archive" onClick={(event) => { if (onNavigate) { event.preventDefault(); onNavigate("/archive"); } }}><Archive size={16} /> Archived notes</Link>
              <button onClick={handleLogout}><LogOut size={16} /> Sign out</button>
            </div>
          </>
        )}
        <button className="account-avatar" onClick={() => setShowAccount(!showAccount)} aria-label="Account menu" aria-expanded={showAccount}>
          {(user?.email?.[0] || "U").toUpperCase()}
        </button>
      </div>
    </aside>
  );
}
