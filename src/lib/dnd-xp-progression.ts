// D&D 5e Experience Points Progression Table
export const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

// Calculate XP needed for next level
export const getXPForLevel = (level: number): number => {
  if (level >= 20) return 0;
  return XP_TABLE[level + 1] || 0;
};

// Calculate current level based on total XP
export const getLevelFromXP = (xp: number): number => {
  let level = 1;
  for (let i = 2; i <= 20; i++) {
    if (xp >= XP_TABLE[i]) {
      level = i;
    } else {
      break;
    }
  }
  return level;
};

// Calculate XP to next level
export const getXPToNextLevel = (currentXP: number, currentLevel: number): number => {
  if (currentLevel >= 20) return 0;
  const nextLevelXP = XP_TABLE[currentLevel + 1];
  return nextLevelXP - currentXP;
};

// Calculate XP progress percentage
export const getXPProgressPercentage = (currentXP: number, currentLevel: number): number => {
  if (currentLevel >= 20) return 100;
  
  const currentLevelXP = XP_TABLE[currentLevel];
  const nextLevelXP = XP_TABLE[currentLevel + 1];
  const xpIntoLevel = currentXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  
  return Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));
};

// Suggested XP rewards based on encounter difficulty
export const XP_REWARDS = {
  trivial: { min: 10, max: 25 },
  easy: { min: 25, max: 50 },
  medium: { min: 50, max: 100 },
  hard: { min: 100, max: 200 },
  deadly: { min: 200, max: 400 },
  story: { min: 50, max: 150 }, // For roleplay, puzzle solving, etc.
};
