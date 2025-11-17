import React from 'react';

interface WatchlistPageProps {
  watchlist: any[];
  removeFromWatchlist: (imdbID: string) => void;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ watchlist, removeFromWatchlist }) => {
  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="watchlist">
        <h2>Watchlist</h2>
        <p>Watchlist empty. Add some from the search page!</p>
      </div>
    );
  }

  return (
    <div className="watchlist">
      <h2>Watchlist</h2>
      <div className="watchlist-grid">
        {watchlist.map((movie) => (
          <div className="watchlist-item" key={movie.imdbID}>
            <img src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/250x250'} alt={movie.Title} />
            <h3>{movie.Title}</h3>
            <button className="remove-btn" onClick={() => removeFromWatchlist(movie.imdbID)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistPage;