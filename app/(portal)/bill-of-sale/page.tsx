'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string
  year: number | null
  make: string | null
  model: string | null
  vin: string
  colour: string | null
  kilometers: number | null
  sold_price: number | null
  customer: string | null
  date_sold: string | null
}

type BOS = {
  id: string
  created_at: string
  truck_id: string | null
  truck_year: number | null
  truck_make: string | null
  truck_model: string | null
  truck_vin: string | null
  truck_colour: string | null
  truck_km: number | null
  buyer_name: string | null
  buyer_address: string | null
  buyer_phone: string | null
  price: number
  tax_rate: number
  tax_amount: number
  total: number
  deposit: number
  sale_date: string | null
  notes: string | null
}

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }
const TD: React.CSSProperties = { padding: '12px 14px', color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 15 }

const emptyForm = {
  truck_id: '',
  truck_year: '', truck_make: '', truck_model: '', truck_vin: '', truck_colour: '', truck_km: '',
  buyer_name: '', buyer_address: '', buyer_phone: '',
  price: '', tax_rate: '13', deposit: '0', sale_date: new Date().toISOString().split('T')[0], notes: '',
}

type FormType = typeof emptyForm

// Shared logo as a data URL - using a simple text-based SVG for the logo placeholder
// In production, replace LOGO_BASE64 with your actual base64 logo
const LOGO_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlMAAAGkCAYAAAAVPqDUAAEAAElEQVR4nOz9d7Qt..."  // truncated - keep your existing base64

function bosHTML(bos: BOS): string {
  const saleDate = bos.sale_date
    ? new Date(bos.sale_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Calculate validity date (30 days from sale date)
  const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
  const validTill = new Date(saleDateObj)
  validTill.setDate(validTill.getDate() + 30)
  const validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit

  return `
    <html>
    <head>
      <title>Bill of Sale</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 11px; 
          padding: 24px 36px; 
          color: #000; 
          line-height: 1.4;
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          display: flex; 
          align-items: center; 
          gap: 20px;
          margin-bottom: 20px; 
          border-bottom: 3px solid #000;
          padding-bottom: 14px;
        }
        .header-logo { 
          height: 70px; 
          width: auto; 
          flex-shrink: 0;
          object-fit: contain;
        }
        .header-text { flex: 1; }
        .header-title { 
          font-size: 26px; 
          font-weight: 900; 
          letter-spacing: 0.08em; 
          text-transform: uppercase; 
          line-height: 1;
          margin-bottom: 4px;
        }
        .header-company { 
          font-size: 16px; 
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        .header-sub { font-size: 11px; color: #555; }
        .date-line { margin-bottom: 14px; font-size: 12px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 14px; }
        .section { margin-bottom: 14px; }
        .section-label { 
          font-weight: 700; 
          font-size: 10px; 
          text-transform: uppercase; 
          letter-spacing: 0.12em; 
          color: #666; 
          border-bottom: 1.5px solid #999; 
          padding-bottom: 3px; 
          margin-bottom: 7px; 
        }
        .field { margin-bottom: 3px; font-size: 11px; }
        .field strong { font-weight: 700; }
        .financials-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 16px;
          margin-bottom: 14px;
        }
        .totals { border: 1.5px solid #000; border-radius: 4px; overflow: hidden; }
        .totals-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 5px 10px; 
          font-size: 11px; 
          border-bottom: 1px solid #ddd;
        }
        .totals-row:last-child { border-bottom: none; }
        .totals-row.total-main { 
          background: #f5f5f5;
          font-weight: 700; 
          font-size: 12px;
        }
        .totals-row.deposit-row { color: #555; }
        .totals-row.grand { 
          background: #000; 
          color: #fff;
          font-weight: 900; 
          font-size: 14px; 
        }
        .disclaimer { 
          border: 2px solid #000; 
          padding: 8px 14px; 
          text-align: center; 
          font-weight: 900; 
          font-size: 12px; 
          letter-spacing: 0.06em; 
          margin: 12px 0 6px; 
          text-transform: uppercase; 
        }
        .validity {
          text-align: center;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
          color: #333;
        }
        .legal { font-size: 10px; color: #333; line-height: 1.7; margin-bottom: 20px; }
        .sig-row { display: flex; justify-content: space-between; gap: 40px; margin-top: 24px; }
        .sig-block { flex: 1; }
        .sig-line { border-top: 1px solid #000; padding-top: 5px; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.06em; }
        @media print { 
          body { padding: 20px 30px; }
          .no-print { display: none; }
          @page { size: letter portrait; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img src="${LOGO_SRC}" class="header-logo" alt="Logo" />
        <div class="header-text">
          <div class="header-title">Bill of Sale</div>
          <div class="header-company">Aamir &amp; Sons Trading Ltd.</div>
          <div class="header-sub">2 Blair Dr, Brampton, ON L6T 2H5 &nbsp;|&nbsp; HST # 704391101RT0001</div>
        </div>
      </div>

      <div class="date-line">Date of Sale: <strong>${saleDate}</strong></div>

      <div class="two-col">
        <div class="section">
          <div class="section-label">Seller</div>
          <div class="field"><strong>Aamir &amp; Sons Trading Ltd.</strong></div>
          <div class="field">2 Blair Dr, Brampton, ON L6T 2H5</div>
          <div class="field">HST # 704391101RT0001</div>
        </div>
        <div class="section">
          <div class="section-label">Buyer</div>
          <div class="field"><strong>${bos.buyer_name || '___________________________'}</strong></div>
          ${bos.buyer_address ? `<div class="field">${bos.buyer_address}</div>` : ''}
          ${bos.buyer_phone ? `<div class="field">${bos.buyer_phone}</div>` : ''}
        </div>
      </div>

      <div class="financials-grid">
        <div class="section">
          <div class="section-label">Asset Description</div>
          <div class="field">Year: <strong>${bos.truck_year || '___'}</strong></div>
          <div class="field">Make: <strong>${bos.truck_make || '___________'}</strong></div>
          <div class="field">Model: <strong>${bos.truck_model || '___________'}</strong></div>
          <div class="field">Color: <strong>${bos.truck_colour || '___________'}</strong></div>
          <div class="field">VIN: <strong style="font-family:monospace;">${bos.truck_vin || '___________________'}</strong></div>
          <div class="field">Odometer: <strong>${bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________'}</strong></div>
        </div>

        <div>
          <div class="section-label" style="font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#666;border-bottom:1.5px solid #999;padding-bottom:3px;margin-bottom:7px;">Payment Summary</div>
          <div class="totals">
            <div class="totals-row"><span>Sale Price</span><span>$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
            <div class="totals-row"><span>HST (${bos.tax_rate}%)</span><span>$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
            <div class="totals-row total-main"><span>Total</span><span>$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            ${deposit > 0 ? `
            <div class="totals-row deposit-row"><span>Deposit Paid</span><span>- $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
            <div class="totals-row grand"><span>BALANCE DUE</span><span>$${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            ` : `
            <div class="totals-row grand"><span>AMOUNT DUE</span><span>$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            `}
          </div>
        </div>
      </div>

      <div class="disclaimer">Sold As-Is Where-Is &mdash; No Guarantee &mdash; No Warranty</div>
      <div class="validity">Bill of Sale is Valid Till ${validTillStr}</div>

      <div class="legal">
        I am the legal owner of the above-described vehicle as evidenced by the attached Registration
        (and where applicable, the title) for the vehicle or equipment. The above-described
        vehicle/equipment is clear title: there are no liens or encumbrances against this
        vehicle/equipment.<br /><br />
        Agreed to this on ${saleDate}, in the city of Brampton, Ontario.
      </div>

      ${bos.notes ? `<div style="font-size:10px;color:#555;margin-bottom:14px;font-style:italic;border-left:2px solid #ccc;padding-left:8px;">${bos.notes}</div>` : ''}

      <div class="sig-row">
        <div class="sig-block"><div class="sig-line">Signature of Seller</div></div>
        <div class="sig-block"><div class="sig-line">Signature of Buyer</div></div>
      </div>
    </body>
    </html>
  `
}

function openBOS(bos: BOS) {
  const blob = new Blob([bosHTML(bos)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank')
  if (!w) { alert('Please allow popups for this site to print the Bill of Sale.'); return }
  w.onload = () => {
    w.print()
    URL.revokeObjectURL(url)
  }
}

// ── BOS FORM ──────────────────────────────────────────────────────────────────
function BOSForm({ trucks, onSave, onCancel, initial }: {
  trucks: Truck[]
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  initial?: BOS
}) {
  const [form, setForm] = useState<FormType>(initial ? {
    truck_id: initial.truck_id || '',
    truck_year: initial.truck_year ? String(initial.truck_year) : '',
    truck_make: initial.truck_make || '',
    truck_model: initial.truck_model || '',
    truck_vin: initial.truck_vin || '',
    truck_colour: initial.truck_colour || '',
    truck_km: initial.truck_km ? String(initial.truck_km) : '',
    buyer_name: initial.buyer_name || '',
    buyer_address: initial.buyer_address || '',
    buyer_phone: initial.buyer_phone || '',
    price: initial.price ? String(initial.price) : '',
    tax_rate: initial.tax_rate ? String(initial.tax_rate) : '13',
    deposit: initial.deposit ? String(initial.deposit) : '0',
    sale_date: initial.sale_date || new Date().toISOString().split('T')[0],
    notes: initial.notes || '',
  } : { ...emptyForm })
  const [saving, setSaving] = useState(false)

  function onTruckSelect(id: string) {
    setForm(f => ({ ...f, truck_id: id }))
    if (!id) return
    const t = trucks.find(t => t.id === id)
    if (!t) return
    setForm(f => ({
      ...f,
      truck_id: id,
      truck_year: t.year ? String(t.year) : '',
      truck_make: t.make || '',
      truck_model: t.model || '',
      truck_vin: t.vin || '',
      truck_colour: t.colour || '',
      truck_km: t.kilometers ? String(t.kilometers) : '',
      buyer_name: t.customer || '',
      price: t.sold_price ? String(t.sold_price) : '',
      sale_date: t.date_sold || new Date().toISOString().split('T')[0],
    }))
  }

  const price = parseFloat(form.price) || 0
  const taxRate = parseFloat(form.tax_rate) || 0
  const deposit = parseFloat(form.deposit) || 0
  const taxAmount = price * (taxRate / 100)
  const total = price + taxAmount
  const balanceDue = total - deposit

  async function handleSave() {
    if (!form.buyer_name) return alert('Buyer name is required.')
    if (!form.price) return alert('Price is required.')
    setSaving(true)
    await onSave({
      truck_id: form.truck_id || null,
      truck_year: parseInt(form.truck_year) || null,
      truck_make: form.truck_make || null,
      truck_model: form.truck_model || null,
      truck_vin: form.truck_vin || null,
      truck_colour: form.truck_colour || null,
      truck_km: parseInt(form.truck_km) || null,
      buyer_name: form.buyer_name || null,
      buyer_address: form.buyer_address || null,
      buyer_phone: form.buyer_phone || null,
      price,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      deposit,
      sale_date: form.sale_date || null,
      notes: form.notes || null,
    })
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={LS}>Link to Inventory (optional)</label>
        <select style={{ ...IS, minHeight: 44 }} value={form.truck_id} onChange={e => onTruckSelect(e.target.value)}>
          <option value="">— Enter manually —</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.year} {t.make} {t.model} — {t.vin}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>VEHICLE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div><label style={LS}>Year</label><input style={{ ...IS, minHeight: 44 }} placeholder="2019" value={form.truck_year} onChange={e => setForm(f => ({ ...f, truck_year: e.target.value }))} /></div>
        <div><label style={LS}>Make</label><input style={{ ...IS, minHeight: 44 }} placeholder="Freightliner" value={form.truck_make} onChange={e => setForm(f => ({ ...f, truck_make: e.target.value }))} /></div>
        <div><label style={LS}>Model</label><input style={{ ...IS, minHeight: 44 }} placeholder="Cascadia" value={form.truck_model} onChange={e => setForm(f => ({ ...f, truck_model: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div><label style={LS}>Colour</label><input style={{ ...IS, minHeight: 44 }} placeholder="White" value={form.truck_colour} onChange={e => setForm(f => ({ ...f, truck_colour: e.target.value }))} /></div>
        <div><label style={LS}>KM</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="450000" value={form.truck_km} onChange={e => setForm(f => ({ ...f, truck_km: e.target.value }))} /></div>
        <div><label style={LS}>VIN</label><input style={{ ...IS, minHeight: 44, fontFamily: 'monospace' }} placeholder="17-char VIN" value={form.truck_vin} onChange={e => setForm(f => ({ ...f, truck_vin: e.target.value }))} /></div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>BUYER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Full Name *</label><input style={{ ...IS, minHeight: 44 }} placeholder="John Smith" value={form.buyer_name} onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))} /></div>
        <div><label style={LS}>Phone</label><input style={{ ...IS, minHeight: 44 }} placeholder="416-555-0100" value={form.buyer_phone} onChange={e => setForm(f => ({ ...f, buyer_phone: e.target.value }))} /></div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Address</label>
        <input style={{ ...IS, minHeight: 44 }} placeholder="123 Main St, Toronto, ON" value={form.buyer_address} onChange={e => setForm(f => ({ ...f, buyer_address: e.target.value }))} />
      </div>

      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>FINANCIALS</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Sale Price ($) *</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="45000" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
        <div><label style={LS}>Tax Rate (%)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="13" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} /></div>
        <div><label style={LS}>Deposit ($)</label><input style={{ ...IS, minHeight: 44 }} type="number" placeholder="0" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} /></div>
        <div><label style={LS}>Date of Sale</label><input style={{ ...IS, minHeight: 44 }} type="date" value={form.sale_date} onChange={e => setForm(f => ({ ...f, sale_date: e.target.value }))} /></div>
      </div>

      {price > 0 && (
        <div style={{ background: 'var(--hover)', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { l: 'PRICE', v: `$${price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, c: 'var(--text)' },
            { l: `HST (${taxRate}%)`, v: `$${taxAmount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, c: 'var(--text2)' },
            { l: 'TOTAL', v: `$${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, c: 'var(--text)' },
            { l: 'BALANCE DUE', v: `$${balanceDue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, c: 'var(--gold)' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Notes (optional)</label>
        <textarea style={{ ...IS, height: 60, resize: 'vertical' }} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: saving ? 'default' : 'pointer', minHeight: 50, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Bill of Sale'}
        </button>
      </div>
    </div>
  )
}

// ── PREVIEW MODAL ─────────────────────────────────────────────────────────────
function BOSPreviewModal({ bos, onClose }: { bos: BOS; onClose: () => void }) {
  const saleDate = bos.sale_date
    ? new Date(bos.sale_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
  const validTill = new Date(saleDateObj)
  validTill.setDate(validTill.getDate() + 30)
  const validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit

  // Shared styles matching the print layout
  const sectionLabel: React.CSSProperties = {
    fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
    color: '#666', borderBottom: '1.5px solid #999', paddingBottom: 3, marginBottom: 7,
  }
  const field: React.CSSProperties = { marginBottom: 3, fontSize: 11 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', color: '#000' }}>

        {/* Controls bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9f9f6', borderRadius: '16px 16px 0 0' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f0f0f' }}>Bill of Sale Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openBOS(bos)} style={{ background: '#b45309', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨 Print / PDF</button>
            <button onClick={onClose} style={{ background: '#eee', border: 'none', color: '#333', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* BOS Content — mirrors print layout exactly */}
        <div style={{ padding: '24px 36px', fontFamily: 'Arial, sans-serif', fontSize: 11, lineHeight: 1.4 }}>

          {/* Header: logo left, title right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, borderBottom: '3px solid #000', paddingBottom: 14 }}>
            <img src={LOGO_SRC} style={{ height: 70, width: 'auto', flexShrink: 0, objectFit: 'contain' }} alt="Logo" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 4 }}>Bill of Sale</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>Aamir & Sons Trading Ltd.</div>
              <div style={{ fontSize: 11, color: '#555' }}>2 Blair Dr, Brampton, ON L6T 2H5 &nbsp;|&nbsp; HST # 704391101RT0001</div>
            </div>
          </div>

          <div style={{ marginBottom: 14, fontSize: 12 }}>Date of Sale: <strong>{saleDate}</strong></div>

          {/* Seller / Buyer side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={sectionLabel}>Seller</div>
              <div style={field}><strong>Aamir & Sons Trading Ltd.</strong></div>
              <div style={{ ...field, color: '#444' }}>2 Blair Dr, Brampton, ON L6T 2H5</div>
              <div style={{ ...field, color: '#444' }}>HST # 704391101RT0001</div>
            </div>
            <div>
              <div style={sectionLabel}>Buyer</div>
              <div style={field}><strong>{bos.buyer_name || '___________________________'}</strong></div>
              {bos.buyer_address && <div style={{ ...field, color: '#444' }}>{bos.buyer_address}</div>}
              {bos.buyer_phone && <div style={{ ...field, color: '#444' }}>{bos.buyer_phone}</div>}
            </div>
          </div>

          {/* Vehicle / Payment side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={sectionLabel}>Asset Description</div>
              {[
                ['Year', String(bos.truck_year || '___')],
                ['Make', bos.truck_make || '___________'],
                ['Model', bos.truck_model || '___________'],
                ['Color', bos.truck_colour || '___________'],
                ['VIN', bos.truck_vin || '___________________'],
                ['Odometer', bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________'],
              ].map(([l, v]) => (
                <div key={l} style={field}>{l}: <strong style={{ fontFamily: l === 'VIN' ? 'monospace' : 'inherit' }}>{v}</strong></div>
              ))}
            </div>
            <div>
              <div style={sectionLabel}>Payment Summary</div>
              <div style={{ border: '1.5px solid #000', borderRadius: 4, overflow: 'hidden' }}>
                {[
                  { l: 'Sale Price', v: `$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff' },
                  { l: `HST (${bos.tax_rate}%)`, v: `$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff' },
                  { l: 'Total', v: `$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`, bold: true, bg: '#f5f5f5' },
                  ...(deposit > 0 ? [
                    { l: 'Deposit Paid', v: `- $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff', color: '#555' },
                  ] : []),
                ].map((row: any) => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', fontSize: 11, borderBottom: '1px solid #ddd', background: row.bg, fontWeight: row.bold ? 700 : 400, color: row.color || '#000' }}>
                    <span>{row.l}</span><span>{row.v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: '#000', color: '#fff', fontWeight: 900, fontSize: 14 }}>
                  <span>{deposit > 0 ? 'BALANCE DUE' : 'AMOUNT DUE'}</span>
                  <span>${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ border: '2px solid #000', padding: '8px 14px', textAlign: 'center', fontWeight: 900, fontSize: 12, letterSpacing: '0.06em', margin: '12px 0 6px', textTransform: 'uppercase' }}>
            Sold As-Is Where-Is — No Guarantee — No Warranty
          </div>
          <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12, color: '#333' }}>
            Bill of Sale is Valid Till {validTillStr}
          </div>

          {/* Legal */}
          <div style={{ fontSize: 10, color: '#333', lineHeight: 1.7, marginBottom: 20 }}>
            I am the legal owner of the above-described vehicle as evidenced by the attached Registration (and where applicable, the title) for the vehicle or equipment. The above-described vehicle/equipment is clear title: there are no liens or encumbrances against this vehicle/equipment.
            <br /><br />
            Agreed to this on {saleDate}, in the city of Brampton, Ontario.
          </div>

          {bos.notes && (
            <div style={{ fontSize: 10, color: '#555', marginBottom: 14, fontStyle: 'italic', borderLeft: '2px solid #ccc', paddingLeft: 8 }}>{bos.notes}</div>
          )}

          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, marginTop: 24 }}>
            <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid #000', paddingTop: 5, fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signature of Seller</div></div>
            <div style={{ flex: 1 }}><div style={{ borderTop: '1px solid #000', paddingTop: 5, fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signature of Buyer</div></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── BILL OF SALE PAGE ─────────────────────────────────────────────────────────
export default function BillOfSalePage() {
  const [bosList, setBosList]       = useState<BOS[]>([])
  const [trucks, setTrucks]         = useState<Truck[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [editBOS, setEditBOS]       = useState<BOS | null>(null)
  const [previewBOS, setPreviewBOS] = useState<BOS | null>(null)
  const [isMobile, setIsMobile]     = useState(false)
  const [search, setSearch]         = useState('')

  useEffect(() => {
    loadAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: bosData }, { data: truckData }] = await Promise.all([
      supabase.from('bills_of_sale').select('*').order('created_at', { ascending: false }),
      supabase.from('Inventory Data').select('id, year, make, model, vin, colour, kilometers, sold_price, customer, date_sold').order('bought_on', { ascending: false }),
    ])
    setBosList(bosData || [])
    setTrucks(truckData || [])
    setLoading(false)
  }

  async function saveBOS(data: any) {
    const { error } = await supabase.from('bills_of_sale').insert([data])
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false)
    loadAll()
  }

  async function updateBOS(id: string, data: any) {
    const { error } = await supabase.from('bills_of_sale').update(data).eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    setEditBOS(null)
    loadAll()
  }

  async function deleteBOS(id: string) {
    if (!confirm('Delete this Bill of Sale?')) return
    await supabase.from('bills_of_sale').delete().eq('id', id)
    loadAll()
  }

  const filtered = bosList.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return [b.buyer_name, b.truck_make, b.truck_model, b.truck_vin].some(v => v?.toLowerCase().includes(q))
  })

  const fmt = (d: string | null) => {
    if (!d) return '—'
    const [y, m, day] = d.split('T')[0].split('-').map(Number)
    return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .bos-row { border-bottom:1px solid var(--border2); transition:background 0.15s; }
        .bos-row:hover { background:var(--hover); }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>SALES</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Bill of Sale</h1>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: isMobile ? '10px 18px' : '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>
            + New Bill of Sale
          </button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',   value: bosList.length, color: 'var(--text2)' },
            { label: 'Revenue', value: `$${bosList.reduce((s, b) => s + b.total, 0).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`, color: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 }}
            placeholder="Search buyer, truck, VIN..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>
            {bosList.length === 0 ? 'No bills of sale yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Buyer', 'Vehicle', 'VIN', 'Price', 'HST', 'Total', 'Deposit', 'Balance', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text)', fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(bos => {
                    const dep = bos.deposit || 0
                    const bal = bos.total - dep
                    return (
                      <tr key={bos.id} className="bos-row">
                        <td style={TD}>{fmt(bos.sale_date)}</td>
                        <td style={{ ...TD, fontWeight: 600 }}>{bos.buyer_name || '—'}</td>
                        <td style={TD}>{bos.truck_year} {bos.truck_make} {bos.truck_model}</td>
                        <td style={{ ...TD, fontFamily: 'monospace', fontSize: 13 }}>{bos.truck_vin || '—'}</td>
                        <td style={TD}>${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                        <td style={TD}>${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                        <td style={TD}>${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                        <td style={{ ...TD, color: dep > 0 ? 'var(--text2)' : 'var(--text4)' }}>{dep > 0 ? `$${dep.toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : '—'}</td>
                        <td style={{ ...TD, color: 'var(--gold)', fontWeight: 700 }}>${bal.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={() => setPreviewBOS(bos)}
                              style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              👁 Preview
                            </button>
                            <button onClick={() => openBOS(bos)}
                              style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              🖨 Print
                            </button>
                            <button onClick={() => setEditBOS(bos)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: 4 }}>✏️</button>
                            <button onClick={() => deleteBOS(bos.id)} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 4 }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 13, color: 'var(--text3)' }}>
              {filtered.length} of {bosList.length} bills of sale
            </div>
          </div>
        )}

        {/* ADD MODAL */}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 660, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Bill of Sale</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <BOSForm trucks={trucks} onSave={saveBOS} onCancel={() => setShowAdd(false)} />
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editBOS && (
          <div onClick={() => setEditBOS(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 660, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Bill of Sale</h2>
                <button onClick={() => setEditBOS(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <BOSForm trucks={trucks} onSave={(data) => updateBOS(editBOS.id, data)} onCancel={() => setEditBOS(null)} initial={editBOS} />
            </div>
          </div>
        )}

        {/* PREVIEW MODAL */}
        {previewBOS && <BOSPreviewModal bos={previewBOS} onClose={() => setPreviewBOS(null)} />}
      </main>
    </>
  )
}