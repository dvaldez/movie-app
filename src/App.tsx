// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
  useLocation,
} from 'react-router-dom';
import axios from 'axios';
import { supabase } from './supabaseClient';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

import Search from './components/Search';
import Filters from './components/Filters';
import Results from './components/Results';
import Popup from './components/Popup';
import Recommendations from './components/Recommendations';
import WatchlistPage from './components/WatchlistPage';
import Trivia from './components/Trivia';
import Leaderboard from './components/Leaderboard';
import { SignUp } from './pages/Signup';
import { Login } from './pages/Login';
import { ThemeProvider } from './ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

export interface MovieSummary {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface MovieDetail extends MovieSummary {
  Genre: string;
  Director: string;
  Plot: string;
  Actors: string;
  imdbRating: string;
  Response?: string;
  Awards?: string;
}

interface AppState {
  s: string;
  results: MovieSummary[];
  selected?: MovieDetail;
  page: number;
  loading: boolean;
  error: string | null;
  filters: {
    year: string;
    genre: string;
  };
  recommendations: MovieSummary[];
  recommendationsLoading: boolean;
  recommendationsError: string | null;
}

const API_URL = 'http://www.omdbapi.com/?apikey=d194dfd5';

const AppHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const loc = useLocation();

  return (
    <header>
      <h1>Beaker’s Movie Portal</h1>
      <div className="app-title">Your personal portal to the cinematic world</div>
      <nav className="nav">
        <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        {user ? (
          <>
            <Link
              to="/watchlist"
              className={loc.pathname === '/watchlist' ? 'active' : ''}
            >
              Watchlist
            </Link>
            <Link
              to="/trivia"
              className={loc.pathname === '/trivia' ? 'active' : ''}
            >
              Trivia
            </Link>
            <Link
              to="/leaderboard"
              className={loc.pathname === '/leaderboard' ? 'active' : ''}
            >
              Leaderboard
            </Link>
            <button className="theme-toggle" onClick={() => signOut()}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={loc.pathname === '/login' ? 'active' : ''}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className={loc.pathname === '/signup' ? 'active' : ''}
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
      <ThemeToggle />
    </header>
  );
};

const AppContent: React.FC = () => {
  const [state, setState] = useState<AppState>({
    s: '',
    results: [],
    page: 1,
    loading: false,
    error: null,
    filters: { year: '', genre: '' },
    recommendations: [],
    recommendationsLoading: false,
    recommendationsError: null,
  });

  const [watchlist, setWatchlist] = useState<MovieSummary[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef(false);

  // helper: fetch movies
  const fetchMovies = async (
    searchTerm: string,
    page: number,
    append = false
  ) => {
    if (!searchTerm || fetchingRef.current || searchTerm.length < 3) {
      setState((p) => ({ ...p, loading: false, error: null }));
      return;
    }
    fetchingRef.current = true;
    setState((p) => ({ ...p, loading: true, error: null }));

    try {
      const { filters } = state;
      const params = new URLSearchParams({
        s: searchTerm,
        page: page.toString(),
        ...(filters.year && { y: filters.year }),
      });
      const url = `${API_URL}&${params.toString()}`;
      const resp = await axios.get<{
        Response: string;
        Search: MovieSummary[];
        Error?: string;
      }>(url);

      if (resp.data.Response === 'True') {
        setState((p) => ({
          ...p,
          results: append
            ? [...p.results, ...resp.data.Search]
            : resp.data.Search,
          loading: false,
        }));
      } else {
        setState((p) => ({
          ...p,
          results: append ? p.results : [],
          loading: false,
          error: resp.data.Error || `No results for "${searchTerm}"`,
        }));
      }
    } catch {
      setState((p) => ({
        ...p,
        results: append ? p.results : [],
        loading: false,
        error: 'Failed to fetch movies.',
      }));
    } finally {
      fetchingRef.current = false;
    }
  };

  // helper: fetch recommendations based on watchlist
  const fetchRecommendations = async (
    genre: string,
    yearRange: { start: number; end: number }
  ) => {
    if (!genre) return;
    setState((p) => ({
      ...p,
      recommendationsLoading: true,
      recommendationsError: null,
    }));

    try {
      const term = genre.split(',')[0].trim();
      const params = new URLSearchParams({
        s: term,
        type: 'movie',
        y: `${Math.floor((yearRange.start + yearRange.end) / 2)}`,
      });
      const url = `${API_URL}&${params.toString()}`;
      const resp = await axios.get<{
        Response: string;
        Search: MovieSummary[];
      }>(url);

      if (resp.data.Response === 'True') {
        const filtered = resp.data.Search.filter(
          (m) => !watchlist.some((w) => w.imdbID === m.imdbID)
        ).slice(0, 4);
        setState((p) => ({
          ...p,
          recommendations: filtered,
          recommendationsLoading: false,
        }));
      } else {
        setState((p) => ({
          ...p,
          recommendations: [],
          recommendationsLoading: false,
          recommendationsError: 'No recommendations found.',
        }));
      }
    } catch {
      setState((p) => ({
        ...p,
        recommendations: [],
        recommendationsLoading: false,
        recommendationsError: 'Failed to fetch recommendations.',
      }));
    }
  };

  // Sync watchlist to localStorage
  useEffect(() => {
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Infinite scroll observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !state.loading &&
          !state.error &&
          !fetchingRef.current
        ) {
          setState((p) => ({ ...p, page: p.page + 1 }));
          fetchMovies(state.s, state.page + 1, true);
        }
      },
      { threshold: 1.0 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => {
      if (observerRef.current && loadMoreRef.current)
        observerRef.current.unobserve(loadMoreRef.current);
    };
  }, [state.loading, state.error, state.page, state.s, watchlist]);

  // Recompute recommendations when watchlist or search changes
  useEffect(() => {
    if (!state.s && watchlist.length > 0) {
      // derive dominant genre+years
      const genres: string[] = [];
      const years: number[] = [];
      watchlist.forEach((m) => {
        // fetch details
        axios
          .get<MovieDetail>(`${API_URL}&i=${m.imdbID}`)
          .then(({ data }) => {
            if (data.Response === 'True') {
              data.Genre.split(',').forEach((g) => genres.push(g.trim()));
              years.push(parseInt(data.Year, 10));
            }
          })
          .finally(() => {
            const genreCounts = genres.reduce<Record<string, number>>(
              (acc, g) => {
                acc[g] = (acc[g] || 0) + 1;
                return acc;
              },
              {}
            );
            const dominant = Object.keys(genreCounts).reduce((a, b) =>
              genreCounts[a] > genreCounts[b] ? a : b
            );
            const yrRange = {
              start: years.length ? Math.min(...years) : new Date().getFullYear() - 10,
              end: years.length ? Math.max(...years) : new Date().getFullYear(),
            };
            fetchRecommendations(dominant, yrRange);
          });
      });
    } else {
      setState((p) => ({
        ...p,
        recommendations: [],
        recommendationsError: null,
      }));
    }
  }, [watchlist, state.s]);

  // Search input handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setState((p) => ({ ...p, s, page: 1, results: [], error: null }));
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      if (s.trim()) fetchMovies(s, 1);
      else setState((p) => ({ ...p, results: [], loading: false }));
    }, 500);
  };

  // Toggle watchlist
  const toggleWatchlist = (movie: MovieSummary) => {
    setWatchlist((prev) =>
      prev.some((m) => m.imdbID === movie.imdbID)
        ? prev.filter((m) => m.imdbID !== movie.imdbID)
        : [...prev, movie]
    );
  };
  const removeFromWatchlist = (imdbID: string) =>
    setWatchlist((prev) => prev.filter((m) => m.imdbID !== imdbID));

  // Popup handlers
  const openPopup = (id: string) => {
    setState((p) => ({ ...p, loading: true, error: null }));
    axios
      .get<MovieDetail>(`${API_URL}&i=${id}&plot=full`)
      .then(({ data }) =>
        setState((p) => ({
          ...p,
          selected: data.Response === 'True' ? data : undefined,
          loading: false,
          error: data.Response === 'True' ? null : 'Not found.',
        }))
      )
      .catch(() =>
        setState((p) => ({
          ...p,
          selected: undefined,
          loading: false,
          error: 'Failed to load details.',
        }))
      );
  };
  const closePopup = () =>
    setState((p) => ({ ...p, selected: undefined, error: null }));

  return (
    <main>
      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            <>
              <Search value={state.s} onChange={handleSearch} />
              <Filters onFilterChange={(f) =>
                setState((p) => ({ ...p, filters: f, page: 1, results: [] }))
              } />
              {state.loading && <div className="loading-message">Loading…</div>}
              {!state.loading && state.s && state.results.length === 0 && state.error && (
                <div className="error-message">{state.error}</div>
              )}
              <Results
                results={state.results}
                onClick={openPopup}
                loading={state.loading}
                toggleWatchlist={toggleWatchlist}
                watchlist={watchlist}
              />
              <div ref={loadMoreRef} style={{ height: 20 }} />
              {!state.s && watchlist.length > 0 && (
                <>
                  {state.recommendationsLoading && (
                    <div className="loading-message">Loading recommendations…</div>
                  )}
                  {state.recommendationsError && (
                    <div className="error-message">{state.recommendationsError}</div>
                  )}
                  {state.recommendations.length > 0 && (
                    <Recommendations
                      recommendations={state.recommendations}
                      onClick={openPopup}
                      toggleWatchlist={toggleWatchlist}
                      watchlist={watchlist}
                    />
                  )}
                </>
              )}
              {state.selected && (
                <Popup movie={state.selected} onClose={closePopup} />
              )}
            </>
          }
        />

        {/* Auth */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <WatchlistPage
                watchlist={watchlist}
                removeFromWatchlist={removeFromWatchlist}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trivia"
          element={
            <ProtectedRoute>
              <Trivia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
};

const App: React.FC = () => (
  <Router>
    <AuthProvider>
      <div className="App">
        <ThemeProvider>
          <AppHeader />
          <AppContent />
        </ThemeProvider>
      </div>
    </AuthProvider>
  </Router>
);

export default App;
