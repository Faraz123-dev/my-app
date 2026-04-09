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
const LOGO_SRC = "data:image/png;base64,PASTE_YOUR_CLIPBOARD_HERE"

// ── Helper: add N business days ───────────────────────────────────────────────
function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++ // skip Sunday(0) and Saturday(6)
  }
  return result
}

function bosHTML(bos: BOS): string {
  const saleDate = bos.sale_date
    ? new Date(bos.sale_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit

 // Valid-till: only when deposit > 0, sale date + 5 business days
  let validTillStr = ''
  if (deposit > 0) {
    const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
    const validTill = addBusinessDays(saleDateObj, 5)
    validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  }
  
  return `
    <html>
    <head>
      <title>Bill of Sale</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 11.5px; 
          color: #000; 
          line-height: 1.5;
        }
        .page {
          min-height: 100vh;
          padding: 32px 44px 36px;
          display: flex;
          flex-direction: column;
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          display: flex; 
          align-items: center; 
          gap: 22px;
          margin-bottom: 22px; 
          border-bottom: 3px solid #000;
          padding-bottom: 16px;
        }
        .header-logo { 
          height: 72px; 
          width: auto; 
          flex-shrink: 0;
          object-fit: contain;
        }
        .header-text { flex: 1; }
        .header-title { 
          font-size: 28px; 
          font-weight: 900; 
          letter-spacing: 0.08em; 
          text-transform: uppercase; 
          line-height: 1;
          margin-bottom: 5px;
        }
        .header-company { 
          font-size: 17px; 
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 3px;
        }
        .header-sub { font-size: 11px; color: #555; }
        .date-line { margin-bottom: 18px; font-size: 12.5px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 18px; }
        .section-label { 
          font-weight: 700; 
          font-size: 10px; 
          text-transform: uppercase; 
          letter-spacing: 0.12em; 
          color: #555; 
          border-bottom: 1.5px solid #aaa; 
          padding-bottom: 4px; 
          margin-bottom: 9px; 
        }
        .field { margin-bottom: 4px; font-size: 11.5px; }
        .field strong { font-weight: 700; }
        .totals { border: 1.5px solid #000; border-radius: 4px; overflow: hidden; }
        .totals-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 6px 12px; 
          font-size: 11.5px; 
          border-bottom: 1px solid #ddd;
        }
        .totals-row:last-child { border-bottom: none; }
        .totals-row.total-main { background: #f0f0f0; font-weight: 700; font-size: 12.5px; }
        .totals-row.deposit-row { color: #555; background: #fafafa; }
        .totals-row.grand { background: #000; color: #fff; font-weight: 900; font-size: 15px; padding: 8px 12px; }
        .spacer { flex: 1; }
        .disclaimer { 
          border: 2.5px solid #000; 
          padding: 10px 16px; 
          text-align: center; 
          font-weight: 900; 
          font-size: 12.5px; 
          letter-spacing: 0.07em; 
          margin-bottom: 8px; 
          text-transform: uppercase; 
        }
        .validity {
          text-align: center;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 16px;
          color: #333;
          padding: 6px;
          border: 1px dashed #999;
          border-radius: 3px;
        }
        .legal { 
          font-size: 10.5px; 
          color: #333; 
          line-height: 1.75; 
          margin-bottom: 10px;
          padding: 12px 14px;
          background: #fafafa;
          border-left: 3px solid #ccc;
        }
        .sig-row { 
          display: flex; 
          justify-content: space-between; 
          gap: 48px; 
          padding-top: 12px;
          border-top: 1px solid #e0e0e0;
        }
        .sig-block { flex: 1; }
        .sig-spacer { height: 48px; }
        .sig-line { border-top: 1.5px solid #000; padding-top: 6px; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.07em; }
        @media print { 
          .page { padding: 20px 32px; min-height: 100vh; }
          @page { size: letter portrait; margin: 0; }
        }
      </style>
    </head>
    <body>
    <div class="page">

      <!-- HEADER -->
      <div class="header">
        <img src="${LOGO_SRC}" class="header-logo" alt="Logo" />
        <div class="header-text">
          <div class="header-title">Bill of Sale</div>
          <div class="header-company">Aamir &amp; Sons Trading Ltd.</div>
          <div class="header-sub">2 Blair Dr, Brampton, ON L6T 2H5 &nbsp;&nbsp;|&nbsp;&nbsp; HST # 704391101RT0001</div>
        </div>
      </div>

      <!-- DATE -->
      <div class="date-line">Date of Sale: &nbsp;<strong>${saleDate}</strong></div>

      <!-- SELLER / BUYER -->
      <div class="two-col">
        <div>
          <div class="section-label">Seller</div>
          <div class="field"><strong>Aamir &amp; Sons Trading Ltd.</strong></div>
          <div class="field">2 Blair Dr, Brampton, ON L6T 2H5</div>
          <div class="field">HST # 704391101RT0001</div>
        </div>
        <div>
          <div class="section-label">Buyer</div>
          <div class="field"><strong>${bos.buyer_name || '___________________________'}</strong></div>
          ${bos.buyer_address ? `<div class="field">${bos.buyer_address}</div>` : ''}
          ${bos.buyer_phone ? `<div class="field">${bos.buyer_phone}</div>` : ''}
        </div>
      </div>

      <!-- VEHICLE / PAYMENT -->
      <div class="two-col">
        <div>
          <div class="section-label">Asset Description</div>
          <div class="field">Year: <strong>${bos.truck_year || '___'}</strong></div>
          <div class="field">Make: <strong>${bos.truck_make || '___________'}</strong></div>
          <div class="field">Model: <strong>${bos.truck_model || '___________'}</strong></div>
          <div class="field">Color: <strong>${bos.truck_colour || '___________'}</strong></div>
          <div class="field">VIN: <strong style="font-family:monospace;letter-spacing:0.05em;">${bos.truck_vin || '___________________'}</strong></div>
          <div class="field">Odometer: <strong>${bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________'}</strong></div>
        </div>
        <div>
          <div class="section-label">Payment Summary</div>
          <div class="totals">
            <div class="totals-row"><span>Sale Price</span><span><strong>$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</strong></span></div>
            <div class="totals-row"><span>HST (${bos.tax_rate}%)</span><span>$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
            <div class="totals-row total-main"><span>Total</span><span>$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            ${deposit > 0 ? `
            <div class="totals-row deposit-row"><span>Deposit Paid</span><span>&minus; $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span></div>
            <div class="totals-row grand"><span>BALANCE DUE</span><span>$${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            ` : `
            <div class="totals-row grand"><span>AMOUNT DUE</span><span>$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span></div>
            `}
          </div>
        </div>
      </div>

      <!-- DISCLAIMER -->
      <div class="disclaimer">Sold As-Is Where-Is &mdash; No Guarantee &mdash; No Warranty</div>

      <!-- VALID TILL — only when deposit > 0 -->
      ${validTillStr ? `<div class="validity">&#9432; &nbsp; Bill of Sale is Valid Till &nbsp; ${validTillStr}</div>` : ''}

      <!-- SPACER pushes legal + sigs to bottom -->
      <div class="spacer"></div>

      <!-- LEGAL -->
      <div class="legal">
        I am the legal owner of the above-described vehicle as evidenced by the attached Registration
        (and where applicable, the title) for the vehicle or equipment. The above-described
        vehicle/equipment is clear title: there are no liens or encumbrances against this
        vehicle/equipment.<br /><br />
        Agreed to this on <strong>${saleDate}</strong>, in the city of Brampton, Ontario.
      </div>

      ${bos.notes ? `<div style="font-size:10.5px;color:#555;margin-bottom:12px;font-style:italic;border-left:2px solid #ccc;padding-left:10px;padding-top:4px;padding-bottom:4px;">${bos.notes}</div>` : ''}

      <!-- SIGNATURES -->
      <div class="sig-row">
        <div class="sig-block">
          <div class="sig-spacer"></div>
          <div class="sig-line">Signature of Seller</div>
        </div>
        <div class="sig-block">
          <div class="sig-spacer"></div>
          <div class="sig-line">Signature of Buyer</div>
        </div>
      </div>

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
function BOSForm({ trucks, customers, onSave, onCancel, initial }: {
  trucks: Truck[]
  customers: any[]
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
      <div>
        <label style={LS}>Link to Inventory (optional)</label>
        <select style={{ ...IS, minHeight: 44 }} value={form.truck_id} onChange={e => onTruckSelect(e.target.value)}>
          <option value="">— Enter manually —</option>
          {trucks.map(t => <option key={t.id} value={t.id}>{t.year} {t.make} {t.model} — {t.vin}</option>)}
        </select>
      </div>
      <div>
        <label style={LS}>Auto-fill from Customer DB (optional)</label>
        <select style={{ ...IS, minHeight: 44 }} defaultValue=""
          onChange={e => {
            const c = customers.find((c: any) => c.id === e.target.value)
            if (!c) return
            setForm(f => ({
              ...f,
              buyer_name: c.name || '',
              buyer_phone: c.phone || '',
              buyer_address: c.address || '',
            }))
          }}>
          <option value="">— Select customer —</option>
          {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
        </select>
      </div>
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

// ── PREVIEW MODAL — mirrors bosHTML exactly ───────────────────────────────────
function BOSPreviewModal({ bos, onClose }: { bos: BOS; onClose: () => void }) {
  const saleDate = bos.sale_date
    ? new Date(bos.sale_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit

  let validTillStr = ''
  if (deposit > 0) {
    const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
    const validTill = addBusinessDays(saleDateObj, 5)
    validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  }

  const sl: React.CSSProperties = {
    fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em',
    color: '#555', borderBottom: '1.5px solid #aaa', paddingBottom: 4, marginBottom: 9,
  }
  const fi: React.CSSProperties = { marginBottom: 4, fontSize: 11.5 }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', color: '#000', overflow: 'hidden' }}>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9f9f6', flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f0f0f' }}>Bill of Sale Preview</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openBOS(bos)} style={{ background: '#b45309', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨 Print / PDF</button>
            <button onClick={onClose} style={{ background: '#eee', border: 'none', color: '#333', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>

        {/* Scrollable BOS body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '32px 44px 36px', fontFamily: 'Arial, sans-serif', fontSize: 11.5, lineHeight: 1.5, display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 22, borderBottom: '3px solid #000', paddingBottom: 16 }}>
            <img src={LOGO_SRC} style={{ height: 72, width: 'auto', flexShrink: 0, objectFit: 'contain' }} alt="Logo" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 5 }}>Bill of Sale</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 3 }}>Aamir & Sons Trading Ltd.</div>
              <div style={{ fontSize: 11, color: '#555' }}>2 Blair Dr, Brampton, ON L6T 2H5 &nbsp;|&nbsp; HST # 704391101RT0001</div>
            </div>
          </div>

          {/* DATE */}
          <div style={{ marginBottom: 18, fontSize: 12.5 }}>Date of Sale: &nbsp;<strong>{saleDate}</strong></div>

          {/* SELLER / BUYER */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={sl}>Seller</div>
              <div style={fi}><strong>Aamir & Sons Trading Ltd.</strong></div>
              <div style={{ ...fi, color: '#444' }}>2 Blair Dr, Brampton, ON L6T 2H5</div>
              <div style={{ ...fi, color: '#444' }}>HST # 704391101RT0001</div>
            </div>
            <div>
              <div style={sl}>Buyer</div>
              <div style={fi}><strong>{bos.buyer_name || '___________________________'}</strong></div>
              {bos.buyer_address && <div style={{ ...fi, color: '#444' }}>{bos.buyer_address}</div>}
              {bos.buyer_phone && <div style={{ ...fi, color: '#444' }}>{bos.buyer_phone}</div>}
            </div>
          </div>

          {/* VEHICLE / PAYMENT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
            <div>
              <div style={sl}>Asset Description</div>
              {([
                ['Year', String(bos.truck_year || '___')],
                ['Make', bos.truck_make || '___________'],
                ['Model', bos.truck_model || '___________'],
                ['Color', bos.truck_colour || '___________'],
                ['VIN', bos.truck_vin || '___________________'],
                ['Odometer', bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________'],
              ] as [string,string][]).map(([l, v]) => (
                <div key={l} style={fi}>{l}: <strong style={{ fontFamily: l === 'VIN' ? 'monospace' : 'inherit' }}>{v}</strong></div>
              ))}
            </div>
            <div>
              <div style={sl}>Payment Summary</div>
              <div style={{ border: '1.5px solid #000', borderRadius: 4, overflow: 'hidden' }}>
                {([
                  { l: 'Sale Price', v: `$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: true, bg: '#fff', color: '#000' },
                  { l: `HST (${bos.tax_rate}%)`, v: `$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff', color: '#000' },
                  { l: 'Total', v: `$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`, bold: true, bg: '#f0f0f0', color: '#000' },
                  ...(deposit > 0 ? [{ l: 'Deposit Paid', v: `− $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fafafa', color: '#555' }] : []),
                ] as {l:string,v:string,bold:boolean,bg:string,color:string}[]).map(row => (
                  <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', fontSize: 11.5, borderBottom: '1px solid #ddd', background: row.bg, fontWeight: row.bold ? 700 : 400, color: row.color }}>
                    <span>{row.l}</span><span>{row.v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#000', color: '#fff', fontWeight: 900, fontSize: 15 }}>
                  <span>{deposit > 0 ? 'BALANCE DUE' : 'AMOUNT DUE'}</span>
                  <span>${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span>
                </div>
              </div>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div style={{ border: '2.5px solid #000', padding: '10px 16px', textAlign: 'center', fontWeight: 900, fontSize: 12.5, letterSpacing: '0.07em', marginBottom: 8, textTransform: 'uppercase' }}>
            Sold As-Is Where-Is — No Guarantee — No Warranty
          </div>

          {/* VALID TILL — only when deposit > 0 */}
          {validTillStr && (
            <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 16, color: '#333', padding: 6, border: '1px dashed #999', borderRadius: 3 }}>
              ℹ &nbsp; Bill of Sale is Valid Till &nbsp; {validTillStr}
            </div>
          )}

          {/* SPACER */}
          <div style={{ flex: 1, minHeight: 20 }} />

          {/* LEGAL */}
          <div style={{ fontSize: 10.5, color: '#333', lineHeight: 1.75, marginBottom: 10, padding: '12px 14px', background: '#fafafa', borderLeft: '3px solid #ccc' }}>
            I am the legal owner of the above-described vehicle as evidenced by the attached Registration (and where applicable, the title) for the vehicle or equipment. The above-described vehicle/equipment is clear title: there are no liens or encumbrances against this vehicle/equipment.
            <br /><br />
            Agreed to this on <strong>{saleDate}</strong>, in the city of Brampton, Ontario.
          </div>

          {bos.notes && (
            <div style={{ fontSize: 10.5, color: '#555', marginBottom: 12, fontStyle: 'italic', borderLeft: '2px solid #ccc', paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>{bos.notes}</div>
          )}

          {/* SIGNATURES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
            {['Signature of Seller', 'Signature of Buyer'].map(label => (
              <div key={label} style={{ flex: 1 }}>
                <div style={{ height: 48 }} />
                <div style={{ borderTop: '1.5px solid #000', paddingTop: 6, fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
              </div>
            ))}
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
  const [customers, setCustomers]   = useState<any[]>([])
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
    const [{ data: bosData }, { data: truckData }, { data: customerData }] = await Promise.all([
      supabase.from('bills_of_sale').select('*').order('created_at', { ascending: false }),
      supabase.from('Inventory Data').select('id, year, make, model, vin, colour, kilometers, sold_price, customer, date_sold').order('bought_on', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setBosList(bosData || [])
    setTrucks(truckData || [])
    setCustomers(customerData || [])
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
                              {bos.truck_id && (
                                <button onClick={() => window.location.href = `/inventory/${bos.truck_id}`}
                                  style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  🚛 View Truck
                                </button>
                              )}
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
              <BOSForm trucks={trucks} customers={customers} onSave={saveBOS} onCancel={() => setShowAdd(false)} />
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
             <BOSForm trucks={trucks} customers={customers} onSave={(data) => updateBOS(editBOS!.id, data)} onCancel={() => setEditBOS(null)} initial={editBOS} />
            </div>
          </div>
        )}
        {/* PREVIEW MODAL */}
        {previewBOS && <BOSPreviewModal bos={previewBOS} onClose={() => setPreviewBOS(null)} />}
      </main>
    </>
  )
}