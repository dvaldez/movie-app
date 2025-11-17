import React from 'react';

interface FiltersProps {
  onFilterChange: (filters: { year: string; genre: string }) => void;
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ year: e.target.value, genre: '' });
  };

  return (
    <div className="filters">
      <select onChange={handleYearChange} defaultValue="">
        <option value="">All Years</option>
        {Array.from({ length: 2025 - 1900 + 1 }, (_, i) => 1900 + i).reverse().map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  );
};

export default Filters;