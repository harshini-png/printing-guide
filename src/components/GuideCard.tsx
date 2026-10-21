import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Guide } from '../types';
import { GuideIcon } from './GuideIcon';
import { getGuideProgress } from '../lib/storage';

interface GuideCardProps {
  guide: Guide;
  onOpen: (guideId: string) => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onOpen }) => {
  const stepsCount = guide.steps?.length || 0;
  const progressMap = getGuideProgress(guide.id);
  const completedCount = Object.keys(progressMap).length;
  const isAllCompleted = stepsCount > 0 && completedCount === stepsCount;

  return (
    <div
      onClick={() => onOpen(guide.id)}
      className="group bg-white border border-[#E9DFF5] hover:border-[#DCCEFF] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top: Icon + Category and step count metadata */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EDE5FF] text-[#493D61] border border-[#E9DFF5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <GuideIcon name={guide.icon} className="w-5 h-5" />
          </div>

          {/* Clean unboxed metadata (anti-slop rule) */}
          <div className="flex items-center gap-1.5 text-xs text-[#81758F] text-right font-medium">
            <span>{guide.category?.name || 'General'}</span>
            <span aria-hidden="true" className="text-[#E9DFF5]">·</span>
            <span>{stepsCount} step{stepsCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base text-[#493D61] group-hover:text-[#382e4c] transition-colors leading-snug mb-1.5 line-clamp-2">
          {guide.title}
        </h3>

        {/* Description */}
        {guide.description && (
          <p className="text-xs text-[#81758F] line-clamp-2 leading-relaxed mb-4">
            {guide.description}
          </p>
        )}
      </div>

      {/* Card bottom: status / action button */}
      <div className="pt-3.5 border-t border-[#E9DFF5]/70 flex items-center justify-between text-xs">
        {completedCount > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-[#E0F2E5] px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {isAllCompleted ? 'Completed' : `${completedCount}/${stepsCount} done`}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[#81758F]">Ready to follow</span>
        )}

        <div className="flex items-center gap-1 font-semibold text-[#493D61] group-hover:translate-x-0.5 transition-transform">
          <span>Open Guide</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
