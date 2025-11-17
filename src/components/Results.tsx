import React from 'react';

interface ResultsProps {
  results: any[];
  onClick: (id: string) => void;
  loading: boolean;
  toggleWatchlist: (movie: any) => void;
  watchlist: any[];
}

const Results: React.FC<ResultsProps> = ({ results, onClick, loading, toggleWatchlist, watchlist }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="results">
      {results.map((result) => (
        <div
          className={`result ${loading ? 'skeleton' : ''}`}
          key={result.imdbID}
          onClick={() => onClick(result.imdbID)}
        >
          <img src={result.Poster !== 'N/A' ? result.Poster : 'https://via.placeholder.com/300x300'} alt={result.Title} />
          <h3>{result.Title}</h3>
          <button
            className={`watchlist-btn ${watchlist.some((item) => item.imdbID === result.imdbID) ? 'in-watchlist' : ''}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onClick
              toggleWatchlist(result);
            }}
          >
            {watchlist.some((item) => item.imdbID === result.imdbID) ? 'Remove from Watchlist' : 'Add to Watchlist'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Results;