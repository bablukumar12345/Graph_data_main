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

export function wallSqft(wall) {
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

export function billableWallSqft(wall) {
  return Math.round(wallSqft(wall));
}

export function wallAmount(wall) {
  return billableWallSqft(wall) * (Number(wall.rate) || 0);
}

export function roomTotals(room) {
  return (room.walls || []).reduce(
    (total, wall) => ({
      sqft: total.sqft + billableWallSqft(wall),
      amount: total.amount + wallAmount(wall)
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
