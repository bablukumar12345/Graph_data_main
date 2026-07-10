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

function measureClass(axis, value) {
  const number = Number(value) || 0;
  return ['item-distance', 'bill-distance', axis, number <= 0 ? 'zero' : '', number > 0 && number < 12 ? 'compact' : '']
    .filter(Boolean)
    .join(' ');
}

function itemTop(item, wallHeight) {
  const height = Number(item.height) || 0;
  return item.type === 'door' || item.type === 'sofa'
    ? wallHeight - height
    : Number(item.y) || 0;
}

function itemDistances(item, wallWidth, wallHeight) {
  const width = Number(item.width) || 0;
  const height = Number(item.height) || 0;
  const x = Number(item.x) || 0;
  const top = itemTop(item, wallHeight);
  return {
    left: Math.max(0, x),
    right: Math.max(0, wallWidth - x - width),
    top: Math.max(0, top),
    bottom: Math.max(0, wallHeight - top - height),
    midX: x + width / 2,
    midY: top + height / 2,
    topPosition: top
  };
}

const isSmallWallItem = (item) => (
  item.type === 'molding' && (Number(item.width) < 70 || Number(item.height) < 36)
);

export default function GraphPreview({ roomName, wall, wallIndex }) {
  const wallWidth = Number(wall.width) || 1;
  const wallHeight = Number(wall.height) || 1;
  const items = wall.items || [];

  return (
    <div className="bill-graph-card pdf-page-section">
      <strong>{roomName} - Wall {wallIndex + 1}</strong>
      <div className="bill-stage-wrap">
        <div className="bill-wall-stage" style={{ aspectRatio: `${wallWidth} / ${wallHeight}` }}>
          <div className="graph-watermark">NOIDA DECOR</div>
          <div className="wall-total bill-wall-total width"><span>Width {formatWhole(wallWidth)} inch</span></div>
          <div className="wall-total bill-wall-total height"><span>Height {formatWhole(wallHeight)} inch</span></div>
          {items.map((item) => {
            if (item.type === 'molding') return null;
            const color = COLORS[item.type] || '#7b4b20';
            const width = Number(item.width) || 0;
            const height = Number(item.height) || 0;
            const x = Number(item.x) || 0;
            const d = itemDistances(item, wallWidth, wallHeight);
            return (
              <React.Fragment key={`${item.id}-dist`}>
                <div className={measureClass('horizontal', d.left)} style={{ '--measure-color': color, left: 0, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.left / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.left)}</span>
                </div>
                <div className={measureClass('horizontal', d.right)} style={{ '--measure-color': color, left: `${((x + width) / wallWidth) * 100}%`, top: `${(d.midY / wallHeight) * 100}%`, width: `${(d.right / wallWidth) * 100}%` }}>
                  <span>{formatWhole(d.right)}</span>
                </div>
                <div className={measureClass('vertical', d.top)} style={{ '--measure-color': color, left: `${(d.midX / wallWidth) * 100}%`, top: 0, height: `${(d.top / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.top)}</span>
                </div>
                <div className={measureClass('vertical', d.bottom)} style={{ '--measure-color': color, left: `${(d.midX / wallWidth) * 100}%`, top: `${((d.topPosition + height) / wallHeight) * 100}%`, height: `${(d.bottom / wallHeight) * 100}%` }}>
                  <span>{formatWhole(d.bottom)}</span>
                </div>
              </React.Fragment>
            );
          })}
          {items.map((item) => {
            const width = Number(item.width) || 0;
            const height = Number(item.height) || 0;
            const x = Number(item.x) || 0;
            const top = itemTop(item, wallHeight);
            return (
              <div
                key={item.id}
                className={`graph-item bill-graph-item ${item.type} ${isSmallWallItem(item) ? 'large-visual' : ''}`}
                style={{
                  left: `${(x / wallWidth) * 100}%`,
                  top: `${(top / wallHeight) * 100}%`,
                  width: `${(width / wallWidth) * 100}%`,
                  height: `${(height / wallHeight) * 100}%`,
                  borderColor: COLORS[item.type],
                  background: FILLS[item.type]
                }}
              >
                <span className="item-title">{item.label}</span>
                <b className="item-size item-size-width"><span>{formatWhole(width)}</span></b>
                <b className="item-size item-size-height"><span>{formatWhole(height)}</span></b>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



