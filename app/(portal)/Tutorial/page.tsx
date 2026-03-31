'use client'

import { useState } from 'react'

type Section = {
  id: string
  icon: string
  title: string
  subtitle: string
  steps: { title: string; desc: string; tip?: string }[]
}

const sections: Section[] = [
  {
    id: 'dashboard',
    icon: '📊',
    title: 'Dashboard',
    subtitle: 'Your command centre — live overview of the entire fleet.',
    steps: [
      { title: 'KPI Cards', desc: 'The top 4 cards show Active Inventory, Capital Deployed (true all-in cost including all recon), Pending Payments, and This Month\'s Profit. These update in real time from your data.' },
      { title: 'All-Time Stats', desc: 'Below the KPIs you\'ll find Total Revenue, Total Profit, Average Profit per Truck, and Total Trucks Sold — calculated across all time.' },
      { title: 'Profit Chart', desc: 'Switch between Monthly, Quarterly, and YTD views using the toggle. In Monthly mode use the 6mo/12mo/24mo filter to zoom in. Hover over any bar to see revenue, profit, and truck count for that period.' },
      { title: 'Aging Donut', desc: 'Shows how long your current inventory has been sitting. Hover segments to highlight. Capital at Risk shows the total money tied up in trucks 30+ days old.' },
      { title: 'Bottom Tables', desc: 'Aging 30+ Days lists trucks that need attention sorted by days. Pending Payments lists sold trucks awaiting payment. Click any row to go straight to that truck.' },
    ]
  },
  {
    id: 'inventory',
    icon: '🚛',
    title: 'Inventory',
    subtitle: 'Manage your entire fleet in one place.',
    steps: [
      { title: 'Adding a Truck', desc: 'Click "+ Add Truck" in the top right. Fill in VIN, year, make, model, purchase price and other details. VIN is required. The truck is immediately added to your inventory.' },
      { title: 'Card vs Table View', desc: 'Toggle between card and table view using the ▦/☰ buttons. Cards show a summary, table shows all columns including Colour, Bought From, Recon, Date Sold, Customer and more.', tip: 'Table view is best for quickly scanning all data across many trucks.' },
      { title: 'Searching & Filtering', desc: 'Use the search bar to find trucks by VIN, make, model, customer, or seller. Filter by status (Intake, Purchased, In Reconditioning, etc.) or payment status.' },
      { title: 'Photos', desc: 'Click the 📷 icon on any truck to upload a photo. Click the thumbnail to open a fullscreen immersive preview. In the preview you can Replace or Remove the photo.' },
      { title: 'Editing a Truck', desc: 'Click the ✏️ button on any row to open the edit modal. You can update every field — status, VIN, year, make, model, colour, KMs, purchase price, recon cost, sold price, date sold, customer, and payment status.' },
      { title: 'Deleting a Truck', desc: 'Click the 🗑 button to permanently delete a truck. This cannot be undone.' },
      { title: 'Profit Calculation', desc: 'All-In = Purchase Price + Recondition Cost. Profit = Sold Price − All-In. These are shown on every card and table row.' },
    ]
  },
  {
    id: 'truck-detail',
    icon: '🔍',
    title: 'Truck Detail',
    subtitle: 'The full file for a single truck — costs, docs, listings, and more.',
    steps: [
      { title: 'Overview Tab', desc: 'Shows the status timeline, key dates (bought, listed, sold), vehicle details, and notes. Click "✏ Edit" on the Details card to update colour, KMs, purchase price, recon cost, sold info, and more.' },
      { title: 'Status Bar', desc: 'The dropdown at the top lets you change the truck\'s status instantly. It saves to Supabase immediately.', tip: 'Moving a truck to Sold automatically sets the status when you save sale details.' },
      { title: 'Costs Tab', desc: 'Track every expense: Parts, Labor, Vendor Invoices, and Other Costs. Click "+ Add" in each section. Every cost row has a "📎 Upload" button to attach an invoice image or PDF.' },
      { title: 'Cost Bar', desc: 'The sticky bar at the bottom of the Costs tab shows running totals: Parts, Labor, Vendor, Other, Recon total, and the final All-In cost.' },
      { title: 'Listings Tab', desc: 'Record where the truck is listed, the asking price, listing link, and date. The link is clickable. Log offers with amounts, dates, and notes. Mark offers as accepted.' },
      { title: 'Sale Details', desc: 'Enter the sold price, date sold, customer name, and payment status. Saving with a sold price automatically sets status to Sold.' },
      { title: 'Docs Tab', desc: 'Upload any file (images, PDFs, Word docs) into 6 categories: Photos, Purchase Docs, Inspection & Safety, Repair Invoices, Sales Docs, Other. Click any file to preview it. Delete removes from both storage and database.' },
    ]
  },
  {
    id: 'intake',
    icon: '📋',
    title: 'Truck Intake',
    subtitle: 'Evaluate a truck before deciding to buy.',
    steps: [
      { title: 'When to Use This', desc: 'Use Truck Intake when you\'re inspecting a truck at a seller\'s location or auction and need to decide whether to buy. Fill in what you know on the spot.' },
      { title: 'Seller Info', desc: 'Enter the seller\'s name and contact info. This gets saved to the truck\'s "Bought From" field.' },
      { title: 'Inspection Checklist', desc: 'Check off each item as you inspect: engine, transmission, brakes, tires, body, electrical, AC, and warning lights. The checklist score is saved in the notes.' },
      { title: 'Profit Simulator', desc: 'Enter your offer price and estimated recon cost to instantly see projected profit, margin, and minimum sell price before committing.' },
      { title: 'Save Intake Only', desc: 'Creates the truck in Inventory with status "Intake". Use this when you\'re still deciding. The truck appears in inventory filtered by Intake status.', tip: 'Filter the Inventory page by "Intake" to see all trucks under evaluation.' },
      { title: 'Create Truck File & Buy', desc: 'Creates the truck with status "Purchased" and immediately redirects you to the truck\'s detail page to continue filling in information.' },
    ]
  },
  {
    id: 'invoices',
    icon: '🧾',
    title: 'Vendor Invoices',
    subtitle: 'Track all vendor invoices across your fleet.',
    steps: [
      { title: 'Adding an Invoice', desc: 'Click "+ Add Invoice". Select the linked truck from the dropdown, enter vendor name, amount, description, date, and status (Unpaid/Paid/Overdue).' },
      { title: 'Linking to Trucks', desc: 'Every invoice must be linked to a truck. This ensures costs flow into the truck\'s all-in cost calculation and appear in the Costs tab on the truck detail page.' },
      { title: 'Status Toggle', desc: 'Click the status badge (Unpaid/Paid/Overdue) on any invoice to cycle through statuses with one click. No modal needed.' },
      { title: 'Uploading Invoice Files', desc: 'Use the 📎 Upload button on any row to attach the actual invoice image or PDF. Once uploaded, a "📄 View" button appears to open it.' },
      { title: 'Editing & Deleting', desc: 'Use ✏️ to edit any invoice details. Use 🗑 to permanently delete. Deleting removes it from the vendor invoices table and the truck\'s cost calculation updates accordingly.' },
      { title: 'KPI Cards', desc: 'The top cards show Total Invoices, Unpaid amount, Overdue amount, and total Paid. These pull live from your data.' },
    ]
  },
  {
    id: 'reports',
    icon: '📈',
    title: 'Reports',
    subtitle: 'Analytics across your entire business.',
    steps: [
      { title: 'Profit Tab', desc: 'Monthly bar chart showing profit per month. Toggle between Profit only, Revenue only, or Both. Filter by 6M, 1Y, 2Y, or All time. The table below shows a full breakdown with margin %.' },
      { title: 'Aging Tab', desc: 'See how long your in-stock trucks have been sitting. Buckets: 0–15 days (green), 16–30 (gold), 31–60 (orange), 60+ (red). The table is sorted by days, click any row to go to the truck.' },
      { title: 'Vendor Spend Tab', desc: 'Shows total vendor invoice spend, number of unique vendors, and average per invoice. The top 10 vendors are ranked by total spend with progress bars showing % of total.' },
      { title: 'Cashflow Tab', desc: 'Monthly cash in (from sales) vs cash out (from purchases). Shows net cashflow per month. Use the range filter to zoom in. Helps identify cash-tight months.' },
      { title: 'Profit Accuracy', desc: 'All profit figures use the full all-in cost: purchase price + recondition cost + parts + labor + vendor invoices + other costs. Make sure costs are entered in the truck detail page for accurate reporting.' },
    ]
  },
  {
    id: 'calculator',
    icon: '🧮',
    title: 'Profit Calculator',
    subtitle: 'Simulate a deal before committing.',
    steps: [
      { title: 'How to Use', desc: 'Enter Purchase Price, Estimated Recon Cost, and any Other Fees. The All-In Cost updates instantly. This is a standalone tool — nothing is saved to the database.' },
      { title: 'Expected Sell Price', desc: 'Enter an expected sell price to instantly see Projected Profit and Margin %. The status badge shows PROFITABLE, BREAK EVEN, or LOSS.' },
      { title: 'Target Profit', desc: 'Enter a target profit amount (or %) and the Min Sell Required card shows exactly what price you need to hit that target. Toggle between $ and % mode using the switch.' },
      { title: 'Copy Results', desc: 'Click "⧉ Copy Results" to copy All-In, Min Sell, and Projected Profit to your clipboard — useful for sharing with partners or saving notes.' },
      { title: 'Reset', desc: 'Click "↺ Reset" to clear all fields and start a new calculation.' },
    ]
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Settings',
    subtitle: 'Configure your dealership system.',
    steps: [
      { title: 'General Tab', desc: 'Set your default labor rate (used as a suggestion when adding labor costs) and select which listing platforms you use. Toggle platforms on/off by clicking them.' },
      { title: 'Business Tab', desc: 'Enter your dealership name, contact email, phone, and address. This information is saved to Supabase and displayed in exports and reports.' },
      { title: 'Account Tab', desc: 'Shows your signed-in email and role. Use the Change Password section to update your password. Sign Out ends your current session.' },
      { title: 'Users Tab', desc: 'Shows all users with access to the system. New users are managed through Supabase Authentication.' },
      { title: 'Data Tab', desc: 'System Overview shows live counts of trucks, intakes, vendors, and invoices. Export buttons download CSV files for Inventory, Invoices, and Sales Report. Clear All Intakes removes all Intake-status trucks.' },
    ]
  },
]

export default function TutorialPage() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const section = sections.find(s => s.id === activeSection)!

  return (
    <>
      <style>{`
        .tut-nav-btn { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; border:none; cursor:pointer; transition:all 0.15s; width:100%; text-align:left; }
        .tut-nav-btn:hover { background:var(--hover); }
        .tut-step { border:1px solid var(--card-border); border-radius:12px; overflow:hidden; transition:all 0.15s; }
        .tut-step:hover { border-color:var(--gold); }
        @media(max-width:768px){ .tut-layout{flex-direction:column!important} .tut-sidebar{width:100%!important; flex-direction:row!important; overflow-x:auto; flex-wrap:nowrap!important} }
      `}</style>
      <main style={{ padding:'24px 20px', background:'var(--bg)', minHeight:'100vh', color:'var(--text)', fontFamily:'system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, color:'var(--gold)', letterSpacing:'0.15em', fontWeight:700, marginBottom:6, opacity:0.7 }}>HELP</div>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em' }}>Tutorial</h1>
          <p style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>Learn how to use every feature of Aamir & Sons Fleet Management.</p>
          <div style={{ marginTop:16, height:1, background:'linear-gradient(90deg,var(--gold),transparent)' }} />
        </div>

        <div className="tut-layout" style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

          {/* Sidebar */}
          <div className="tut-sidebar" style={{ width:220, flexShrink:0, display:'flex', flexDirection:'column', gap:4, position:'sticky', top:20 }}>
            {sections.map(s => (
              <button key={s.id} className="tut-nav-btn"
                onClick={() => { setActiveSection(s.id); setExpandedStep(null) }}
                style={{ background: activeSection===s.id ? 'var(--gold)' : 'transparent', color: activeSection===s.id ? '#000' : 'var(--text2)' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight: activeSection===s.id ? 800 : 500, whiteSpace:'nowrap' }}>{s.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Section header */}
            <div style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', borderRadius:16, padding:'20px 24px', marginBottom:16, boxShadow:'var(--shadow-card)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'var(--gold-dim)', border:'1px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>{section.icon}</div>
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:'var(--text)', margin:0, letterSpacing:'-0.02em' }}>{section.title}</h2>
                  <p style={{ fontSize:13, color:'var(--text3)', margin:0, marginTop:2 }}>{section.subtitle}</p>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12 }}>
                <div style={{ height:3, flex:1, background:'var(--border)', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${(sections.findIndex(s=>s.id===activeSection)+1)/sections.length*100}%`, background:'var(--gold)', borderRadius:99, transition:'width 0.3s' }} />
                </div>
                <span style={{ fontSize:11, color:'var(--text4)', fontWeight:600, whiteSpace:'nowrap' }}>{sections.findIndex(s=>s.id===activeSection)+1} / {sections.length}</span>
              </div>
            </div>

            {/* Steps */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {section.steps.map((step, i) => {
                const isOpen = expandedStep === i
                return (
                  <div key={i} className="tut-step" style={{ background:'var(--card-bg)', boxShadow:'var(--shadow-card)' }}>
                    <button onClick={() => setExpandedStep(isOpen ? null : i)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background: isOpen?'var(--gold)':'var(--hover)', border:`1px solid ${isOpen?'var(--gold)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:isOpen?'#000':'var(--text3)', flexShrink:0, transition:'all 0.15s' }}>{i+1}</div>
                      <span style={{ fontSize:14, fontWeight:700, color:'var(--text)', flex:1 }}>{step.title}</span>
                      <span style={{ fontSize:12, color:'var(--text4)', transition:'transform 0.2s', display:'inline-block', transform:isOpen?'rotate(180deg)':'rotate(0)' }}>▼</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding:'0 18px 16px 60px' }}>
                        <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7, margin:'0 0 0', }}>
                          {step.desc}
                        </p>
                        {step.tip && (
                          <div style={{ marginTop:12, display:'flex', gap:8, background:'var(--gold-dim)', border:'1px solid var(--gold)', borderRadius:8, padding:'8px 12px' }}>
                            <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                            <span style={{ fontSize:12, color:'var(--gold)', fontWeight:600, lineHeight:1.6 }}>{step.tip}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Prev / Next nav */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:20, gap:10 }}>
              {sections.findIndex(s=>s.id===activeSection) > 0 ? (
                <button onClick={() => { setActiveSection(sections[sections.findIndex(s=>s.id===activeSection)-1].id); setExpandedStep(null) }}
                  style={{ background:'var(--card-bg)', border:'1px solid var(--card-border)', color:'var(--text2)', borderRadius:10, padding:'10px 20px', fontSize:13, cursor:'pointer', fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                  ← {sections[sections.findIndex(s=>s.id===activeSection)-1].title}
                </button>
              ) : <div />}
              {sections.findIndex(s=>s.id===activeSection) < sections.length-1 && (
                <button onClick={() => { setActiveSection(sections[sections.findIndex(s=>s.id===activeSection)+1].id); setExpandedStep(null) }}
                  style={{ background:'linear-gradient(135deg,#EAB308,#d97706)', border:'none', color:'#000', borderRadius:10, padding:'10px 20px', fontSize:13, cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 16px var(--gold-glow)', marginLeft:'auto' }}>
                  {sections[sections.findIndex(s=>s.id===activeSection)+1].title} →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}