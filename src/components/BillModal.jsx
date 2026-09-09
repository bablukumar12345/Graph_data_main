import React, { useRef, useState } from 'react';
import { formatWhole, isWallpaperRoom, money, quoteTotals, wallAmount, wallSqft } from '../lib/calc';
import { createPdfFile, downloadFile } from '../lib/pdf';
import GraphPreview from './GraphPreview.jsx';

export default function BillModal({ data, onClose }) {
  const billRef = useRef(null);
  const graphRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const totals = quoteTotals(data.rooms);
  const roundOff = Math.min(Number(data.roundOff) || 0, totals.amount);
  const finalTotal = totals.amount - roundOff;
  const balance = finalTotal - (Number(data.advance) || 0);

  async function makePdf() {
    return createPdfFile(billRef.current, 'Noida Decor.pdf', { pageSelector: '.pdf-page-section' });
  }

  async function makeSharePdf() {
    return createPdfFile(billRef.current, 'Noida Decor.pdf', { scale: 2, pageSelector: '.pdf-page-section' });
  }

  async function makeShareGraphPdf() {
    return createPdfFile(graphRef.current, 'Noida Decor Graph.pdf', { scale: 2, pageSelector: '.bill-graph-card' });
  }

  async function makeGraphPdf() {
    return createPdfFile(graphRef.current, 'Noida Decor Graph.pdf', { pageSelector: '.bill-graph-card' });
  }

  async function downloadPdf() {
    setBusy(true);
    try {
      downloadFile(await makePdf());
    } finally {
      setBusy(false);
    }
  }

  async function downloadGraphPdf() {
    setBusy(true);
    try {
      downloadFile(await makeGraphPdf());
    } finally {
      setBusy(false);
    }
  }

  async function handleDownloadChoice(event) {
    const value = event.target.value;
    event.target.value = '';
    if (value === 'full') await downloadPdf();
    if (value === 'graph') await downloadGraphPdf();
  }

  function openWhatsAppShare(fileName) {
    const message = `Noida Decor PDF is ready: ${fileName}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function shareFile(file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Noida Decor',
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    openWhatsAppShare(file.name);
  }

  async function sharePdf() {
    setBusy(true);
    try {
      await shareFile(await makeSharePdf());
    } finally {
      setBusy(false);
    }
  }

  async function shareGraphPdf() {
    setBusy(true);
    try {
      await shareFile(await makeShareGraphPdf());
    } finally {
      setBusy(false);
    }
  }

  async function handleShareChoice(event) {
    const value = event.target.value;
    event.target.value = '';
    if (value === 'full') await sharePdf();
    if (value === 'graph') await shareGraphPdf();
  }

  return (
    <div className="modal">
      <button className="modal-bg" type="button" onClick={onClose} aria-label="Close" />
      <div className="modal-box">
        <button className="modal-close" type="button" onClick={onClose}>x</button>
        <div className="bill" ref={billRef}>
          <div className="pdf-page-section">
            <div className="bill-header">
              <div className="bill-brand">
                <img src="/img/logo.png" alt="Noida Decor" />
                <div><strong>Noida Decor</strong><small>Vivek Choudhary</small></div>
              </div>
              <div className="bill-meta">
                Date: <b>{new Date().toLocaleDateString('en-IN')}</b><br />
                Customer: <b>{data.name || '--'}</b><br />
                Phone: <b>{data.phone || '--'}</b><br />
                Address: <b>{data.address || '--'}</b>
              </div>
            </div>
            <table className="bill-table">
              <thead>
                <tr><th>Room</th><th>Wall</th><th>Paper</th><th>Pattern</th><th>Sq/Ft</th><th>Price (Per/Sqft)</th><th>Price (Per/Roll)</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {data.rooms.flatMap((room) => {
                  const isWallpaper = isWallpaperRoom(room);
                  return room.walls.map((wall, wallIndex) => (
                    <tr key={wall.id}>
                      <td>{room.category}</td>
                      <td>Wall {wallIndex + 1}</td>
                      <td>{isWallpaper ? 'Wallpaper' : room.roomPaper}</td>
                      <td>{wall.patternNum || 'NA'}</td>
                      <td>{isWallpaper ? 'NA' : formatWhole(wallSqft(wall, false))}</td>
                      <td>{isWallpaper ? 'NA' : money(wall.rate)}</td>
                      <td>{isWallpaper ? money(wall.rollPrice) : 'NA'}</td>
                      <td>{money(wallAmount(wall, isWallpaper))}</td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
            <div className="bill-total">
              <span>Total Area</span><b>{formatWhole(totals.sqft)} sq ft</b>
              <span>Total Amount</span><b>{money(totals.amount)}</b>
              {roundOff > 0 && <><span>Round Off / Offer</span><b>- {money(roundOff)}</b></>}
              <span>Advance Paid</span><b>{money(data.advance)}</b>
              <span>{balance < 0 ? 'Overpaid' : 'Balance Due'}</span><b>{money(Math.abs(balance))}</b>
            </div>
          </div>
          <div className="bill-graphs" ref={graphRef}>
            {data.rooms.flatMap((room) => {
              if (isWallpaperRoom(room)) return [];
              return room.walls.map((wall, wallIndex) => (
                <GraphPreview key={wall.id} roomName={room.category} wall={wall} wallIndex={wallIndex} />
              ));
            })}
          </div>
        </div>
        <div className="bill-actions">
          <select className="btn btn-outline download-select" defaultValue="" disabled={busy} onChange={handleDownloadChoice} aria-label="Download options">
            <option value="" disabled>Download PDF</option>
            <option value="full">Download / Print PDF</option>
            <option value="graph">Download Graph PDF</option>
          </select>
          <select className="btn btn-primary download-select" defaultValue="" disabled={busy} onChange={handleShareChoice} aria-label="Share options">
            <option value="" disabled>{busy ? 'Preparing...' : 'Share PDF'}</option>
            <option value="full">Share Full PDF on WhatsApp</option>
            <option value="graph">Share Graph PDF on WhatsApp</option>
          </select>
        </div>
      </div>
    </div>
  );
}
