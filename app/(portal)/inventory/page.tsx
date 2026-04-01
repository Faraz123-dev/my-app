'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Truck = {
  id: string; status: string; bought_on: string | null; vin: string
  year: number | null; make: string | null; model: string | null
  colour: string | null; kilometers: number | null; bought_from: string | null
  purchase_price: number | null; recondition_cost: number | null
  date_sold: string | null; customer: string | null; sold_price: number | null
  payment_status: string | null; notes: string | null; photo_url: string | null
  photo_before_recon: string | null; photo_after_recon: string | null
}
type TruckPhoto = { id: string; truck_id: string; url: string; sort_order: number }
type SortDir = 'asc' | 'desc'

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  Intake:              { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  Purchased:           { bg: 'var(--hover)',      color: 'var(--text2)',  border: 'var(--border)' },
  'In Reconditioning': { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
  'Ready to List':     { bg: 'var(--gold-dim)',   color: 'var(--gold)',   border: 'var(--gold)' },
  Listed:              { bg: 'var(--blue-dim)',   color: 'var(--blue)',   border: 'var(--blue)' },
  'Deal Pending':      { bg: 'var(--orange-dim)', color: 'var(--orange)', border: 'var(--orange)' },
  Sold:                { bg: 'var(--green-dim)',  color: 'var(--green)',  border: 'var(--green)' },
}

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ── LIGHTBOX ──────────────────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }: { photos: TruckPhoto[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) setIdx(i => dx < 0 ? (i + 1) % photos.length : (i - 1 + photos.length) % photos.length)
    touchStartX.current = null
  }

  const photo = photos[idx]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${photo.url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.25)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{idx + 1} / {photos.length}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={photo.url} download onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>⬇ Save</a>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 60px', minHeight: 0 }}>
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 44, height: 44, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        )}
        <img src={photo.url} alt={`Photo ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', display: 'block' }} />
        {photos.length > 1 && (
          <button onClick={() => setIdx(i => (i + 1) % photos.length)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 44, height: 44, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        )}
      </div>
      {photos.length > 1 && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto', flexShrink: 0, justifyContent: 'center' }}>
          {photos.map((p, i) => (
            <div key={p.id} onClick={() => setIdx(i)}
              style={{ width: 52, height: 40, borderRadius: 6, overflow: 'hidden', border: `2px solid ${i === idx ? '#EAB308' : 'rgba(255,255,255,0.2)'}`, cursor: 'pointer', flexShrink: 0, opacity: i === idx ? 1 : 0.55, transition: 'all 0.15s' }}>
              <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SINGLE PHOTO LIGHTBOX (for before/after) ──────────────────────────────────
function SingleLightbox({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(0.25)', transform: 'scale(1.1)' }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={url} download onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '6px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>⬇ Save</a>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      </div>
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <img src={url} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', display: 'block' }} />
      </div>
    </div>
  )
}

// ── PHOTO MANAGER ─────────────────────────────────────────────────────────────
function PhotoManager({ truck, photos, onClose, onChanged, onTruckUpdated }: {
  truck: Truck; photos: TruckPhoto[]; onClose: () => void
  onChanged: (p: TruckPhoto[]) => void
  onTruckUpdated: (updates: Partial<Truck>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const beforeRef = useRef<HTMLInputElement>(null)
  const afterRef = useRef<HTMLInputElement>(null)
  const [local, setLocal] = useState<TruckPhoto[]>(photos)
  const [uploading, setUploading] = useState(false)
  const [uploadingBefore, setUploadingBefore] = useState(false)
  const [uploadingAfter, setUploadingAfter] = useState(false)
  const [msg, setMsg] = useState('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [beforeUrl, setBeforeUrl] = useState<string | null>(truck.photo_before_recon)
  const [afterUrl, setAfterUrl] = useState<string | null>(truck.photo_after_recon)
  const [singleLightbox, setSingleLightbox] = useState<{ url: string; label: string } | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true); setMsg(`Uploading ${files.length} photo${files.length > 1 ? 's' : ''}...`)
    const maxOrder = local.length ? Math.max(...local.map(p => p.sort_order)) : -1
    const added: TruckPhoto[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = `trucks/${truck.id}-${Date.now()}-${i}.${file.name.split('.').pop() || 'jpg'}`
      const { error: sErr } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
      if (sErr) { setMsg(`Storage error: ${sErr.message}`); continue }
      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path)
      const { data: row, error: dErr } = await supabase.from('truck_photos').insert([{ truck_id: truck.id, url: urlData.publicUrl, sort_order: maxOrder + i + 1 }]).select().single()
      if (dErr) { setMsg(`DB error: ${dErr.message}`); setUploading(false); return }
      added.push(row as TruckPhoto)
    }
    if (local.length === 0 && added.length > 0) await supabase.from('Inventory Data').update({ photo_url: added[0].url }).eq('id', truck.id)
    const updated = [...local, ...added]
    setLocal(updated); onChanged(updated)
    setUploading(false); if (fileRef.current) fileRef.current.value = ''
    setMsg(`✓ ${added.length} photo${added.length > 1 ? 's' : ''} added`)
    setTimeout(() => setMsg(''), 2500)
  }

  async function uploadReconPhoto(file: File, type: 'before' | 'after') {
    const path = `trucks/${truck.id}-recon-${type}-${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
    const { error: sErr } = await supabase.storage.from('invoices').upload(path, file, { upsert: true })
    if (sErr) { setMsg(`Upload error: ${sErr.message}`); return null }
    const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path)
    return urlData.publicUrl
  }

  async function handleBeforeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingBefore(true)
    const url = await uploadReconPhoto(file, 'before')
    if (url) {
      await supabase.from('Inventory Data').update({ photo_before_recon: url }).eq('id', truck.id)
      setBeforeUrl(url); onTruckUpdated({ photo_before_recon: url })
    }
    setUploadingBefore(false)
    if (beforeRef.current) beforeRef.current.value = ''
  }

  async function handleAfterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingAfter(true)
    const url = await uploadReconPhoto(file, 'after')
    if (url) {
      await supabase.from('Inventory Data').update({ photo_after_recon: url }).eq('id', truck.id)
      setAfterUrl(url); onTruckUpdated({ photo_after_recon: url })
    }
    setUploadingAfter(false)
    if (afterRef.current) afterRef.current.value = ''
  }

  async function deleteReconPhoto(type: 'before' | 'after') {
    if (!confirm(`Delete ${type} recon photo?`)) return
    const col = type === 'before' ? 'photo_before_recon' : 'photo_after_recon'
    await supabase.from('Inventory Data').update({ [col]: null }).eq('id', truck.id)
    if (type === 'before') { setBeforeUrl(null); onTruckUpdated({ photo_before_recon: null }) }
    else { setAfterUrl(null); onTruckUpdated({ photo_after_recon: null }) }
  }

  async function deletePhoto(photoId: string, url: string) {
    if (!confirm('Delete this photo?')) return
    const path = url.split('/invoices/')[1]
    if (path) await supabase.storage.from('invoices').remove([path])
    await supabase.from('truck_photos').delete().eq('id', photoId)
    const remaining = local.filter(p => p.id !== photoId)
    await supabase.from('Inventory Data').update({ photo_url: remaining[0]?.url || null }).eq('id', truck.id)
    setLocal(remaining); onChanged(remaining)
  }

  async function onDragEnd() {
    if (dragIdx === null || dragOver === null || dragIdx === dragOver) { setDragIdx(null); setDragOver(null); return }
    const reordered = [...local]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(dragOver, 0, moved)
    const updated = reordered.map((p, i) => ({ ...p, sort_order: i }))
    setLocal(updated); onChanged(updated); setDragIdx(null); setDragOver(null)
    for (const p of updated) await supabase.from('truck_photos').update({ sort_order: p.sort_order }).eq('id', p.id)
    if (updated[0]) await supabase.from('Inventory Data').update({ photo_url: updated[0].url }).eq('id', truck.id)
  }

  // Recon photo slot component
  function ReconSlot({ label, url, color, uploading: up, onUpload, onDelete, onView }: {
    label: string; url: string | null; color: string; uploading: boolean
    onUpload: () => void; onDelete: () => void; onView: () => void
  }) {
    return (
      <div style={{ border: `2px solid ${url ? color : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', background: 'var(--hover)', transition: 'border-color 0.2s' }}>
        {/* Label bar */}
        <div style={{ padding: '8px 12px', background: url ? `${color}22` : 'transparent', borderBottom: `1px solid ${url ? color : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: url ? color : 'var(--text3)', letterSpacing: '0.1em' }}>{label}</span>
          {url && (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer', fontSize: 14, padding: 2, lineHeight: 1 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text4)')}>🗑</button>
          )}
        </div>
        {/* Photo area */}
        {url ? (
          <div onClick={onView} style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}>
            <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <span style={{ color: '#fff', fontSize: 28 }}>🔍</span>
            </div>
          </div>
        ) : (
          <div onClick={onUpload} style={{ width: '100%', aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 8 }}>
            {up ? (
              <div style={{ width: 24, height: 24, border: '2px solid transparent', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <>
                <span style={{ fontSize: 28, opacity: 0.4 }}>📷</span>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>Click to upload</span>
              </>
            )}
          </div>
        )}
        {/* Replace button */}
        {url && (
          <div style={{ padding: '8px 12px', borderTop: `1px solid var(--border2)` }}>
            <button onClick={onUpload} disabled={up} style={{ width: '100%', background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 8, padding: '6px', fontSize: 11, fontWeight: 600, cursor: up ? 'default' : 'pointer' }}>
              {up ? 'Uploading...' : '🔄 Replace Photo'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Photos</div>
            <button onClick={onClose} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '50%', width: 34, height: 34, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 20 }}>Drag to reorder · tap to view full screen</div>

          {/* ── BEFORE / AFTER RECON ── */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 12 }}>RECONDITIONING COMPARISON</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <ReconSlot
                label="📥 BEFORE RECON"
                url={beforeUrl}
                color="#ef4444"
                uploading={uploadingBefore}
                onUpload={() => beforeRef.current?.click()}
                onDelete={() => deleteReconPhoto('before')}
                onView={() => beforeUrl && setSingleLightbox({ url: beforeUrl, label: 'Before Reconditioning' })}
              />
              <ReconSlot
                label="📤 AFTER RECON"
                url={afterUrl}
                color="#22c55e"
                uploading={uploadingAfter}
                onUpload={() => afterRef.current?.click()}
                onDelete={() => deleteReconPhoto('after')}
                onView={() => afterUrl && setSingleLightbox({ url: afterUrl, label: 'After Reconditioning' })}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 20 }} />

          {/* General photos */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ background: uploading ? 'var(--hover)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: uploading ? 'var(--text3)' : '#000', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 800, cursor: uploading ? 'default' : 'pointer', minHeight: 44 }}>
              {uploading ? 'Uploading...' : '+ Add Photos'}
            </button>
            {msg && <div style={{ fontSize: 12, color: msg.includes('error') || msg.includes('Error') ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{msg}</div>}
          </div>

          {local.length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text4)', fontSize: 13, fontStyle: 'italic' }}>No photos yet. Click "+ Add Photos" above.</div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {local.map((p, i) => (
                  <div key={p.id} draggable
                    onDragStart={() => setDragIdx(i)} onDragEnter={() => setDragOver(i)}
                    onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
                    style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', border: `2px solid ${dragOver === i ? '#EAB308' : i === 0 ? 'rgba(234,179,8,0.5)' : 'var(--border)'}`, opacity: dragIdx === i ? 0.4 : 1, cursor: 'grab', transition: 'all 0.15s' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onClick={() => setLightboxIdx(i)} />
                    {i === 0 && <div style={{ position: 'absolute', top: 6, left: 6, background: '#EAB308', color: '#000', borderRadius: 4, fontSize: 9, fontWeight: 800, padding: '2px 6px' }}>COVER</div>}
                    <button onClick={() => deletePhoto(p.id, p.url)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', borderRadius: '50%', width: 26, height: 26, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 14, color: 'rgba(255,255,255,0.6)', pointerEvents: 'none' }}>⠿</div>
                  </div>
                ))}
              </div>}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileRef}   type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />
      <input ref={beforeRef} type="file" accept="image/*"          style={{ display: 'none' }} onChange={handleBeforeFile} />
      <input ref={afterRef}  type="file" accept="image/*"          style={{ display: 'none' }} onChange={handleAfterFile} />

      {lightboxIdx !== null && local.length > 0 && <Lightbox photos={local} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
      {singleLightbox && <SingleLightbox url={singleLightbox.url} label={singleLightbox.label} onClose={() => setSingleLightbox(null)} />}
    </>
  )
}

// ── PHOTO CELL ────────────────────────────────────────────────────────────────
function PhotoCell({ truck, photos, onPhotosChanged, onTruckUpdated }: {
  truck: Truck; photos: TruckPhoto[]
  onPhotosChanged: (p: TruckPhoto[]) => void
  onTruckUpdated: (updates: Partial<Truck>) => void
}) {
  const [showManager, setShowManager] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const first = photos[0]

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {first && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div onClick={e => { e.stopPropagation(); setLightboxIdx(0) }}
              style={{ width: 48, height: 36, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}>
              <img src={first.url} alt="Truck" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            {photos.length > 1 && (
              <div onClick={e => { e.stopPropagation(); setLightboxIdx(0) }}
                style={{ position: 'absolute', top: -5, right: -7, background: '#EAB308', color: '#000', borderRadius: 99, fontSize: 9, fontWeight: 800, padding: '1px 5px', cursor: 'pointer', lineHeight: 1.5, minWidth: 16, textAlign: 'center' }}>
                {photos.length}
              </div>
            )}
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setShowManager(true) }}
          style={{ width: first ? 28 : 48, height: 36, borderRadius: 6, border: '1px dashed var(--border)', background: 'var(--hover)', color: 'var(--text3)', cursor: 'pointer', fontSize: first ? 13 : 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title={first ? 'Manage photos' : 'Add photos'}>
          {first ? '⊕' : '📷'}
        </button>
      </div>
      {showManager && (
        <PhotoManager truck={truck} photos={photos}
          onClose={() => setShowManager(false)}
          onChanged={onPhotosChanged}
          onTruckUpdated={onTruckUpdated}
        />
      )}
      {lightboxIdx !== null && photos.length > 0 && <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  )
}

function getUnique(trucks: Truck[], key: keyof Truck): string[] {
  const vals = trucks.map(t => { const v = t[key]; return v != null ? String(v) : null }).filter(Boolean) as string[]
  return Array.from(new Set(vals)).sort()
}

export default function InventoryPage() {
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [photoMap, setPhotoMap] = useState<Record<string, TruckPhoto[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [sortCol, setSortCol] = useState<keyof Truck>('bought_on')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [colFilters, setColFilters] = useState<Partial<Record<keyof Truck, string>>>({})
  const [filterPopup, setFilterPopup] = useState<{ col: keyof Truck; x: number; y: number } | null>(null)
  const [filterSearch, setFilterSearch] = useState('')
  const popupRef = useRef<HTMLDivElement>(null)
  const [boughtFrom, setBoughtFrom] = useState('')
  const [boughtTo, setBoughtTo] = useState('')
  const [soldFrom, setSoldFrom] = useState('')
  const [soldTo, setSoldTo] = useState('')
  const [showDateFilters, setShowDateFilters] = useState(false)
  const [newTruck, setNewTruck] = useState({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })
  const [editTruck, setEditTruck] = useState<Truck | null>(null)
  const [editForm, setEditForm] = useState<Partial<Truck>>({})

  useEffect(() => {
    loadAll()
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setViewMode('cards')
    }
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) { setFilterPopup(null); setFilterSearch('') }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: truckData, error: truckErr }, { data: photoData }] = await Promise.all([
      supabase.from('Inventory Data').select('*'),
      supabase.from('truck_photos').select('*').order('sort_order'),
    ])
    if (truckErr) { setError(truckErr.message); setLoading(false); return }
    setTrucks(truckData || [])
    const map: Record<string, TruckPhoto[]> = {}
    for (const p of (photoData || []) as TruckPhoto[]) {
      if (!map[p.truck_id]) map[p.truck_id] = []
      map[p.truck_id].push(p)
    }
    setPhotoMap(map)
    setLoading(false)
  }

  function updatePhotosForTruck(truckId: string, newPhotos: TruckPhoto[]) {
    setPhotoMap(prev => ({ ...prev, [truckId]: newPhotos }))
  }

  function updateTruckFields(truckId: string, updates: Partial<Truck>) {
    setTrucks(prev => prev.map(t => t.id === truckId ? { ...t, ...updates } : t))
  }

  async function addTruck() {
    if (!newTruck.vin) return alert('VIN is required')
    const { error } = await supabase.from('Inventory Data').insert([{
      status: newTruck.status, bought_on: newTruck.bought_on, vin: newTruck.vin,
      year: parseInt(newTruck.year) || null, make: newTruck.make || null,
      model: newTruck.model || null, colour: newTruck.colour || null,
      kilometers: parseInt(newTruck.kilometers) || null, bought_from: newTruck.bought_from || null,
      purchase_price: parseFloat(newTruck.purchase_price) || 0,
      recondition_cost: parseFloat(newTruck.recondition_cost) || 0,
      payment_status: 'N/A', notes: newTruck.notes || null,
    }])
    if (error) return alert('Error: ' + error.message)
    setShowAddModal(false)
    setNewTruck({ status: 'Purchased', bought_on: new Date().toISOString().split('T')[0], vin: '', year: '', make: '', model: '', colour: '', kilometers: '', bought_from: '', purchase_price: '', recondition_cost: '0', notes: '' })
    loadAll()
  }

  async function deleteTruck(id: string) {
    if (!confirm('Delete this truck?')) return
    await supabase.from('Inventory Data').delete().eq('id', id)
    loadAll()
  }

  function openEdit(truck: Truck, e: React.MouseEvent) {
    e.stopPropagation()
    setEditTruck(truck)
    setEditForm({ status: truck.status, bought_on: truck.bought_on, vin: truck.vin, year: truck.year, make: truck.make, model: truck.model, colour: truck.colour, kilometers: truck.kilometers, bought_from: truck.bought_from, purchase_price: truck.purchase_price, recondition_cost: truck.recondition_cost, sold_price: truck.sold_price, date_sold: truck.date_sold, customer: truck.customer, payment_status: truck.payment_status, notes: truck.notes })
  }

  async function saveEdit() {
    if (!editTruck) return
    const payload = { ...editForm, year: editForm.year ? Number(editForm.year) : null, kilometers: editForm.kilometers ? Number(editForm.kilometers) : null, purchase_price: editForm.purchase_price ? Number(editForm.purchase_price) : null, recondition_cost: editForm.recondition_cost ? Number(editForm.recondition_cost) : null, sold_price: editForm.sold_price ? Number(editForm.sold_price) : null, date_sold: editForm.date_sold || null, customer: editForm.customer || null, bought_from: editForm.bought_from || null, colour: editForm.colour || null, notes: editForm.notes || null }
    const { error } = await supabase.from('Inventory Data').update(payload).eq('id', editTruck.id)
    if (error) { alert('Error: ' + error.message); return }
    setTrucks(prev => prev.map(t => t.id === editTruck.id ? { ...t, ...payload } : t))
    setEditTruck(null)
  }

  function handleSort(col: keyof Truck) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const filtered = trucks
    .filter(t => {
      const q = search.toLowerCase()
      if (q && ![t.vin, t.make, t.model, t.customer, t.bought_from].some(v => v?.toLowerCase().includes(q))) return false
      for (const [col, val] of Object.entries(colFilters)) {
        if (!val) continue; const tv = (t as any)[col]
        if (tv == null || String(tv) !== val) return false
      }
      if (boughtFrom && (!t.bought_on || t.bought_on < boughtFrom)) return false
      if (boughtTo && (!t.bought_on || t.bought_on > boughtTo)) return false
      if (soldFrom && (!t.date_sold || t.date_sold < soldFrom)) return false
      if (soldTo && (!t.date_sold || t.date_sold > soldTo)) return false
      return true
    })
    .sort((a, b) => {
      const av = (a as any)[sortCol]; const bv = (b as any)[sortCol]
      if (av == null && bv == null) return 0
      if (av == null) return 1; if (bv == null) return -1
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

  const inStock = trucks.filter(t => t.status !== 'Sold').length
  const sold = trucks.filter(t => t.status === 'Sold').length
  const pend = trucks.filter(t => t.payment_status === 'Unpaid').length
  const activeFilterCount = Object.values(colFilters).filter(Boolean).length + [boughtFrom, boughtTo, soldFrom, soldTo].filter(Boolean).length

  function clearAllFilters() { setColFilters({}); setBoughtFrom(''); setBoughtTo(''); setSoldFrom(''); setSoldTo('') }

  const IS: React.CSSProperties = { background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui,sans-serif' }
  const LS: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', marginBottom: 6, display: 'block', fontWeight: 500 }
  const TD: React.CSSProperties = { padding: '10px 12px', color: 'var(--text)', whiteSpace: 'nowrap' }

  type Col = { key: keyof Truck | 'allIn' | 'profit'; label: string; sortKey?: keyof Truck; filterable?: boolean }
  const cols: Col[] = [
    { key: 'status',           label: 'Status',      sortKey: 'status',           filterable: true },
    { key: 'bought_on',        label: 'Bought On',   sortKey: 'bought_on' },
    { key: 'vin',              label: 'VIN',         sortKey: 'vin' },
    { key: 'year',             label: 'Year',        sortKey: 'year',             filterable: true },
    { key: 'make',             label: 'Make',        sortKey: 'make',             filterable: true },
    { key: 'model',            label: 'Model',       sortKey: 'model',            filterable: true },
    { key: 'colour',           label: 'Colour',      sortKey: 'colour',           filterable: true },
    { key: 'kilometers',       label: 'KMs',         sortKey: 'kilometers' },
    { key: 'bought_from',      label: 'Bought From', sortKey: 'bought_from',      filterable: true },
    { key: 'purchase_price',   label: 'Purchase',    sortKey: 'purchase_price' },
    { key: 'recondition_cost', label: 'Recon',       sortKey: 'recondition_cost' },
    { key: 'allIn',            label: 'All-In' },
    { key: 'date_sold',        label: 'Date Sold',   sortKey: 'date_sold' },
    { key: 'customer',         label: 'Customer',    sortKey: 'customer',         filterable: true },
    { key: 'sold_price',       label: 'Sold Price',  sortKey: 'sold_price' },
    { key: 'profit',           label: 'Profit' },
    { key: 'payment_status',   label: 'Payment',     sortKey: 'payment_status',   filterable: true },
  ]

  const popupValues = filterPopup
    ? getUnique(trucks, filterPopup.col).filter(v => !filterSearch || v.toLowerCase().includes(filterSearch.toLowerCase()))
    : []

  return (
    <>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        .inv-card { background:var(--card-bg); border:1px solid var(--card-border); border-radius:14px; padding:16px; cursor:pointer; transition:all 0.18s; }
        .inv-card:hover { border-color:var(--gold); }
        .inv-card:active { transform:scale(0.99); }
        .th-btn { display:flex; align-items:center; gap:4px; background:none; border:none; color:var(--text); cursor:pointer; font-size:12px; font-weight:600; letter-spacing:0.06em; padding:0; white-space:nowrap; transition:color 0.15s; }
        .th-btn:hover { color:var(--gold); }
        .th-btn.active { color:var(--gold); }
        @media (max-width:767px) { .inv-card { border-radius:12px; padding:14px; } }
      `}</style>

      <main style={{ padding: isMobile ? '16px' : '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: isMobile ? 14 : 20 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', fontWeight:700, marginBottom:4, opacity:0.7 }}>FLEET</div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Inventory</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:99, padding: isMobile ? '10px 18px' : '9px 20px', fontSize: isMobile ? 14 : 13, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px rgba(234,179,8,0.35)', minHeight:44 }}>+ Add</button>
        </div>

        <div style={{ height:1, background:'linear-gradient(90deg,var(--gold),transparent)', marginBottom: isMobile ? 14 : 20 }} />

        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          {[{ label:'Total', value:trucks.length, color:'var(--text2)' }, { label:'In Stock', value:inStock, color:'var(--gold)' }, { label:'Sold', value:sold, color:'var(--green)' }, { label:'Pending', value:pend, color:'var(--orange)' }].map(s => (
            <div key={s.label} style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:99, padding:'5px 12px', fontSize:12, color:'var(--text2)' }}>
              {s.label} <span style={{ color:s.color, fontWeight:700 }}>{s.value}</span>
            </div>
          ))}
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ background:'var(--gold-dim)', border:'1px solid var(--gold)', borderRadius:99, padding:'5px 12px', fontSize:11, color:'var(--gold)', fontWeight:700, cursor:'pointer' }}>
              {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} × clear
            </button>
          )}
          {!isMobile && (
            <div style={{ marginLeft:'auto', display:'flex', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:8, overflow:'hidden' }}>
              {(['cards','table'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{ padding:'6px 14px', fontSize:13, cursor:'pointer', border:'none', background: viewMode===m ? 'var(--gold)' : 'transparent', color: viewMode===m ? '#000' : 'var(--text3)', fontWeight: viewMode===m ? 700 : 400, transition:'all 0.15s' }}>
                  {m === 'cards' ? '▦' : '☰'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth: isMobile ? '100%' : 200 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', fontSize:15 }}>🔍</span>
            <input style={{ ...IS, paddingLeft:36, minHeight:44 }} placeholder="Search VIN, Make, Model, Customer..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowDateFilters(p => !p)} style={{ background: showDateFilters ? 'var(--gold-dim)' : 'var(--card-bg)', border:`1px solid ${showDateFilters ? 'var(--gold)' : 'var(--card-border)'}`, color: showDateFilters ? 'var(--gold)' : 'var(--text2)', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', minHeight:44 }}>
            📅 {isMobile ? '' : 'Date Filters '}{(boughtFrom||boughtTo||soldFrom||soldTo) ? '●' : ''}
          </button>
        </div>

        {showDateFilters && (
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:12, padding:'16px', marginBottom:14, display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>BOUGHT ON</div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="date" style={{ ...IS, flex:1 }} value={boughtFrom} onChange={e => setBoughtFrom(e.target.value)} />
                  <span style={{ color:'var(--text4)', flexShrink:0 }}>→</span>
                  <input type="date" style={{ ...IS, flex:1 }} value={boughtTo} onChange={e => setBoughtTo(e.target.value)} />
                  {(boughtFrom||boughtTo) && <button onClick={() => { setBoughtFrom(''); setBoughtTo('') }} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:18, padding:4, minWidth:32 }}>×</button>}
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>DATE SOLD</div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <input type="date" style={{ ...IS, flex:1 }} value={soldFrom} onChange={e => setSoldFrom(e.target.value)} />
                  <span style={{ color:'var(--text4)', flexShrink:0 }}>→</span>
                  <input type="date" style={{ ...IS, flex:1 }} value={soldTo} onChange={e => setSoldTo(e.target.value)} />
                  {(soldFrom||soldTo) && <button onClick={() => { setSoldFrom(''); setSoldTo('') }} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:18, padding:4, minWidth:32 }}>×</button>}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>QUICK SELECT — SOLD DATE</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {(() => {
                  const buttons = []; const now = new Date()
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                    const from = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
                    const last = new Date(d.getFullYear(), d.getMonth()+1, 0)
                    const to = `${last.getFullYear()}-${String(last.getMonth()+1).padStart(2,'0')}-${String(last.getDate()).padStart(2,'0')}`
                    const label = d.toLocaleDateString('en-US', { month:'short', year:'2-digit' })
                    const isActive = soldFrom===from && soldTo===to
                    buttons.push(<button key={from} onClick={() => { setSoldFrom(from); setSoldTo(to) }} style={{ background: isActive ? 'var(--gold)' : 'var(--hover)', border:`1px solid ${isActive ? 'var(--gold)' : 'var(--border)'}`, color: isActive ? '#000' : 'var(--text2)', borderRadius:6, padding:'6px 12px', fontSize:12, fontWeight: isActive ? 700 : 500, cursor:'pointer', minHeight:36 }}>{label}</button>)
                  }
                  return buttons
                })()}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div style={{ width:36, height:36, border:'2px solid transparent', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--red)' }}>Error: {error}</div>
        ) : (viewMode === 'cards' || isMobile) ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.length === 0
              ? <div style={{ textAlign:'center', padding:48, color:'var(--text4)' }}>No trucks found</div>
              : filtered.map(truck => {
                const photos = photoMap[truck.id] || []
                const allIn = (truck.purchase_price||0) + (truck.recondition_cost||0)
                const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                const sc = statusColors[truck.status] || { bg:'rgba(255,255,255,0.04)', color:'#888', border:'rgba(255,255,255,0.1)' }
                return (
                  <div key={truck.id} className="inv-card" onClick={() => window.location.href = `/inventory/${truck.id}`}>
                    <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:12 }}>
                      <div onClick={e => e.stopPropagation()} style={{ flexShrink:0 }}>
                        <PhotoCell truck={truck} photos={photos} onPhotosChanged={p => updatePhotosForTruck(truck.id, p)} onTruckUpdated={u => updateTruckFields(truck.id, u)} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ fontSize: isMobile ? 15 : 16, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{truck.year} {truck.make} {truck.model}</div>
                            <div style={{ fontSize:11, color:'var(--text3)', marginTop:3, fontFamily:'monospace' }}>{truck.vin}</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, borderRadius:99, padding:'3px 10px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{truck.status}</span>
                            {!isMobile && (<>
                              <button onClick={e => openEdit(truck,e)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:13, padding:4, minWidth:32, minHeight:32 }}>✏️</button>
                              <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:4, minWidth:32, minHeight:32 }}>🗑</button>
                            </>)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile ? 8 : 12, marginBottom:10 }}>
                      {[
                        { l:'PURCHASE', v:`$${(truck.purchase_price||0).toLocaleString()}`, c:'var(--text)' },
                        { l:'ALL-IN',   v:`$${allIn.toLocaleString()}`, c:'var(--text)' },
                        { l:'PROFIT',   v: profit==null ? '—' : `${profit<0?'-':''}$${Math.abs(profit).toLocaleString()}`, c: profit==null ? 'var(--text4)' : profit>=0 ? 'var(--green)' : 'var(--red)' },
                      ].map(s => (
                        <div key={s.l} style={{ background:'var(--hover)', borderRadius:8, padding:'8px 10px' }}>
                          <div style={{ fontSize:9, color:'var(--text4)', marginBottom:3, letterSpacing:'0.1em', fontWeight:600 }}>{s.l}</div>
                          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight:700, color:s.c }}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                      {truck.kilometers && <span style={{ fontSize:11, color:'var(--text3)' }}>🚛 {truck.kilometers.toLocaleString()} km</span>}
                      {truck.bought_on && <span style={{ fontSize:11, color:'var(--text3)' }}>📅 {fmt(truck.bought_on)}</span>}
                      {truck.customer && <span style={{ fontSize:11, color:'var(--text2)', fontWeight:500 }}>→ {truck.customer}</span>}
                      {truck.payment_status && truck.payment_status !== 'N/A' && (
                        <span style={{ background: truck.payment_status==='Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: truck.payment_status==='Paid' ? 'var(--green)' : 'var(--red)', borderRadius:99, padding:'2px 8px', fontSize:10, fontWeight:600 }}>{truck.payment_status}</span>
                      )}
                      {isMobile && (
                        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
                          <button onClick={e => openEdit(truck,e)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer', fontSize:13, padding:'6px 10px', borderRadius:6, minHeight:36 }}>✏️</button>
                          <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--red)', cursor:'pointer', fontSize:13, padding:'6px 10px', borderRadius:6, minHeight:36 }}>🗑</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            <div style={{ textAlign:'center', padding:'12px 0', fontSize:12, color:'var(--text4)' }}>{filtered.length} of {trucks.length} trucks</div>
          </div>
        ) : (
          <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid var(--border)' }}>
                    <th style={{ padding:'12px 12px', textAlign:'left', color:'var(--text)', fontWeight:600, fontSize:12, letterSpacing:'0.06em', whiteSpace:'nowrap' }}>PHOTO</th>
                    {cols.map(col => {
                      const isActive = sortCol === col.sortKey
                      return (
                        <th key={col.key} style={{ padding:'12px 12px', textAlign:'left', whiteSpace:'nowrap', userSelect:'none' }}>
                          {col.sortKey ? (
                            <button className={`th-btn${isActive ? ' active' : ''}`} onClick={() => handleSort(col.sortKey!)}>
                              {col.label}
                              <span style={{ fontSize:9, marginLeft:2 }}>{isActive ? (sortDir==='asc' ? '▲' : '▼') : '⇅'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize:12, color:'var(--text)', fontWeight:600, letterSpacing:'0.06em' }}>{col.label}</span>
                          )}
                        </th>
                      )
                    })}
                    <th style={{ padding:'12px 12px' }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={cols.length+2} style={{ padding:48, textAlign:'center', color:'var(--text4)' }}>No trucks found</td></tr>
                    : filtered.map(truck => {
                      const photos = photoMap[truck.id] || []
                      const allIn = (truck.purchase_price||0) + (truck.recondition_cost||0)
                      const profit = truck.sold_price != null ? truck.sold_price - allIn : null
                      const sc = statusColors[truck.status] || { bg:'rgba(255,255,255,0.04)', color:'#888', border:'rgba(255,255,255,0.1)' }
                      return (
                        <tr key={truck.id} onClick={() => window.location.href = `/inventory/${truck.id}`}
                          style={{ borderBottom:'1px solid var(--border2)', cursor:'pointer', transition:'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background='var(--hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                          <td style={{ padding:'8px 12px' }} onClick={e => e.stopPropagation()}>
                            <PhotoCell truck={truck} photos={photos} onPhotosChanged={p => updatePhotosForTruck(truck.id, p)} onTruckUpdated={u => updateTruckFields(truck.id, u)} />
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, borderRadius:99, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>{truck.status}</span>
                          </td>
                          <td style={TD}>{fmt(truck.bought_on)}</td>
                          <td style={{ ...TD, fontFamily:'monospace', fontSize:11 }}>{truck.vin}</td>
                          <td style={TD}>{truck.year || '—'}</td>
                          <td style={TD}>{truck.make || '—'}</td>
                          <td style={TD}>{truck.model || '—'}</td>
                          <td style={TD}>{truck.colour || '—'}</td>
                          <td style={TD}>{truck.kilometers ? Number(truck.kilometers).toLocaleString() : '—'}</td>
                          <td style={TD}>{truck.bought_from || '—'}</td>
                          <td style={TD}>${(truck.purchase_price||0).toLocaleString()}</td>
                          <td style={TD}>${(truck.recondition_cost||0).toLocaleString()}</td>
                          <td style={TD}>${allIn.toLocaleString()}</td>
                          <td style={TD}>{truck.date_sold ? fmt(truck.date_sold) : '—'}</td>
                          <td style={TD}>{truck.customer || '—'}</td>
                          <td style={TD}>{truck.sold_price != null ? `$${truck.sold_price.toLocaleString()}` : '—'}</td>
                          <td style={{ padding:'10px 12px', whiteSpace:'nowrap', fontWeight:700, color: profit==null ? 'var(--text4)' : profit>=0 ? 'var(--green)' : 'var(--red)' }}>
                            {profit==null ? '—' : `${profit<0?'-':''}$${Math.abs(profit).toLocaleString()}`}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {truck.payment_status && truck.payment_status !== 'N/A'
                              ? <span style={{ background: truck.payment_status==='Paid' ? 'var(--green-dim)' : 'var(--red-dim)', color: truck.payment_status==='Paid' ? 'var(--green)' : 'var(--red)', borderRadius:99, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{truck.payment_status}</span>
                              : <span style={{ color:'var(--text4)', fontSize:11 }}>N/A</span>}
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <div style={{ display:'flex', gap:4 }}>
                              <button onClick={e => openEdit(truck,e)} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:13, padding:4 }}>✏️</button>
                              <button onClick={e => { e.stopPropagation(); deleteTruck(truck.id) }} style={{ background:'none', border:'none', color:'var(--text4)', cursor:'pointer', fontSize:14, padding:4 }}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border2)', fontSize:12, color:'var(--text3)' }}>
              Showing {filtered.length} of {trucks.length} trucks
            </div>
          </div>
        )}

        {filterPopup && (
          <div ref={popupRef} style={{ position:'fixed', left:filterPopup.x, top:filterPopup.y, zIndex:300, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.5)', minWidth:180, maxWidth:240, overflow:'hidden' }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid var(--border2)' }}>
              <input autoFocus style={{ ...IS, padding:'6px 10px', fontSize:12 }} placeholder="Search..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} />
            </div>
            <div style={{ maxHeight:220, overflowY:'auto' }}>
              <div onClick={() => { setColFilters(p => { const n={...p}; delete n[filterPopup.col]; return n }); setFilterPopup(null) }}
                style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, color: colFilters[filterPopup.col] ? 'var(--gold)' : 'var(--text3)', fontWeight:600, borderBottom:'1px solid var(--border2)' }}>
                {colFilters[filterPopup.col] ? '✕ Clear filter' : 'All values'}
              </div>
              {popupValues.map(val => (
                <div key={val} onClick={() => { setColFilters(p => ({...p,[filterPopup.col]:val})); setFilterPopup(null); setFilterSearch('') }}
                  style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, color: colFilters[filterPopup.col]===val ? 'var(--gold)' : 'var(--text)', fontWeight: colFilters[filterPopup.col]===val ? 700 : 400, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  {val}{colFilters[filterPopup.col]===val && <span style={{ fontSize:10 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {showAddModal && (
          <div onClick={() => setShowAddModal(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(8px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width:'100%', maxWidth: isMobile ? '100%' : 560, maxHeight:'92vh', overflowY:'auto' }}>
              {isMobile && <div style={{ width:36, height:4, background:'var(--border)', borderRadius:99, margin:'0 auto 20px' }} />}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', letterSpacing:'-0.02em' }}>Add New Truck</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontSize:18, width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Status</label><select style={{ ...IS, minHeight:44 }} value={newTruck.status} onChange={e => setNewTruck(p=>({...p,status:e.target.value}))}>{['Purchased','In Reconditioning','Ready to List','Listed','Deal Pending','Sold'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Bought On</label><input type="date" style={{ ...IS, minHeight:44 }} value={newTruck.bought_on} onChange={e => setNewTruck(p=>({...p,bought_on:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:14 }}><label style={LS}>VIN *</label><input style={{ ...IS, minHeight:44 }} placeholder="17-CHARACTER VIN" value={newTruck.vin} onChange={e => setNewTruck(p=>({...p,vin:e.target.value}))} maxLength={17} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                {([['Year','year','2020'],['Make','make','Freightliner'],['Model','model','Cascadia']] as const).map(([l,k,p]) => (
                  <div key={k}><label style={LS}>{l}</label><input style={{ ...IS, minHeight:44 }} placeholder={p} value={(newTruck as any)[k]} onChange={e => setNewTruck(prev=>({...prev,[k]:e.target.value}))} /></div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Colour</label><input style={{ ...IS, minHeight:44 }} placeholder="White" value={newTruck.colour} onChange={e => setNewTruck(p=>({...p,colour:e.target.value}))} /></div>
                <div><label style={LS}>KMs</label><input style={{ ...IS, minHeight:44 }} type="number" placeholder="450000" value={newTruck.kilometers} onChange={e => setNewTruck(p=>({...p,kilometers:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:14 }}><label style={LS}>Bought From</label><input style={{ ...IS, minHeight:44 }} placeholder="e.g. Lussicam Inc." value={newTruck.bought_from} onChange={e => setNewTruck(p=>({...p,bought_from:e.target.value}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Purchase Price ($)</label><input style={{ ...IS, minHeight:44 }} type="number" placeholder="35000" value={newTruck.purchase_price} onChange={e => setNewTruck(p=>({...p,purchase_price:e.target.value}))} /></div>
                <div><label style={LS}>Recondition ($)</label><input style={{ ...IS, minHeight:44 }} type="number" placeholder="0" value={newTruck.recondition_cost} onChange={e => setNewTruck(p=>({...p,recondition_cost:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:20 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height:70, resize:'vertical' }} placeholder="Any purchase notes..." value={newTruck.notes} onChange={e => setNewTruck(p=>({...p,notes:e.target.value}))} /></div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex:1, background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:12, padding:'14px', fontSize:14, cursor:'pointer', fontWeight:500, minHeight:50 }}>Cancel</button>
                <button onClick={addTruck} style={{ flex:2, background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:12, padding:'14px', fontSize:14, fontWeight:800, cursor:'pointer', minHeight:50 }}>Add Truck</button>
              </div>
            </div>
          </div>
        )}

        {editTruck && (
          <div onClick={() => setEditTruck(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(10px)', padding: isMobile ? 0 : 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 20, padding: isMobile ? '20px 20px 32px' : 28, width:'100%', maxWidth: isMobile ? '100%' : 560, maxHeight:'92vh', overflowY:'auto' }}>
              {isMobile && <div style={{ width:36, height:4, background:'var(--border)', borderRadius:99, margin:'0 auto 20px' }} />}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                <h2 style={{ fontSize:18, fontWeight:800, color:'var(--text)', margin:0 }}>Edit Truck</h2>
                <button onClick={() => setEditTruck(null)} style={{ background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer', fontSize:16, width:36, height:36, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Status</label><select style={{ ...IS, minHeight:44 }} value={editForm.status||''} onChange={e => setEditForm(p=>({...p,status:e.target.value}))}>{['Intake','Purchased','In Reconditioning','Ready to List','Listed','Deal Pending','Sold'].map(s=><option key={s}>{s}</option>)}</select></div>
                <div><label style={LS}>Bought On</label><input style={{ ...IS, minHeight:44 }} type="date" value={editForm.bought_on||''} onChange={e => setEditForm(p=>({...p,bought_on:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:12 }}><label style={LS}>VIN</label><input style={{ ...IS, minHeight:44 }} value={editForm.vin||''} onChange={e => setEditForm(p=>({...p,vin:e.target.value}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={LS}>Year</label><input style={{ ...IS, minHeight:44 }} type="number" value={editForm.year||''} onChange={e => setEditForm(p=>({...p,year:e.target.value as any}))} /></div>
                <div><label style={LS}>Make</label><input style={{ ...IS, minHeight:44 }} value={editForm.make||''} onChange={e => setEditForm(p=>({...p,make:e.target.value}))} /></div>
                <div><label style={LS}>Model</label><input style={{ ...IS, minHeight:44 }} value={editForm.model||''} onChange={e => setEditForm(p=>({...p,model:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Colour</label><input style={{ ...IS, minHeight:44 }} value={editForm.colour||''} onChange={e => setEditForm(p=>({...p,colour:e.target.value}))} /></div>
                <div><label style={LS}>Kilometers</label><input style={{ ...IS, minHeight:44 }} type="number" value={editForm.kilometers||''} onChange={e => setEditForm(p=>({...p,kilometers:e.target.value as any}))} /></div>
              </div>
              <div style={{ marginBottom:12 }}><label style={LS}>Bought From</label><input style={{ ...IS, minHeight:44 }} value={editForm.bought_from||''} onChange={e => setEditForm(p=>({...p,bought_from:e.target.value}))} /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div><label style={LS}>Purchase Price ($)</label><input style={{ ...IS, minHeight:44 }} type="number" value={editForm.purchase_price||''} onChange={e => setEditForm(p=>({...p,purchase_price:e.target.value as any}))} /></div>
                <div><label style={LS}>Recondition ($)</label><input style={{ ...IS, minHeight:44 }} type="number" value={editForm.recondition_cost||''} onChange={e => setEditForm(p=>({...p,recondition_cost:e.target.value as any}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div><label style={LS}>Sold Price ($)</label><input style={{ ...IS, minHeight:44 }} type="number" value={editForm.sold_price||''} onChange={e => setEditForm(p=>({...p,sold_price:e.target.value as any}))} /></div>
                <div><label style={LS}>Date Sold</label><input style={{ ...IS, minHeight:44 }} type="date" value={editForm.date_sold||''} onChange={e => setEditForm(p=>({...p,date_sold:e.target.value}))} /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div><label style={LS}>Customer</label><input style={{ ...IS, minHeight:44 }} value={editForm.customer||''} onChange={e => setEditForm(p=>({...p,customer:e.target.value}))} /></div>
                <div><label style={LS}>Payment Status</label><select style={{ ...IS, minHeight:44 }} value={editForm.payment_status||'N/A'} onChange={e => setEditForm(p=>({...p,payment_status:e.target.value}))}>{['N/A','Paid','Unpaid'].map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ marginBottom:22 }}><label style={LS}>Notes</label><textarea style={{ ...IS, height:70, resize:'vertical' }} value={editForm.notes||''} onChange={e => setEditForm(p=>({...p,notes:e.target.value}))} /></div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setEditTruck(null)} style={{ flex:1, background:'var(--hover)', border:'1px solid var(--border)', color:'var(--text2)', borderRadius:12, padding:'14px', fontSize:14, cursor:'pointer', fontWeight:500, minHeight:50 }}>Cancel</button>
                <button onClick={saveEdit} style={{ flex:2, background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:12, padding:'14px', fontSize:14, fontWeight:800, cursor:'pointer', minHeight:50 }}>Save Changes</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}