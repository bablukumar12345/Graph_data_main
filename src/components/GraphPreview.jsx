import React from 'react';
import { formatWhole } from '../lib/calc';

const COLORS = {
  door: '#7b4b20',
  window: '#0879d6',
  ac: '#6f7d8c',
  sofa: '#b33a5e',
  bed: '#7952b3',
  molding: '#0f766e'
};

const FILLS = {
  door: '#c99765',
  window: '#bfe7ff',
  ac: '#f8fbff',
  sofa: '#ffd1dd',
  bed: '#ddd6fe',
  molding: '#ccfbf1'
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function measureClass(axis, value) {
  const number = Number(value) || 0;
  return ['item-distance', 'bill-distance', axis, number <= 0 ? 'zero' : '', number > 0 && number < 12 ? 'compact' : '']
    .filter(Boolean)
    .join(' ');
}

function normalizePreviewItem(item, wallWidth, wallHeight) {
  const rawWidth = Math.max(0, Number(item.width) || 0);
  const rawHeight = Math.max(0, Number(item.height) || 0);
  const width = Math.min(rawWidth, wallWidth);
  const height = Math.min(rawHeight, wallHeight);
  const maxX = Math.max(0, wallWidth - width);
  const floorItem = item.type === 'door' || item.type === 'sofa';
  const x = clamp(Number(item.x) || 0, 0, maxX);
  const top = floorItem
    ? Math.max(0, wallHeight - height)
    : clamp(Number(item.y) || 0, 0, Math.max(0, wallHeight - height));

  return { ...item, width, height, x, top };
}

function itemDistances(item, wallWidth, wallHeight) {
  return {
    left: Math.max(0, item.x),
    right: Math.max(0, wallWidth - item.x - item.width),
    top: Math.max(0, item.top),
    bottom: Math.max(0, wallHeight - item.top - item.height),
    midX: item.x + item.width / 2,
    midY: item.top + item.height / 2,
    topPosition: item.top
  };
}

export default function GraphPreview({ roomName, wall, wallIndex }) {
  const wallWidth = Number(wall.width) || 1;
  const wallHeight = Number(wall.height) || 1;
  const items = (wall.items || []).map((item) => normalizePreviewItem(item, wallWidth, wallHeight));

  return (
    <div className="bill-graph-card pdf-page-section">
      <strong>{roomName} - Wall {wallIndex + 1}</strong>
      <div className="bill-stage-wrap">
        <div className="bill-wall-stage" style={{ aspectRatio: `${wallWidth} / ${wallHeight}` }}>
          <div className="graph-watermark">ODO WALLS</div>
          <div className="wall-total bill-wall-total width"><span>Width {formatWhole(wallWidth)} inch</span></div>
          <div className="wall-total bill-wall-total height"><span>Height {formatWhole(wallHeight)} inch</span></div>
          {items.map((item) => {
            if (item.type === 'molding') return null;
            const color = COLORS[item.type] || '#7b4b20';
            const d = itemDistances(item, wallWidth, wallHeight);
            return (
              <React.Fragment key={`${item.id}-dist`}>
                <div className={measureClass('horizontal', d.left)} style={{ '--measure-color': color, left: 0, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.left / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.left)}</span>
                </div>
                <div className={measureClass('horizontal', d.right)} style={{ '--measure-color': color, left: `${((item.x + item.width) / wallWidth) * 100}%`, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.right / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.right)}</span>
                </div>
                <div className={measureClass('vertical', d.top)} style={{ '--measure-color': color, left: `${(d.midX / wallWidth) * 100}%`, top: 0, height: `${(d.top / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.top)}</span>
                </div>
                <div className={measureClass('vertical', d.bottom)} style={{ '--measure-color': color, left: `${(d.midX / wallWidth) * 100}%`, top: `${((d.topPosition + item.height) / wallHeight) * 100}%`, height: `${(d.bottom / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.bottom)}</span>
                </div>
              </React.Fragment>
            );
          })}
          {items.map((item) => (
            <div
              key={item.id}
              className={`graph-item bill-graph-item ${item.type}`}
              style={{
                left: `${(item.x / wallWidth) * 100}%`,
                top: `${(item.top / wallHeight) * 100}%`,
                width: `${(item.width / wallWidth) * 100}%`,
                height: `${(item.height / wallHeight) * 100}%`,
                borderColor: COLORS[item.type],
                background: FILLS[item.type]
              }}
            >
              <span className="item-title">{item.label}</span>
              <b className="item-size item-size-width"><span>{formatWhole(item.width)}</span></b>
              <b className="item-size item-size-height"><span>{formatWhole(item.height)}</span></b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
