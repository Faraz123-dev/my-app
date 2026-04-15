'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  stock_number: string | null
  horsepower: number | null
  ratio: string | null
  date_sold: string | null; sold_price: number | null; customer: string | null
  payment_status: string | null; notes: string | null; photo_url: string | null
  listing_platform: string | null; listing_link: string | null
  listing_date: string | null; asking_price: number | null
  found_by: string | null; delivered_by: string | null; from_location: string | null
  eta_recon: string | null
}
type Part      = { id: string; part: string; category: string; qty: number; unit_cost: number; date: string | null; invoice_url: string | null }
type Labor     = { id: string; tech: string; hours: number; rate: number; date: string | null; invoice_url: string | null }
type Invoice = { id: string; vendor: string; description: string; amount: number; qty: number; status: string; date: string | null; invoice_url: string | null }
type OtherCost = { id: string; category: string; amount: number; date: string | null; notes: string | null; invoice_url: string | null }
type Offer     = { id: string; amount: number; date: string | null; notes: string | null; accepted: boolean }
type Doc       = { id: string; category: string; name: string; url: string; created_at: string }
type Commission = { id: string; truck_id: string; person: string; amount: number; is_auto: boolean; paid: boolean }

const TEAM = ['Faiz Aamir', 'Faraz Aamir', 'Umar Aamir', 'Waleed Aamir']
const FAIZ_RATE = 0.30

const STATUS_PIPELINE = ['Intake', 'Purchased', 'In Reconditioning', 'Ready to List', 'Listed', 'Deal Pending', 'Sold']
const DOC_CATEGORIES = ['Purchase Docs', 'Inspection & Safety', 'Sales Docs', 'Carfax & Lien Documents']

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Purchased:           { bg: '#1a1a1a', color: '#888',    border: '#333'    },
  'In Reconditioning': { bg: '#1a2a1a', color: '#22c55e', border: '#2a4a2a' },
  'Ready to List':     { bg: '#2a2a0a', color: '#EAB308', border: '#4a4a0a' },
  Listed:              { bg: '#1a2a2a', color: '#38bdf8', border: '#2a4a4a' },
  'Deal Pending':      { bg: '#2a1a00', color: '#f97316', border: '#4a3a00' },
  Sold:                { bg: '#0a2a0a', color: '#22c55e', border: '#1a4a1a' },
  Intake:              { bg: '#2a1a00', color: '#EAB308', border: '#4a3a00' },
}

const IS = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif', minHeight: 44 }
const LS = { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block' as const, fontWeight: 500 as const }
const SS = { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }

function Modal({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 14, padding: isMobile ? '20px 20px 32px' : 28, width: '100%', maxWidth: isMobile ? '100%' : 480, maxHeight: '92vh', overflowY: 'auto' }}>
        {isMobile && <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 99, margin: '0 auto 16px' }} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 12, padding: '14px', fontSize: 14, cursor: 'pointer', fontWeight: 500, minHeight: 50 }}>Cancel</button>
          <button onClick={onSave} style={{ flex: 2, background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 800, cursor: 'pointer', minHeight: 50 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

function PreviewModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(url)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.95)' }}>
      {isImage && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.25)', transform: 'scale(1.1)' }} />}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{name}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={url} download={name} onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 600, textDecoration: 'none' }}>⬇ Download</a>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 34, height: 34, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {isImage
          ? <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }} />
          : <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{name}</div>
              <a href={url} target="_blank" rel="noreferrer" style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', color: '#000', borderRadius: 99, padding: '10px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>Open File</a>
            </div>}
      </div>
    </div>
  )
}

function UploadButton({ table, rowId, currentUrl, onUploaded }: { table: string; rowId: string; currentUrl: string | null; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    const path = `${table}/${rowId}-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from(table).update({ invoice_url: data.publicUrl }).eq('id', rowId)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }

  return (
    <div style={{ marginTop: 8 }}>
      {currentUrl && (
        <a href={currentUrl} target="_blank" rel="noreferrer"
          style={{ display: 'inline-block', marginBottom: 8, background: 'var(--green-dim)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 99, padding: '5px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          📄 View Invoice
        </a>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }}
        onClick={() => fileRef.current?.click()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1.5px dashed ${dragging ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s', background: dragging ? 'var(--gold-dim)' : 'transparent', marginTop: 4 }}>
        <span style={{ fontSize: 12 }}>📎</span>
        <span style={{ fontSize: 12, color: uploading ? 'var(--text4)' : dragging ? 'var(--gold)' : 'var(--text3)', fontWeight: 500 }}>
          {uploading ? 'Uploading...' : currentUrl ? 'Replace file' : 'Drop file or click to upload'}
        </span>
      </div>
      <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
        onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file) }} />
    </div>
  )
}

// ── COMMISSION SECTION ────────────────────────────────────────────────────────
function CommissionSection({ truck, profit, commissions, onChanged }: {
  truck: Truck
  profit: number | null
  commissions: Commission[]
  onChanged: () => void
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [manualAmounts, setManualAmounts] = useState<Record<string, string>>({})

  // Initialize manual amounts from DB
  useEffect(() => {
    const init: Record<string, string> = {}
    for (const c of commissions) {
      if (!c.is_auto) init[c.person] = String(c.amount)
    }
    setManualAmounts(init)
  }, [commissions])

    const faizCommission = profit != null ? profit * FAIZ_RATE : null
    const faizRow = commissions.find(c => c.person === 'Faiz Aamir')
    const manualPeople = TEAM.filter(p => p !== 'Faiz Aamir')

  async function upsertFaiz() {
    if (faizCommission == null) return
    setSaving('Faiz Aamir')
    const existing = commissions.find(c => c.person === 'Faiz Aamir')
    if (existing) {
      await supabase.from('commissions').update({ amount: faizCommission, is_auto: true }).eq('id', existing.id)
    } else {
      await supabase.from('commissions').insert([{ truck_id: truck.id, person: 'Faiz Aamir', amount: faizCommission, is_auto: true, paid: false }])
    }
    setSaving(null)
    onChanged()
  }

  async function saveManual(person: string) {
    const amt = parseFloat(manualAmounts[person] || '0') || 0
    setSaving(person)
    const existing = commissions.find(c => c.person === person)
    if (existing) {
      await supabase.from('commissions').update({ amount: amt, is_auto: false }).eq('id', existing.id)
    } else {
      await supabase.from('commissions').insert([{ truck_id: truck.id, person, amount: amt, is_auto: false, paid: false }])
    }
    setSaving(null)
    onChanged()
  }

  async function togglePaid(commission: Commission) {
    await supabase.from('commissions').update({ paid: !commission.paid }).eq('id', commission.id)
    onChanged()
  }

  async function deleteCommission(id: string) {
    await supabase.from('commissions').delete().eq('id', id)
    onChanged()
  }

  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0)
  const totalPaid = commissions.filter(c => c.paid).reduce((s, c) => s + c.amount, 0)

  return (
    <div style={SS}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0, marginBottom: 4 }}>Commissions</h3>
          {totalCommissions > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              Total: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>${totalCommissions.toLocaleString()}</span>
              {totalPaid > 0 && <> · Paid: <span style={{ color: 'var(--green)', fontWeight: 700 }}>${totalPaid.toLocaleString()}</span></>}
              {(totalCommissions - totalPaid) > 0 && <> · Owing: <span style={{ color: 'var(--orange)', fontWeight: 700 }}>${(totalCommissions - totalPaid).toLocaleString()}</span></>}
            </div>
          )}
        </div>
      </div>

      {profit == null && (
        <div style={{ background: 'var(--hover)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text3)', marginBottom: 14, fontStyle: 'italic' }}>
          Profit not yet calculated — add a sold price to enable Faiz's auto-commission.
        </div>
      )}

      {/* Faiz — auto 30% of profit */}
      <div style={{ background: 'var(--hover)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Faiz Aamir</div>
            <div style={{ fontSize: 11, color: 'var(--text4)' }}>Auto · 30% of profit</div>          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: faizCommission != null ? 'var(--gold)' : 'var(--text4)' }}>
              {faizCommission != null ? `$${faizCommission.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </div>
            {faizRow && (
              <div style={{ fontSize: 11, color: faizRow.paid ? 'var(--green)' : 'var(--orange)', fontWeight: 600, marginTop: 2 }}>
                {faizRow.paid ? '✓ Paid' : '⏳ Owing'}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {faizCommission != null && (
            <button onClick={upsertFaiz} disabled={saving === 'Faiz Aamir'}
              style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {saving === 'Faiz Aamir' ? '...' : faizRow ? '🔄 Recalculate' : '+ Add Commission'}
            </button>
          )}
          {faizRow && (
            <>
              <button onClick={() => togglePaid(faizRow)}
                style={{ background: faizRow.paid ? 'var(--green-dim)' : 'var(--hover)', border: `1px solid ${faizRow.paid ? 'var(--green)' : 'var(--border)'}`, color: faizRow.paid ? 'var(--green)' : 'var(--text3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {faizRow.paid ? '✓ Mark Unpaid' : 'Mark Paid'}
              </button>
              <button onClick={() => deleteCommission(faizRow.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 13, padding: '5px 8px' }}>🗑</button>
            </>
          )}
        </div>
      </div>

      {/* Manual people */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {manualPeople.map(person => {
          const row = commissions.find(c => c.person === person)
          return (
            <div key={person} style={{ background: 'var(--hover)', border: `1px solid ${row ? 'var(--border)' : 'var(--border2)'}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{person}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)' }}>Manual entry</div>
                </div>
                {row && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>${row.amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 11, color: row.paid ? 'var(--green)' : 'var(--orange)', fontWeight: 600, marginTop: 2 }}>
                      {row.paid ? '✓ Paid' : '⏳ Owing'}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 160 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>$</span>
                  <input type="number" placeholder="0"
                    style={{ ...IS, paddingLeft: 24, minHeight: 36, fontSize: 13 }}
                    value={manualAmounts[person] ?? (row?.amount ? String(row.amount) : '')}
                    onChange={e => setManualAmounts(prev => ({ ...prev, [person]: e.target.value }))} />
                </div>
                <button onClick={() => saveManual(person)} disabled={saving === person}
                  style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36 }}>
                  {saving === person ? '...' : row ? '🔄 Update' : '+ Add'}
                </button>
                {row && (
                  <>
                    <button onClick={() => togglePaid(row)}
                      style={{ background: row.paid ? 'var(--green-dim)' : 'var(--hover)', border: `1px solid ${row.paid ? 'var(--green)' : 'var(--border)'}`, color: row.paid ? 'var(--green)' : 'var(--text3)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 36 }}>
                      {row.paid ? '✓ Paid' : 'Mark Paid'}
                    </button>
                    <button onClick={() => deleteCommission(row.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: '7px 4px' }}>🗑</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TruckDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isMobile, setIsMobile] = useState(false)

  const [truck,        setTruck]        = useState<Truck | null>(null)
  const [parts,        setParts]        = useState<Part[]>([])
  const [labors,       setLabors]       = useState<Labor[]>([])
  const [invoices,     setInvoices]     = useState<Invoice[]>([])
  const [otherCosts,   setOtherCosts]   = useState<OtherCost[]>([])
  const [offers,       setOffers]       = useState<Offer[]>([])
  const [docs,         setDocs]         = useState<Doc[]>([])
  const [commissions,  setCommissions]  = useState<Commission[]>([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState<'overview' | 'costs' | 'listings' | 'docs'>('overview')

  const [editingDetails,   setEditingDetails]   = useState(false)
  const [editingNotes,     setEditingNotes]      = useState(false)
  const [editingSale,      setEditingSale]       = useState(false)
  const [editingListing,   setEditingListing]    = useState(false)
  const [showPartModal,    setShowPartModal]     = useState(false)
  const [showLaborModal,   setShowLaborModal]    = useState(false)
  const [showInvoiceModal, setShowInvoiceModal]  = useState(false)
  const [showCostModal,    setShowCostModal]     = useState(false)
  const [showOfferModal,   setShowOfferModal]    = useState(false)
  const [editPart,         setEditPart]                  = useState<Part | null>(null)
  const [editLabor,        setEditLabor]                = useState<Labor | null>(null)
  const [editInvoice,      setEditInvoice]            = useState<Invoice | null>(null)
  const [editCost,         setEditCost]                  = useState<OtherCost | null>(null)

  const [detailsForm, setDetailsForm] = useState<any>({})
  const [notesForm,   setNotesForm]   = useState({ notes: '' })
  const [saleForm,    setSaleForm]    = useState({ sold_price: '', date_sold: '', customer: '', payment_status: 'N/A' })
  const [listingForm, setListingForm] = useState({ listing_platform: '', listing_link: '', listing_date: '', asking_price: '' })
  const [newPart,     setNewPart]     = useState({ part: '', category: '', qty: '1', unit_cost: '', date: '' })
  const [newLabor,    setNewLabor]    = useState({ tech: '', hours: '', rate: '', date: '' })
  const [newInvoice, setNewInvoice] = useState({ vendor: '', description: '', amount: '', qty: '1', status: 'Unpaid', date: '' })
  const [newCost,     setNewCost]     = useState({ category: '', amount: '', date: '', notes: '' })
  const [newOffer,    setNewOffer]    = useState({ amount: '', date: '', notes: '', accepted: false })

  const [docCategory, setDocCategory] = useState('Purchase Docs')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [previewDoc,   setPreviewDoc]   = useState<Doc | null>(null)
  const docFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id) fetchAll()
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [id])

  async function fetchAll(showLoader = true) {
    if (showLoader) setLoading(true)
    const [{ data: t }, { data: p }, { data: l }, { data: i }, { data: o }, { data: of }, { data: d }, { data: com }] = await Promise.all([
      supabase.from('Inventory Data').select('*').eq('id', id).single(),
      supabase.from('parts').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('labor').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('vendor_invoices').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('other_costs').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('offers').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('truck_documents').select('*').eq('truck_id', id).order('created_at'),
      supabase.from('commissions').select('*').eq('truck_id', id),
    ])
    if (t) {
      setTruck(t)
      setDetailsForm({ 
        colour: t.colour, kilometers: t.kilometers, bought_from: t.bought_from, 
        purchase_price: t.purchase_price, recondition_cost: t.recondition_cost, 
        date_sold: t.date_sold, customer: t.customer, payment_status: t.payment_status, 
        sold_price: t.sold_price, horsepower: t.horsepower, ratio: t.ratio,
        found_by: t.found_by, delivered_by: t.delivered_by, from_location: t.from_location,
        eta_recon: t.eta_recon || null,      
      })
      setNotesForm({ notes: t.notes || '' })
      setSaleForm({ sold_price: t.sold_price?.toString() || '', date_sold: t.date_sold || '', customer: t.customer || '', payment_status: t.payment_status || 'N/A' })
      setListingForm({ listing_platform: t.listing_platform || '', listing_link: t.listing_link || '', listing_date: t.listing_date || '', asking_price: t.asking_price?.toString() || '' })
    }
    setParts(p || []); setLabors(l || []); setInvoices(i || [])
    setOtherCosts(o || []); setOffers(of || []); setDocs(d || [])
    setCommissions((com || []) as Commission[])
    setLoading(false)
  }

    async function updateStatus(status: string) {
      await supabase.from('Inventory Data').update({ status }).eq('id', id)
      setTruck(prev => prev ? { ...prev, status } : prev)

      if (status === 'Listed' || status === 'Ready to List') {
        const { data: existing } = await supabase
          .from('alert_queue')
          .select('id')
          .eq('truck_id', id)
          .maybeSingle()

        if (!existing) {
          await supabase.from('alert_queue').insert([{
            truck_id: id,
            photo_url: truck?.photo_url || null
          }])
        }
      }
    }

  async function saveDetails() {
  const payload = { 
    ...detailsForm, 
    kilometers: detailsForm.kilometers ? Number(detailsForm.kilometers) : null, 
    purchase_price: detailsForm.purchase_price ? Number(detailsForm.purchase_price) : null, 
    recondition_cost: detailsForm.recondition_cost ? Number(detailsForm.recondition_cost) : null, 
    sold_price: detailsForm.sold_price ? Number(detailsForm.sold_price) : null, 
    horsepower: detailsForm.horsepower ? Number(detailsForm.horsepower) : null,
    date_sold: detailsForm.date_sold || null, customer: detailsForm.customer || null, 
    payment_status: detailsForm.payment_status || null,
    found_by: detailsForm.found_by || null,
    delivered_by: detailsForm.delivered_by || null,
    from_location: detailsForm.from_location || null,
    eta_recon: detailsForm.eta_recon || null,
  }
    await supabase.from('Inventory Data').update(payload).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...payload } : prev)
    setEditingDetails(false)
  }

  async function saveNotes() {
    await supabase.from('Inventory Data').update({ notes: notesForm.notes }).eq('id', id)
    setTruck(prev => prev ? { ...prev, notes: notesForm.notes } : prev)
    setEditingNotes(false)
  }

  async function saveSale() {
    const hasSoldPrice = saleForm.sold_price && parseFloat(saleForm.sold_price) > 0
    const autoPayment = hasSoldPrice && saleForm.payment_status === 'N/A' ? 'Unpaid' : saleForm.payment_status
    const update: any = { sold_price: parseFloat(saleForm.sold_price) || null, date_sold: saleForm.date_sold || null, customer: saleForm.customer || null, payment_status: autoPayment, status: hasSoldPrice ? 'Sold' : (truck?.status === 'Sold' ? 'Deal Pending' : (truck?.status ?? 'Purchased')) }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    setEditingSale(false)
  }

  async function saveListing() {
    const update = { listing_platform: listingForm.listing_platform || null, listing_link: listingForm.listing_link || null, listing_date: listingForm.listing_date || null, asking_price: parseFloat(listingForm.asking_price) || null }
    await supabase.from('Inventory Data').update(update).eq('id', id)
    setTruck(prev => prev ? { ...prev, ...update } : prev)
    setEditingListing(false)
  }

  async function addPart() {
    await supabase.from('parts').insert([{ truck_id: id, part: newPart.part, category: newPart.category, qty: parseFloat(newPart.qty)||1, unit_cost: parseFloat(newPart.unit_cost)||0, date: newPart.date||null }])
    setShowPartModal(false); setNewPart({ part:'', category:'', qty:'1', unit_cost:'', date:'' }); fetchAll()
  }
  async function addLabor() {
    await supabase.from('labor').insert([{ truck_id: id, tech: newLabor.tech, hours: parseFloat(newLabor.hours)||0, rate: parseFloat(newLabor.rate)||0, date: newLabor.date||null }])
    setShowLaborModal(false); setNewLabor({ tech:'', hours:'', rate:'', date:'' }); fetchAll()
  }
    async function addInvoice() {
      const qty = parseInt(newInvoice.qty) || 1
      const { data: inserted, error } = await supabase.from('vendor_invoices').insert([{
        truck_id: id, vendor: newInvoice.vendor, description: newInvoice.description,
        amount: parseFloat(newInvoice.amount)||0, qty, status: newInvoice.status, date: newInvoice.date||null
      }]).select().single()
        if (error) return
        const file = (newInvoice as any)._file
        if (file && inserted) {
          const path = `vendor_invoices/${inserted.id}-${Date.now()}.${file.name.split('.').pop()}`
          const { error: sErr } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
          if (!sErr) {
            const { data } = supabase.storage.from('invoices').getPublicUrl(path)
            await supabase.from('vendor_invoices').update({ invoice_url: data.publicUrl }).eq('id', inserted.id)
          }
        }
        setShowInvoiceModal(false)
        setNewInvoice({ vendor:'', description:'', amount:'', qty:'1', status:'Unpaid', date:'' })
        fetchAll()
      }
  async function addCost() {
    await supabase.from('other_costs').insert([{ truck_id: id, category: newCost.category, amount: parseFloat(newCost.amount)||0, date: newCost.date||null, notes: newCost.notes||null }])
    setShowCostModal(false); setNewCost({ category:'', amount:'', date:'', notes:'' }); fetchAll()
  }
  async function addOffer() {
    await supabase.from('offers').insert([{ truck_id: id, amount: parseFloat(newOffer.amount)||0, date: newOffer.date||null, notes: newOffer.notes||null, accepted: newOffer.accepted }])
    setShowOfferModal(false); setNewOffer({ amount:'', date:'', notes:'', accepted:false }); fetchAll()
  }
  async function updatePart() {
  if (!editPart) return
  await supabase.from('parts').update({ part: editPart.part, category: editPart.category, qty: editPart.qty, unit_cost: editPart.unit_cost, date: editPart.date || null }).eq('id', editPart.id)
  setEditPart(null); fetchAll()
  }
  async function updateLabor() {
    if (!editLabor) return
    await supabase.from('labor').update({ tech: editLabor.tech, hours: editLabor.hours, rate: editLabor.rate, date: editLabor.date || null }).eq('id', editLabor.id)
    setEditLabor(null); fetchAll()
  }
  async function updateInvoice() {
    if (!editInvoice) return
    await supabase.from('vendor_invoices').update({ vendor: editInvoice.vendor, description: editInvoice.description, amount: editInvoice.amount, qty: editInvoice.qty, status: editInvoice.status, date: editInvoice.date || null }).eq('id', editInvoice.id)
    setEditInvoice(null); fetchAll()
  }
  async function updateCost() {
    if (!editCost) return
    await supabase.from('other_costs').update({ category: editCost.category, amount: editCost.amount, date: editCost.date || null, notes: editCost.notes || null }).eq('id', editCost.id)
    setEditCost(null); fetchAll()
  }
  async function deleteRow(table: string, rowId: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from(table).delete().eq('id', rowId); fetchAll()
  }
  async function deleteTruck() {
    if (!confirm('Delete this truck permanently?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    router.push('/inventory')
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingDoc(true)
    const path = `docs/${id}/${docCategory}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('invoices').getPublicUrl(path)
      await supabase.from('truck_documents').insert([{ truck_id: id, category: docCategory, name: file.name, url: data.publicUrl }])
      await fetchAll(false)
    }
    setUploadingDoc(false)
    if (docFileRef.current) docFileRef.current.value = ''
  }

  async function deleteDoc(docId: string, url: string) {
    if (!confirm('Delete this document?')) return
    const path = url.split('/invoices/')[1]
    if (path) await supabase.storage.from('invoices').remove([path])
    await supabase.from('truck_documents').delete().eq('id', docId)
    await fetchAll(false)
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--text3)' }}>Loading...</div>
  if (!truck)  return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--red)' }}>Truck not found</div>

  const partsTotal   = parts.reduce((s, p) => s + p.qty * p.unit_cost, 0)
  const laborTotal   = labors.reduce((s, l) => s + l.hours * l.rate, 0)
  const invoiceTotal = invoices.reduce((s, i) => s + i.amount, 0)
  const otherTotal   = otherCosts.reduce((s, o) => s + o.amount, 0)
  const reconTotal   = partsTotal + laborTotal + invoiceTotal + otherTotal
  const allInCost = (truck.purchase_price || 0) + reconTotal
  const totalCommissions = commissions.reduce((s, c) => s + c.amount, 0)
  const grossProfit = truck.sold_price != null ? truck.sold_price - allInCost : null
  const netProfit = grossProfit != null ? grossProfit - totalCommissions : null
  const profit = grossProfit

  const daysInInventory = truck.bought_on ? Math.floor((Date.now() - new Date(truck.bought_on).getTime()) / 86400000) : null
  const agingLabel = daysInInventory == null ? '' : daysInInventory <= 15 ? '0–15' : daysInInventory <= 30 ? '16–30' : daysInInventory <= 60 ? '31–60' : '60+'
  const currentStepIndex = STATUS_PIPELINE.indexOf(truck.status)
  const docsByCategory = DOC_CATEGORIES.reduce<Record<string, Doc[]>>((acc, cat) => { acc[cat] = docs.filter(d => d.category === cat); return acc }, {})

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .cost-row { display:flex; justify-content:space-between; align-items:flex-start; padding:12px 0; border-bottom:1px solid var(--border2); }
        .cost-row:last-child { border-bottom:none; }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '28px', background:'var(--bg)', minHeight:'100vh', color:'var(--text)', fontFamily:'system-ui,sans-serif', paddingBottom: isMobile ? '100px' : '28px' }}>

        {/* Header */}
        <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, padding: isMobile ? '14px 16px' : '20px 24px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
              <button onClick={() => router.push('/inventory')} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontSize:16, width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
              <div style={{ minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    {(truck as any).stock_number && (
                      <span style={{ fontSize:11, fontFamily:'monospace', fontWeight:800, color:'var(--gold)', background:'var(--gold-dim)', border:'1px solid var(--gold)', borderRadius:6, padding:'2px 8px', flexShrink:0, letterSpacing:'0.05em' }}>
                        {(truck as any).stock_number}
                      </span>
                    )}
                    <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight:700, color:'var(--text)', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{truck.year} {truck.make} {truck.model}</h1>
                  </div>                <div style={{ display:'flex', gap:10, alignItems:'center', marginTop:3, flexWrap:'wrap' }}>
                  <div style={{ fontSize:13, color:'var(--text)', fontFamily:'monospace', letterSpacing:'0.05em' }}>{truck.vin}</div>
                  {truck.found_by && <span style={{ fontSize:11, color:'var(--gold)', fontWeight:600, background:'var(--gold-dim)', borderRadius:99, padding:'1px 8px' }}>🔍 {truck.found_by}</span>}
                  {truck.delivered_by && <span style={{ fontSize:11, color:'var(--text3)' }}>{truck.delivered_by}{truck.from_location ? ` · ${truck.from_location}` : ''}</span>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <select value={truck.status} onChange={e => updateStatus(e.target.value)}
                style={{ background:'var(--card-bg)', border:'1px solid var(--border)', color:'var(--gold)', borderRadius:8, padding:'7px 10px', fontSize:12, cursor:'pointer', outline:'none', minHeight:36 }}>
                {STATUS_PIPELINE.filter(s => s !== 'Intake').map(s => <option key={s}>{s}</option>)}
              </select>
              {!isMobile && <button onClick={deleteTruck} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>🗑 Delete</button>}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(7,1fr)', gap:10, marginBottom:14 }}>         {[
            { label:'PURCHASE',   value:`$${(truck.purchase_price||0).toLocaleString()}`, color:'var(--gold)' },
            { label:'RECON',      value:`$${reconTotal.toLocaleString()}`,                color:'var(--gold)' },
            { label:'ALL-IN',     value:`$${allInCost.toLocaleString()}`,                 color:'var(--gold)' },
            { label:'GROSS PROFIT', value: grossProfit != null ? `${grossProfit < 0 ? '-' : ''}$${Math.abs(grossProfit).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: grossProfit == null ? 'var(--text4)' : grossProfit >= 0 ? 'var(--green)' : 'var(--red)' },
            { label:'COMMISSIONS',  value: totalCommissions > 0 ? `-$${totalCommissions.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: totalCommissions > 0 ? 'var(--orange)' : 'var(--text4)' },
            { label:'NET PROFIT',   value: netProfit != null ? `${netProfit < 0 ? '-' : ''}$${Math.abs(netProfit).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—', color: netProfit == null ? 'var(--text4)' : netProfit >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:10, padding: isMobile ? '10px 12px' : '14px 16px', borderBottom:`2px solid ${s.color === 'var(--text4)' ? 'var(--border)' : s.color}` }}>
              <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:'0.1em', marginBottom:6, fontWeight:600 }}>{s.label}</div>
              <div style={{ fontSize: isMobile ? 15 : 18, fontWeight:700, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {daysInInventory != null && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, fontSize:13, color:'var(--text2)' }}>
            <span style={{ fontWeight:700, color: daysInInventory > 60 ? 'var(--red)' : daysInInventory > 30 ? 'var(--gold)' : 'var(--text2)' }}>{daysInInventory}d</span>
            <span>in inventory</span>
            <span style={{ background:'var(--hover)', border:'1px solid var(--border)', borderRadius:4, padding:'1px 8px', fontSize:11, color:'var(--text3)' }}>· {agingLabel}</span>
            {isMobile && <button onClick={deleteTruck} style={{ marginLeft:'auto', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#ef4444', borderRadius:8, padding:'6px 12px', fontSize:12, cursor:'pointer' }}>🗑</button>}
          </div>
        )}

        {/* Tabs */}
        <div style={{ overflowX:'auto', marginBottom:16 }}>
          <div style={{ display:'flex', gap:6, background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:10, padding:4, width:'fit-content', minWidth: isMobile ? '100%' : 'auto' }}>
            {(['overview','costs','listings','docs'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '10px 8px' : '7px 18px', borderRadius:8, border: activeTab===tab ? '1px solid var(--gold)' : '1px solid transparent', background: activeTab===tab ? 'var(--active)' : 'transparent', color: activeTab===tab ? 'var(--gold)' : 'var(--text3)', fontSize: isMobile ? 12 : 13, cursor:'pointer', fontWeight: activeTab===tab ? 600 : 400, whiteSpace:'nowrap', minHeight:38 }}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
                {tab === 'docs' && docs.length > 0 && <span style={{ marginLeft:4, background:'var(--gold-dim)', color:'var(--gold)', borderRadius:99, padding:'0 5px', fontSize:10, fontWeight:700 }}>{docs.length}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={SS}>
              <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', marginBottom:16, fontWeight:600 }}>STATUS TIMELINE</div>
              <div style={{ overflowX:'auto' }}>
                <div style={{ display:'flex', alignItems:'center', minWidth: isMobile ? 500 : 'auto' }}>
                  {STATUS_PIPELINE.map((step, i) => {
                    const isActive = i === currentStepIndex; const isPast = i < currentStepIndex
                    return (
                      <div key={step} style={{ display:'flex', alignItems:'center', flex: i < STATUS_PIPELINE.length-1 ? 1 : 0 }}>
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                          <div style={{ width:26, height:26, borderRadius:'50%', background: isActive ? 'var(--gold)' : isPast ? 'var(--hover)' : 'var(--card-bg)', border:`2px solid ${isActive ? 'var(--gold)' : isPast ? 'var(--border)' : 'var(--border2)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {isPast && <span style={{ color:'var(--text3)', fontSize:11 }}>✓</span>}
                            {isActive && <span style={{ width:8, height:8, borderRadius:'50%', background:'#000', display:'block' }} />}
                          </div>
                          <div style={{ fontSize:9, color: isActive ? 'var(--gold)' : isPast ? 'var(--text3)' : 'var(--text4)', whiteSpace:'nowrap', fontWeight: isActive ? 700 : 400 }}>{step}</div>
                        </div>
                        {i < STATUS_PIPELINE.length-1 && <div style={{ flex:1, height:1, background: isPast ? 'var(--border)' : 'var(--border2)', margin:'0 4px', marginBottom:20 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:14, marginBottom:14 }}>
              <div style={SS}>
                <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', marginBottom:14, fontWeight:600 }}>KEY DATES</div>
                {[{ label:'Bought', value: truck.bought_on }, { label:'Listed', value: truck.listing_date }, { label:'Sold', value: truck.date_sold }].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border2)' }}>
                    <span style={{ fontSize:13, color:'var(--text2)' }}>{row.label}</span>
                    <span style={{ fontSize:13, color: row.value ? 'var(--text)' : 'var(--text4)' }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>
              <div style={SS}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:600 }}>DETAILS</div>
                  <button onClick={() => setEditingDetails(true)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'#fff', cursor:'pointer', fontSize:12, padding:'5px 10px', borderRadius:6, minHeight:32 }}>✏ Edit</button>
                </div>
                {[
                  { label:'Colour', value: truck.colour },
                  { label:'KM', value: truck.kilometers?.toLocaleString() },
                  { label:'Bought From', value: truck.bought_from },
                  { label:'Found By', value: truck.found_by },
                  { label:'How Delivered', value: truck.delivered_by },
                  { label:'From', value: truck.from_location },
                  { label:'ETA Recon', value: truck.eta_recon },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border2)' }}>
                    <span style={{ fontSize:13, color:'var(--text2)' }}>{row.label}</span>
                    <span style={{ fontSize:13, color: row.value ? (row.label === 'Found By' ? 'var(--gold)' : 'var(--text)') : 'var(--text4)', maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'right', fontWeight: row.label === 'Found By' ? 600 : 400 }}>{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={SS}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:600 }}>NOTES</div>
               <button onClick={() => setEditingNotes(true)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'#fff', cursor:'pointer', fontSize:12, padding:'5px 10px', borderRadius:6, minHeight:32 }}>✏ Edit</button>
              </div>
              <div style={{ fontSize:14, color: truck.notes ? 'var(--text)' : 'var(--text4)', fontStyle: truck.notes ? 'normal' : 'italic', lineHeight:1.6 }}>{truck.notes || 'No notes added.'}</div>
            </div>
          </div>
        )}

        {/* ── COSTS ── */}
        {activeTab === 'costs' && (
          <div style={{ paddingBottom:90 }}>
            {[
              { title:'Parts', items: parts, onAdd: () => setShowPartModal(true), render: (p: Part) => (
                <div key={p.id} className="cost-row" style={{ flexDirection:'column' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{p.part}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{p.category} · Qty {p.qty} · ${p.unit_cost}/ea · {p.date || 'No date'}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:12 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'var(--gold)' }}>${(p.qty*p.unit_cost).toLocaleString()}</span>
                      <button onClick={() => setEditPart(p)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:4, minWidth:32, minHeight:32 }}>✏️</button>
                      <button onClick={() => deleteRow('parts', p.id)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:16, padding:4, minWidth:32, minHeight:32 }}>🗑</button>
                    </div>
                  </div>
                  <UploadButton table="parts" rowId={p.id} currentUrl={p.invoice_url} onUploaded={url => setParts(prev => prev.map(x => x.id===p.id ? {...x,invoice_url:url} : x))} />
                </div>
              )},
              { title:'Labor', items: labors, onAdd: () => setShowLaborModal(true), render: (l: Labor) => (
                <div key={l.id} className="cost-row" style={{ flexDirection:'column' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{l.tech}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{l.hours}h × ${l.rate}/hr · {l.date || 'No date'}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:12 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'var(--gold)' }}>${(l.hours*l.rate).toLocaleString()}</span>
                      <button onClick={() => setEditLabor(l)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:4, minWidth:32, minHeight:32 }}>✏️</button>
                      <button onClick={() => deleteRow('labor', l.id)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:16, padding:4, minWidth:32, minHeight:32 }}>🗑</button>
                    </div>
                  </div>
                  <UploadButton table="labor" rowId={l.id} currentUrl={l.invoice_url} onUploaded={url => setLabors(prev => prev.map(x => x.id===l.id ? {...x,invoice_url:url} : x))} />
                </div>
              )},
].map(section => (
              <div key={section.title} style={SS}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>{section.title}</h3>
                  <button onClick={section.onAdd} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:800, cursor:'pointer', minHeight:36 }}>+ Add</button>
                </div>
                {(section.items as any[]).length === 0
                  ? <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Nothing added yet</div>
                  : (section.items as any[]).map(item => section.render(item))}
              </div>
            ))}
{/* Vendor Invoices — grouped by vendor */}
<div style={SS}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
    <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>Vendor Invoices</h3>
    <button onClick={() => setShowInvoiceModal(true)} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:800, cursor:'pointer', minHeight:36 }}>+ Add</button>
  </div>
  {invoices.length === 0 ? (
    <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Nothing added yet</div>
  ) : (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {Object.entries(
        invoices.reduce<Record<string, Invoice[]>>((acc, inv) => {
          if (!acc[inv.vendor]) acc[inv.vendor] = []
          acc[inv.vendor].push(inv)
          return acc
        }, {})
      ).map(([vendor, vendorInvoices]) => {
        const vendorTotal = vendorInvoices.reduce((s, i) => s + i.amount, 0)
        const allPaid = vendorInvoices.every(i => i.status === 'Paid')
        return (
          <div key={vendor} style={{ border:'1px solid var(--card-border)', borderRadius:12, overflow:'hidden' }}>
            {/* Vendor header bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.03))', borderBottom:'1px solid var(--gold)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13 }}>🏢</span>
                <span style={{ fontSize:13, fontWeight:800, color:'var(--text)', letterSpacing:'0.02em' }}>{vendor}</span>
                <span style={{ fontSize:11, color:'var(--text4)', marginLeft:4 }}>{vendorInvoices.length} invoice{vendorInvoices.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:11, fontWeight:700, color: allPaid ? 'var(--green)' : 'var(--orange)', background: allPaid ? 'var(--green-dim)' : 'var(--orange-dim)', borderRadius:99, padding:'2px 10px' }}>
                  {allPaid ? '✓ All Paid' : 'Has Unpaid'}
                </span>
                <span style={{ fontSize:15, fontWeight:800, color:'var(--gold)' }}>${vendorTotal.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
            </div>

            {/* Table header */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 90px', gap:0, padding:'8px 16px', background:'var(--hover)', borderBottom:'1px solid var(--border2)' }}>
              {['Description', 'Date', 'Status', 'Amount'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text4)', letterSpacing:'0.1em' }}>{h.toUpperCase()}</div>
              ))}
            </div>

            {/* Invoice rows */}
            {vendorInvoices.map((inv, idx) => (
              <div key={inv.id}
                style={{ display:'grid', gridTemplateColumns:'1fr 100px 80px 130px', gap:0, padding:'12px 16px', borderBottom: idx < vendorInvoices.length - 1 ? '1px solid var(--border2)' : 'none', background:'var(--card-bg)', transition:'background 0.15s', alignItems:'center' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>{inv.description || <span style={{ color:'var(--text4)', fontStyle:'italic' }}>—</span>}</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <UploadButton table="vendor_invoices" rowId={inv.id} currentUrl={inv.invoice_url} onUploaded={url => setInvoices(prev => prev.map(x => x.id===inv.id ? {...x,invoice_url:url} : x))} />
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{inv.date || '—'}</div>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color: inv.status==='Paid' ? 'var(--green)' : 'var(--orange)', background: inv.status==='Paid' ? 'var(--green-dim)' : 'var(--orange-dim)', borderRadius:99, padding:'2px 8px' }}>
                    {inv.status}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'space-between' }}>
                  <span style={{ fontSize:14, fontWeight:800, color:'var(--gold)' }}>${inv.amount.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  <div style={{ display:'flex', gap:2 }}>
                    <button onClick={() => setEditInvoice(inv)}
                      style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:13, padding:'4px 5px', borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>✏️</button>
                    <button onClick={() => deleteRow('vendor_invoices', inv.id)}
                      style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:13, padding:'4px 5px', borderRadius:6 }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )}
</div>

            {/* ── COMMISSIONS (after vendor invoices) ── */}
            <CommissionSection
              truck={truck}
              profit={profit}
              commissions={commissions}
              onChanged={() => fetchAll(false)}
            />

            {/* Other Costs */}
            <div style={SS}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>Other Costs</h3>
                <button onClick={() => setShowCostModal(true)} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:800, cursor:'pointer', minHeight:36 }}>+ Add</button>
              </div>
              {otherCosts.length === 0
                ? <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>Nothing added yet</div>
                : otherCosts.map(c => (
                  <div key={c.id} className="cost-row" style={{ flexDirection:'column' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', width:'100%' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{c.category}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{c.notes || 'No notes'} · {c.date || 'No date'}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:12 }}>
                        <span style={{ fontSize:15, fontWeight:700, color:'var(--gold)' }}>${c.amount.toLocaleString()}</span>
                        <button onClick={() => setEditCost(c)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:4, minWidth:32, minHeight:32 }}>✏️</button>
                        <button onClick={() => deleteRow('other_costs', c.id)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:16, padding:4, minWidth:32, minHeight:32 }}>🗑</button>
                      </div>
                    </div>
                    <UploadButton table="other_costs" rowId={c.id} currentUrl={c.invoice_url} onUploaded={url => setOtherCosts(prev => prev.map(x => x.id===c.id ? {...x,invoice_url:url} : x))} />
                  </div>
                ))}
            </div>

            {/* Sticky cost bar */}
            <div style={{ position:'fixed', bottom: isMobile ? 64 : 0, left:0, right:0, background:'var(--surface)', borderTop:'1px solid var(--gold)', padding: isMobile ? '10px 16px' : '12px 28px', zIndex:40, overflowX:'auto' }}>
              <div style={{ display:'flex', gap: isMobile ? 16 : 32, minWidth:'fit-content' }}>
                {[
                  { label:'RECON FIELD', value: truck.recondition_cost || 0 },
                  { label:'PARTS',       value: partsTotal },
                  { label:'LABOR',       value: laborTotal },
                  { label:'VENDOR',      value: invoiceTotal },
                  { label:'OTHER',       value: otherTotal },
                  { label:'RECON TOTAL', value: reconTotal },
                  { label:'ALL-IN',      value: allInCost },
                ].map(s => (
                  <div key={s.label} style={{ flexShrink:0 }}>
                    <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:'0.08em', fontWeight:600 }}>{s.label}</div>
                    <div style={{ fontSize: isMobile ? 13 : 16, fontWeight:700, color: s.label==='ALL-IN' ? 'var(--gold)' : 'var(--text)' }}>${s.value.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LISTINGS ── */}
        {activeTab === 'listings' && (
          <div>
            <div style={SS}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>Listing Info</h3>
                <button onClick={() => setEditingListing(true)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', minHeight:36 }}>✏ Edit</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:16 }}>
                {[
                  { label:'PLATFORM',     value: truck.listing_platform },
                  { label:'DATE LISTED',  value: truck.listing_date },
                  { label:'ASKING PRICE', value: truck.asking_price ? `$${Number(truck.asking_price).toLocaleString()}` : null },
                  { label:'LINK',         value: truck.listing_link, link: true },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:'0.08em', marginBottom:6, fontWeight:600 }}>{item.label}</div>
                    {(item as any).link && item.value
                      ? <a href={item.value} target="_blank" rel="noreferrer" style={{ fontSize:13, color:'var(--blue)', textDecoration:'underline', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{item.value}</a>
                      : <div style={{ fontSize:13, fontWeight:500, color: item.value ? 'var(--text)' : 'var(--text4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.value || '—'}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={SS}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>Offers</h3>
                <button onClick={() => setShowOfferModal(true)} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:800, cursor:'pointer', minHeight:36 }}>+ Log Offer</button>
              </div>
              {offers.length === 0
                ? <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text4)', fontSize:13 }}>No offers yet</div>
                : offers.map(o => (
                  <div key={o.id} className="cost-row">
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--gold)', marginBottom:3 }}>${o.amount.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{o.notes || 'No notes'} · {o.date || 'No date'}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ background: o.accepted ? 'var(--green-dim)' : 'var(--hover)', color: o.accepted ? 'var(--green)' : 'var(--text3)', borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:600 }}>{o.accepted ? 'Accepted' : 'Pending'}</span>
                      <button onClick={() => deleteRow('offers', o.id)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:16, padding:4, minWidth:32, minHeight:32 }}>🗑</button>
                    </div>
                  </div>
                ))}
            </div>

            <div style={SS}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', margin:0 }}>Sale Details</h3>
                <button onClick={() => setEditingSale(true)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', minHeight:36 }}>✏ Edit</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5,1fr)', gap:16 }}>
                {[
                  { label:'SOLD PRICE', value: truck.sold_price ? `$${truck.sold_price.toLocaleString()}` : '—', color: truck.sold_price ? 'var(--text)' : 'var(--text4)' },                  { label:'SOLD DATE',  value: truck.date_sold },
                  { label:'CUSTOMER',   value: truck.customer },
                  { label:'PAYMENT',    value: truck.payment_status },
                  { label:'STATUS',     value: truck.status, badge: true },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize:9, color:'var(--text4)', letterSpacing:'0.08em', marginBottom:6, fontWeight:600 }}>{item.label}</div>
                    {(item as any).badge
                      ? <span style={{ background: STATUS_COLORS[item.value||'']?.bg||'var(--hover)', color: STATUS_COLORS[item.value||'']?.color||'var(--text2)', border:`1px solid ${STATUS_COLORS[item.value||'']?.border||'var(--border)'}`, borderRadius:6, padding:'3px 10px', fontSize:12 }}>{item.value||'N/A'}</span>
                      : <div style={{ fontSize:13, fontWeight:500, color: item.value ? 'var(--text)' : 'var(--text4)' }}>{item.value||'—'}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DOCS ── */}
        {activeTab === 'docs' && (
          <div>
            <div style={{ ...SS, marginBottom:16 }}>
              <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.12em', fontWeight:700, marginBottom:12 }}>UPLOAD DOCUMENT</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <select value={docCategory} onChange={e => setDocCategory(e.target.value)} style={{ ...IS, flex:1, minWidth:160, cursor:'pointer' }}>
                  {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <button onClick={() => docFileRef.current?.click()} disabled={uploadingDoc}
                  style={{ background: uploadingDoc ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color: uploadingDoc ? 'var(--text3)' : '#000', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:800, cursor: uploadingDoc ? 'default' : 'pointer', whiteSpace:'nowrap' }}>
                  {uploadingDoc ? 'Uploading...' : '⬆ Upload File'}
                </button>
                <input ref={docFileRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" style={{ display:'none' }} onChange={handleDocUpload} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap:12 }}>
              {DOC_CATEGORIES.map(cat => {
                const catDocs = docsByCategory[cat] || []
                return (
              <div key={cat}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-dim)' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = catDocs.length > 0 ? 'var(--gold)' : 'var(--card-border)'; e.currentTarget.style.background = 'var(--card-bg)' }}
                onDrop={async e => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = catDocs.length > 0 ? 'var(--gold)' : 'var(--card-border)'
                  e.currentTarget.style.background = 'var(--card-bg)'
                  const file = e.dataTransfer.files[0]
                  if (!file) return
                  setUploadingDoc(true)
                  const path = `docs/${id}/${cat}/${Date.now()}-${file.name}`
                  const { error } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
                  if (!error) {
                    const { data } = supabase.storage.from('invoices').getPublicUrl(path)
                    await supabase.from('truck_documents').insert([{ truck_id: id, category: cat, name: file.name, url: data.publicUrl }])
                    await fetchAll(false)
                  }
                  setUploadingDoc(false)
                }}
                style={{ background:'var(--card-bg)', border:`1px solid ${catDocs.length > 0 ? 'var(--gold)' : 'var(--card-border)'}`, borderRadius:12, padding:'14px', transition:'all 0.15s' }}>                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:18, color: catDocs.length > 0 ? 'var(--gold)' : 'var(--text4)' }}>📁</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{cat}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{catDocs.length} file{catDocs.length!==1?'s':''}</div>
                      </div>
                      <button onClick={() => { setDocCategory(cat); docFileRef.current?.click() }} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text3)', borderRadius:99, padding:'3px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>+ Add</button>
                    </div>
                    {catDocs.length === 0
                    ? <div style={{ fontSize:11, color:'var(--text4)', fontStyle:'italic' }}>Drop a file here or click + Add</div>
                      : catDocs.map(doc => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(doc.name)
                          return (
                            <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 4px', borderBottom:'1px solid var(--border2)' }}>
                              {isImage
                                ? <img src={doc.url} alt={doc.name} style={{ width:36, height:36, borderRadius:6, objectFit:'cover', flexShrink:0, border:'1px solid var(--border)', cursor:'pointer' }} onClick={() => setPreviewDoc(doc)} />
                                : <div style={{ width:36, height:36, borderRadius:6, background:'var(--hover)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0, cursor:'pointer' }} onClick={() => setPreviewDoc(doc)}>📄</div>}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:11, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', cursor:'pointer' }} onClick={() => setPreviewDoc(doc)}>{doc.name}</div>
                                <div style={{ fontSize:10, color:'var(--text4)', marginTop:1 }}>{new Date(doc.created_at).toLocaleDateString()}</div>
                              </div>
                              <button onClick={() => deleteDoc(doc.id, doc.url)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:13, flexShrink:0 }} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text4)')}>🗑</button>
                            </div>
                          )
                        })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

  {editingDetails && (
    <Modal title="Edit Truck Details" onClose={() => setEditingDetails(false)} onSave={saveDetails}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div><label style={LS}>Colour</label><input style={IS} placeholder="White" value={detailsForm.colour||''} onChange={e=>setDetailsForm((p:any)=>({...p,colour:e.target.value}))} /></div>
        <div><label style={LS}>Kilometers</label><input style={IS} type="number" value={detailsForm.kilometers||''} onChange={e=>setDetailsForm((p:any)=>({...p,kilometers:e.target.value}))} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div><label style={LS}>Horsepower</label><input style={IS} type="number" placeholder="400" value={detailsForm.horsepower||''} onChange={e=>setDetailsForm((p:any)=>({...p,horsepower:e.target.value}))} /></div>
        <div><label style={LS}>Ratio</label><input style={IS} placeholder="3.55" value={detailsForm.ratio||''} onChange={e=>setDetailsForm((p:any)=>({...p,ratio:e.target.value}))} /></div>
      </div> 
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div><label style={LS}>Purchase Price ($)</label><input style={IS} type="number" value={detailsForm.purchase_price||''} onChange={e=>setDetailsForm((p:any)=>({...p,purchase_price:e.target.value}))} /></div>
        <div><label style={LS}>Recondition Cost ($)</label><input style={IS} type="number" value={detailsForm.recondition_cost||''} onChange={e=>setDetailsForm((p:any)=>({...p,recondition_cost:e.target.value}))} /></div>
      </div>
      <div style={{ marginBottom:14 }}><label style={LS}>Bought From</label><input style={IS} value={detailsForm.bought_from||''} onChange={e=>setDetailsForm((p:any)=>({...p,bought_from:e.target.value}))} /></div>
      <div style={{ height:1, background:'var(--border2)', marginBottom:14 }} />
      <div style={{ fontSize:10, color:'var(--gold)', letterSpacing:'0.12em', fontWeight:700, marginBottom:12 }}>ACQUISITION DETAILS</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div>
          <label style={LS}>Found By</label>
          <select style={{ ...IS, cursor:'pointer' }} value={detailsForm.found_by||''} onChange={e=>setDetailsForm((p:any)=>({...p,found_by:e.target.value}))}>
            <option value="">— Select —</option>
            {TEAM.map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={LS}>How Delivered</label>
          <select style={{ ...IS, cursor:'pointer' }} value={detailsForm.delivered_by||''} onChange={e=>setDetailsForm((p:any)=>({...p,delivered_by:e.target.value}))}>
            <option value="">— Select —</option>
            {['Delivered','Towed','Driven In'].map(m=><option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom:14 }}><label style={LS}>From (Location)</label><input style={IS} placeholder="e.g. Hamilton, ON" value={detailsForm.from_location||''} onChange={e=>setDetailsForm((p:any)=>({...p,from_location:e.target.value}))} /></div>
      <div style={{ marginBottom:14 }}>
        <label style={LS}>ETA Recon Complete</label>
        <input style={IS} type="date" value={detailsForm.eta_recon||''} onChange={e=>setDetailsForm((p:any)=>({...p,eta_recon:e.target.value}))} />
      </div>
      <div style={{ height:1, background:'var(--border2)', marginBottom:14 }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
        <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" value={detailsForm.sold_price||''} onChange={e=>setDetailsForm((p:any)=>({...p,sold_price:e.target.value}))} /></div>
        <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={detailsForm.date_sold||''} onChange={e=>setDetailsForm((p:any)=>({...p,date_sold:e.target.value}))} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div><label style={LS}>Customer</label><input style={IS} value={detailsForm.customer||''} onChange={e=>setDetailsForm((p:any)=>({...p,customer:e.target.value}))} /></div>
        <div><label style={LS}>Payment Status</label>
          <select style={{ ...IS, cursor:'pointer' }} value={detailsForm.payment_status||'N/A'} onChange={e=>setDetailsForm((p:any)=>({...p,payment_status:e.target.value}))}>
            {['N/A','Paid','Unpaid'].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )}
      {editingNotes && (
        <Modal title="Edit Notes" onClose={() => setEditingNotes(false)} onSave={saveNotes}>
          <textarea style={{ ...IS, height:120, resize:'vertical', minHeight:120 }} placeholder="Add notes..." value={notesForm.notes} onChange={e=>setNotesForm({notes:e.target.value})} />
        </Modal>
      )}

      {editingSale && (
        <Modal title="Edit Sale Details" onClose={() => setEditingSale(false)} onSave={saveSale}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div><label style={LS}>Sold Price ($)</label><input style={IS} type="number" value={saleForm.sold_price} onChange={e=>setSaleForm(p=>({...p,sold_price:e.target.value}))} /></div>
            <div><label style={LS}>Date Sold</label><input style={IS} type="date" value={saleForm.date_sold} onChange={e=>setSaleForm(p=>({...p,date_sold:e.target.value}))} /></div>
          </div>
          <div style={{ marginBottom:14 }}><label style={LS}>Customer</label><input style={IS} value={saleForm.customer} onChange={e=>setSaleForm(p=>({...p,customer:e.target.value}))} /></div>
          <div><label style={LS}>Payment Status</label>
            <select style={IS} value={saleForm.payment_status} onChange={e=>setSaleForm(p=>({...p,payment_status:e.target.value}))}>
              {['N/A','Paid','Unpaid'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {editingListing && (
        <Modal title="Edit Listing Info" onClose={() => setEditingListing(false)} onSave={saveListing}>
          <div style={{ marginBottom:14 }}><label style={LS}>Platform</label>
            <select style={IS} value={listingForm.listing_platform} onChange={e=>setListingForm(p=>({...p,listing_platform:e.target.value}))}>
              <option value="">— Select platform —</option>
              {['Facebook Marketplace','Kijiji','TruckPaper','Commercial Truck Trader','Other'].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:14 }}><label style={LS}>Listing Link</label><input style={IS} placeholder="https://..." value={listingForm.listing_link} onChange={e=>setListingForm(p=>({...p,listing_link:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={LS}>Date Listed</label><input style={IS} type="date" value={listingForm.listing_date} onChange={e=>setListingForm(p=>({...p,listing_date:e.target.value}))} /></div>
            <div><label style={LS}>Asking Price ($)</label><input style={IS} type="number" value={listingForm.asking_price} onChange={e=>setListingForm(p=>({...p,asking_price:e.target.value}))} /></div>
          </div>
        </Modal>
      )}

      {showPartModal && (
        <Modal title="Add Part" onClose={() => setShowPartModal(false)} onSave={addPart}>
          <div style={{ marginBottom:14 }}><label style={LS}>Part Name</label><input style={IS} placeholder="e.g. Air Filter" value={newPart.part} onChange={e=>setNewPart(p=>({...p,part:e.target.value}))} /></div>
          <div style={{ marginBottom:14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Engine" value={newPart.category} onChange={e=>setNewPart(p=>({...p,category:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div><label style={LS}>Qty</label><input style={IS} type="number" value={newPart.qty} onChange={e=>setNewPart(p=>({...p,qty:e.target.value}))} /></div>
            <div><label style={LS}>Unit Cost ($)</label><input style={IS} type="number" value={newPart.unit_cost} onChange={e=>setNewPart(p=>({...p,unit_cost:e.target.value}))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newPart.date} onChange={e=>setNewPart(p=>({...p,date:e.target.value}))} /></div>
          </div>
        </Modal>
      )}

      {showLaborModal && (
        <Modal title="Add Labor" onClose={() => setShowLaborModal(false)} onSave={addLabor}>
          <div style={{ marginBottom:14 }}><label style={LS}>Technician</label><input style={IS} value={newLabor.tech} onChange={e=>setNewLabor(p=>({...p,tech:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
            <div><label style={LS}>Hours</label><input style={IS} type="number" value={newLabor.hours} onChange={e=>setNewLabor(p=>({...p,hours:e.target.value}))} /></div>
            <div><label style={LS}>Rate ($/hr)</label><input style={IS} type="number" value={newLabor.rate} onChange={e=>setNewLabor(p=>({...p,rate:e.target.value}))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newLabor.date} onChange={e=>setNewLabor(p=>({...p,date:e.target.value}))} /></div>
          </div>
        </Modal>
      )}

{showInvoiceModal && (
  <Modal title="Add Vendor Invoice" onClose={() => setShowInvoiceModal(false)} onSave={addInvoice}>
    <div style={{ marginBottom:14 }}><label style={LS}>Vendor</label><input style={IS} value={newInvoice.vendor} onChange={e=>setNewInvoice(p=>({...p,vendor:e.target.value}))} /></div>
    <div style={{ marginBottom:14 }}><label style={LS}>Description</label><input style={IS} value={newInvoice.description} onChange={e=>setNewInvoice(p=>({...p,description:e.target.value}))} /></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
      <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={newInvoice.amount} onChange={e=>setNewInvoice(p=>({...p,amount:e.target.value}))} /></div>
      <div><label style={LS}>Qty</label><input style={IS} type="number" placeholder="1" value={newInvoice.qty} onChange={e=>setNewInvoice(p=>({...p,qty:e.target.value}))} /></div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
      <div><label style={LS}>Status</label><select style={IS} value={newInvoice.status} onChange={e=>setNewInvoice(p=>({...p,status:e.target.value}))}><option>Unpaid</option><option>Paid</option></select></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={newInvoice.date} onChange={e=>setNewInvoice(p=>({...p,date:e.target.value}))} /></div>
    </div>

    {/* Drag & drop PDF upload */}
    <label style={LS}>Invoice File (optional)</label>
    <div
      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--gold)' }}
      onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
      onDrop={e => {
        e.preventDefault()
        e.currentTarget.style.borderColor = 'var(--border)'
        const file = e.dataTransfer.files[0]
        if (file) setNewInvoice(p => ({ ...p, _file: file } as any))
      }}
      onClick={() => (document.getElementById('inv-file-input') as HTMLInputElement)?.click()}
      style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s', marginBottom: 4 }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>
        {(newInvoice as any)._file ? (newInvoice as any)._file.name : 'Drag & drop PDF here or click to browse'}
      </div>
      {(newInvoice as any)._file && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>✓ File ready to upload</div>}
    </div>
    <input id="inv-file-input" type="file" accept="image/*,application/pdf" style={{ display: 'none' }}
      onChange={e => { const file = e.target.files?.[0]; if (file) setNewInvoice(p => ({ ...p, _file: file } as any)) }} />
  </Modal>
)}

      {showCostModal && (
        <Modal title="Add Other Cost" onClose={() => setShowCostModal(false)} onSave={addCost}>
          <div style={{ marginBottom:14 }}><label style={LS}>Category</label><input style={IS} placeholder="e.g. Transport, Towing" value={newCost.category} onChange={e=>setNewCost(p=>({...p,category:e.target.value}))} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={newCost.amount} onChange={e=>setNewCost(p=>({...p,amount:e.target.value}))} /></div>
            <div><label style={LS}>Date</label><input style={IS} type="date" value={newCost.date} onChange={e=>setNewCost(p=>({...p,date:e.target.value}))} /></div>
          </div>
          <div><label style={LS}>Notes</label><input style={IS} value={newCost.notes} onChange={e=>setNewCost(p=>({...p,notes:e.target.value}))} /></div>
        </Modal>
      )}

  {showOfferModal && (
    <Modal title="Log Offer" onClose={() => setShowOfferModal(false)} onSave={addOffer}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
        <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={newOffer.amount} onChange={e=>setNewOffer(p=>({...p,amount:e.target.value}))} /></div>
        <div><label style={LS}>Date</label><input style={IS} type="date" value={newOffer.date} onChange={e=>setNewOffer(p=>({...p,date:e.target.value}))} /></div>
      </div>
      <div style={{ marginBottom:14 }}><label style={LS}>Notes</label><input style={IS} value={newOffer.notes} onChange={e=>setNewOffer(p=>({...p,notes:e.target.value}))} /></div>
      <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer', padding:'10px 0', minHeight:44 }} onClick={() => setNewOffer(p=>({...p,accepted:!p.accepted}))}>
        <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${newOffer.accepted ? 'var(--gold)' : 'var(--border)'}`, background: newOffer.accepted ? 'var(--gold)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {newOffer.accepted && <span style={{ color:'#000', fontSize:13, fontWeight:800 }}>✓</span>}
        </div>
        <span style={{ fontSize:14, color:'var(--text2)' }}>Accepted offer</span>
      </div>
    </Modal>
  )}

      {previewDoc && <PreviewModal url={previewDoc.url} name={previewDoc.name} onClose={() => setPreviewDoc(null)} />}
        {editPart && (
  <Modal title="Edit Part" onClose={() => setEditPart(null)} onSave={updatePart}>
    <div style={{ marginBottom:14 }}><label style={LS}>Part Name</label><input style={IS} value={editPart.part} onChange={e=>setEditPart(p=>p?({...p,part:e.target.value}):p)} /></div>
    <div style={{ marginBottom:14 }}><label style={LS}>Category</label><input style={IS} value={editPart.category} onChange={e=>setEditPart(p=>p?({...p,category:e.target.value}):p)} /></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
      <div><label style={LS}>Qty</label><input style={IS} type="number" value={editPart.qty} onChange={e=>setEditPart(p=>p?({...p,qty:parseFloat(e.target.value)||1}):p)} /></div>
      <div><label style={LS}>Unit Cost ($)</label><input style={IS} type="number" value={editPart.unit_cost} onChange={e=>setEditPart(p=>p?({...p,unit_cost:parseFloat(e.target.value)||0}):p)} /></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={editPart.date||''} onChange={e=>setEditPart(p=>p?({...p,date:e.target.value}):p)} /></div>
    </div>
  </Modal>
)}
{editLabor && (
  <Modal title="Edit Labor" onClose={() => setEditLabor(null)} onSave={updateLabor}>
    <div style={{ marginBottom:14 }}><label style={LS}>Technician</label><input style={IS} value={editLabor.tech} onChange={e=>setEditLabor(p=>p?({...p,tech:e.target.value}):p)} /></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
      <div><label style={LS}>Hours</label><input style={IS} type="number" value={editLabor.hours} onChange={e=>setEditLabor(p=>p?({...p,hours:parseFloat(e.target.value)||0}):p)} /></div>
      <div><label style={LS}>Rate ($/hr)</label><input style={IS} type="number" value={editLabor.rate} onChange={e=>setEditLabor(p=>p?({...p,rate:parseFloat(e.target.value)||0}):p)} /></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={editLabor.date||''} onChange={e=>setEditLabor(p=>p?({...p,date:e.target.value}):p)} /></div>
    </div>
  </Modal>
)}
{editInvoice && (
  <Modal title="Edit Vendor Invoice" onClose={() => setEditInvoice(null)} onSave={updateInvoice}>
    <div style={{ marginBottom:14 }}><label style={LS}>Vendor</label><input style={IS} value={editInvoice.vendor} onChange={e=>setEditInvoice(p=>p?({...p,vendor:e.target.value}):p)} /></div>
    <div style={{ marginBottom:14 }}><label style={LS}>Description</label><input style={IS} value={editInvoice.description} onChange={e=>setEditInvoice(p=>p?({...p,description:e.target.value}):p)} /></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
      <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={editInvoice.amount} onChange={e=>setEditInvoice(p=>p?({...p,amount:parseFloat(e.target.value)||0}):p)} /></div>
      <div><label style={LS}>Qty</label><input style={IS} type="number" value={editInvoice.qty} onChange={e=>setEditInvoice(p=>p?({...p,qty:parseInt(e.target.value)||1}):p)} /></div>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
      <div><label style={LS}>Status</label><select style={IS} value={editInvoice.status} onChange={e=>setEditInvoice(p=>p?({...p,status:e.target.value}):p)}><option>Unpaid</option><option>Paid</option></select></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={editInvoice.date||''} onChange={e=>setEditInvoice(p=>p?({...p,date:e.target.value}):p)} /></div>
    </div>
  </Modal>
)}
{editCost && (
  <Modal title="Edit Other Cost" onClose={() => setEditCost(null)} onSave={updateCost}>
    <div style={{ marginBottom:14 }}><label style={LS}>Category</label><input style={IS} value={editCost.category} onChange={e=>setEditCost(p=>p?({...p,category:e.target.value}):p)} /></div>
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
      <div><label style={LS}>Amount ($)</label><input style={IS} type="number" value={editCost.amount} onChange={e=>setEditCost(p=>p?({...p,amount:parseFloat(e.target.value)||0}):p)} /></div>
      <div><label style={LS}>Date</label><input style={IS} type="date" value={editCost.date||''} onChange={e=>setEditCost(p=>p?({...p,date:e.target.value}):p)} /></div>
    </div>
    <div><label style={LS}>Notes</label><input style={IS} value={editCost.notes||''} onChange={e=>setEditCost(p=>p?({...p,notes:e.target.value}):p)} /></div>
  </Modal>
)}
    </>
  )
}