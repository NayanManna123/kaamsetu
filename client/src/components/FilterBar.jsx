import { useState } from 'react';
import { X } from 'lucide-react';

const defaultFilters = {
  skills: ['Painting', 'Plumbing', 'Electrical', 'Carpentry', 'Masonry', 'Welding', 'Cleaning', 'Driving', 'Cooking', 'Security'],
  workTypes: ['Daily', 'Contract', 'Instant', 'Part-time'],
  payRanges: ['₹300-500', '₹500-800', '₹800-1200', '₹1200+'],
};

export default function FilterBar({ filters = defaultFilters, activeFilters = {}, onFilterChange }) {
  const [selectedSkills, setSelectedSkills] = useState(activeFilters.skills || []);
  const [selectedWorkType, setSelectedWorkType] = useState(activeFilters.workType || null);
  const [selectedPayRange, setSelectedPayRange] = useState(activeFilters.payRange || null);

  const toggleSkill = (skill) => {
    const updated = selectedSkills.includes(skill)
      ? selectedSkills.filter((s) => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(updated);
    onFilterChange?.({ skills: updated, workType: selectedWorkType, payRange: selectedPayRange });
  };

  const toggleWorkType = (type) => {
    const updated = selectedWorkType === type ? null : type;
    setSelectedWorkType(updated);
    onFilterChange?.({ skills: selectedSkills, workType: updated, payRange: selectedPayRange });
  };

  const togglePayRange = (range) => {
    const updated = selectedPayRange === range ? null : range;
    setSelectedPayRange(updated);
    onFilterChange?.({ skills: selectedSkills, workType: selectedWorkType, payRange: updated });
  };

  const hasActiveFilters = selectedSkills.length > 0 || selectedWorkType || selectedPayRange;

  const clearAll = () => {
    setSelectedSkills([]);
    setSelectedWorkType(null);
    setSelectedPayRange(null);
    onFilterChange?.({ skills: [], workType: null, payRange: null });
  };

  return (
    <div className="space-y-3">
      {/* Skills row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.skills?.map((skill) => (
          <button
            key={skill}
            onClick={() => toggleSkill(skill)}
            className={`chip whitespace-nowrap flex-shrink-0 ${selectedSkills.includes(skill) ? 'chip-active' : ''}`}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Work type + Pay range row */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {filters.workTypes?.map((type) => (
          <button
            key={type}
            onClick={() => toggleWorkType(type)}
            className={`chip whitespace-nowrap flex-shrink-0 ${selectedWorkType === type ? 'chip-active' : ''}`}
          >
            {type}
          </button>
        ))}
        <div className="w-px bg-gray-200 mx-1 flex-shrink-0" />
        {filters.payRanges?.map((range) => (
          <button
            key={range}
            onClick={() => togglePayRange(range)}
            className={`chip whitespace-nowrap flex-shrink-0 ${selectedPayRange === range ? 'chip-active' : ''}`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 text-xs font-medium text-danger-600 hover:text-danger-700 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}
    </div>
  );
}
