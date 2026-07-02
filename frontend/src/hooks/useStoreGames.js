import { useCallback, useEffect, useState } from "react";
import { fetchStoreGames } from "../api/store";
import { groupGamesForDisplay } from "../utils/groupGames";
import { fetchWithRetry } from "../utils/fetchWithRetry";

export function useStoreGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWithRetry(() => fetchStoreGames());
      setGames(groupGamesForDisplay(data.games || []));
    } catch (err) {
      setError(err.message || "Failed to load games");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { games, loading, error, reload };
}
