"use client";

import { useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/actions/outfits";
import { HeartIcon } from "./icons";

export function FavoriteButton({ outfitId, initial }: { outfitId: string; initial: boolean }) {
  const [favorited, setFavorited] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    setError(null);
    const previous = favorited;
    setFavorited(!previous);
    startTransition(async () => {
      const result = await toggleFavoriteAction(outfitId);
      if (result.ok) setFavorited(result.favorited);
      else {
        setFavorited(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={favorited}
        className={`btn-outline ${favorited ? "border-obsidian !bg-obsidian !text-white" : ""}`}
      >
        <HeartIcon filled={favorited} />
        {favorited ? "Saved" : "Save"}
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-red-800">{error}</p>}
    </div>
  );
}
