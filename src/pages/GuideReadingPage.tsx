import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Check,
  Info,
  FileQuestion,
  Share2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import type { Guide } from '../types';
import { GuideIcon } from '../components/GuideIcon';
import { getGuideProgress, setStepCompleted, resetGuideProgress } from '../lib/storage';

interface GuideReadingPageProps {
  guide: Guide;
  onBack: () => void;
  isAdmin?: boolean;
  onEditGuide?: (guideId: string) => void;
}

export const GuideReadingPage: React.FC<GuideReadingPageProps> = ({
  guide,
  onBack,
  isAdmin,
  onEditGuide,
}) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Load progress for this guide from localStorage
  useEffect(() => {
    setCompletedSteps(getGuideProgress(guide.id));
    // Scroll to top on opening guide
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [guide.id]);

  const steps = guide.steps || [];
  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => completedSteps[s.id]).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const isAllDone = totalSteps > 0 && completedCount === totalSteps;

  const handleToggleStep = (stepId: string) => {
    const isCurrentlyDone = Boolean(completedSteps[stepId]);
    const updated = setStepCompleted(guide.id, stepId, !isCurrentlyDone);
    setCompletedSteps(updated);
  };

  const handleResetChecklist = () => {
    resetGuideProgress(guide.id);
    setCompletedSteps({});
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `PrintMate — ${guide.title}`,
        text: `Follow the step-by-step instructions for "${guide.title}" on PrintMate.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Top sticky bar for reading context */}
      <div className="sticky top-16 z-30 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#E9DFF5] px-4 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-[#493D61] hover:text-[#382e4c] bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] px-3 py-2 rounded-xl transition-colors min-h-[40px] shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Guides</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="text-xs text-[#81758F] hover:text-[#493D61] bg-white border border-[#E9DFF5] p-2 rounded-xl transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center shadow-xs"
              title="Share guide link"
              aria-label="Share guide"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {isAdmin && onEditGuide && (
              <button
                onClick={() => onEditGuide(guide.id)}
                className="text-xs font-medium text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] border border-[#DCCEFF] px-3 py-2 rounded-xl transition-colors min-h-[40px]"
              >
                Edit Guide
              </button>
            )}

            <button
              onClick={handleResetChecklist}
              className="flex items-center gap-1.5 text-xs font-medium text-[#81758F] hover:text-[#493D61] bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] px-3 py-2 rounded-xl transition-colors min-h-[40px] shadow-xs"
              title="Reset checklist progress for this guide"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-3xl mx-auto mt-2">
          <div className="flex items-center justify-between text-[11px] text-[#81758F] font-medium mb-1">
            <span>
              {completedCount} of {totalSteps} step{totalSteps === 1 ? '' : 's'} completed
            </span>
            <span className="tabular-nums font-semibold text-[#493D61]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#EDE5FF] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out rounded-full ${
                isAllDone ? 'bg-emerald-500' : 'bg-[#D8C5FF]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {copiedLink && (
        <div className="fixed top-20 right-4 z-50 bg-[#493D61] text-white text-xs px-3 py-2 rounded-xl shadow-lg animate-in fade-in">
          Link copied to clipboard!
        </div>
      )}

      {/* Main Notebook Reading Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Guide Header Sheet */}
        <div className="bg-white border border-[#E9DFF5] rounded-3xl p-5 sm:p-7 shadow-xs mb-6 relative overflow-hidden">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE5FF] border border-[#E9DFF5] flex items-center justify-center text-[#493D61] shrink-0 shadow-xs">
              <GuideIcon name={guide.icon} className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Category label */}
              <div className="text-xs font-medium text-[#81758F] mb-1">
                {guide.category?.name || 'Printing Guide'}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-[#493D61] tracking-tight leading-snug">
                {guide.title}
              </h1>
            </div>
          </div>

          {guide.description && (
            <p className="text-sm text-[#81758F] leading-relaxed pt-3 border-t border-[#E9DFF5]">
              {guide.description}
            </p>
          )}

          {isAllDone && (
            <div className="mt-4 p-3.5 bg-[#E0F2E5] border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-semibold">All steps completed! Great work.</span>
              </div>
              <button
                onClick={handleResetChecklist}
                className="text-xs text-emerald-800 underline font-medium hover:text-emerald-950 shrink-0"
              >
                Reset for next print
              </button>
            </div>
          )}
        </div>

        {/* Steps List */}
        <section aria-label="Step by step instructions" className="space-y-3.5">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-[#81758F] px-1">
            Numbered Instructions
          </h2>

          {steps.length === 0 ? (
            <div className="bg-white border border-[#E9DFF5] rounded-2xl p-8 text-center text-[#81758F]">
              <FileQuestion className="w-8 h-8 mx-auto mb-2 text-[#DCCEFF]" />
              <p className="text-sm font-medium text-[#493D61]">No steps added yet</p>
              <p className="text-xs mt-1">This guide doesn't have any instruction steps yet.</p>
            </div>
          ) : (
            steps.map((step, index) => {
              const isDone = Boolean(completedSteps[step.id]);

              return (
                <div
                  key={step.id}
                  onClick={() => handleToggleStep(step.id)}
                  role="checkbox"
                  aria-checked={isDone}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleToggleStep(step.id);
                    }
                  }}
                  className={`group rounded-2xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer select-none ${
                    isDone
                      ? 'bg-[#E0F2E5]/70 border-emerald-200 shadow-xs'
                      : 'bg-white border-[#E9DFF5] hover:border-[#DCCEFF] shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Interactive Checkbox / Number circle */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm transition-all duration-200 ${
                        isDone
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#EDE5FF] text-[#493D61] group-hover:bg-[#DCCEFF]'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <span className="tabular-nums font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#81758F]">
                          Step {index + 1}
                        </span>
                        {isDone && (
                          <span className="text-[11px] font-medium text-emerald-800">
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Instruction */}
                      <p
                        className={`text-base font-semibold leading-snug mt-0.5 transition-colors ${
                          isDone
                            ? 'text-emerald-950 line-through opacity-85'
                            : 'text-[#493D61]'
                        }`}
                      >
                        {step.instruction}
                      </p>

                      {/* Optional Description / Tip */}
                      {step.description && (
                        <div className="mt-2 text-xs sm:text-sm text-[#81758F] leading-relaxed">
                          {step.description}
                        </div>
                      )}

                      {/* Optional Note */}
                      {step.note && (
                        <div
                          className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
                            isDone
                              ? 'bg-emerald-100/60 border-emerald-200 text-emerald-900'
                              : 'bg-[#FFF8EF] border-[#E9DFF5] text-[#493D61]'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#81758F]" />
                          <div className="leading-relaxed">
                            <strong className="font-semibold">Note:</strong> {step.note}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Bottom Actions Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E9DFF5]">
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-[#493D61] bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Guides
          </button>

          {completedCount > 0 && (
            <button
              onClick={handleResetChecklist}
              className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-[#81758F] hover:text-[#493D61] bg-[#EDE5FF] hover:bg-[#DCCEFF] rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Checklist
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
