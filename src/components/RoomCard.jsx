import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { CUSTOM_PAPER, CUSTOM_ROOM, PAPERS, ROOM_TYPES, WALLPAPER_OPTIONS, makeWall } from '../lib/constants';
import { formatWhole, isWallpaperRoom, money, roomTotals, wallAmount, wallSqft } from '../lib/calc';
import WallGraph from './WallGraph.jsx';
import { cleanNumericInput } from '../lib/numberInput';

export default function RoomCard({ room, index, onChange, canDelete = false, onDelete }) {
  const walls = room.walls?.length ? room.walls : [];
  const totals = roomTotals(room);
  const isWallpaper = isWallpaperRoom(room);

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
        {room.category === CUSTOM_ROOM && (
          <label className="custom-room-name">
            Custom room name
            <input
              type="text"
              value={room.customName || ''}
              placeholder="Enter room name"
              onChange={(e) => updateRoom({ customName: e.target.value })}
            />
          </label>
        )}
        <div className="room-section-label paper-label">Paper Quality</div>
        <div className="room-select-row paper-select-row">
          <div className="room-num">2</div>
          <Dropdown value={room.roomPaper} options={PAPERS} onChange={(e) => updateRoom({ roomPaper: e.value })} className="prime-dropdown paper-dropdown" />
        </div>
        {room.roomPaper === CUSTOM_PAPER && (
          <label className="custom-room-name">
            Custom paper quality
            <input
              type="text"
              value={room.customPaperName || ''}
              placeholder="Enter paper quality"
              onChange={(e) => updateRoom({ customPaperName: e.target.value })}
            />
          </label>
        )}
        <div className="room-section-label paper-label">Wallpaper</div>
        <div className="room-select-row paper-select-row">
          <div className="room-num">3</div>
          <Dropdown value={room.wallpaperOption || 'None'} options={WALLPAPER_OPTIONS} onChange={(e) => updateRoom({ wallpaperOption: e.value })} className="prime-dropdown paper-dropdown" />
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
                <button className="wall-delete" type="button" onClick={() => deleteWall(wall.id)}>x</button>
              </div>
            </div>
            <label className="pattern-field">Pattern Number<input type="text" placeholder="e.g. WP-2024" value={wall.patternNum} onChange={(e) => updateWall(wall.id, { ...wall, patternNum: e.target.value })} /></label>
            {isWallpaper ? (
              <>
                <div className="room-section-label paper-label">Wallpaper Details</div>
                <div className="wall-input-grid">
                  <label>Quantity
                    <input
                      type="text"
                      inputMode="numeric"
                      value={wall.rollCount}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                      onChange={(e) => updateWall(wall.id, { ...wall, rollCount: cleanNumericInput(e.target.value) })}
                    />
                  </label>
                  <label>Price per Roll
                    <input
                      type="text"
                      inputMode="decimal"
                      value={wall.rollPrice}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => (e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.preventDefault()}
                      onChange={(e) => updateWall(wall.id, { ...wall, rollPrice: cleanNumericInput(e.target.value) })}
                    />
                  </label>
                </div>
                <div className="rate-row">
                  <label>Total</label>
                  <strong>{money(wallAmount(wall, true))}</strong>
                </div>
              </>
            ) : (
              <>
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
                  <strong>{money(wallAmount(wall, false))}</strong>
                </div>
                <div className="sqft-pill">{formatWhole(wallSqft(wall, false))} sq ft</div>
              </>
            )}
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
