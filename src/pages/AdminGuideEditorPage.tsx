import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Tag
} from 'lucide-react';
import type { Category, Guide, GuideFormData, GuideStepDraft } from '../types';
import { GuideIcon } from '../components/GuideIcon';
import { saveGuide } from '../lib/supabase';

interface AdminGuideEditorPageProps {
  initialGuide?: Guide | null;
  categories: Category[];
  onSaveSuccess: (savedGuide: Guide) => void;
  onCancel: () => void;
  onOpenCategoryManager: () => void;
}

const AVAILABLE_ICONS = [
  'BookOpen',
  'Printer',
  'FileText',
  'Smartphone',
  'CreditCard',
  'Mail',
  'Layers',
  'Copy',
  'CheckCircle2',
  'Sparkles',
];

export const AdminGuideEditorPage: React.FC<AdminGuideEditorPageProps> = ({
  initialGuide,
  categories,
  onSaveSuccess,
  onCancel,
  onOpenCategoryManager,
}) => {
  const isEditing = Boolean(initialGuide);

  const [title, setTitle] = useState(initialGuide?.title || '');
  const [description, setDescription] = useState(initialGuide?.description || '');
  const [categoryId, setCategoryId] = useState(
    initialGuide?.category_id || (categories.length > 0 ? categories[0].id : '')
  );
  const [icon, setIcon] = useState(initialGuide?.icon || 'BookOpen');
  const [published, setPublished] = useState(initialGuide ? initialGuide.published : true);

  const [steps, setSteps] = useState<GuideStepDraft[]>(() => {
    if (initialGuide?.steps && initialGuide.steps.length > 0) {
      return initialGuide.steps.map((s, idx) => ({
        tempId: s.id || `step-${idx}-${Date.now()}`,
        id: s.id,
        instruction: s.instruction,
        description: s.description || '',
        note: s.note || '',
        step_order: idx + 1,
      }));
    }
    return [
      {
        tempId: `step-1-${Date.now()}`,
        instruction: '',
        description: '',
        note: '',
        step_order: 1,
      },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync category if initially empty and categories load
  useEffect(() => {
    if (!categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleAddStep = () => {
    const newStep: GuideStepDraft = {
      tempId: `step-${Date.now()}-${Math.random()}`,
      instruction: '',
      description: '',
      note: '',
      step_order: steps.length + 1,
    };
    setSteps([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      setErrorMessage('Every guide must have at least one step.');
      return;
    }
    const updated = steps.filter((_, i) => i !== index);
    // Recalculate order
    const reordered = updated.map((step, idx) => ({
      ...step,
      step_order: idx + 1,
    }));
    setSteps(reordered);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...steps];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    setSteps(
      reordered.map((step, idx) => ({
        ...step,
        step_order: idx + 1,
      }))
    );
  };

  const handleStepChange = (
    index: number,
    field: keyof GuideStepDraft,
    value: string
  ) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('Please enter a guide title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please select a category for this guide.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (steps.length === 0) {
      setErrorMessage('Every guide must have at least one step.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].instruction.trim()) {
        setErrorMessage(`Please enter an instruction for Step ${i + 1}.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const payload: GuideFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category_id: categoryId,
      icon,
      published,
      steps,
    };

    try {
      setIsSubmitting(true);
      const saved = await saveGuide(payload, initialGuide?.id);
      setSuccessMessage('Guide saved to database successfully!');
      setTimeout(() => {
        onSaveSuccess(saved);
      }, 700);
    } catch (err: unknown) {
      console.error('Error saving guide:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Your guide could not be saved. Please check your connection and try again.'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E9DFF5]">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#81758F] hover:text-[#493D61] bg-white border border-[#E9DFF5] px-3.5 py-2 rounded-xl transition-colors min-h-[40px] shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>

        <h1 className="text-xl font-bold text-[#493D61] tracking-tight text-center">
          {isEditing ? 'Edit Printing Guide' : 'Write New Printing Guide'}
        </h1>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors min-h-[40px] disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-3.5 h-3.5 border-2 border-[#493D61] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSubmitting ? 'Saving to Database...' : 'Save Guide'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1 font-semibold">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Guide Overview Details Card */}
        <div className="bg-white border border-[#E9DFF5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#493D61] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#81758F]" />
            <span>Guide Details</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#493D61] mb-1.5">
              Guide Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., How to Print a PDF from WhatsApp"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF] font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#493D61]">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[11px] text-[#81758F] hover:text-[#493D61] flex items-center gap-1 hover:underline"
                >
                  <Tag className="w-3 h-3" />
                  <span>Manage Categories</span>
                </button>
              </div>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF]"
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#493D61] mb-1.5">
                Guide Icon
              </label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#EDE5FF] text-[#493D61] border border-[#E9DFF5] flex items-center justify-center shrink-0">
                  <GuideIcon name={icon} className="w-5 h-5" />
                </div>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF]"
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#493D61] mb-1.5">
              Short Description / Summary (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary explaining what this guide is for..."
              className="w-full px-3.5 py-2 text-xs bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF] leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="guide-published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded-md border-[#E9DFF5] text-[#D8C5FF] focus:ring-[#DCCEFF]"
            />
            <label htmlFor="guide-published" className="text-xs font-medium text-[#493D61] cursor-pointer">
              Published (Visible to shop staff on homepage)
            </label>
          </div>
        </div>

        {/* Steps Editor Card */}
        <div className="bg-white border border-[#E9DFF5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-[#E9DFF5] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#493D61]">Numbered Steps ({steps.length})</h2>
              <p className="text-xs text-[#81758F]">Keep steps concise and in logical chronological order</p>
            </div>
            <button
              type="button"
              onClick={handleAddStep}
              className="px-3.5 py-2 bg-[#EDE5FF] hover:bg-[#DCCEFF] text-[#493D61] font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Step</span>
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {steps.map((step, index) => (
              <div
                key={step.tempId}
                className="p-4 sm:p-5 rounded-2xl border border-[#E9DFF5] bg-[#FFFDF8] transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#EDE5FF] text-[#493D61] font-bold text-xs flex items-center justify-center tabular-nums">
                      {index + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#493D61]">
                      Step {index + 1}
                    </span>
                  </div>

                  {/* Step ordering & remove controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveStep(index, 'up')}
                      className="p-1.5 text-[#81758F] hover:text-[#493D61] disabled:opacity-30 rounded-lg hover:bg-white"
                      title="Move step up"
                      aria-label="Move step up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={index === steps.length - 1}
                      onClick={() => handleMoveStep(index, 'down')}
                      className="p-1.5 text-[#81758F] hover:text-[#493D61] disabled:opacity-30 rounded-lg hover:bg-white"
                      title="Move step down"
                      aria-label="Move step down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                      title="Remove step"
                      aria-label="Remove step"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#493D61] mb-1">
                      Step Instruction <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={step.instruction}
                      onChange={(e) => handleStepChange(index, 'instruction', e.target.value)}
                      placeholder="e.g., Open WhatsApp and download the PDF document"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#81758F] mb-1">
                        Optional Tip / Description
                      </label>
                      <input
                        type="text"
                        value={step.description || ''}
                        onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                        placeholder="e.g., Look in the Files or Downloads folder"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-1 focus:ring-[#DCCEFF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#81758F] mb-1">
                        Optional Important Note
                      </label>
                      <input
                        type="text"
                        value={step.note || ''}
                        onChange={(e) => handleStepChange(index, 'note', e.target.value)}
                        placeholder="e.g., Ensure printer paper tray 1 is loaded with A4"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-1 focus:ring-[#DCCEFF]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 flex justify-center">
            <button
              type="button"
              onClick={handleAddStep}
              className="px-5 py-2.5 bg-[#EDE5FF] hover:bg-[#DCCEFF] text-[#493D61] font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Step</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E9DFF5]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-xs font-semibold text-[#81758F] hover:text-[#493D61] bg-white border border-[#E9DFF5] rounded-xl hover:bg-[#FFFDF8] transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 min-h-[42px]"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-[#493D61] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving to Supabase...' : 'Save Guide'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
