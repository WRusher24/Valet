import { SEASON_LABEL, type Season } from "@/lib/constants";

export function SeasonTag({ season }: { season: Season }) {
  return <span className="tag">{SEASON_LABEL[season]}</span>;
}
