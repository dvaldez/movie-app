import React, { ChangeEvent } from 'react';

interface SearchProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const Search: React.FC<SearchProps> = ({ value, onChange }) => (
  <div className="search">
    <input
      type="text"
      placeholder="Search for a movie..."
      value={value}
      onChange={onChange}
    />
  </div>
);

export default Search;
