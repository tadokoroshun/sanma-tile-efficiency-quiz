use serde::Serialize;
use wasm_bindgen::prelude::*;
use xiangting::{
    calculate_necessary_tiles, calculate_replacement_number, PlayerCount, TileCounts, TileFlagsExt,
};

const TILE_KIND_COUNT: usize = 34;
const HAND_TILE_COUNT: u8 = 14;
const MAX_COPIES: u8 = 4;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectiveTile {
    tile: String,
    remaining: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscardEvaluation {
    discard: String,
    shanten: i8,
    effective_tiles: Vec<EffectiveTile>,
    total_ukeire: u8,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HandEvaluation {
    current_shanten: i8,
    candidates: Vec<DiscardEvaluation>,
    best_discards: Vec<String>,
}

/// Evaluates all unique discard choices for a 14-tile sanma hand supplied as a JSON array of 34 counts.
#[wasm_bindgen]
pub fn evaluate_sanma_hand(hand_json: &str) -> Result<String, JsValue> {
    let parsed: Vec<u8> = serde_json::from_str(hand_json)
        .map_err(|error| JsValue::from_str(&format!("手牌JSONを解析できません: {error}")))?;
    let hand = tile_counts_from_slice(&parsed).map_err(|message| JsValue::from_str(&message))?;
    let evaluation =
        evaluate_sanma_hand_counts(&hand).map_err(|message| JsValue::from_str(&message))?;

    serde_json::to_string(&evaluation)
        .map_err(|error| JsValue::from_str(&format!("評価結果をJSONへ変換できません: {error}")))
}

pub fn evaluate_sanma_hand_counts(hand: &TileCounts) -> Result<HandEvaluation, String> {
    validate_hand(hand, HAND_TILE_COUNT)?;
    let current_shanten = shanten(hand)?;
    let mut candidates = Vec::new();

    for tile_index in valid_tile_indices() {
        if hand[tile_index] == 0 {
            continue;
        }

        let mut after_discard = *hand;
        after_discard[tile_index] -= 1;
        let (candidate_shanten, effective_tiles) = effective_tiles_for(&after_discard)?;
        let total_ukeire = effective_tiles.iter().map(|tile| tile.remaining).sum();

        candidates.push(DiscardEvaluation {
            discard: tile_name(tile_index).to_owned(),
            shanten: candidate_shanten,
            effective_tiles,
            total_ukeire,
        });
    }

    let best_discards = best_discards(&candidates);
    Ok(HandEvaluation {
        current_shanten,
        candidates,
        best_discards,
    })
}

fn tile_counts_from_slice(counts: &[u8]) -> Result<TileCounts, String> {
    if counts.len() != TILE_KIND_COUNT {
        return Err(format!(
            "牌種の配列長は34である必要があります: {}",
            counts.len()
        ));
    }

    let mut hand = [0; TILE_KIND_COUNT];
    hand.copy_from_slice(counts);
    Ok(hand)
}

fn validate_hand(hand: &TileCounts, expected_tile_count: u8) -> Result<(), String> {
    for tile_index in 1..8 {
        if hand[tile_index] != 0 {
            return Err(format!(
                "{}は三人麻雀では使用しません",
                tile_name(tile_index)
            ));
        }
    }

    for (tile_index, count) in hand.iter().enumerate() {
        if *count > MAX_COPIES {
            return Err(format!("{}は4枚以下にしてください", tile_name(tile_index)));
        }
    }

    let total: u8 = hand.iter().sum();
    if total != expected_tile_count {
        return Err(format!(
            "手牌は{expected_tile_count}枚である必要があります: {total}枚"
        ));
    }
    Ok(())
}

fn shanten(hand: &TileCounts) -> Result<i8, String> {
    calculate_replacement_number(hand, &PlayerCount::Three)
        .map(|replacement_number| replacement_number as i8 - 1)
        .map_err(|error| error.to_string())
}

fn effective_tiles_for(hand: &TileCounts) -> Result<(i8, Vec<EffectiveTile>), String> {
    validate_hand(hand, HAND_TILE_COUNT - 1)?;
    let (replacement_number, flags) =
        calculate_necessary_tiles(hand, &PlayerCount::Three).map_err(|error| error.to_string())?;
    let flags = flags.to_array();
    let effective_tiles = valid_tile_indices()
        .filter(|&tile_index| flags[tile_index] && hand[tile_index] < MAX_COPIES)
        .map(|tile_index| EffectiveTile {
            tile: tile_name(tile_index).to_owned(),
            remaining: MAX_COPIES - hand[tile_index],
        })
        .collect();

    Ok((replacement_number as i8 - 1, effective_tiles))
}

fn best_discards(candidates: &[DiscardEvaluation]) -> Vec<String> {
    let Some(best_shanten) = candidates.iter().map(|candidate| candidate.shanten).min() else {
        return Vec::new();
    };
    let best_ukeire = candidates
        .iter()
        .filter(|candidate| candidate.shanten == best_shanten)
        .map(|candidate| candidate.total_ukeire)
        .max()
        .unwrap_or(0);

    candidates
        .iter()
        .filter(|candidate| {
            candidate.shanten == best_shanten && candidate.total_ukeire == best_ukeire
        })
        .map(|candidate| candidate.discard.clone())
        .collect()
}

fn valid_tile_indices() -> impl Iterator<Item = usize> {
    [0usize, 8].into_iter().chain(9..TILE_KIND_COUNT)
}

fn tile_name(tile_index: usize) -> &'static str {
    const TILES: [&str; TILE_KIND_COUNT] = [
        "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "4p", "5p", "6p",
        "7p", "8p", "9p", "1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "東", "南", "西",
        "北", "白", "發", "中",
    ];
    TILES[tile_index]
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hand(tiles: &[(usize, u8)]) -> TileCounts {
        let mut counts = [0; TILE_KIND_COUNT];
        for (tile_index, count) in tiles {
            counts[*tile_index] = *count;
        }
        counts
    }

    fn candidate(discard: &str, shanten: i8, total_ukeire: u8) -> DiscardEvaluation {
        DiscardEvaluation {
            discard: discard.to_owned(),
            shanten,
            effective_tiles: Vec::new(),
            total_ukeire,
        }
    }

    #[test]
    fn calculates_standard_hand_shanten() {
        let counts = hand(&[
            (0, 3),
            (8, 1),
            (9, 1),
            (10, 1),
            (11, 1),
            (18, 1),
            (19, 1),
            (20, 1),
            (27, 3),
        ]);
        assert_eq!(shanten(&counts).unwrap(), 0);
    }

    #[test]
    fn calculates_seven_pairs_shanten() {
        let counts = hand(&[(0, 2), (8, 2), (9, 2), (10, 2), (18, 2), (19, 2), (27, 1)]);
        assert_eq!(shanten(&counts).unwrap(), 0);
    }

    #[test]
    fn calculates_thirteen_orphans_shanten() {
        let counts = hand(&[
            (0, 1),
            (8, 1),
            (9, 1),
            (17, 1),
            (18, 1),
            (26, 1),
            (27, 1),
            (28, 1),
            (29, 1),
            (30, 1),
            (31, 1),
            (32, 1),
            (33, 1),
        ]);
        assert_eq!(shanten(&counts).unwrap(), 0);
    }

    #[test]
    fn never_includes_removed_man_tiles_in_effective_tiles() {
        let counts = hand(&[(0, 4), (9, 4), (10, 3), (27, 2)]);
        let (_, effective_tiles) = effective_tiles_for(&counts).unwrap();
        assert!(effective_tiles.iter().all(|tile| !matches!(
            tile.tile.as_str(),
            "2m" | "3m" | "4m" | "5m" | "6m" | "7m" | "8m"
        )));
    }

    #[test]
    fn rejects_five_copies_of_a_tile() {
        let counts = hand(&[(0, 5), (8, 4), (9, 4), (18, 1)]);
        assert!(evaluate_sanma_hand_counts(&counts)
            .unwrap_err()
            .contains("4枚以下"));
    }

    #[test]
    fn calculates_ukeire_for_each_discard() {
        let counts = hand(&[
            (0, 3),
            (8, 2),
            (9, 1),
            (10, 1),
            (11, 1),
            (18, 1),
            (19, 1),
            (20, 1),
            (27, 3),
        ]);
        let result = evaluate_sanma_hand_counts(&counts).unwrap();
        assert!(result.candidates.len() >= 5);
        assert!(result
            .candidates
            .iter()
            .all(|candidate| candidate.total_ukeire
                == candidate
                    .effective_tiles
                    .iter()
                    .map(|tile| tile.remaining)
                    .sum::<u8>()));
    }

    #[test]
    fn prefers_more_ukeire_when_shanten_is_equal() {
        let candidates = vec![
            candidate("1m", 1, 8),
            candidate("9m", 1, 12),
            candidate("1p", 2, 30),
        ];
        assert_eq!(best_discards(&candidates), vec!["9m"]);
    }

    #[test]
    fn returns_all_tied_best_discards() {
        let candidates = vec![
            candidate("1m", 1, 12),
            candidate("9m", 1, 12),
            candidate("1p", 1, 11),
        ];
        assert_eq!(best_discards(&candidates), vec!["1m", "9m"]);
    }
}
