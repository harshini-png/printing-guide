import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Tag,
  Edit,
  Trash2,
  ExternalLink,
  BookOpen,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut
} from 'lucide-react';
import type { Category, Guide } from '../types';
import { GuideIcon } from '../components/GuideIcon';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { ConfirmModal } from '../components/ConfirmModal';
import { deleteGuide } from '../lib/supabase';

interface AdminDashboardPageProps {
  guides: Guide[];
  categories: Category[];
  onOpenCreate: () => void;
  onOpenEdit: (guideId: string) => void;
  onOpenGuideReading: (guideId: string) => void;
  onOpenCategoryManager: () => void;
  onRefresh: () => void;
  onSignOut: () => void;
  isLoading: boolean;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  guides,
  categories,
  onOpenCreate,
  onOpenEdit,
  onOpenGuideReading,
  onOpenCategoryManager,
  onRefresh,
  onSignOut,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Deletion modal state
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    return guides.filter((g) => {
      if (selectedCategoryId && g.category_id !== selectedCategoryId) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const inTitle = g.title.toLowerCase().includes(q);
      const inCategory = g.category ? g.category.name.toLowerCase().includes(q) : false;
      const inDesc = g.description ? g.description.toLowerCase().includes(q) : false;
      return inTitle || inCategory || inDesc;
    });
  }, [guides, selectedCategoryId, searchQuery]);

  const confirmDelete = async () => {
    if (!guideToDelete) return;
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      setIsDeleting(true);
      await deleteGuide(guideToDelete.id);
      setFeedbackSuccess(`Guide "${guideToDelete.title}" has been deleted.`);
      setGuideToDelete(null);
      onRefresh();
      setTimeout(() => setFeedbackSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Delete guide failed:', err);
      setFeedbackError(
        err instanceof Error
          ? err.message
          : 'Failed to delete guide. Please check your network and permissions.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E9DFF5]">
        <div>
          <h1 className="text-2xl font-bold text-[#493D61] tracking-tight">Admin Notebook</h1>
          <p className="text-xs text-[#81758F] mt-0.5">
            Manage your printing instruction guides, steps, and categories
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenCategoryManager}
            className="px-3.5 py-2 text-xs font-semibold text-[#493D61] bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 min-h-[40px]"
          >
            <Tag className="w-4 h-4 text-[#81758F]" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Guide</span>
          </button>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {feedbackError && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="mt-6 space-y-3.5">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2.5 bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] rounded-xl text-[#81758F] hover:text-[#493D61] transition-all shadow-xs disabled:opacity-50 min-h-[42px] min-w-[42px] flex items-center justify-center shrink-0"
            title="Refresh guides"
            aria-label="Refresh guides"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
      </div>

      {/* Guides Table / Cards */}
      <div className="mt-6 bg-white border border-[#E9DFF5] rounded-3xl shadow-xs overflow-hidden">
        {isLoading && guides.length === 0 ? (
          <div className="p-12 text-center text-[#81758F]">
            <RefreshCw className="w-6 h-6 text-[#DCCEFF] animate-spin mx-auto mb-2" />
            <p className="text-xs">Loading guides from Supabase...</p>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-10 h-10 text-[#DCCEFF] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#493D61]">No guides found</h3>
            <p className="text-xs text-[#81758F] mt-1 mb-4">
              {guides.length === 0
                ? "You haven't created any printing guides yet."
                : "No guides match your filter query."}
            </p>
            {guides.length === 0 && (
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Your First Guide</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#E9DFF5]">
            {filteredGuides.map((guide) => {
              const stepCount = guide.steps?.length || 0;

              return (
                <div
                  key={guide.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FFFDF8] transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#EDE5FF] text-[#493D61] border border-[#E9DFF5] flex items-center justify-center shrink-0">
                      <GuideIcon name={guide.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs text-[#81758F] font-medium">
                          {guide.category?.name || 'Uncategorized'}
                        </span>
                        <span className="text-[#E9DFF5]">·</span>
                        <span className="text-xs text-[#81758F]">
                          {stepCount} step{stepCount === 1 ? '' : 's'}
                        </span>
                        {!guide.published && (
                          <>
                            <span className="text-[#E9DFF5]">·</span>
                            <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Draft (Hidden)
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="text-sm sm:text-base font-semibold text-[#493D61] leading-snug truncate">
                        {guide.title}
                      </h2>

                      {guide.description && (
                        <p className="text-xs text-[#81758F] line-clamp-1 mt-0.5">
                          {guide.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenGuideReading(guide.id)}
                      className="p-2 text-[#81758F] hover:text-[#493D61] hover:bg-[#EDE5FF] rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Preview guide as reader"
                      aria-label="Preview guide"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onOpenEdit(guide.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] rounded-xl transition-colors flex items-center gap-1.5 min-h-[38px]"
                      title="Edit guide"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setGuideToDelete(guide)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Delete guide"
                      aria-label="Delete guide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for deletion */}
      <ConfirmModal
        isOpen={Boolean(guideToDelete)}
        title="Delete Printing Guide?"
        message={`Are you sure you want to permanently delete "${guideToDelete?.title}" and its ${guideToDelete?.steps?.length || 0} instruction steps? This action cannot be undone.`}
        confirmLabel="Yes, Delete Guide"
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setGuideToDelete(null)}
      />
    </div>
  );
};
