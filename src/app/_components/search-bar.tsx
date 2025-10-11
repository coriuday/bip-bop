"use client";

import React from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search posts, users..." }) => {
  const [mounted, setMounted] = React.useState(false);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  if (!mounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full max-w-md mx-auto my-4">
      <input
        type="text"
        className="input input-bordered flex-1 rounded-l-md"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <button type="submit" className="btn btn-primary rounded-l-none rounded-r-md">Search</button>
    </form>
  );
};

export default SearchBar;

