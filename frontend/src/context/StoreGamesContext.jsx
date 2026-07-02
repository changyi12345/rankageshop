import { createContext, useContext } from "react";
import { useStoreGames } from "../hooks/useStoreGames";

const StoreGamesContext = createContext(null);

export function StoreGamesProvider({ children }) {
  const value = useStoreGames();
  return (
    <StoreGamesContext.Provider value={value}>{children}</StoreGamesContext.Provider>
  );
}

export function useStoreGamesContext() {
  const ctx = useContext(StoreGamesContext);
  if (!ctx) {
    throw new Error("useStoreGamesContext must be used within StoreGamesProvider");
  }
  return ctx;
}
