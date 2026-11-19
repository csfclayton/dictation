/** Battle App power levels (ATK+DEF+STA+SPD rank → Lv1-10). Auto-synced from arena. */
const LEVELS: Record<string, number> = {"BL-PRD-080626-01":1};

export function battleLevelForBadgeId(id: string): number | undefined {
  if (!id) return undefined;
  if (LEVELS[id] != null) return LEVELS[id];
  const up = id.toUpperCase();
  if (LEVELS[up] != null) return LEVELS[up];
  return undefined;
}

export const BATTLE_BEY_LEVELS = LEVELS;
