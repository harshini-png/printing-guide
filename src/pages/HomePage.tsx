import React, { useMemo } from 'react';
import { BookOpen, RefreshCw, AlertCircle, PlusCircle, Sparkles } from 'lucide-react';
import type { Category, Guide } from '../types';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { GuideCard } from '../components/GuideCard';

interface HomePageProps {
  guides: Guide[];
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onOpenGuide: (guideId: string) => void;
  isAdmin: boolean;
  onNavigate: (view: string) => void;
  isSupabaseConfigured: boolean;
  isSchemaMissing?: boolean;
  onOpenSetupModal?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  guides,
  categories,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
  isLoading,
  error,
  onRefresh,
  onOpenGuide,
  isAdmin,
  onNavigate,
  isSupabaseConfigured,
  isSchemaMissing = false,
  onOpenSetupModal,
}) => {
  // Filter guides by search term and category
  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      // Category check
      if (selectedCategoryId && g.category_id !== selectedCategoryId) {
        return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = g.title.toLowerCase().includes(q);
      const inDesc = g.description ? g.description.toLowerCase().includes(q) : false;
      const inCategory = g.category ? g.category.name.toLowerCase().includes(q) : false;
      const inSteps = g.steps?.some(
        (s) =>
          s.instruction.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          (s.note && s.note.toLowerCase().includes(q))
      );

      return inTitle || inDesc || inCategory || inSteps;
    });
  }, [guides, selectedCategoryId, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Welcoming Header */}
      <section className="mb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9DFF5]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#493D61] tracking-tight mb-1.5 flex items-center justify-center sm:justify-start gap-2.5">
              <span>Welcome to PrintMate</span>
            </h1>
            <p className="text-sm text-[#81758F] max-w-xl">
              Simple, step-by-step instructions for everyday printing tasks.
            </p>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2.5">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] rounded-xl text-[#81758F] hover:text-[#493D61] transition-all shadow-xs disabled:opacity-50 min-h-[42px] min-w-[42px] flex items-center justify-center"
              title="Refresh guides"
              aria-label="Refresh guides"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin-create')}
                className="px-4 py-2.5 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[42px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Guide</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="mt-6 space-y-3.5">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />
        </div>
      </section>

      {/* Schema Missing Guidance Banner */}
      {isSchemaMissing && (
        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-800">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-950 mb-1">
                  Supabase Connected — Run SQL Schema Migration
                </h2>
                <p className="text-xs text-amber-800/90 leading-relaxed max-w-2xl">
                  Your Supabase credentials are authenticated, but the database tables (<code className="bg-amber-100/70 px-1 py-0.5 rounded">categories</code>, <code className="bg-amber-100/70 px-1 py-0.5 rounded">guides</code>, <code className="bg-amber-100/70 px-1 py-0.5 rounded">guide_steps</code>, <code className="bg-amber-100/70 px-1 py-0.5 rounded">app_admins</code>) have not been created yet.
                  Run the migration in your Supabase SQL Editor to save permanent guides.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {onOpenSetupModal && (
                <button
                  onClick={onOpenSetupModal}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Copy SQL Script</span>
                </button>
              )}
              <button
                onClick={onRefresh}
                className="px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isSchemaMissing && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load guides from database</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={onRefresh}
            className="underline font-semibold hover:text-rose-950 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Guides Grid / Empty / Loading */}
      {isLoading && guides.length === 0 ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-7 h-7 text-[#DCCEFF] animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-[#493D61]">Opening notebook...</p>
          <p className="text-xs text-[#81758F] mt-1">Loading guides from Supabase</p>
        </div>
      ) : filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGuides.map((guide) => (
            <GuideCard key={guide.id} guide={guide} onOpen={onOpenGuide} />
          ))}
        </div>
      ) : (
        /* Empty States */
        <div className="bg-white border border-[#E9DFF5] rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#EDE5FF] text-[#493D61] flex items-center justify-center mx-auto mb-4 border border-[#E9DFF5]">
            <BookOpen className="w-7 h-7" />
          </div>

          {searchQuery || selectedCategoryId ? (
            <div>
              <h2 className="text-base font-semibold text-[#493D61] mb-1">
                No matching guides found
              </h2>
              <p className="text-xs text-[#81758F] mb-4">
                No instructions match your search or filter criteria. Try clearing the filter.
              </p>
              <button
                onClick={() => {
                  onSearchChange('');
                  onSelectCategory(null);
                }}
                className="px-4 py-2 bg-[#EDE5FF] hover:bg-[#DCCEFF] text-[#493D61] text-xs font-semibold rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : !isSupabaseConfigured ? (
            <div>
              <h2 className="text-base font-semibold text-[#493D61] mb-1">
                Supabase Connection Needed
              </h2>
              <p className="text-xs text-[#81758F] leading-relaxed mb-4">
                To load and save your permanent printing guides, please connect your Supabase project using the button above.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-semibold text-[#493D61] mb-1">
                Your notebook is ready!
              </h2>
              <p className="text-xs text-[#81758F] leading-relaxed mb-4">
                Guides will appear here once the administrator adds them.
              </p>
              {isAdmin ? (
                <button
                  onClick={() => onNavigate('admin-create')}
                  className="px-4 py-2.5 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Your First Guide
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('admin-login')}
                  className="text-xs text-[#81758F] hover:text-[#493D61] underline font-medium"
                >
                  Administrator Login
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
