export function formatMax2(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return Number(number.toFixed(2)).toString();
}

export function formatWhole(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return String(Math.round(number));
}

export const money = (value) => `Rs. ${formatWhole(value)}`;

function itemSqft(item) {
  return ((Number(item.width) || 0) * (Number(item.height) || 0)) / 144;
}

export function isWallpaperRoom(room) {
  return room?.wallpaperOption === 'Wallpaper';
}

export function wallRollAmount(wall) {
  return (Number(wall.rollCount) || 0) * (Number(wall.rollPrice) || 0);
}

export function wallSqft(wall, isWallpaper) {
  if (isWallpaper) return 0;

  const items = wall.items || [];
  const moldingArea = items
    .filter((item) => item.type === 'molding')
    .reduce((sum, item) => sum + itemSqft(item), 0);

  if (moldingArea > 0) return moldingArea;

  const base = ((Number(wall.width) || 0) * (Number(wall.height) || 0)) / 144;
  const minus = items
    .filter((item) => item.type === 'door' || item.type === 'window')
    .reduce((sum, item) => sum + itemSqft(item), 0);
  return Math.max(0, base - minus);
}

export function billableWallSqft(wall, isWallpaper) {
  return Math.round(wallSqft(wall, isWallpaper));
}

export function wallAmount(wall, isWallpaper) {
  if (isWallpaper) return wallRollAmount(wall);
  return billableWallSqft(wall) * (Number(wall.rate) || 0);
}

export function roomTotals(room) {
  const isWallpaper = isWallpaperRoom(room);
  return (room.walls || []).reduce(
    (total, wall) => ({
      sqft: total.sqft + billableWallSqft(wall, isWallpaper),
      amount: total.amount + wallAmount(wall, isWallpaper)
    }),
    { sqft: 0, amount: 0 }
  );
}

export function quoteTotals(rooms) {
  return (rooms || []).reduce(
    (total, room) => {
      const rt = roomTotals(room);
      return { sqft: total.sqft + rt.sqft, amount: total.amount + rt.amount };
    },
    { sqft: 0, amount: 0 }
  );
}
