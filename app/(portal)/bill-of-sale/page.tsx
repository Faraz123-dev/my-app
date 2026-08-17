'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; stock_number: string | null; year: number | null; make: string | null; model: string | null
  vin: string; colour: string | null; kilometers: number | null
  sold_price: number | null; customer: string | null; date_sold: string | null
}

type BOS = {
  id: string; created_at: string; truck_id: string | null
  truck_year: number | null; truck_make: string | null; truck_model: string | null
  truck_vin: string | null; truck_colour: string | null; truck_km: number | null
  buyer_name: string | null; buyer_address: string | null; buyer_phone: string | null; buyer_company: string | null; buyer_email: string | null; sold_with_safety: boolean; is_parts_truck?: boolean
  price: number; tax_rate: number; tax_amount: number; total: number
  deposit: number; sale_date: string | null; notes: string | null; invoice_number: string | null
  is_financed?: boolean; deposit_valid_days?: number | null
}

const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }
const TD: React.CSSProperties = { padding: '12px 14px', color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 15 }

const emptyForm = {
  truck_id: '',
  truck_year: '', truck_make: '', truck_model: '', truck_vin: '', truck_colour: '', truck_km: '',
  buyer_name: '', buyer_address: '', buyer_phone: '',
  price: '', tax_rate: '13', deposit: '0', sale_date: new Date().toISOString().split('T')[0], notes: '',
  invoice_number: '',
  sold_with_safety: false,
  buyer_company: '',
  buyer_email: '',
  is_parts_truck: false,
  is_financed: false,
  deposit_valid_days: '5',
}

type FormType = typeof emptyForm

// Place your logo file at: public/logo.png
const LOGO_SRC = '/logo.png'

function addBusinessDays(startDate: Date, days: number): Date {
  const result = new Date(startDate)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++   // skip Sat (6) and Sun (0)
  }
  return result
}

function bosHTML(bos: BOS): string {
  const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
  const saleDate = saleDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit
  const validDaysLabel = bos.deposit_valid_days ?? 5
  let validTillStr = ''
  if (bos.is_financed) {
    const validTill = addBusinessDays(saleDateObj, validDaysLabel)
    validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  }
  const formattedPhone = bos.buyer_phone ? bos.buyer_phone.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || bos.buyer_phone : '___________________________'
  const logoAbs = typeof window !== 'undefined' ? `${window.location.origin}${LOGO_SRC}` : LOGO_SRC

  return `<!DOCTYPE html>
<html>
<head>
<title>Sales Agreement</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; }
  .page { width: 100%; min-height: 100vh; padding: 36px 54px; display: flex; flex-direction: column; }
  .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 14px; margin-bottom: 18px; }
  .header-logo { height: 110px; width: auto; object-fit: contain; }
  .header-title { font-size: 38px; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1; text-align: right; }
  .header-company { font-size: 15px; font-weight: 700; margin-top: 4px; text-align: right; }
  .header-sub { font-size: 12px; color: #000; margin-top: 2px; text-align: right; }
  .date-bar { border: 1px solid #000; padding: 8px 16px; font-size: 14px; margin-bottom: 16px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 14px; }
  .section-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; border-bottom: 1px dotted #000; }
  .row:last-child { border-bottom: none; }
  .row-lbl { color: #000; }
  .row-val { font-weight: 600; color: #000; }
  .pay-table { width: 100%; border-collapse: collapse; }
  .pay-table td { padding: 8px 10px; font-size: 14px; border: 1px solid #000; color: #000; font-weight: 600; }
  .pay-table .lbl { width: 58%; }
  .pay-table .amt { text-align: right; }
  .pay-table .subtotal td { font-weight: 700; border-top: 2px solid #000; }
  .pay-table .deposit-row td { font-style: italic; }
  .pay-table .grand td { border: 2px solid #000; font-weight: 900; font-size: 16px; }
  .divider { border: none; border-top: 1px solid #000; margin: 12px 0; }
  .disclaimer-box { border: 2px solid #000; text-align: center; font-weight: 900; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; padding: 12px; margin-bottom: 8px; }
  .validity-box { border: 1px dashed #000; text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 6px; margin-bottom: 14px; color: #000; }
  .legal-box { border-left: 3px solid #000; padding: 10px 14px; font-size: 13px; line-height: 1.8; color: #000; margin-bottom: 14px; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; padding-top: 14px; border-top: 1px solid #000; margin-top: 40px; }
  .sig-space { height: 50px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }
  .sig-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #000; }
  .sig-name { font-size: 13px; color: #000; margin-top: 3px; }
  @media print {
    .page { padding: 24px 44px; }
    @page { size: letter portrait; margin: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="${logoAbs}" class="header-logo" alt="Logo" />
    <div>
      <div class="header-title">Sales Agreement</div>
      <div class="header-company">Aamir &amp; Sons Trading Ltd.</div>
      <div class="header-sub">2 Blair Dr, Brampton, ON L6T 2H5 &bull; HST # 704391101RT0001</div>
      <div class="header-sub">Tel: 647-563-5783 &bull; aamirandsons@hotmail.com</div>
    </div>
  </div>

  <div class="date-bar" style="display:flex;justify-content:space-between;">
    <span>Date of Sale: &nbsp;<strong>${saleDate}</strong></span>
    <span>Invoice #: &nbsp;<strong>${bos.invoice_number || '—'}</strong></span>
  </div>

  <div class="two-col">
    <div>
      <div class="section-title">Seller</div>
      <div class="row"><span class="row-lbl">Company</span><span class="row-val">Aamir &amp; Sons Trading Ltd.</span></div>
      <div class="row"><span class="row-lbl">Address</span><span class="row-val">2 Blair Dr, Brampton, ON L6T 2H5</span></div>
      <div class="row"><span class="row-lbl">HST #</span><span class="row-val">704391101RT0001</span></div>
    </div>
    <div>
      <div class="section-title">Buyer</div>
      <div class="row"><span class="row-lbl">Name</span><span class="row-val">${bos.buyer_name || '___________________________'}</span></div>
      <div class="row"><span class="row-lbl">Company</span><span class="row-val">${(bos as any).buyer_company || '___________________________'}</span></div>
      <div class="row"><span class="row-lbl">Address</span><span class="row-val">${bos.buyer_address || '___________________________'}</span></div>
      <div class="row"><span class="row-lbl">Phone</span><span class="row-val">${formattedPhone}</span></div>
    </div>
  </div>

  <hr class="divider" />

  <div class="two-col">
    <div>
      <div class="section-title">Asset Description</div>
      <div class="row"><span class="row-lbl">Year</span><span class="row-val">${bos.truck_year || '___'}</span></div>
      <div class="row"><span class="row-lbl">Make</span><span class="row-val">${bos.truck_make || '___________'}</span></div>
      <div class="row"><span class="row-lbl">Model</span><span class="row-val">${bos.truck_model || '___________'}</span></div>
      <div class="row"><span class="row-lbl">Color</span><span class="row-val">${bos.truck_colour || '___________'}</span></div>
      <div class="row"><span class="row-lbl">VIN</span><span class="row-val" style="font-family:monospace;font-size:12px;">${bos.truck_vin || '___________________'}</span></div>
      <div class="row"><span class="row-lbl">Odometer</span><span class="row-val">${(bos as any).is_parts_truck ? 'PARTS' : (bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________')}</span></div>
    </div>
    <div>
      <div class="section-title">Payment Summary</div>
      <table class="pay-table">
        <tr><td class="lbl">Sale Price</td><td class="amt">$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td class="lbl">HST (${bos.tax_rate}%)</td><td class="amt">$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td></tr>
        <tr class="subtotal"><td class="lbl">Total</td><td class="amt">$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</td></tr>
        ${deposit > 0 ? `
        <tr class="deposit-row"><td class="lbl">Nonrefundable Deposit Paid</td><td class="amt">&minus; $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</td></tr>
        <tr class="grand"><td>BALANCE DUE</td><td style="text-align:right;">$${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</td></tr>
        ` : `
        <tr class="grand"><td>AMOUNT DUE</td><td style="text-align:right;">$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</td></tr>
        `}
      </table>
    </div>
  </div>

  <hr class="divider" />

  <div class="disclaimer-box">${(bos as any).sold_with_safety ? 'SOLD WITH SAFETY' : 'Sold As-Is Where-Is &mdash; No Guarantee &mdash; No Warranty'}</div>
  ${validTillStr ? `<div class="validity-box">&#9432;&nbsp; This Sales Agreement is Valid until &nbsp;${validTillStr}&nbsp; (${validDaysLabel} business day${validDaysLabel === 1 ? '' : 's'})</div>` : ''}

  <div class="legal-box">
    I am the legal owner of the above-described vehicle as evidenced by the attached Registration (and where applicable, the title) for the vehicle or equipment. The above-described vehicle/equipment is clear title: there are no liens or encumbrances against this vehicle/equipment. The buyer acknowledges they have inspected the vehicle and agree to purchase it in its current as-is condition with no warranties expressed or implied. All sales are final.<br/><br/>
    Agreed to this on <strong>${saleDate}</strong>, in the city of Brampton, Ontario.
  </div>

  ${(bos as any).notes ? `<div style="font-size:12px;color:#555;margin-bottom:12px;font-style:italic;border-left:2px solid #bbb;padding:4px 10px;">${(bos as any).notes}</div>` : ''}

  <div class="sig-grid">
    <div>
      <div class="sig-space"></div>
      <div class="sig-label">Signature of Seller</div>
      <div class="sig-name">Aamir &amp; Sons Trading Ltd.</div>
    </div>
    <div>
      <div class="sig-space"></div>
      <div class="sig-label">Signature of Buyer</div>
      <div class="sig-name">${(bos as any).buyer_company || bos.buyer_name || ''}</div>
    </div>
  </div>
</div>
</body>
</html>`
}

function openBOS(bos: BOS) {
  const blob = new Blob([bosHTML(bos)], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function BOSForm({ trucks, customers, onSave, onCancel, onCustomerCreated, initial }: {
  trucks: Truck[]; customers: any[]; onSave: (data: any) => Promise<void>; onCancel: () => void; onCustomerCreated: () => Promise<void>; initial?: BOS
}) {
  const [form, setForm] = useState<FormType>(initial ? {
    truck_id: initial.truck_id || '',
    truck_year: initial.truck_year ? String(initial.truck_year) : '',
    truck_make: initial.truck_make || '', truck_model: initial.truck_model || '',
    truck_vin: initial.truck_vin || '', truck_colour: initial.truck_colour || '',
    truck_km: initial.truck_km ? String(initial.truck_km) : '',
    buyer_name: initial.buyer_name || '', buyer_address: initial.buyer_address || '',
    buyer_phone: initial.buyer_phone || '',
    price: initial.price ? String(initial.price) : '',
    tax_rate: initial.tax_rate ? String(initial.tax_rate) : '13',
    deposit: initial.deposit ? String(initial.deposit) : '0',
    sale_date: initial.sale_date || new Date().toISOString().split('T')[0],
    notes: initial.notes || '',
    invoice_number: initial.invoice_number || '',
    sold_with_safety: (initial as any).sold_with_safety || false,
    buyer_company: (initial as any).buyer_company || '',
    buyer_email: (initial as any).buyer_email || '',
    is_parts_truck: (initial as any).is_parts_truck || false,
    is_financed: (initial as any).is_financed || false,
    deposit_valid_days: initial.deposit_valid_days != null ? String(initial.deposit_valid_days) : '5',
  } : { ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCust, setNewCust] = useState({ name: '', company: '', phone: '', email: '', address: '' })
  const [savingCust, setSavingCust] = useState(false)

  function onTruckSelect(id: string) {
    if (!id) { setForm(f => ({ ...f, truck_id: '' })); return }
    const t = trucks.find(t => t.id === id)
    if (!t) return
    setForm(f => ({
      ...f, truck_id: id,
      truck_year: t.year ? String(t.year) : '', truck_make: t.make || '',
      truck_model: t.model || '', truck_vin: t.vin || '',
      truck_colour: t.colour || '', truck_km: t.kilometers ? String(t.kilometers) : '',
      buyer_name: t.customer || '', price: t.sold_price ? String(t.sold_price) : '',
      sale_date: t.date_sold || new Date().toISOString().split('T')[0],
      invoice_number: t.stock_number && /^A&S-\d+$/.test(t.stock_number)
      ? `INV#-${t.stock_number.replace('A&S-', '')}`
      : f.invoice_number,
    }))
  }

  const price = parseFloat(form.price) || 0
  const taxRate = parseFloat(form.tax_rate) || 0
  const deposit = parseFloat(form.deposit) || 0
  const taxAmount = price * (taxRate / 100)
  const total = price + taxAmount
  const balanceDue = total - deposit

  async function handleAddCustomer() {
    if (!newCust.name) return alert('Name is required.')
    setSavingCust(true)
    const { data, error } = await supabase.from('customers').insert([newCust]).select().single()
    if (error) { alert('Error: ' + error.message); setSavingCust(false); return }
    await onCustomerCreated()
    setForm(f => ({ ...f, buyer_name: data.name || '', buyer_phone: data.phone || '', buyer_address: data.address || '', buyer_company: data.company || '', buyer_email: data.email || '' }))
    setNewCust({ name: '', company: '', phone: '', email: '', address: '' })
    setShowAddCustomer(false)
    setSavingCust(false)
  }

  async function handleSave() {
    if (!form.buyer_name) return alert('Buyer name is required.')
    if (!form.price) return alert('Price is required.')
    setSaving(true)
    await onSave({
      truck_id: form.truck_id || null,
      truck_year: parseInt(form.truck_year) || null, truck_make: form.truck_make || null,
      truck_model: form.truck_model || null, truck_vin: form.truck_vin || null,
      truck_colour: form.truck_colour || null, truck_km: parseInt(form.truck_km) || null,
      buyer_name: form.buyer_name || null, buyer_address: form.buyer_address || null,
      buyer_phone: form.buyer_phone || null,
      price, tax_rate: taxRate, tax_amount: taxAmount, total, deposit,
      sale_date: form.sale_date || null, notes: form.notes || null,
      invoice_number: form.invoice_number || null,
      sold_with_safety: form.sold_with_safety,
      buyer_company: form.buyer_company || null,
      buyer_email: form.buyer_email || null,
      is_parts_truck: form.is_parts_truck || false,
      is_financed: form.is_financed || false,
      deposit_valid_days: parseInt(form.deposit_valid_days) || 5,
    })
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={LS}>Invoice Number <span style={{ color: 'var(--text4)', fontWeight: 400 }}>(auto-generated if blank)</span></label>
        <input style={{ ...IS, minHeight: 44, fontFamily: 'monospace' }} placeholder="INV-000001" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={LS}>Inventory</label>
          <select style={{ ...IS, minHeight: 44 }} value={form.truck_id} onChange={e => onTruckSelect(e.target.value)}>
            <option value="">— Enter manually —</option>
            {trucks.map(t => <option key={t.id} value={t.id}>{t.stock_number || t.vin} {'-'} {t.year} {t.make} {t.model}</option>)}
          </select>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <button onClick={() => setShowAddCustomer(v => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 3 }}>
              {showAddCustomer ? '✕ Cancel' : '+ New Customer'}
            </button>
          </div>
          {showAddCustomer ? (
            <div style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input style={{ ...IS, minHeight: 38 }} placeholder="Full Name *" value={newCust.name} onChange={e => setNewCust(c => ({ ...c, name: e.target.value }))} />
              <input style={{ ...IS, minHeight: 38 }} placeholder="Company" value={newCust.company} onChange={e => setNewCust(c => ({ ...c, company: e.target.value }))} />
              <input style={{ ...IS, minHeight: 38 }} placeholder="Phone" value={newCust.phone} onChange={e => setNewCust(c => ({ ...c, phone: e.target.value }))} />
              <input style={{ ...IS, minHeight: 38 }} placeholder="Email" value={newCust.email} onChange={e => setNewCust(c => ({ ...c, email: e.target.value }))} />
              <input style={{ ...IS, minHeight: 38 }} placeholder="Address" value={newCust.address} onChange={e => setNewCust(c => ({ ...c, address: e.target.value }))} />
              <button onClick={handleAddCustomer} disabled={savingCust}
                style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: savingCust ? 0.7 : 1 }}>
                {savingCust ? 'Saving...' : '✓ Save & Auto-fill'}
              </button>
            </div>
          ) : (
            <select style={{ ...IS, minHeight: 44 }} defaultValue=""
              onChange={e => {
                const c = customers.find((c: any) => c.id === e.target.value)
                if (!c) return
                setForm(f => ({ ...f, buyer_name: c.name || '', buyer_phone: c.phone || '', buyer_address: c.address || '', buyer_company: c.company || '', buyer_email: c.email || '' }))
              }}>
              <option value="">— Select customer —</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          )}
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
        <div>
          <label style={LS}>KM</label>
          <input style={{ ...IS, minHeight: 44 }} type="number" placeholder="450000" value={form.truck_km} onChange={e => setForm(f => ({ ...f, truck_km: e.target.value }))} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.is_parts_truck || false} onChange={e => setForm(f => ({ ...f, is_parts_truck: e.target.checked }))}
              style={{ width: 14, height: 14, accentColor: '#EAB308', cursor: 'pointer' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)' }}>Parts Truck</span>
          </label>
        </div>
        <div><label style={LS}>VIN</label><input style={{ ...IS, minHeight: 44, fontFamily: 'monospace' }} placeholder="17-char VIN" value={form.truck_vin} onChange={e => setForm(f => ({ ...f, truck_vin: e.target.value }))} /></div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 10 }}>BUYER</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Full Name *</label><input style={{ ...IS, minHeight: 44 }} placeholder="John Smith" value={form.buyer_name} onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))} /></div>
        <div><label style={LS}>Company Name</label><input style={{ ...IS, minHeight: 44 }} placeholder="ABC Trucking Inc." value={form.buyer_company} onChange={e => setForm(f => ({ ...f, buyer_company: e.target.value }))} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div><label style={LS}>Email</label><input style={{ ...IS, minHeight: 44 }} placeholder="john@example.com" type="email" value={form.buyer_email} onChange={e => setForm(f => ({ ...f, buyer_email: e.target.value }))} /></div>
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
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={form.sold_with_safety} onChange={e => setForm(f => ({ ...f, sold_with_safety: e.target.checked }))}
            style={{ width: 18, height: 18, accentColor: '#EAB308', cursor: 'pointer' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Truck sold with safety</span>
          <span style={{ fontSize: 12, color: 'var(--text4)' }}>(changes warranty disclaimer on invoice)</span>
        </label>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={form.is_financed || false} onChange={e => setForm(f => ({ ...f, is_financed: e.target.checked }))}
            style={{ width: 18, height: 18, accentColor: '#EAB308', cursor: 'pointer' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Financed</span>
          <span style={{ fontSize: 12, color: 'var(--text4)' }}>(adds "valid for X business days" notice to invoice)</span>
        </label>
        {form.is_financed && (
          <div style={{ marginTop: 10, marginLeft: 28, maxWidth: 220 }}>
            <label style={LS}>Deposit Valid For (business days)</label>
            <input style={{ ...IS, minHeight: 44 }} type="number" min="1" placeholder="5"
              value={form.deposit_valid_days}
              onChange={e => setForm(f => ({ ...f, deposit_valid_days: e.target.value }))} />
          </div>
        )}
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={LS}>Notes (optional)</label>
        <textarea style={{ ...IS, height: 60, resize: 'vertical' }} placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: saving ? 'default' : 'pointer', minHeight: 50, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Sales Agreement'}
        </button>
      </div>
    </div>
  )
}

// ─── Shared document renderer ───────────────────────────────────────────────
function BOSDocument({ bos }: { bos: BOS }) {
  const saleDateObj = bos.sale_date ? new Date(bos.sale_date + 'T12:00:00') : new Date()
  const saleDate = saleDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const deposit = bos.deposit || 0
  const totalRemaining = bos.total - deposit
  const validDaysLabel = bos.deposit_valid_days ?? 5
  let validTillStr = ''
  if (bos.is_financed) {
    const validTill = addBusinessDays(saleDateObj, validDaysLabel)
    validTillStr = validTill.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
  }

  const rowS: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px dotted #ccc' }
  const secT: React.CSSProperties = { fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', borderBottom: '2px solid #000', paddingBottom: 3, marginBottom: 8 }

  return (
    <div style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: 13, color: '#000', padding: '24px 40px', position: 'relative', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px double #000', paddingBottom: 12, marginBottom: 14 }}>
        <img src={LOGO_SRC} style={{ height: 150, width: 'auto', objectFit: 'contain' }} alt="Logo" />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>Sales Agreement</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>Aamir &amp; Sons Trading Ltd.</div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>2 Blair Dr, Brampton, ON L6T 2H5 &bull; HST # 704391101RT0001</div>
          <div style={{ fontSize: 11, color: '#444' }}>Tel: 647-563-5783 &bull; aamirandsons@hotmail.com</div>
        </div>
      </div>

      {/* Date / Invoice */}
      <div style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '7px 14px', fontSize: 15, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
        <span>Date of Sale: &nbsp;<strong>{saleDate}</strong></span>
        <span>Invoice #: &nbsp;<strong>{bos.invoice_number || '—'}</strong></span>
      </div>

      {/* Seller / Buyer */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
        <div>
          <div style={secT}>Seller</div>
          {([["Company","Aamir & Sons Trading Ltd."],["Address","2 Blair Dr, Brampton, ON L6T 2H5"],["HST #","704391101RT0001"]] as [string,string][]).map(([l,v]) => (
            <div key={l} style={rowS}><span style={{ color: '#555' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
          ))}
        </div>
        <div>
          <div style={secT}>Buyer</div>
          {([
            ["Name", bos.buyer_name || '___________________________'],
            ["Company", (bos as any).buyer_company || '___________________________'],
            ["Address", bos.buyer_address || '___________________________'],
            ["Phone", bos.buyer_phone ? bos.buyer_phone.replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{4})$/, '($1) $2-$3') || bos.buyer_phone : '___________________________'],
          ] as [string,string][]).map(([l,v]) => (
            <div key={l} style={rowS}><span style={{ color: '#555' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
          ))}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '0 0 12px' }} />

      {/* Asset / Payment */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 12 }}>
        <div>
          <div style={secT}>Asset Description</div>
          {([
            ["Year", String(bos.truck_year || '___')],
            ["Make", bos.truck_make || '___________'],
            ["Model", bos.truck_model || '___________'],
            ["Color", bos.truck_colour || '___________'],
            ["VIN", bos.truck_vin || '___________________'],
            ["Odometer", (bos as any).is_parts_truck ? 'PARTS' : (bos.truck_km ? bos.truck_km.toLocaleString() + ' km' : '___________')],
          ] as [string,string][]).map(([l,v]) => (
            <div key={l} style={rowS}><span style={{ color: '#555' }}>{l}</span><span style={{ fontWeight: 600, fontFamily: l === 'VIN' ? 'monospace' : 'inherit', fontSize: l === 'VIN' ? 14 : 15 }}>{v}</span></div>
          ))}
        </div>
        <div>
          <div style={secT}>Payment Summary</div>
          <div style={{ border: '1px solid #ccc', borderRadius: 3, overflow: 'hidden' }}>
            {([
              { l: 'Sale Price', v: `$${bos.price.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff' },
              { l: `HST (${bos.tax_rate}%)`, v: `$${bos.tax_amount.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff' },
              { l: 'Total', v: `$${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD`, bold: true, bg: '#f5f5f5' },
              ...(deposit > 0 ? [{ l: 'Nonrefundable Deposit Paid', v: `− $${deposit.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`, bold: false, bg: '#fff', italic: true, color: '#666' }] : []),
            ] as any[]).map((row: any) => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: row.bg, borderBottom: '1px solid #ccc', fontWeight: row.bold ? 700 : 400, fontSize: 13, color: row.color || '#000', fontStyle: row.italic ? 'italic' : 'normal' }}>
                <span>{row.l}</span><span>{row.v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 10px', background: '#000', color: '#fff', fontWeight: 900, fontSize: 14 }}>
              <span>{deposit > 0 ? 'BALANCE DUE' : 'AMOUNT DUE'}</span>
              <span>${totalRemaining.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD</span>
            </div>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '0 0 10px' }} />

      {/* Warranty */}
      <div style={{ border: '2px solid #000', textAlign: 'center', fontWeight: 900, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 10, marginBottom: 8 }}>
        {(bos as any).sold_with_safety ? 'SOLD WITH SAFETY' : 'Sold As-Is Where-Is — No Guarantee — No Warranty'}
      </div>

      {validTillStr && (
        <div style={{ border: '1px dashed #666', textAlign: 'center', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', padding: 6, marginBottom: 10, color: '#333' }}>
          ℹ️ This Sales Agreement is Valid until {validTillStr} ({validDaysLabel} business day{validDaysLabel === 1 ? '' : 's'})
        </div>
      )}

      {/* Legal text */}
      <div style={{ borderLeft: '3px solid #999', padding: '8px 14px', background: '#fafafa', fontSize: 11, lineHeight: 1.5, color: '#333', marginBottom: 8 }}>
        I am the legal owner of the above-described vehicle as evidenced by the attached Registration (and where applicable, the title) for the vehicle or equipment. The above-described vehicle/equipment is clear title: there are no liens or encumbrances against this vehicle/equipment. The buyer acknowledges they have inspected the vehicle and agree to purchase it in its current as-is condition with no warranties expressed or implied. All sales are final.
        {' '}Agreed to this on <strong>{saleDate}</strong>, in the city of Brampton, Ontario.
      </div>

      {bos.notes && (
        <div style={{ fontSize: 11, color: '#555', marginBottom: 10, fontStyle: 'italic', borderLeft: '2px solid #bbb', paddingLeft: 10, paddingTop: 4, paddingBottom: 4 }}>
          {bos.notes}
        </div>
      )}

      {/* Signatures */}
      <div style={{ paddingTop: 8, borderTop: '1px solid #ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginTop: 10 }}>
        {([
          ["Signature of Seller", "Aamir & Sons Trading Ltd.", null],
          ["Signature of Buyer", (bos as any).buyer_company || bos.buyer_name || '', null],
        ] as [string,string,string|null][]).map(([label, name]) => (
          <div key={label}>
            <div style={{ height: 36, borderBottom: '1.5px solid #000', marginBottom: 4 }} />
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' }}>{label}</div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Preview modal ───────────────────────────────────────────────────────────
function BOSPreviewModal({ bos, onClose }: { bos: BOS; onClose: () => void }) {
  const handlePrint = () => window.print()

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .bos-row { border-bottom:1px solid var(--border2); transition:background 0.15s; }
        .bos-row:hover { background:var(--hover); }
      `}</style>

      {/* On-screen modal */}
      <div className="no-print" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', color: '#000', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9f9f6', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f0f0f' }}>Sales Agreement Preview</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handlePrint} style={{ background: '#b45309', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🖨 Print / PDF</button>
              <button onClick={onClose} style={{ background: '#eee', border: 'none', color: '#333', borderRadius: '50%', width: 32, height: 32, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <BOSDocument bos={bos} />
          </div>
        </div>
      </div>
    </>
  )
}

export default function OfSalePagBille() {
  const [bosList, setBosList]       = useState<BOS[]>([])
  const [trucks, setTrucks]         = useState<Truck[]>([])
  const [customers, setCustomers]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [editBOS, setEditBOS]       = useState<BOS | null>(null)
  const [previewBOS, setPreviewBOS] = useState<BOS | null>(null)
  const [printBOS, setPrintBOS]     = useState<BOS | null>(null)
  const [isMobile, setIsMobile]     = useState(false)
  const [search, setSearch]         = useState('')

  useEffect(() => {
    loadAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'bos-print-style'
    style.innerHTML = `
      @media print {
        @page { margin: 0; size: A4; }
        body * { visibility: hidden !important; }
        .no-print { display: none !important; }
        #bos-print-root { display: block !important; visibility: visible !important; position: fixed !important; inset: 0 !important; background: #fff !important; z-index: 9999 !important; }
        #bos-print-root * { visibility: visible !important; }
      }
    `
    document.head.appendChild(style)
    return () => document.getElementById('bos-print-style')?.remove()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: bosData }, { data: truckData }, { data: customerData }] = await Promise.all([
      supabase.from('bills_of_sale').select('*').order('created_at', { ascending: false }),
      supabase.from('Inventory Data').select('id, year, make, model, vin, colour, kilometers, sold_price, customer, date_sold, stock_number').order('bought_on', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
    ])
    setBosList(bosData || [])
    setTrucks(truckData || [])
    setCustomers(customerData || [])
    setLoading(false)
  }

  async function generateInvoiceNumber(): Promise<string> {
    const { data } = await supabase
      .from('bills_of_sale')
      .select('invoice_number')
      .not('invoice_number', 'is', null)
      .order('invoice_number', { ascending: false })
      .limit(1)
    const last = data?.[0]?.invoice_number
    if (last && /^INV-\d{6}$/.test(last)) {
      const num = parseInt(last.replace('INV-', '')) + 1
      return `INV-${String(num).padStart(6, '0')}`
    }
    return 'INV-000001'
  }

  async function saveBOS(data: any) {
    const invoice_number = data.invoice_number || await generateInvoiceNumber()
    const { error } = await supabase.from('bills_of_sale').insert([{ ...data, invoice_number }])
    if (error) { alert('Error: ' + error.message); return }
    setShowAdd(false); loadAll()
  }

  async function updateBOS(id: string, data: any) {
    const { error } = await supabase.from('bills_of_sale').update(data).eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    setEditBOS(null); loadAll()
  }

  async function deleteBOS(id: string) {
    if (!confirm('Delete this Sales Agreement?')) return
    await supabase.from('bills_of_sale').delete().eq('id', id); loadAll()
  }

  const filtered = bosList.filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return [b.buyer_name, b.truck_make, b.truck_model, b.truck_vin].some(v => v?.toLowerCase().includes(q))
  })

  const fmt = (d: string | null) => {
    if (!d) return '—'
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } } .bos-row { border-bottom:1px solid var(--border2); transition:background 0.15s; } .bos-row:hover { background:var(--hover); }`}</style>
      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>SALES</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Sales Agreement</h1>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 99, padding: isMobile ? '10px 18px' : '9px 20px', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(234,179,8,0.35)', minHeight: 44 }}>+ New Sales Agreement</button>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ label: 'Total', value: bosList.length, color: 'var(--text2)' }, { label: 'Revenue', value: `$${bosList.reduce((s, b) => s + b.total, 0).toLocaleString('en-CA', { minimumFractionDigits: 0 })}`, color: 'var(--gold)' }].map(s => (
            <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '14px 18px', flex: 1, minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text4)', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 15 }}>🔍</span>
          <input style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px 10px 36px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', minHeight: 44 }} placeholder="Search buyer, truck, VIN..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div style={{ width: 36, height: 36, border: '2px solid transparent', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text4)', fontSize: 14 }}>{bosList.length === 0 ? 'No bills of sale yet.' : 'No results match your search.'}</div>
        ) : (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Invoice #','Date','Buyer','Vehicle','VIN','Price','HST','Total','Deposit','Balance',''].map(h => (
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
                        <td style={{ ...TD, fontFamily: 'monospace', fontWeight: 700, color: 'var(--gold)' }}>{bos.invoice_number || '—'}</td>
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
                            {bos.truck_id && <button onClick={() => window.location.href = `/inventory/${bos.truck_id}`} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🚛 View Truck</button>}
                            <button onClick={() => setPreviewBOS(bos)} style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue)', color: 'var(--blue)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Preview</button>
                            {bos.buyer_email && (() => {
                              const emailSubject = encodeURIComponent(`Sales Agreement - ${bos.invoice_number || 'Invoice'} - ${bos.truck_year} ${bos.truck_make} ${bos.truck_model}`)
                              const emailBody = encodeURIComponent(`Dear ${bos.buyer_name},\n\nPlease find attached your Sales Agreement for the following vehicle:\n\nVehicle: ${bos.truck_year} ${bos.truck_make} ${bos.truck_model}\nVIN: ${bos.truck_vin}\nInvoice #: ${bos.invoice_number || '—'}\nTotal: $${bos.total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} CAD\n\nPlease don't hesitate to reach out if you have any questions.\n\nBest regards,\nAamir & Sons Trading Ltd.\n647-563-5783\naamirandsons@hotmail.com`)
                              const emailHref = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(bos.buyer_email!)}&subject=${emailSubject}&body=${emailBody}`
                              return (
                                <a href={emailHref} target="_blank" rel="noopener noreferrer"
                                  style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-block' }}>
                                  ✉️ Email
                                </a>
                              )
                            })()}
                            <button onClick={() => openBOS(bos)} style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>🖨 Print</button>
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
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border2)', fontSize: 13, color: 'var(--text3)' }}>{filtered.length} of {bosList.length} bills of sale</div>
          </div>
        )}
        {showAdd && (
          <div onClick={() => setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 660, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>New Sales Agreement</h2>
                <button onClick={() => setShowAdd(false)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <BOSForm trucks={trucks} customers={customers} onSave={saveBOS} onCancel={() => setShowAdd(false)} onCustomerCreated={async () => { const { data } = await supabase.from('customers').select('*').order('name'); setCustomers(data || []) }} />
            </div>
          </div>
        )}
        {editBOS && (
          <div onClick={() => setEditBOS(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 660, maxHeight: '92vh', overflowY: 'auto' }}>
              {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 20px' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Edit Sales Agreement</h2>
                <button onClick={() => setEditBOS(null)} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <BOSForm trucks={trucks} customers={customers} onSave={(data) => updateBOS(editBOS!.id, data)} onCancel={() => setEditBOS(null)} onCustomerCreated={async () => { const { data } = await supabase.from('customers').select('*').order('name'); setCustomers(data || []) }} initial={editBOS} />
            </div>
          </div>
        )}
        {previewBOS && !printBOS && (
          <div className="no-print">
            <BOSPreviewModal bos={previewBOS} onClose={() => setPreviewBOS(null)} />
          </div>
        )}
        <div id="bos-print-root" style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 9999, visibility: printBOS ? 'visible' : 'hidden', display: 'block' }}>
          {printBOS && <BOSDocument bos={printBOS} />}
        </div>
      </main>
    </>
  )
}