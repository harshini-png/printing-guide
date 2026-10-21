import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import type { Category } from '../types';
import { createCategory, updateCategory, deleteCategory } from '../lib/supabase';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onCategoriesUpdated: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCategoriesUpdated,
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!newCatName.trim()) return;

    try {
      setIsSubmitting(true);
      await createCategory(newCatName);
      setNewCatName('');
      onCategoriesUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setErrorMessage(null);
  };

  const handleSaveEdit = async (id: string) => {
    setErrorMessage(null);
    if (!editingName.trim()) return;

    try {
      setIsSubmitting(true);
      await updateCategory(id, editingName);
      setEditingId(null);
      setEditingName('');
      onCategoriesUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setErrorMessage(null);
    try {
      setIsSubmitting(true);
      await deleteCategory(id);
      onCategoriesUpdated();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to delete category "${name}".`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
      <div className="bg-white border border-[#E9DFF5] rounded-3xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#81758F] hover:text-[#493D61] p-1.5 rounded-lg hover:bg-[#FFF8EF] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-[#493D61]">
          <Tag className="w-5 h-5 text-[#81758F]" />
          <div>
            <h2 className="text-lg font-bold">Category Management</h2>
            <p className="text-xs text-[#81758F]">Create, rename, or delete guide categories</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Add new category form */}
        <form onSubmit={handleCreate} className="mb-5 flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name (e.g., Lamination)..."
            className="flex-1 px-3.5 py-2 text-xs bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCatName.trim()}
            className="px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* Categories List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {categories.length === 0 ? (
            <p className="text-xs text-[#81758F] text-center py-6">No categories found in database.</p>
          ) : (
            categories.map((cat) => {
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-[#E9DFF5] bg-[#FFFDF8] text-xs"
                >
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#DCCEFF] rounded-lg text-[#493D61] focus:outline-hidden"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        disabled={isSubmitting || !editingName.trim()}
                        className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-[#493D61] pl-1">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 text-[#81758F] hover:text-[#493D61] hover:bg-white rounded-lg transition-colors"
                          title="Rename category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-[#E9DFF5] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
