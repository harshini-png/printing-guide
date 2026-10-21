import React from 'react';
import { BookOpen, Lock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  isAdmin: boolean;
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ isAdmin, onNavigate }) => {
  return (
    <footer className="mt-auto border-t border-[#E9DFF5] bg-[#FFFDF8] py-8 px-4 text-xs text-[#81758F]">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#EDE5FF] flex items-center justify-center text-[#493D61]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-[#493D61] tracking-tight">PrintMate</span>
            <span className="mx-2 text-[#E9DFF5]">·</span>
            <span>Your Simple Printing Guide Notebook</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>Built for our printing shop</span>
          <span className="text-[#E9DFF5]">·</span>
          {isAdmin ? (
            <button
              onClick={() => onNavigate('admin-dashboard')}
              className="text-[#493D61] hover:underline flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Admin Portal
            </button>
          ) : (
            <button
              onClick={() => onNavigate('admin-login')}
              className="text-[#81758F] hover:text-[#493D61] hover:underline flex items-center gap-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Administrator Login
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
