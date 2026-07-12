import React, { useEffect, useMemo, useRef, useState } from 'react';
import RoomCard from './components/RoomCard.jsx';
import BillModal from './components/BillModal.jsx';
import { makeRoom, makeWall } from './lib/constants';
import { money, quoteTotals } from './lib/calc';
import {
  clearDraftId,
  getDraftId,
  getHistory,
  getRecentDeleted,
  gsDelete,
  gsLoad,
  gsSave,
  setDraftId,
  setHistory as persistHistory,
  setRecentDeleted
} from './lib/storage';
import { makeId } from './lib/id';
import { cleanNumericInput } from './lib/numberInput';

const makeEmptyRoom = () => {
  const room = makeRoom();
  return {
    ...room,
    walls: room.walls.map((wall) => ({ ...wall, width: 0, height: 0, rate: 0, patternNum: '', items: [] }))
  };
};

const SYNC_INTERVAL_MS = 10000;

const blankQuote = (empty = false) => ({
  id: makeId(),
  name: '',
  phone: '',
  address: '',
  advance: 0,
  rooms: [empty ? makeEmptyRoom() : makeRoom()],
  savedAt: new Date().toISOString()
});

function normalizeQuote(input) {
  const q = input || {};
  const numericValue = (value, fallback) => (
    value === undefined || value === null ? fallback : cleanNumericInput(value)
  );
  const itemLabel = (item) => {
    const label = item.label || item.name || 'Item';
    const type = item.type || item.t;
    return type === 'molding'
      ? label.replace(/^Molding\s+(\d+)$/i, 'Wall $1')
      : label;
  };
  return {
    ...blankQuote(),
    ...q,
    id: q.id || makeId(),
    advance: numericValue(q.advance, 0),
    rooms: (q.rooms?.length ? q.rooms : [makeRoom()]).map((room) => ({
      ...makeRoom(),
      ...room,
      id: room.id || makeId(),
      walls: (room.walls?.length ? room.walls : [makeWall()]).map((wall) => ({
        id: wall.id || makeId(),
        patternNum: wall.patternNum ?? '',
        width: numericValue(wall.width, 350),
        height: numericValue(wall.height, 120),
        rate: numericValue(wall.rate, 0),
        items: Array.isArray(wall.items) ? wall.items.map((item) => ({
          id: item.id || makeId(),
          type: item.type || item.t || 'window',
          label: itemLabel(item),
          width: numericValue(item.width ?? item.w, 0),
          height: numericValue(item.height ?? item.h, 0),
          x: Number(item.x) || 0,
          y: Number(item.y) || 0
        })) : []
      }))
    }))
  };
}

export default function App() {
  const [quote, setQuote] = useState(blankQuote);
  const [history, setHistoryState] = useState([]);
  const [recent, setRecentState] = useState([]);
  const [billOpen, setBillOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmBox, setConfirmBox] = useState(null);
  const [notice, setNotice] = useState('');
  const historyRef = useRef([]);
  const recentRef = useRef([]);
  const totals = useMemo(() => quoteTotals(quote.rooms), [quote.rooms]);
  const balance = totals.amount - (Number(quote.advance) || 0);

  useEffect(() => {
    const localHistory = getHistory().map(normalizeQuote).filter(hasMeaningfulData);
    applyHistory(localHistory);
    const localRecent = getRecentDeleted().map(normalizeQuote).filter(hasMeaningfulData);
    applyRecent(localRecent);
    const draft = localHistory.find((item) => String(item.id) === String(getDraftId()));
    if (draft) setQuote(draft);

    setLoading(true);
    syncFromSheet(localHistory).finally(() => setLoading(false));
    const timer = setInterval(() => syncFromSheet(), SYNC_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const hasData = hasMeaningfulData(quote);
      if (!hasData) return;
      saveQuote(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [quote]);

  function updateQuote(patch) {
    setQuote((current) => ({ ...current, ...patch }));
  }

  function applyHistory(items) {
    const next = items.slice(0, 50);
    historyRef.current = next;
    persistHistory(next);
    setHistoryState(next);
  }

  function applyRecent(items) {
    const next = items.slice(0, 50);
    recentRef.current = next;
    setRecentDeleted(next);
    setRecentState(next);
  }

  function mergeSheetHistory(sheetItems, baseHistory = historyRef.current) {
    const normalizedSheets = sheetItems.map(normalizeQuote).filter(hasMeaningfulData);
    return [...normalizedSheets, ...baseHistory.filter((local) => !normalizedSheets.some((sheet) => sheet.id === local.id))]
      .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }

  async function syncFromSheet(baseHistory = historyRef.current) {
    const sheetItems = await gsLoad();
    if (!sheetItems.length) return;
    applyHistory(mergeSheetHistory(sheetItems, baseHistory));
  }

  function hasMeaningfulData(data) {
    return Boolean(
      data.name ||
      data.phone ||
      data.address ||
      Number(data.advance) ||
      data.rooms.some((room) => room.walls?.some((wall) => wall.patternNum || Number(wall.rate) || (wall.items || []).length))
    );
  }

  function askConfirm(message, onOk) {
    setConfirmBox({ message, onOk });
  }

  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(''), 2200);
  }

  async function saveQuote(showMessage = true) {
    if (!hasMeaningfulData(quote)) {
      if (showMessage) showNotice('Pehle customer ya wall data fill karo.');
      return;
    }
    const saved = { ...quote, grandTotal: totals.amount, savedAt: new Date().toISOString() };
    const nextHistory = [saved, ...historyRef.current.filter((item) => item.id !== saved.id)];
    applyHistory(nextHistory);
    setDraftId(saved.id);
    const synced = await gsSave(saved);
    if (showMessage) showNotice(synced ? 'Quote saved successfully!' : 'Local save ho gaya, Google Sheet sync fail. Internet check karo.');
  }

  function loadQuote(item) {
    setQuote(item);
    setDraftId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearAll() {
    askConfirm('Clear all fields?', () => {
      clearDraftId();
      setQuote(blankQuote(true));
    });
  }

  function softDelete(id) {
    const item = history.find((q) => q.id === id);
    if (!item) return;
    askConfirm(`"${item.name || 'No Name'}" Remove from history ? It will remain in Recents.`, () => {
      const nextHistory = history.filter((q) => q.id !== id);
      const nextRecent = [{ ...item, deletedAt: new Date().toISOString() }, ...recent.filter((q) => q.id !== id)];
      applyHistory(nextHistory);
      applyRecent(nextRecent);
      if (quote.id === id) {
        clearDraftId();
        setQuote(blankQuote(true));
      }
    });
  }

  function restoreDeleted(id) {
    const item = recent.find((q) => q.id === id);
    if (!item) return;
    const restored = { ...item, savedAt: new Date().toISOString() };
    delete restored.deletedAt;
    const nextHistory = [restored, ...history.filter((q) => q.id !== id)];
    const nextRecent = recent.filter((q) => q.id !== id);
    applyHistory(nextHistory);
    applyRecent(nextRecent);
  }

  async function permanentDelete(id) {
    const item = recent.find((q) => q.id === id);
    if (!item) return;
    askConfirm(`"${item.name || 'No Name'}" Permanently delete?`, async () => {
      const nextRecent = recent.filter((q) => q.id !== id);
      applyRecent(nextRecent);
      const deleted = await gsDelete(id);
      if (!deleted) showNotice('Local delete ho gaya, Google Sheet delete fail. Internet check karo.');
    });
  }

  return (
    <>
      {loading && <div className="loading">Loading data...</div>}
      {notice && <div className="toast">{notice}</div>}
      <header>
        <div className="brand">
          <img src="/img/logo.png" alt="Noida Decor" />
          <strong>Noida Decor</strong>
        </div>
        <span>{new Date().toLocaleDateString('en-IN')}</span>
      </header>

      <main className="page">
        <section className="card">
          <h2>Customer Details</h2>
          <div className="customer-grid">
            <label>Customer Name<input value={quote.name} placeholder="Full name" onChange={(e) => updateQuote({ name: e.target.value })} /></label>
            <label>Phone Number<input value={quote.phone} placeholder="+91 00000 00000" onChange={(e) => updateQuote({ phone: e.target.value })} /></label>
            <label>Address<input value={quote.address} placeholder="House no, Street, City" onChange={(e) => updateQuote({ address: e.target.value })} /></label>
          </div>
        </section>

        {quote.rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            onChange={(nextRoom) => updateQuote({ rooms: quote.rooms.map((r) => r.id === room.id ? nextRoom : r) })}
            canDelete={index > 0}
            onDelete={() => updateQuote({ rooms: quote.rooms.filter((r) => r.id !== room.id) })}
          />
        ))}

        <button className="add-room-btn" type="button" onClick={() => updateQuote({ rooms: [...quote.rooms, makeRoom()] })}><span>+</span>Add New Room</button>

        <section className="card">
          <h2>Bill Summary</h2>
          {quote.rooms.map((room) => {
            const rt = quoteTotals([room]);
            return <div className="summary-room" key={room.id}><span>{room.category} - {Math.trunc(rt.sqft)} sq ft</span><b>{money(rt.amount)}</b></div>;
          })}
          <div className="summary-total"><span>Total Area</span><b>{Math.trunc(totals.sqft)} sq ft</b></div>
          <div className="summary-total grand"><span>Grand Total</span><b>{money(totals.amount)}</b></div>
          <div className="advance-box">
            <label>Advance Paid<input type="text" inputMode="decimal" value={quote.advance} onChange={(e) => updateQuote({ advance: cleanNumericInput(e.target.value) })} /></label>
            <div><span>{balance < 0 ? 'Overpaid' : 'Balance Due'}</span><b>{money(Math.abs(balance))}</b></div>
          </div>
        </section>

        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={() => saveQuote(true)}>Save Quote</button>
          <button className="btn btn-outline" type="button" onClick={() => setBillOpen(true)}>Preview Bill</button>
          <button className="btn btn-ghost" type="button" onClick={clearAll}>Clear All</button>
        </div>

        <details className="card history-dropdown">
          <summary>Quote History ({history.length})</summary>
          {!history.length && <p className="empty">No saved quotes yet.</p>}
          {history.map((item) => (
            <div className="history-item" key={item.id}>
              <div><strong>{item.name || 'No Name'}</strong><small>{new Date(item.savedAt).toLocaleString('en-IN')} | {item.rooms?.length || 0} room(s)</small></div>
              <b>{money(item.grandTotal || quoteTotals(item.rooms).amount)}</b>
              <button type="button" onClick={() => loadQuote(item)}>Load</button>
              <button type="button" onClick={() => softDelete(item.id)}>Delete</button>
            </div>
          ))}
        </details>

        <details className="card history-dropdown">
          <summary>Recent Deleted ({recent.length})</summary>
          {!recent.length && <p className="empty">Deleted quotes appear here. Delete them here to remove them permanently.</p>}
          {recent.map((item) => (
            <div className="history-item" key={item.id}>
              <div><strong>{item.name || 'No Name'}</strong><small>Deleted: {new Date(item.deletedAt).toLocaleString('en-IN')}</small></div>
              <button type="button" onClick={() => restoreDeleted(item.id)}>Restore</button>
              <button type="button" onClick={() => permanentDelete(item.id)}>Delete Forever</button>
            </div>
          ))}
        </details>
      </main>

      {billOpen && <BillModal data={quote} onClose={() => setBillOpen(false)} />}
      {confirmBox && (
        <div className="confirm-modal">
          <div className="confirm-panel">
            <p>{confirmBox.message}</p>
            <div>
              <button type="button" onClick={() => setConfirmBox(null)}>Cancel</button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmBox.onOk;
                  setConfirmBox(null);
                  await action();
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
