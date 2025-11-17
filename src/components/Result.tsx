import React, { useState } from 'react';
import { MovieSummary } from '../App';

interface ResultProps {
  movie: MovieSummary;
  onClick: (id: string) => void;
}

const Result: React.FC<ResultProps> = ({ movie, onClick }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="result" onClick={() => onClick(movie.imdbID)}>
      <img
        src={imageError ? 'https://via.placeholder.com/300x450?text=Image+Not+Found' : movie.Poster}
        alt={movie.Title}
        onError={() => setImageError(true)}
      />
      <h3>{movie.Title} ({movie.Year})</h3>
    </div>
  );
};

export default Result;