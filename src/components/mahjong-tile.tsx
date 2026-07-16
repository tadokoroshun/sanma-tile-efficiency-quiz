import {
  Man1,
  Man9,
  Pin1,
  Pin2,
  Pin3,
  Pin4,
  Pin5,
  Pin6,
  Pin7,
  Pin8,
  Pin9,
  Sou1,
  Sou2,
  Sou3,
  Sou4,
  Sou5,
  Sou6,
  Sou7,
  Sou8,
  Sou9,
  type MahjongTileComponent,
} from "react-riichi-mahjong-tiles";
import { tileLabel } from "@/lib/tiles";
import type { TileIndex } from "@/lib/types";

const TILE_IMAGES: Partial<Record<TileIndex, MahjongTileComponent>> = {
  0: Man1,
  8: Man9,
  9: Pin1,
  10: Pin2,
  11: Pin3,
  12: Pin4,
  13: Pin5,
  14: Pin6,
  15: Pin7,
  16: Pin8,
  17: Pin9,
  18: Sou1,
  19: Sou2,
  20: Sou3,
  21: Sou4,
  22: Sou5,
  23: Sou6,
  24: Sou7,
  25: Sou8,
  26: Sou9,
};

type MahjongTileProps = {
  tileIndex: TileIndex;
  className?: string;
  decorative?: boolean;
};

export function MahjongTile({ tileIndex, className, decorative = false }: MahjongTileProps) {
  const TileImage = TILE_IMAGES[tileIndex];
  const label = tileLabel(tileIndex);

  if (TileImage === undefined) {
    return <span className={className}>{label}</span>;
  }

  return <TileImage aria-hidden={decorative} aria-label={decorative ? undefined : label} className={className} />;
}
