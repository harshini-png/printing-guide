import React from 'react';
import type { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none py-1">
      <button
        onClick={() => onSelectCategory(null)}
        className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all border shrink-0 min-h-[36px] ${
          selectedCategoryId === null
            ? 'bg-[#EDE5FF] text-[#493D61] border-[#DCCEFF] font-semibold shadow-xs'
            : 'bg-white text-[#81758F] border-[#E9DFF5] hover:bg-[#FFFDF8] hover:text-[#493D61]'
        }`}
      >
        All Guides
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-all border shrink-0 min-h-[36px] ${
              isSelected
                ? 'bg-[#EDE5FF] text-[#493D61] border-[#DCCEFF] font-semibold shadow-xs'
                : 'bg-white text-[#81758F] border-[#E9DFF5] hover:bg-[#FFFDF8] hover:text-[#493D61]'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};
