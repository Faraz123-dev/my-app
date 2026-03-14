'use client'

import { useState } from 'react'

type Tab = 'General' | 'Business' | 'Account' | 'Users' | 'Data'

const pipeline = [
  { stage: 'Intake', desc: 'Initial inspection before buying', color: '#555', text: '#ccc' },
  { stage: 'Purchased', desc: 'Truck bought, awaiting reconditioning', color: '#1e3a5f', text: '#60a5fa' },
  { stage: 'In Reconditioning', desc: 'Repairs and prep underway', color: '#1a3a2a', text: '#34d399' },
  { stage: 'Ready to List', desc: 'Truck ready for listing', color: '#3a2a0a', text: '#EAB308' },
  { stage: 'Listed', desc: 'Truck advertised for sale', color: '#1e1e1e', text: '#ccc' },
  { stage: 'Deal Pending', desc: 'Offer accepted, awaiting finalization', color: '#3a1a0a', text: '#f97316' },
  { stage: 'Sold', desc: 'Deal complete', color: '#0f2a1a', text: '#22c55e' },
]

const inputStyle = {
  width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8,
  padding: '12px 14px', color: '#e5e5e5', fontSize: 14, outline: 'none',
  boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif',
}
const labelStyle = { fontSize: 13, color: '#ccc', marginBottom: 8, display: 'block' as const }

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('General')
  const [laborRate, setLaborRate] = useState('90')
  const [listingPlatform, setListingPlatform] = useState('Facebook Marketplace')
  const [saved, setSaved] = useState(false)
  const [businessName, setBusinessName] = useState('Aamir & Sons Trading Ltd.')
  const [businessEmail, setBusinessEmail] = useState('faiz@aamirandsons.com')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')

  const saveDefaults = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const tabs: { id: Tab; icon: string }[] = [
    { id: 'General', icon: '⚙' },
    { id: 'Business', icon: '🏢' },
    { id: 'Account', icon: '🔒' },
    { id: 'Users', icon: '👤' },
    { id: 'Data', icon: '🗄' },
  ]

  return (
    <>
      <style>{`
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) {
          .settings-grid { grid-template-columns: 1fr !important; }
          .settings-tabs button span.tab-label { display: none; }
        }
      `}</style>
      <main style={{ padding: '16px', overflowY: 'auto', background: '#0a0a0a', minHeight: '100vh', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>Settings</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>Manage your dealership configuration.</p>

        {/* Tabs */}
        <div className="settings-tabs" style={{ display: 'flex', background: '#161616', border: '1px solid #222', borderRadius: 10, padding: 4, marginBottom: 20, gap: 2, overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, background: activeTab === tab.id ? '#0a0a0a' : 'transparent',
              border: activeTab === tab.id ? '1px solid #EAB308' : '1px solid transparent',
              color: activeTab === tab.id ? '#EAB308' : '#666',
              borderRadius: 8, padding: '8px 10px', fontSize: 13,
              cursor: 'pointer', fontWeight: activeTab === tab.id ? 500 : 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, whiteSpace: 'nowrap',
            }}>
              <span>{tab.icon}</span>
              <span className="tab-label">{tab.id}</span>
            </button>
          ))}
        </div>

        {activeTab === 'General' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Defaults</h2>
              <div className="settings-grid" style={{ marginBottom: 14 }}>
                <div><label style={labelStyle}>Default Labor Rate ($/hr)</label><input style={inputStyle} type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} /></div>
                <div><label style={labelStyle}>Default Listing Platform</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={listingPlatform} onChange={e => setListingPlatform(e.target.value)}>
                    {['Facebook Marketplace', 'Kijiji', 'TruckPaper', 'Commercial Truck Trader', 'Other'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 14 }}>Currency: CAD ($)</div>
              <button onClick={saveDefaults} style={{ background: saved ? '#166534' : '#EAB308', border: 'none', color: saved ? '#fff' : '#000', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {saved ? '✓ Saved!' : 'Save Defaults'}
              </button>
            </div>

            <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 6px' }}>Truck Status Pipeline</h2>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 16px' }}>Lifecycle stages each truck goes through.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pipeline.map((p, i) => (
                  <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#555', width: 18, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ background: p.color, color: p.text, border: `1px solid ${p.text}33`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{p.stage}</span>
                    <span style={{ fontSize: 12, color: '#777' }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Business' && (
          <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Business Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="settings-grid">
                <div><label style={labelStyle}>Business Name</label><input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} /></div>
                <div><label style={labelStyle}>Business Email</label><input style={inputStyle} value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} /></div>
              </div>
              <div className="settings-grid">
                <div><label style={labelStyle}>Phone Number</label><input style={inputStyle} placeholder="+1 (416) 555-0100" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} /></div>
                <div><label style={labelStyle}>Address</label><input style={inputStyle} placeholder="123 King St, Toronto, ON" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} /></div>
              </div>
              <button onClick={saveDefaults} style={{ background: saved ? '#166534' : '#EAB308', border: 'none', color: saved ? '#fff' : '#000', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
                {saved ? '✓ Saved!' : 'Save Business Info'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Account' && (
          <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Account Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={labelStyle}>Email Address</label><input style={inputStyle} placeholder="faiz@aamirandsons.com" /></div>
              <div><label style={labelStyle}>New Password</label><input style={inputStyle} type="password" placeholder="••••••••" /></div>
              <div><label style={labelStyle}>Confirm Password</label><input style={inputStyle} type="password" placeholder="••••••••" /></div>
              <button style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>Update Account</button>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Users</h2>
              <button style={{ background: '#EAB308', border: 'none', color: '#000', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Invite</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #222' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#60a5fa', fontWeight: 600, flexShrink: 0 }}>FA</div>
              <div>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 500 }}>Faiz Aamir</div>
                <div style={{ fontSize: 12, color: '#666' }}>faiz@aamirandsons.com</div>
              </div>
              <span style={{ marginLeft: 'auto', background: '#0f2a1a', color: '#22c55e', border: '1px solid #166534', borderRadius: 5, padding: '3px 10px', fontSize: 11 }}>Owner</span>
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 14 }}>Invite team members to collaborate.</div>
          </div>
        )}

        {activeTab === 'Data' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#161616', border: '1px solid #222', borderRadius: 10, padding: '20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 8px' }}>Export Data</h2>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 14px' }}>Download your data as CSV files.</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Export Inventory', 'Export Invoices', 'Export Reports'].map(label => (
                  <button key={label} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc', borderRadius: 8, padding: '9px 14px', fontSize: 13, cursor: 'pointer' }}>↓ {label}</button>
                ))}
              </div>
            </div>
            <div style={{ background: '#161616', border: '1px solid #7f1d1d', borderRadius: 10, padding: '20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#ef4444', margin: '0 0 8px' }}>Danger Zone</h2>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 14px' }}>These actions are irreversible.</p>
              <button style={{ background: '#2a0f0f', border: '1px solid #7f1d1d', color: '#ef4444', borderRadius: 8, padding: '9px 16px', fontSize: 13, cursor: 'pointer' }}>🗑 Delete All Data</button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}