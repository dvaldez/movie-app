import React from 'react';
import { MovieSummary } from '../App';

interface RecommendationsProps {
  recommendations: MovieSummary[];
  onClick: (id: string) => void;
  toggleWatchlist: (movie: MovieSummary) => void;
  watchlist: MovieSummary[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ recommendations, onClick, toggleWatchlist, watchlist }) => {
  return (
    <div className="recommendations">
      <h2>Recommended for You</h2>
      <div className="recommendations-grid">
        {recommendations.map(movie => (
          <div key={movie.imdbID} className="recommendation">
            <img
              src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/250x250'}
              alt={movie.Title}
              onClick={() => onClick(movie.imdbID)}
            />
            <h3 onClick={() => onClick(movie.imdbID)}>{movie.Title}</h3>
            <button
              className={`watchlist-btn ${watchlist.some(item => item.imdbID === movie.imdbID) ? 'in-watchlist' : ''}`}
              onClick={() => toggleWatchlist(movie)}
            >
              {watchlist.some(item => item.imdbID === movie.imdbID) ? 'Remove' : 'Add to Watchlist'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;