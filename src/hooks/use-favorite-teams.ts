'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addFavoriteTeam,
  FAVORITE_TEAMS_CHANGE_EVENT,
  FAVORITE_TEAMS_STORAGE_KEY,
  readFavoriteTeams,
  removeFavoriteTeam,
  saveFavoriteTeams,
  toggleFavoriteTeam,
} from '@/lib/favorite-teams';

function getBrowserStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function useFavoriteTeams() {
  const [favorites, setFavorites] = useState<string[]>(() => readFavoriteTeams(getBrowserStorage()));

  useEffect(() => {
    setFavorites(readFavoriteTeams(getBrowserStorage()));

    function syncFavorites() {
      setFavorites(readFavoriteTeams(getBrowserStorage()));
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === FAVORITE_TEAMS_STORAGE_KEY) syncFavorites();
    }

    window.addEventListener('storage', handleStorage);
    window.addEventListener(FAVORITE_TEAMS_CHANGE_EVENT, syncFavorites);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(FAVORITE_TEAMS_CHANGE_EVENT, syncFavorites);
    };
  }, []);

  const updateFavorites = useCallback((updater: (current: string[]) => string[]) => {
    const nextFavorites = saveFavoriteTeams(updater(favorites), getBrowserStorage());
    setFavorites(nextFavorites);
    window.dispatchEvent(new Event(FAVORITE_TEAMS_CHANGE_EVENT));
  }, [favorites]);

  const addFavorite = useCallback((teamCode: string) => updateFavorites((current) => addFavoriteTeam(current, teamCode)), [updateFavorites]);
  const removeFavorite = useCallback((teamCode: string) => updateFavorites((current) => removeFavoriteTeam(current, teamCode)), [updateFavorites]);
  const toggleFavorite = useCallback((teamCode: string) => updateFavorites((current) => toggleFavoriteTeam(current, teamCode)), [updateFavorites]);
  const setFavoriteTeams = useCallback((teamCodes: string[]) => {
    setFavorites(saveFavoriteTeams(teamCodes, getBrowserStorage()));
    window.dispatchEvent(new Event(FAVORITE_TEAMS_CHANGE_EVENT));
  }, []);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const isFavorite = useCallback((teamCode: string) => favoriteSet.has(teamCode.trim().toUpperCase()), [favoriteSet]);

  return {
    favorites,
    favoriteSet,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    setFavoriteTeams,
  };
}
