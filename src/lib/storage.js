import { GS_URL } from './constants';

const HISTORY_KEY = 'noida_decor_quote_history_v3';
const RECENT_KEY = 'noida_decor_quote_recent_deleted_v3';
const DRAFT_KEY = 'noida_decor_current_draft_v3';

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

export const getHistory = () => read(HISTORY_KEY);
export const setHistory = (items) => write(HISTORY_KEY, items.slice(0, 50));
export const getRecentDeleted = () => read(RECENT_KEY);
export const setRecentDeleted = (items) => write(RECENT_KEY, items.slice(0, 50));
export const getDraftId = () => localStorage.getItem(DRAFT_KEY);
export const setDraftId = (id) => localStorage.setItem(DRAFT_KEY, id);
export const clearDraftId = () => localStorage.removeItem(DRAFT_KEY);

export async function gsSave(quote) {
  try {
    await fetch(GS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'save', quote }),
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (err) {
    console.log('Google Sheets save failed, local copy remains.', err);
  }
}

export async function gsDelete(id) {
  try {
    await fetch(GS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
      headers: { 'Content-Type': 'text/plain' }
    });
  } catch (err) {
    console.log('Google Sheets delete failed.', err);
  }
}

export async function gsLoad() {
  try {
    const res = await fetch(`${GS_URL}?t=${Date.now()}`);
    const data = await res.json();
    return data.quotes || [];
  } catch (err) {
    console.log('Google Sheets load failed, using local data.', err);
    return [];
  }
}
