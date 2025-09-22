import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import axios from "../api/axios";

export default function AdminHome() {
  const { auth } = useAuth();
  const [movies, setMovies] = useState([]);
  const [sortBy, setSortBy] = useState("totalVotes");
  const [loading, setLoading] = useState(false);
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const logout = useLogout();

  const fetchMoviesURI = "/c/getMovies";

  const normalizeMovie = (m) => ({
    ...m,
    comments: Array.isArray(m?.comments) ? m.comments : [],
    votes: Array.isArray(m?.votes) ? m.votes : [],
    upVotes: typeof m?.upVotes === "number" ? m.upVotes : 0,
    downVotes: typeof m?.downVotes === "number" ? m.downVotes : 0,
    totalVotes: typeof m?.totalVotes === "number" ? m.totalVotes : 0,
    createdAt: m?.createdAt ?? m?.created_at ?? new Date().toISOString(),
  });

  useEffect(() => {
    let isMounted = true;
    const getMovies = async () => {
      setLoading(true);
      try {
        const res = await axios.get(fetchMoviesURI, { withCredentials: true });
        if (!isMounted) return;
        const moviesData = Array.isArray(res?.data?.movies)
          ? res.data.movies
          : [];
        setMovies(moviesData.map(normalizeMovie));
      } catch (err) {
        if (isMounted) setMovies([]);
        console.error("Fetch movies error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    getMovies();
    return () => {
      isMounted = false;
    };
  }, [auth._id]);

  const removeMovieFromState = (movieId) =>
    setMovies((prev) => prev.filter((m) => m._id !== movieId));

  const replaceMovieInState = (movieId, newMovie) =>
    setMovies((prev) =>
      prev.map((m) => (m._1d === movieId ? normalizeMovie(newMovie) : m))
    );

  const updateMovieCommentsInState = (movieId, comments) =>
    setMovies((prev) =>
      prev.map((m) =>
        m._id === movieId
          ? { ...m, comments: Array.isArray(comments) ? comments : [] }
          : m
      )
    );

  const commentDeletable = (c) => {
    if (!c) return false;
    if (typeof c.upVotes === "number" || typeof c.downVotes === "number") {
      return (c.upVotes ?? 0) === 0 && (c.downVotes ?? 0) === 0;
    }
    if (Array.isArray(c.votes)) return c.votes.length === 0;
    return true;
  };

  const handleDeleteMovie = async (movieId) => {
    const movie = movies.find((m) => m._id === movieId);
    if (!movie) return;
    if (
      !window.confirm(
        `Delete movie "${movie.title}"? This action cannot be undone.`
      )
    )
      return;
    try {
      const res = await axios.delete(`/a/${movieId}/delete`, {
        withCredentials: true,
      });
      if (res.status >= 200 && res.status < 300) {
        removeMovieFromState(movieId);
      } else {
        const fresh = await axios.get(fetchMoviesURI, {
          withCredentials: true,
        });
        setMovies(
          (Array.isArray(fresh.data.movies) ? fresh.data.movies : []).map(
            normalizeMovie
          )
        );
      }
    } catch (err) {
      alert("Failed to delete movie. Check console for details.");
      console.error("Delete movie error:", err);
    }
  };

  const handleDeleteComment = async (movieId, commentId) => {
    const movie = movies.find((m) => m._id === movieId);
    const comment = movie?.comments?.find((c) => c._id === commentId);
    if (!comment) return;
    if (!commentDeletable(comment)) {
      alert("Cannot delete comment that has votes.");
      return;
    }
    if (!window.confirm("Delete this comment? This action cannot be undone."))
      return;
    try {
      const res = await axios.delete(`/a/${movieId}/${commentId}/delete`, {
        withCredentials: true,
      });
      if (res.status >= 200 && res.status < 300) {
        updateMovieCommentsInState(
          movieId,
          (movie.comments || []).filter((c) => c._id !== commentId)
        );
      } else if (res?.data?.movie) {
        replaceMovieInState(movieId, res.data.movie);
      } else {
        const fresh = await axios.get(fetchMoviesURI, {
          withCredentials: true,
        });
        setMovies(
          (Array.isArray(fresh.data.movies) ? fresh.data.movies : []).map(
            normalizeMovie
          )
        );
      }
    } catch (err) {
      alert("Failed to delete comment. Check console for details.");
      console.error("Delete comment error:", err);
    }
  };

  const sortedMovies = [...movies].sort((a, b) => {
    switch (sortBy) {
      case "totalVotes":
        return b.totalVotes - a.totalVotes;
      case "upVotes":
        return b.upVotes - a.upVotes;
      case "downVotes":
        return b.downVotes - a.downVotes;
      case "createdAt":
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const handleToggleComments = (movieId) =>
    setExpandedMovieId((prev) => (prev === movieId ? null : movieId));
  const signOut = async () => {
    await logout();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Welcome Admin {auth.name}</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="totalVotes">Score </option>
            <option value="createdAt">Newest</option>
            <option value="upVotes">Upvotes</option>
            <option value="downVotes">Downvotes</option>
          </select>
          <button
            onClick={signOut}
            className="bg-gray-800 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading movies…</p>
      ) : sortedMovies.length === 0 ? (
        <p className="text-center text-gray-500">No movies found</p>
      ) : (
        sortedMovies.map((movie) => (
          <div key={movie._id} className="border rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">{movie.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(movie.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm">
                  👍 {movie.upVotes} 👎 {movie.downVotes}{" "}
                  <span className="font-medium">Total: {movie.totalVotes}</span>
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => handleDeleteMovie(movie._id)}
                    className="text-sm bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Delete Movie
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-700">{movie.description}</p>

            <div className="mt-3">
              <button
                onClick={() => handleToggleComments(movie._id)}
                className="text-sm text-blue-600"
              >
                {expandedMovieId === movie._id
                  ? "Hide Comments"
                  : "View Comments"}
              </button>
            </div>

            {expandedMovieId === movie._id && (
              <div className="mt-3 pl-3">
                <strong className="block mb-2">
                  Comments ({(movie.comments || []).length})
                </strong>
                {(movie.comments || []).length === 0 ? (
                  <p className="text-sm text-gray-500">No comments</p>
                ) : (
                  (movie.comments || []).map((c) => {
                    const isDeletable = commentDeletable(c);
                    return (
                      <div key={c._id} className="mb-3">
                        <div className="text-sm">
                          <strong>
                            {c.user_id?.name || c.userName || "Unknown"}:
                          </strong>{" "}
                          <span>{c.body}</span>
                        </div>
                        <div className="text-xs mt-1 text-gray-500 flex items-center gap-3">
                          {typeof c.upVotes === "number" ||
                          typeof c.downVotes === "number" ? (
                            <span>
                              👍 {c.upVotes ?? 0} 👎 {c.downVotes ?? 0}
                            </span>
                          ) : Array.isArray(c.votes) ? (
                            <span>Votes: {c.votes.length}</span>
                          ) : null}
                          <button
                            onClick={() =>
                              handleDeleteComment(movie._id, c._id)
                            }
                            disabled={!isDeletable}
                            className={`text-xs px-2 py-0.5 rounded ${
                              isDeletable
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                            aria-disabled={!isDeletable}
                          >
                            Delete Comment
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
