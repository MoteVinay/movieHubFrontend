import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import axios from "../api/axios";
import useLogout from "../hooks/useLogout";

export default function UserHome() {
  const { auth } = useAuth();
  const [movies, setMovies] = useState([]);
  const [sortBy, setSortBy] = useState("totalVotes");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [expandedMovieId, setExpandedMovieId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [showInput, setShowInput] = useState(false);
  const [movieTitle, setMovieTitle] = useState("");
  const [movieDescription, setMovieDescription] = useState("");
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const logout = useLogout();

  const fetchMoviesURI = "/c/getMovies";

  const insertOptimisticMovie = (movieObj) => {
    const norm = normalizeMovie(movieObj);
    setMovies((prev) => [norm, ...prev]);
    setCommentInputs((prev) => ({ ...prev, [norm._id]: "" }));
    return norm._id;
  };

  const replaceOptimisticMovie = (tempId, realMovie) => {
    setMovies((prev) =>
      prev.map((m) => (m._id === tempId ? normalizeMovie(realMovie) : m))
    );
    setCommentInputs((prev) => {
      const { [tempId]: tempVal, ...rest } = prev;
      return { ...rest, [realMovie._id]: tempVal ?? "" };
    });
  };

  const removeOptimisticMovie = (tempId) => {
    setMovies((prev) => prev.filter((m) => m._id !== tempId));
    setCommentInputs((prev) => {
      const copy = { ...prev };
      delete copy[tempId];
      return copy;
    });
  };

  const handleAddMovie = async () => {
    if (!movieTitle.trim() || !movieDescription.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const tempMovie = {
      _id: tempId,
      title: movieTitle.trim(),
      description: movieDescription.trim(),
      added_by: auth._id || null,
      createdAt: new Date().toISOString(),
      comments: [],
      votes: [],
      upVotes: 0,
      downVotes: 0,
      totalVotes: 0,
    };

    insertOptimisticMovie(tempMovie);

    setMovieTitle("");
    setMovieDescription("");
    setShowInput(false);

    setIsAddingMovie(true);
    try {
      const res = await axios.post(
        "/u/addMovie",
        { title: tempMovie.title, description: tempMovie.description },
        { withCredentials: true }
      );

      const savedMovie = res?.data?.movie ?? res?.data;

      if (!savedMovie || !savedMovie._id) {
        removeOptimisticMovie(tempId);
        const fresh = await axios.get(fetchMoviesURI, {
          withCredentials: true,
        });
        const normalized = (
          Array.isArray(fresh?.data?.movies) ? fresh.data.movies : []
        ).map(normalizeMovie);
        setMovies(normalized);
      } else {
        replaceOptimisticMovie(tempId, savedMovie);
      }
    } catch (err) {
      removeOptimisticMovie(tempId);
      alert("Failed to add movie. Please try again.");
      console.error("Add movie error:", err);
    } finally {
      setIsAddingMovie(false);
    }
  };

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
      try {
        const res = await axios.get(fetchMoviesURI, { withCredentials: true });
        if (!isMounted) return;
        const moviesData = Array.isArray(res.data.movies)
          ? res.data.movies
          : [];
        const normalized = moviesData.map(normalizeMovie);
        const initialComments = {};
        normalized.forEach((movie) => {
          const userComment = (movie.comments || []).find(
            (c) => c.user_id?._id === auth._id
          );
          initialComments[movie._id] = userComment ? userComment.body : "";
        });
        setCommentInputs(initialComments);
        setMovies(normalized);
      } catch (err) {
        if (isMounted) setMovies([]);
        console.error("Fetch movies error:", err);
      }
    };
    getMovies();
    return () => {
      isMounted = false;
    };
  }, [auth._id]);

  const updateMovie = (movieId, updatedMovie) => {
    setMovies((prev) =>
      prev.map((m) => (m._id === movieId ? normalizeMovie(updatedMovie) : m))
    );
  };

  const handleVote = async (movieId, type) => {
    try {
      const res = await axios.post(
        `/u/${movieId}/vote`,
        { voteType: type === "up" },
        { withCredentials: true }
      );
      if (res?.data?.movie) updateMovie(movieId, res.data.movie);
    } catch (err) {
      alert("Failed to record vote. Please try again.");
      console.error("Vote error:", err);
    }
  };

  const toggleComments = (movieId) => {
    setExpandedMovieId((prev) => (prev === movieId ? null : movieId));
    if (expandedMovieId === movieId) setEditingCommentId(null);
  };

  const handleSaveComment = async (movieId) => {
    const commentText = commentInputs[movieId]?.trim();
    if (!commentText) return;

    try {
      const res = await axios.post(
        `/u/${movieId}/comment`,
        { body: commentText },
        { withCredentials: true }
      );
      if (res?.data?.movie) {
        updateMovie(movieId, res.data.movie);
        setCommentInputs((prev) => ({ ...prev, [movieId]: commentText }));
      }
      setEditingCommentId(null);
    } catch (err) {
      console.error("Save comment error:", err);
      alert("Failed to save comment. Please try again.");
    }
  };

  const startEditing = (movieId, c) => {
    if (c) {
      setEditingCommentId(c._id);
      setCommentInputs((prev) => ({ ...prev, [movieId]: c.body ?? "" }));
    } else {
      setEditingCommentId(`new-${movieId}`);
      setCommentInputs((prev) => ({ ...prev, [movieId]: prev[movieId] ?? "" }));
    }
  };

  const cancelEditing = (movieId) => {
    const movie = movies.find((m) => m._id === movieId);
    const userComment = (movie?.comments || []).find(
      (c) => c.user_id?._id === auth._id
    );
    setCommentInputs((prev) => ({
      ...prev,
      [movieId]: userComment ? userComment.body : "",
    }));
    setEditingCommentId(null);
  };

  const userVote = (votes) =>
    Array.isArray(votes)
      ? votes.find((v) => v.user_id === auth._id)
      : undefined;

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

  const signOut = async () => {
    await logout();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Welcome {auth.name}</h2>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="createdAt">Newest</option>
            <option value="totalVotes">Score </option>
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

      <div className="mb-4">
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Add Movie
          </button>
        ) : (
          <div className="mt-2 flex flex-col md:flex-row gap-2">
            <input
              type="text"
              placeholder="Movie title"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Movie description"
              value={movieDescription}
              onChange={(e) => setMovieDescription(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddMovie}
                disabled={!movieTitle || !movieDescription || isAddingMovie}
                className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-60"
              >
                Submit
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="px-3 py-1 rounded border"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {sortedMovies.length === 0 ? (
        <p className="text-center text-gray-500">No movies added</p>
      ) : (
        sortedMovies.map((movie) => {
          const isExpanded = expandedMovieId === movie._id;
          userVote(movie.votes);
          const userComment = (movie.comments || []).find(
            (c) => c.user_id?._id === auth._id
          );
          const isAdding = editingCommentId === `new-${movie._id}`;

          return (
            <div
              key={movie._id}
              className="border rounded-lg p-4 mb-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{movie.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(movie.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm">
                    👍 {movie.upVotes} 👎 {movie.downVotes}{" "}
                    <span className="font-medium">
                      Total: {movie.totalVotes}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm text-gray-700">{movie.description}</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => handleVote(movie._id, "up")}
                  className="px-3 py-1 rounded border"
                >
                  Upvote
                </button>
                <button
                  onClick={() => handleVote(movie._id, "down")}
                  className="px-3 py-1 rounded border"
                >
                  Downvote
                </button>
                <button
                  onClick={() => toggleComments(movie._id)}
                  className="text-blue-600"
                >
                  {isExpanded ? "Hide Comments" : "Show Comments"}
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pl-3">
                  {(movie.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No comments yet</p>
                  ) : null}

                  {(movie.comments || []).map((c) => {
                    const isUserComment = c.user_id?._id === auth._id;
                    const isEditing = editingCommentId === c._id;

                    return (
                      <div key={c._id} className="mb-3">
                        <div className="text-sm">
                          <strong>{c.user_id?.name || "Unknown"}:</strong>{" "}
                          {!isEditing ? (
                            <>
                              {c.body}{" "}
                              {isUserComment && (
                                <button
                                  onClick={() => startEditing(movie._id, c)}
                                  className="ml-2 text-sm text-blue-600"
                                >
                                  Update
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={commentInputs[movie._id] ?? ""}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [movie._id]: e.target.value,
                                  }))
                                }
                                className="mr-2 border rounded px-2 py-1"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSaveComment(movie._id);
                                }}
                              />
                              <button
                                onClick={() => handleSaveComment(movie._id)}
                                disabled={!commentInputs[movie._id]?.trim()}
                                className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-60"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => cancelEditing(movie._id)}
                                className="ml-2 px-2 py-1 rounded border"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!userComment && !isAdding && (
                    <div className="mt-2">
                      <button
                        onClick={() => startEditing(movie._id, null)}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        Add Comment
                      </button>
                    </div>
                  )}

                  {isAdding && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={commentInputs[movie._id] ?? ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({
                            ...prev,
                            [movie._id]: e.target.value,
                          }))
                        }
                        className="mr-2 border rounded px-2 py-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveComment(movie._id);
                        }}
                      />
                      <button
                        onClick={() => handleSaveComment(movie._id)}
                        disabled={!commentInputs[movie._id]?.trim()}
                        className="px-2 py-1 rounded bg-green-600 text-white disabled:opacity-60"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => cancelEditing(movie._id)}
                        className="ml-2 px-2 py-1 rounded border"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
