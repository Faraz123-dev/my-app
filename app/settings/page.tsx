'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Tab = 'General' | 'Business' | 'Account' | 'Users' | 'Data'

const pipeline = [
  { stage: 'Intake',            desc: 'Initial inspection before buying',          color: 'var(--gold-dim)',    text: 'var(--gold)'   },
  { stage: 'Purchased',         desc: 'Truck bought, awaiting reconditioning',      color: 'var(--hover)',       text: 'var(--text2)'  },
  { stage: 'In Reconditioning', desc: 'Repairs and prep underway',                  color: 'var(--green-dim)',  text: 'var(--green)'  },
  { stage: 'Ready to List',     desc: 'Truck ready for listing',                    color: 'var(--gold-dim)',   text: 'var(--gold)'   },
  { stage: 'Listed',            desc: 'Truck advertised for sale',                  color: 'var(--blue-dim)',   text: 'var(--blue)'   },
  { stage: 'Deal Pending',      desc: 'Offer accepted, awaiting finalization',      color: 'var(--orange-dim)', text: 'var(--orange)' },
  { stage: 'Sold',              desc: 'Deal complete',                              color: 'var(--green-dim)',  text: 'var(--green)'  },
]

const PLATFORMS = ['Facebook Marketplace', 'Kijiji', 'AutoTrader', 'Truck Paper', 'Craigslist', 'Other']

export default function SettingsPage() {
  const [activeTab,       setActiveTab]       = useState<Tab>('General')
  const [loading,         setLoading]         = useState(true)
  const [saved,           setSaved]           = useState<string | null>(null)
  const [exporting,       setExporting]       = useState<string | null>(null)
  const [userEmail,       setUserEmail]       = useState('')
  const [userCreated,     setUserCreated]     = useState('')
  const [laborRate,       setLaborRate]       = useState('90')
  const [platforms,       setPlatforms]       = useState<string[]>(['Facebook Marketplace', 'Kijiji', 'Truck Paper'])
  const [bizName,         setBizName]         = useState('Aamir & Sons Trading')
  const [bizEmail,        setBizEmail]        = useState('aamirandsons@hotmail.com')
  const [bizPhone,        setBizPhone]        = useState('')
  const [bizAddress,      setBizAddress]      = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError,         setPwError]         = useState('')
  const [pwSaved,         setPwSaved]         = useState(false)
  const [stats,           setStats]           = useState({ trucks: 0, intakes: 0, vendors: 0, invoices: 0 })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: { user } }, { data: settings }, { data: trucks }, { data: inv }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('settings').select('*').eq('id', 'singleton').single(),
      supabase.from('Inventory Data').select('id,status'),
      supabase.from('vendor_invoices').select('id'),
    ])
    if (user) {
      setUserEmail(user.email || '')
      setUserCreated(user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '')
    }
    if (settings) {
      setBizName(settings.business_name || 'Aamir & Sons Trading')
      setBizEmail(settings.business_email || 'aamirandsons@hotmail.com')
      setBizPhone(settings.business_phone || '')
      setBizAddress(settings.business_address || '')
      setLaborRate(settings.default_labor_rate?.toString() || '90')
      if (settings.listing_platforms) setPlatforms(settings.listing_platforms)
    }
    const truckList = trucks || []
    setStats({ trucks: truckList.filter(t => t.status !== 'Intake').length, intakes: truckList.filter(t => t.status === 'Intake').length, vendors: 0, invoices: inv?.length || 0 })
    setLoading(false)
  }

  function flash(key: string) { setSaved(key); setTimeout(() => setSaved(null), 2000) }

  async function saveGeneral() {
    await supabase.from('settings').upsert({ id: 'singleton', default_labor_rate: parseFloat(laborRate) || 90, listing_platforms: platforms })
    flash('general')
  }

  async function saveBusiness() {
    await supabase.from('settings').upsert({ id: 'singleton', business_name: bizName, business_email: bizEmail, business_phone: bizPhone, business_address: bizAddress })
    flash('business')
  }

  async function updatePassword() {
    setPwError('')
    if (!newPassword) return setPwError('Enter a new password.')
    if (newPassword.length < 6) return setPwError('Password must be at least 6 characters.')
    if (newPassword !== confirmPassword) return setPwError('Passwords do not match.')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwError(error.message); return }
    setPwSaved(true); setNewPassword(''); setConfirmPassword('')
    setTimeout(() => setPwSaved(false), 3000)
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function exportCSV(type: string) {
    setExporting(type)
    let rows: any[] = [], filename = ''
    if (type === 'inventory') {
      const { data } = await supabase.from('Inventory Data').select('*').order('bought_on', { ascending: false })
      rows = data || []; filename = 'inventory.csv'
    } else if (type === 'invoices') {
      const { data } = await supabase.from('vendor_invoices').select('*').order('date', { ascending: false })
      rows = data || []; filename = 'vendor_invoices.csv'
    } else if (type === 'reports') {
      const { data } = await supabase.from('Inventory Data').select('id,status,date_sold,sold_price,purchase_price,recondition_cost,make,model,year').eq('status','Sold').order('date_sold',{ascending:false})
      rows = (data||[]).map((t:any) => ({...t, profit:(t.sold_price||0)-(t.purchase_price||0)-(t.recondition_cost||0)})); filename='sales_report.csv'
    }
    if (rows.length === 0) { setExporting(null); return }
    const headers = Object.keys(rows[0]).join(',')
    const csv = [headers, ...rows.map((r:any) => Object.values(r).map((v:any)=>`"${v??''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=filename; a.click()
    URL.revokeObjectURL(url); setExporting(null)
  }

  async function clearIntakes() {
    if (!confirm('Delete all Intake trucks? This cannot be undone.')) return
    await supabase.from('Inventory Data').delete().eq('status', 'Intake')
    loadAll()
  }

  const IS = { width:'100%', background:'var(--input-bg)', border:'1px solid var(--input-border)', borderRadius:10, padding:'12px 14px', color:'var(--text)', fontSize:14, outline:'none', boxSizing:'border-box' as const, fontFamily:'system-ui,sans-serif', transition:'border-color 0.15s' }
  const LS = { fontSize:13, color:'var(--text3)', marginBottom:8, display:'block' as const, fontWeight:500 }
  const tabs: { id: Tab; icon: string }[] = [{ id:'General',icon:'⚙' },{ id:'Business',icon:'🏢' },{ id:'Account',icon:'🔒' },{ id:'Users',icon:'👤' },{ id:'Data',icon:'🗄' }]

  const SaveBtn = ({ k, onClick }: { k: string; onClick: () => void }) => (
    <button onClick={onClick} style={{ background:saved===k?'var(--green)':'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:saved===k?'#fff':'#000', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:800, cursor:'pointer', transition:'all 0.2s', boxShadow:saved===k?'0 4px 12px var(--green-dim)':'0 4px 16px var(--gold-glow)' }}>
      {saved===k ? '✓ Saved!' : 'Save Changes'}
    </button>
  )

  return (
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .sg{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:640px){.sg{grid-template-columns:1fr!important}}
      `}</style>
      <main style={{ padding:'24px 20px', background:'var(--bg)', minHeight:'100vh', color:'var(--text)', fontFamily:'system-ui,sans-serif' }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', fontWeight:700, marginBottom:6, opacity:0.7 }}>SYSTEM</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Settings</h1>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Manage your dealership configuration and account.</p>
          <div style={{ marginTop:16, height:1, background:'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        <div style={{ display:'flex', background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:14, padding:5, marginBottom:24, gap:3, overflowX:'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex:1, background:activeTab===tab.id?'var(--gold)':'transparent', border:'none', color:activeTab===tab.id?'#000':'var(--text3)', borderRadius:10, padding:'9px 12px', fontSize:13, cursor:'pointer', fontWeight:activeTab===tab.id?800:400, display:'flex', alignItems:'center', justifyContent:'center', gap:6, whiteSpace:'nowrap', transition:'all 0.18s' }}>
              <span>{tab.icon}</span><span>{tab.id}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
            <div style={{ width:32, height:32, border:'2px solid transparent', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
          </div>
        ) : (<>

          {activeTab === 'General' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Defaults</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>System-wide defaults applied when creating new entries.</p>
                <div className="sg" style={{ marginBottom:20 }}>
                  <div><label style={LS}>Default Labor Rate ($/hr)</label><input style={IS} type="number" value={laborRate} onChange={e=>setLaborRate(e.target.value)} /></div>
                  <div><label style={LS}>Currency</label><div style={{ ...IS, display:'flex', alignItems:'center', color:'var(--text3)', cursor:'default', background:'var(--hover)' }}>CAD ($) — Canadian Dollar</div></div>
                </div>
                <SaveBtn k="general" onClick={saveGeneral} />
              </div>

              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Listing Platforms</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 16px' }}>Platforms used when listing trucks for sale.</p>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
                  {PLATFORMS.map(p => {
                    const active = platforms.includes(p)
                    return (
                      <button key={p} onClick={() => setPlatforms(prev => active ? prev.filter(x=>x!==p) : [...prev,p])}
                        style={{ background:active?'var(--gold)':'var(--hover)', border:`1px solid ${active?'var(--gold)':'var(--border)'}`, color:active?'#000':'var(--text2)', borderRadius:99, padding:'6px 16px', fontSize:13, cursor:'pointer', fontWeight:active?700:400, transition:'all 0.15s' }}>
                        {p}
                      </button>
                    )
                  })}
                </div>
                <SaveBtn k="platforms" onClick={saveGeneral} />
              </div>

              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Truck Status Pipeline</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>Lifecycle stages each truck goes through.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {pipeline.map((p, i) => (
                    <div key={p.stage} style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <span style={{ fontSize:12, color:'var(--text4)', width:18, flexShrink:0, fontWeight:600 }}>{i+1}.</span>
                      <span style={{ background:p.color, color:p.text, borderRadius:99, padding:'4px 12px', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>{p.stage}</span>
                      <span style={{ fontSize:12, color:'var(--text3)' }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Business' && (
            <div className="gcard">
              <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Business Profile</h2>
              <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>Your dealership information — displayed in reports and invoices.</p>
              <div className="sg" style={{ marginBottom:16 }}>
                <div><label style={LS}>Business Name</label><input style={IS} value={bizName} onChange={e=>setBizName(e.target.value)} /></div>
                <div><label style={LS}>Contact Email</label><input style={IS} type="email" value={bizEmail} onChange={e=>setBizEmail(e.target.value)} /></div>
              </div>
              <div className="sg" style={{ marginBottom:20 }}>
                <div><label style={LS}>Phone Number</label><input style={IS} placeholder="+1 (416) 555-0100" value={bizPhone} onChange={e=>setBizPhone(e.target.value)} /></div>
                <div><label style={LS}>Address</label><input style={IS} placeholder="123 King St, Toronto, ON" value={bizAddress} onChange={e=>setBizAddress(e.target.value)} /></div>
              </div>
              <SaveBtn k="business" onClick={saveBusiness} />
            </div>
          )}

          {activeTab === 'Account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 20px' }}>Your Account</h2>
                <div className="sg">
                  <div>
                    <div style={{ fontSize:11, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>EMAIL</div>
                    <div style={{ fontSize:15, fontWeight:600, color:'var(--text)' }}>{userEmail || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'var(--text4)', letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>ROLE</div>
                    <span style={{ background:'var(--gold)', color:'#000', borderRadius:99, padding:'4px 14px', fontSize:12, fontWeight:800 }}>Admin</span>
                  </div>
                </div>
              </div>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>🔑 Change Password</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>Choose a strong password at least 6 characters long.</p>
                <div className="sg" style={{ marginBottom:16 }}>
                  <div><label style={LS}>New Password</label><input style={IS} type="password" placeholder="••••••••" value={newPassword} onChange={e=>{setNewPassword(e.target.value);setPwError('')}} /></div>
                  <div><label style={LS}>Confirm Password</label><input style={IS} type="password" placeholder="••••••••" value={confirmPassword} onChange={e=>{setConfirmPassword(e.target.value);setPwError('')}} /></div>
                </div>
                {pwError && <div style={{ fontSize:13, color:'var(--red)', marginBottom:12 }}>⚠ {pwError}</div>}
                {pwSaved && <div style={{ fontSize:13, color:'var(--green)', marginBottom:12 }}>✓ Password updated successfully.</div>}
                <button onClick={updatePassword} style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 16px var(--gold-glow)' }}>Update Password</button>
              </div>
              <div className="gcard" style={{ borderColor:'rgba(239,68,68,0.3)' }}>
                <h2 style={{ fontSize:16, fontWeight:700, color:'var(--red)', margin:'0 0 6px' }}>Session</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 16px' }}>Sign out of your current session on this device.</p>
                <button onClick={signOut} style={{ background:'var(--red)', border:'none', color:'#fff', borderRadius:10, padding:'9px 22px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Sign Out</button>
              </div>
            </div>
          )}

          {activeTab === 'Users' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Team Members</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>Users who have access to the system. New users are added via the sign-up page.</p>
                <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:'var(--hover)', borderRadius:12, border:'1px solid var(--border)' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#EAB308,#d97706)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#000', fontWeight:800, flexShrink:0 }}>
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, color:'var(--text)', fontWeight:600 }}>{userEmail} <span style={{ fontSize:12, color:'var(--text4)' }}>(you)</span></div>
                    {userCreated && <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>Added {userCreated}</div>}
                  </div>
                  <span style={{ background:'var(--gold)', color:'#000', borderRadius:99, padding:'3px 14px', fontSize:11, fontWeight:800 }}>Admin</span>
                </div>
              </div>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 16px' }}>Roles Reference</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {[
                    { role:'Admin', color:'var(--gold)',  dim:'var(--gold-dim)', desc:'Full access — can manage trucks, finances, invoices, users, and all settings.' },
                    { role:'Ops',   color:'var(--text2)', dim:'var(--hover)',     desc:'Operational access — can manage intake, costs, and documents but cannot edit final profit-related financial fields.' },
                  ].map(r => (
                    <div key={r.role} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                      <span style={{ background:r.dim, color:r.color, border:`1px solid ${r.color}`, borderRadius:99, padding:'3px 12px', fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 }}>{r.role}</span>
                      <span style={{ fontSize:13, color:'var(--text2)' }}>{r.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Data' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>System Overview</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>A snapshot of your data across the system.</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                  {[['TRUCKS',stats.trucks],['INTAKES',stats.intakes],['VENDORS',stats.vendors],['INVOICES',stats.invoices]].map(([l,v]) => (
                    <div key={String(l)} style={{ background:'var(--hover)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', textAlign:'center' }}>
                      <div style={{ fontSize:28, fontWeight:800, color:'var(--text)', marginBottom:4 }}>{v}</div>
                      <div style={{ fontSize:10, color:'var(--text4)', letterSpacing:'0.12em', fontWeight:700 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="gcard">
                <h2 style={{ fontSize:16, fontWeight:700, margin:'0 0 6px' }}>Export Data</h2>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 20px' }}>Download your data as CSV files. All fields included.</p>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {[['inventory','Export Inventory'],['invoices','Export Invoices'],['reports','Export Sales Report']].map(([key,label]) => (
                    <button key={key} onClick={() => exportCSV(key)} disabled={exporting===key}
                      style={{ background:exporting===key?'var(--hover)':'var(--card-bg)', border:'1px solid var(--border)', color:exporting===key?'var(--text4)':'var(--text2)', borderRadius:10, padding:'9px 16px', fontSize:13, cursor:exporting===key?'default':'pointer', fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                      {exporting===key ? <><span style={{ width:12,height:12,border:'2px solid transparent',borderTopColor:'var(--text3)',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block' }}/>Exporting...</> : <>⬇ {label}</>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="gcard" style={{ borderColor:'rgba(239,68,68,0.3)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ color:'var(--red)', fontSize:16 }}>🗑</span>
                  <h2 style={{ fontSize:16, fontWeight:700, color:'var(--red)', margin:0 }}>Danger Zone</h2>
                </div>
                <p style={{ fontSize:13, color:'var(--text3)', margin:'0 0 16px' }}>Irreversible actions. Proceed with caution.</p>
                <button onClick={clearIntakes} style={{ background:'var(--red)', border:'none', color:'#fff', borderRadius:10, padding:'9px 20px', fontSize:13, cursor:'pointer', fontWeight:700 }}>Clear All Intakes</button>
              </div>
            </div>
          )}
        </>)}
      </main>
    </>
  )
}