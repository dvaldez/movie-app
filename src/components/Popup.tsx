import React, { useState } from 'react';
import { MovieDetail } from '../App';

interface PopupProps {
  movie: MovieDetail;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ movie, onClose }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'cast'>('details');

  return (
    <div className="popup">
      <div className="popup-inner">
        <button className="close-btn" onClick={onClose}>X</button>
        <div className="popup-tabs">
          <button
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={activeTab === 'cast' ? 'active' : ''}
            onClick={() => setActiveTab('cast')}
          >
            Cast
          </button>
        </div>
        <div className="popup-content">
          <h2>
            {movie.Title} <span>({movie.Year})</span>
          </h2>
          {movie.Poster !== 'N/A' && <img src={movie.Poster} alt={movie.Title} />}
          {activeTab === 'details' ? (
            <>
              <p><strong>Genre:</strong> {movie.Genre}</p>
              <p><strong>Director:</strong> {movie.Director}</p>
              <p><strong>IMDb Rating:</strong> {movie.imdbRating}</p>
              <p>{movie.Plot}</p>
            </>
          ) : (
            <p><strong>Actors:</strong> {movie.Actors}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;