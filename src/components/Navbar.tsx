import React from 'react';
import { BookOpen, LogOut, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, guideId?: string) => void;
  isAdmin: boolean;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isAdmin,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF8]/90 backdrop-blur-md border-b border-[#E9DFF5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element with notebook icon) */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-[#493D61] hover:text-[#382e4c] transition-colors whitespace-nowrap shrink-0 text-left"
          aria-label="PrintMate Home"
        >
          <div className="w-9 h-9 rounded-xl bg-[#EDE5FF] border border-[#E9DFF5] flex items-center justify-center text-[#493D61] shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight block leading-none">PrintMate</span>
            <span className="text-[11px] text-[#81758F] hidden sm:block leading-tight font-normal">Digital Guide Notebook</span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (Single-line, quiet typography) */}
        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-[#81758F]">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#493D61] py-1 ${
              currentView === 'home' || currentView.startsWith('guide-')
                ? 'text-[#493D61] font-semibold border-b-2 border-[#D8C5FF]'
                : ''
            }`}
          >
            All Guides
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#493D61] py-1 flex items-center gap-1.5 ${
                currentView.startsWith('admin-')
                  ? 'text-[#493D61] font-semibold border-b-2 border-[#D8C5FF]'
                  : ''
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#81758F]" />
              Notebook Admin
            </button>
          )}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              onClick={onSignOut}
              className="px-3.5 py-2 text-xs font-medium text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] border border-[#E9DFF5] rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[40px]"
              title="Log out of admin"
            >
              <LogOut className="w-3.5 h-3.5 text-[#81758F]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('admin-login')}
              className={`px-3.5 py-2 text-xs font-medium text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] border border-[#E9DFF5] rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[40px] shadow-xs ${
                currentView === 'admin-login' ? 'ring-2 ring-[#DCCEFF]' : ''
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#81758F]" />
              <span>Admin Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
