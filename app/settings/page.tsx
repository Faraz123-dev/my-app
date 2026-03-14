'use client'

import { useState } from 'react'

type Tab = 'General' | 'Business' | 'Account' | 'Users' | 'Data'

const pipeline = [
  { stage: 'Intake', desc: 'Initial inspection before buying', color: 'rgba(255,255,255,0.06)', text: 'var(--text2)' },
  { stage: 'Purchased', desc: 'Truck bought, awaiting reconditioning', color: 'rgba(56,189,248,0.1)', text: 'var(--blue)' },
  { stage: 'In Reconditioning', desc: 'Repairs and prep underway', color: 'rgba(34,197,94,0.1)', text: 'var(--green)' },
  { stage: 'Ready to List', desc: 'Truck ready for listing', color: 'rgba(234,179,8,0.1)', text: 'var(--gold)' },
  { stage: 'Listed', desc: 'Truck advertised for sale', color: 'rgba(255,255,255,0.04)', text: 'var(--text)' },
  { stage: 'Deal Pending', desc: 'Offer accepted, awaiting finalization', color: 'rgba(249,115,22,0.1)', text: 'var(--orange)' },
  { stage: 'Sold', desc: 'Deal complete', color: 'rgba(34,197,94,0.1)', text: 'var(--green)' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('General')
  const [laborRate, setLaborRate] = useState('90')
  const [listingPlatform, setListingPlatform] = useState('Facebook Marketplace')
  const [saved, setSaved] = useState(false)
  const [businessName, setBusinessName] = useState('Aamir & Sons Trading Ltd.')
  const [businessEmail, setBusinessEmail] = useState('faiz@aamirandsons.com')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const IS = { width: '100%', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 10, padding: '12px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui,sans-serif', transition: 'border-color 0.15s' }
  const LS = { fontSize: 13, color: 'var(--text2)', marginBottom: 8, display: 'block' as const, fontWeight: 500 }
  const tabs: { id: Tab; icon: string }[] = [{ id: 'General', icon: '⚙' }, { id: 'Business', icon: '🏢' }, { id: 'Account', icon: '🔒' }, { id: 'Users', icon: '👤' }, { id: 'Data', icon: '🗄' }]

  return (
    <>
      <style>{`
        .settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media(max-width:640px) { .settings-grid{grid-template-columns:1fr!important} }
      `}</style>
      <main style={{ padding: '24px 20px', background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>SYSTEM</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Manage your dealership configuration and account.</p>
          <div style={{ marginTop: 16, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)' }} />
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: 5, marginBottom: 24, gap: 3, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, background: activeTab === tab.id ? 'var(--gold)' : 'transparent', border: 'none', color: activeTab === tab.id ? '#000' : 'var(--text3)', borderRadius: 10, padding: '9px 12px', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab.id ? 800 : 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', transition: 'all 0.18s', boxShadow: activeTab === tab.id ? '0 2px 10px var(--gold-glow)' : 'none' }}>
              <span>{tab.icon}</span><span>{tab.id}</span>
            </button>
          ))}
        </div>

        {activeTab === 'General' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="gcard">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px', letterSpacing: '-0.01em' }}>Defaults</h2>
              <div className="settings-grid" style={{ marginBottom: 16 }}>
                <div><label style={LS}>Default Labor Rate ($/hr)</label><input style={IS} type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} /></div>
                <div><label style={LS}>Default Listing Platform</label><select style={{ ...IS, cursor: 'pointer' }} value={listingPlatform} onChange={e => setListingPlatform(e.target.value)}>{['Facebook Marketplace', 'Kijiji', 'TruckPaper', 'Commercial Truck Trader', 'Other'].map(p => <option key={p}>{p}</option>)}</select></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Currency: CAD ($)</div>
              <button onClick={save} style={{ background: saved ? 'var(--green)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saved ? '#fff' : '#000', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', boxShadow: saved ? '0 4px 12px var(--green-dim)' : '0 4px 16px var(--gold-glow)' }}>{saved ? '✓ Saved!' : 'Save Defaults'}</button>
            </div>
            <div className="gcard">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>Truck Status Pipeline</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 20px' }}>Lifecycle stages each truck goes through.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pipeline.map((p, i) => (
                  <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 12, color: 'var(--text4)', width: 18, flexShrink: 0, fontWeight: 600 }}>{i + 1}.</span>
                    <span style={{ background: p.color, color: p.text, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.stage}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Business' && (
          <div className="gcard">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>Business Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="settings-grid">
                <div><label style={LS}>Business Name</label><input style={IS} value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
                <div><label style={LS}>Business Email</label><input style={IS} value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} /></div>
              </div>
              <div className="settings-grid">
                <div><label style={LS}>Phone Number</label><input style={IS} placeholder="+1 (416) 555-0100" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} /></div>
                <div><label style={LS}>Address</label><input style={IS} placeholder="123 King St, Toronto, ON" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} /></div>
              </div>
              <button onClick={save} style={{ background: saved ? 'var(--green)' : 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: saved ? '#fff' : '#000', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', alignSelf: 'flex-start', boxShadow: saved ? '0 4px 12px var(--green-dim)' : '0 4px 16px var(--gold-glow)' }}>{saved ? '✓ Saved!' : 'Save Business Info'}</button>
            </div>
          </div>
        )}

        {activeTab === 'Account' && (
          <div className="gcard">
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 20px' }}>Account Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><label style={LS}>Email Address</label><input style={IS} placeholder="faiz@aamirandsons.com" /></div>
              <div><label style={LS}>New Password</label><input style={IS} type="password" placeholder="••••••••" /></div>
              <div><label style={LS}>Confirm Password</label><input style={IS} type="password" placeholder="••••••••" /></div>
              <button style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 10, padding: '10px 22px', fontSize: 13, fontWeight: 800, cursor: 'pointer', alignSelf: 'flex-start', boxShadow: '0 4px 16px var(--gold-glow)' }}>Update Account</button>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="gcard">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Users</h2>
              <button style={{ background: 'linear-gradient(135deg,#EAB308,#d97706)', border: 'none', color: '#000', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>+ Invite</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border2)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#EAB308,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#000', fontWeight: 800, flexShrink: 0 }}>FA</div>
              <div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Faiz Aamir</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>faiz@aamirandsons.com</div>
              </div>
              <span style={{ marginLeft: 'auto', background: 'var(--green-dim)', color: 'var(--green)', borderRadius: 99, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>Owner</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 16 }}>Invite team members to collaborate on this account.</div>
          </div>
        )}

        {activeTab === 'Data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="gcard">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Export Data</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 16px' }}>Download your data as CSV files.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Export Inventory', 'Export Invoices', 'Export Reports'].map(label => (
                  <button key={label} style={{ background: 'var(--hover)', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: 10, padding: '9px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}>↓ {label}</button>
                ))}
              </div>
            </div>
            <div className="gcard" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)', margin: '0 0 8px' }}>Danger Zone</h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: '0 0 16px' }}>These actions are irreversible. Proceed with caution.</p>
              <button style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '9px 18px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>🗑 Delete All Data</button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}