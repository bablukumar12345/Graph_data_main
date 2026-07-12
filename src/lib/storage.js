<<<<<<< HEAD
﻿import { GS_URL } from './constants';
=======
import { GS_URL } from './constants';
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a

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

<<<<<<< HEAD
async function parseSheetResponse(res) {
  if (!res.ok) throw new Error(`Google Sheets request failed (${res.status})`);
  return res.json();
}

export async function gsSave(quote) {
  try {
    const res = await fetch(GS_URL, {
=======
export async function gsSave(quote) {
  try {
    await fetch(GS_URL, {
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a
      method: 'POST',
      body: JSON.stringify({ action: 'save', quote }),
      headers: { 'Content-Type': 'text/plain' }
    });
<<<<<<< HEAD
    if (!res.ok) throw new Error(`Google Sheets save failed (${res.status})`);
    return true;
  } catch (err) {
    console.log('Google Sheets save failed, local copy remains.', err);
    return false;
=======
  } catch (err) {
    console.log('Google Sheets save failed, local copy remains.', err);
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a
  }
}

export async function gsDelete(id) {
  try {
<<<<<<< HEAD
    const res = await fetch(GS_URL, {
=======
    await fetch(GS_URL, {
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id }),
      headers: { 'Content-Type': 'text/plain' }
    });
<<<<<<< HEAD
    if (!res.ok) throw new Error(`Google Sheets delete failed (${res.status})`);
    return true;
  } catch (err) {
    console.log('Google Sheets delete failed.', err);
    return false;
=======
  } catch (err) {
    console.log('Google Sheets delete failed.', err);
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a
  }
}

export async function gsLoad() {
  try {
    const res = await fetch(`${GS_URL}?t=${Date.now()}`);
<<<<<<< HEAD
    const data = await parseSheetResponse(res);
=======
    const data = await res.json();
>>>>>>> b150150e00a5aa01d2b932c93210da5b99133a3a
    return data.quotes || [];
  } catch (err) {
    console.log('Google Sheets load failed, using local data.', err);
    return [];
  }
}
