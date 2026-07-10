import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { PAPERS, ROOM_TYPES, makeWall } from '../lib/constants';
import { formatWhole, money, roomTotals, wallAmount, wallSqft } from '../lib/calc';
import WallGraph from './WallGraph.jsx';
import { cleanNumericInput } from '../lib/numberInput';

export default function RoomCard({ room, index, onChange, canDelete = false, onDelete }) {
  const walls = room.walls?.length ? room.walls : [];
  const totals = roomTotals(room);

  function updateRoom(patch) {
    onChange({ ...room, ...patch });
  }

  function updateWall(id, nextWall) {
    updateRoom({ walls: walls.map((wall) => wall.id === id ? nextWall : wall) });
  }

  function addWall() {
    updateRoom({ walls: [...walls, makeWall()] });
  }

  function deleteWall(id) {
    if (walls.length <= 1) return;
    updateRoom({ walls: walls.filter((wall) => wall.id !== id) });
  }

  return (
    <section className="room-block">
      <div className="room-head">
        <div className="wall-title-row">
          <div className="room-section-label">Room Details</div>
          {canDelete && <button className="wall-delete" type="button" onClick={onDelete}>x</button>}
        </div>
        <div className="room-select-row">
          <div className="room-num">{index + 1}</div>
          <Dropdown value={room.category} options={ROOM_TYPES} onChange={(e) => updateRoom({ category: e.value })} className="prime-dropdown" />
        </div>
        <div className="room-section-label paper-label">Paper Quality</div>
        <div className="room-select-row paper-select-row">
          <div className="room-num">2</div>
          <Dropdown value={room.roomPaper} options={PAPERS} onChange={(e) => updateRoom({ roomPaper: e.value })} className="prime-dropdown paper-dropdown" />
        </div>
      </div>

      <div className="room-body">
        {walls.length === 0 && (
          <div className="wall-card">
            <button className="add-wall-inline" type="button" onClick={addWall}>+ Add Wall</button>
          </div>
        )}
        {walls.map((wall, wallIndex) => (
          <div className="wall-card" key={wall.id}>
            <div className="wall-title-row">
              <div className="wall-badge">Wall {wallIndex + 1}</div>
              <div className="wall-title-actions">
                <button className="add-wall-inline" type="button" onClick={addWall}>+ Add Wall</button>
                {wallIndex > 0 && <button className="wall-delete" type="button" onClick={() => deleteWall(wall.id)}>x</button>}
              </div>
            </div>
            <label className="pattern-field">Pattern Number<input type="text" placeholder="e.g. WP-2024" value={wall.patternNum} onChange={(e) => updateWall(wall.id, { ...wall, patternNum: e.target.value })} /></label>
            <WallGraph wall={wall} onChange={(next) => updateWall(wall.id, next)} />
            <div className="rate-row">
              <label>Rate (Rs./sq ft)</label>
              <input
                type="text"
                inputMode="decimal"
                value={wall.rate}
                onWheel={(e) => e.currentTarget.blur()}
                onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                onChange={(e) => updateWall(wall.id, { ...wall, rate: cleanNumericInput(e.target.value) })}
              />
              <strong>{money(wallAmount(wall))}</strong>
            </div>
            <div className="sqft-pill">{formatWhole(wallSqft(wall))} sq ft</div>
          </div>
        ))}

        <div className="room-footer">
          <div><span>Room Total</span><strong>{money(totals.amount)}</strong></div>
          <div><span>Total Area</span><strong>{formatWhole(totals.sqft)} sq ft</strong></div>
        </div>
      </div>
    </section>
  );
}


