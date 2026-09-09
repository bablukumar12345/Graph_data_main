import React, { useEffect, useMemo, useRef, useState } from 'react';
import { makeId } from '../lib/id';
import { cleanNumericInput } from '../lib/numberInput';
import { formatMax2, formatWhole } from '../lib/calc';

const DEFAULTS = {
  door: { type: 'door', label: 'Door', width: 36, height: 84, x: 24, y: 0 },
  window: { type: 'window', label: 'Window', width: 48, height: 36, x: 120, y: 24 },
  ac: { type: 'ac', label: 'AC', width: 34, height: 12, x: 90, y: 12 },
  sofa: { type: 'sofa', label: 'Sofa', width: 84, height: 36, x: 80, y: 0 },
  bed: { type: 'bed', label: 'Bed', width: 78, height: 72, x: 130, y: 48 },
  molding: { type: 'molding', label: 'Wall 1', width: 18, height: 60, x: 40, y: 36 }
};

const colors = {
  door: '#7b4b20',
  window: '#0879d6',
  ac: '#6f7d8c',
  sofa: '#b33a5e',
  bed: '#7952b3',
  molding: '#0f766e'
};

const fills = {
  door: '#c99765',
  window: '#bfe7ff',
  ac: '#f8fbff',
  sofa: '#ffd1dd',
  bed: '#ddd6fe',
  molding: '#ccfbf1'
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundState = (value) => Number(formatMax2(value));
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function measureClass(axis, value) {
  const number = Number(value) || 0;
  return ['item-distance', axis, number <= 0 ? 'zero' : '', number > 0 && number < 12 ? 'compact' : '']
    .filter(Boolean)
    .join(' ');
}

const isSmallWallItem = (item) => (
  item.type === 'molding' && (Number(item.width) < 70 || Number(item.height) < 36)
);

export default function WallGraph({ wall, onChange }) {
  const stageRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [resize, setResize] = useState(null);
  const items = wall.items || [];
  const selected = items.find((item) => item.id === selectedId);
  const wallWidth = Number(wall.width) || 1;
  const wallHeight = Number(wall.height) || 1;

  const gridStyle = useMemo(() => ({
    aspectRatio: `${wallWidth} / ${wallHeight}`,
    '--grid-x': `${Math.max(18, (12 / wallWidth) * 100)}%`,
    '--grid-y': `${Math.max(18, (12 / wallHeight) * 100)}%`
  }), [wallWidth, wallHeight]);

  useEffect(() => {
    if (selectedId && !items.some((item) => item.id === selectedId)) setSelectedId(null);
  }, [selectedId, items]);

  function updateWall(next) {
    const merged = { ...wall, ...next };
    if (hasOwn(next, 'width') || hasOwn(next, 'height')) {
      const nextWidth = Number(merged.width);
      const nextHeight = Number(merged.height);
      if (nextWidth > 0 && nextHeight > 0) {
        const bounds = { width: nextWidth, height: nextHeight };
        merged.items = (merged.items || items).map((item) => normalizeItem(item, {}, bounds));
      }
    }
    onChange(merged);
  }

  function updateItem(id, patch) {
    updateWall({
      items: items.map((item) => item.id === id ? normalizeItem(item, patch) : item)
    });
  }

  function normalizeItem(item, patch = {}, bounds = { width: wallWidth, height: wallHeight }) {
    const next = { ...item, ...patch };
    const maxWallWidth = Number(bounds.width) || 1;
    const maxWallHeight = Number(bounds.height) || 1;
    const floorItem = next.type === 'door' || next.type === 'sofa';
    const xEdited = hasOwn(patch, 'x');
    const yEdited = hasOwn(patch, 'y');
    const currentX = Number(item.x) || 0;
    const currentY = Number(item.y) || 0;
    let x = xEdited ? Number(next.x) || 0 : currentX;
    let y = floorItem ? 0 : yEdited ? Number(next.y) || 0 : currentY;

    x = clamp(x, 0, maxWallWidth);
    y = floorItem ? 0 : clamp(y, 0, maxWallHeight);

    let widthValue = cleanNumericInput(next.width);
    let heightValue = cleanNumericInput(next.height);
    let width = Number(widthValue) || 0;
    let height = Number(heightValue) || 0;

    const maxWidth = Math.max(0, maxWallWidth - x);
    const maxHeight = floorItem ? maxWallHeight : Math.max(0, maxWallHeight - y);

    if (width > maxWidth) {
      width = maxWidth;
      widthValue = formatMax2(width);
    }
    if (height > maxHeight) {
      height = maxHeight;
      heightValue = formatMax2(height);
    }

    return { ...next, width: widthValue, height: heightValue, x: roundState(x), y: roundState(y) };
  }

  function itemTop(item) {
    const height = Number(item.height) || 0;
    return item.type === 'door' || item.type === 'sofa'
      ? wallHeight - height
      : Number(item.y) || 0;
  }

  function selectedDistances() {
    if (!selected) return null;
    const width = Number(selected.width) || 0;
    const height = Number(selected.height) || 0;
    const x = Number(selected.x) || 0;
    const top = itemTop(selected);
    const bottom = wallHeight - top - height;
    return {
      left: Math.max(0, x),
      right: Math.max(0, wallWidth - x - width),
      top: Math.max(0, top),
      bottom: Math.max(0, bottom),
      itemTop: top,
      midY: top + height / 2,
      midX: x + width / 2
    };
  }

  function addItem(type) {
    const base = DEFAULTS[type];
    const label = type === 'molding'
      ? `Wall ${items.filter((item) => item.type === 'molding').length + 1}`
      : base.label;
    const item = normalizeItem({ ...base, label, id: makeId() });
    updateWall({ items: [...items, item] });
    setSelectedId(item.id);
  }

  function deleteSelected() {
    if (!selectedId) return;
    updateWall({ items: items.filter((item) => item.id !== selectedId) });
    setSelectedId(null);
  }

  function pointerToInches(event) {
    const rect = stageRef.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * wallWidth,
      yFromTop: ((event.clientY - rect.top) / rect.height) * wallHeight
    };
  }

  function onPointerMove(event) {
    if (resize) {
      const p = pointerToInches(event);
      const item = items.find((current) => current.id === resize.id);
      if (!item) return;
      const patch = {};
      const itemX = Number(item.x) || 0;
      const itemY = Number(item.y) || 0;
      const itemHeight = Number(item.height) || 0;

      if (resize.mode === 'right' || resize.mode === 'corner') {
        patch.width = roundState(Math.max(0, p.x - itemX));
      }
      if (resize.mode === 'top' || resize.mode === 'corner') {
        if (item.type === 'door' || item.type === 'sofa') {
          patch.height = roundState(Math.max(0, wallHeight - p.yFromTop));
        } else {
          const bottom = itemY + itemHeight;
          const nextTop = clamp(p.yFromTop, 0, bottom);
          patch.y = roundState(nextTop);
          patch.height = roundState(Math.max(0, bottom - nextTop));
        }
      }
      updateItem(resize.id, patch);
      return;
    }
    if (!drag) return;
    const p = pointerToInches(event);
    updateItem(drag.id, {
      x: roundState(p.x - drag.offsetX),
      y: roundState(p.yFromTop - drag.offsetY)
    });
  }

  function startDrag(event, item) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = pointerToInches(event);
    setSelectedId(item.id);
    setDrag({ id: item.id, offsetX: p.x - (Number(item.x) || 0), offsetY: p.yFromTop - itemTop(item) });
  }

  function startResize(event, item, mode) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
    setResize({ id: item.id, mode });
  }

  return (
    <div className="graph-box">
      <div className="wall-input-grid">
        <label>Main Wall Height inch<input type="text" inputMode="decimal" value={wall.height} onChange={(e) => updateWall({ height: cleanNumericInput(e.target.value) })} /></label>
        <label>Main Wall Width inch<input type="text" inputMode="decimal" value={wall.width} onChange={(e) => updateWall({ width: cleanNumericInput(e.target.value) })} /></label>
      </div>

      <div className="wall-stage-wrap">
        <div className="wall-stage" ref={stageRef} style={gridStyle} onPointerMove={onPointerMove} onPointerUp={() => { setDrag(null); setResize(null); }} onPointerCancel={() => { setDrag(null); setResize(null); }} onClick={() => setSelectedId(null)}>
          <div className="wall-total width"><span>Width {formatWhole(wallWidth)} inch</span></div>
          <div className="wall-total height"><span>Height {formatWhole(wallHeight)} inch</span></div>
          {selected && selected.type !== 'molding' && (() => {
            const d = selectedDistances();
            const selectedWidth = Number(selected.width) || 0;
            const selectedHeight = Number(selected.height) || 0;
            const selectedX = Number(selected.x) || 0;
            const measureColor = colors[selected.type] || '#7b4b20';
            return (
              <>
                <div className={measureClass('horizontal', d.left)} style={{ '--measure-color': measureColor, left: 0, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.left / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.left)}</span>
                </div>
                <div className={measureClass('horizontal', d.right)} style={{ '--measure-color': measureColor, left: `${((selectedX + selectedWidth) / wallWidth) * 100}%`, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.right / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.right)}</span>
                </div>
                <div className={measureClass('vertical', d.top)} style={{ '--measure-color': measureColor, left: `${(d.midX / wallWidth) * 100}%`, top: 0, height: `${(d.top / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.top)}</span>
                </div>
                <div className={measureClass('vertical', d.bottom)} style={{ '--measure-color': measureColor, left: `${(d.midX / wallWidth) * 100}%`, top: `${((d.itemTop + selectedHeight) / wallHeight) * 100}%`, height: `${(d.bottom / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.bottom)}</span>
                </div>
              </>
            );
          })()}
          {items.map((item) => {
            const width = Number(item.width) || 0;
            const height = Number(item.height) || 0;
            const x = Number(item.x) || 0;
            const left = `${(x / wallWidth) * 100}%`;
            const itemWidth = `${(width / wallWidth) * 100}%`;
            const itemHeight = `${(height / wallHeight) * 100}%`;
            const topValue = `${(itemTop(item) / wallHeight) * 100}%`;
            return (
              <div
                key={item.id}
                className={`graph-item ${item.type} ${isSmallWallItem(item) ? 'large-visual' : ''} ${item.id === selectedId ? 'selected' : ''}`}
                style={{ left, top: topValue, width: itemWidth, height: itemHeight, borderColor: colors[item.type], background: fills[item.type], '--item-color': colors[item.type] }}
                onPointerDown={(e) => startDrag(e, item)}
                onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
              >
                <span className="item-title">{item.label}</span>
                <b className="item-size item-size-width"><span>{formatWhole(width)}</span></b>
                <b className="item-size item-size-height"><span>{formatWhole(height)}</span></b>
                {item.id === selectedId && (
                  <>
                    <i className="resize-handle resize-right" onPointerDown={(e) => startResize(e, item, 'right')} />
                    <i className="resize-handle resize-top" onPointerDown={(e) => startResize(e, item, 'top')} />
                    <i className="resize-handle resize-corner" onPointerDown={(e) => startResize(e, item, 'corner')} />
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="measure-note">All measurements in inch</div>
      </div>

      <div className="graph-tools">
        <button type="button" onClick={() => addItem('door')}>Door</button>
        <button type="button" onClick={() => addItem('window')}>Window</button>
        <button type="button" onClick={() => addItem('ac')}>AC</button>
        <button type="button" onClick={() => addItem('sofa')}>Sofa</button>
        <button type="button" onClick={() => addItem('bed')}>Bed</button>
        <button type="button" onClick={() => addItem('molding')}>Moldings</button>
      </div>

      <div className="graph-panel">
        <label>Selected<input readOnly value={selected?.label || ''} placeholder="Item select karo" /></label>
        <div className="wall-input-grid">
          <label>Item Height inch<input type="text" inputMode="decimal" value={selected ? formatWhole(selected.height) : ''} onFocus={(e) => e.target.select()} onChange={(e) => selected && updateItem(selected.id, { height: cleanNumericInput(e.target.value) })} /></label>
          <label>Item Width inch<input type="text" inputMode="decimal" value={selected ? formatWhole(selected.width) : ''} onFocus={(e) => e.target.select()} onChange={(e) => selected && updateItem(selected.id, { width: cleanNumericInput(e.target.value) })} /></label>
        </div>
        <button className="delete-selected" type="button" disabled={!selected} onClick={deleteSelected}>Delete selected item</button>
      </div>
    </div>
  );
}



