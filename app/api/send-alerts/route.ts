import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { data: queue, error: qErr } = await supabase
      .from('alert_queue')
      .select('*')
      .order('queued_at', { ascending: false })

    if (qErr) return NextResponse.json({ success: false, error: qErr.message })
    if (!queue || queue.length === 0) return NextResponse.json({ success: false, error: 'No trucks in queue' })

    const truckIds = queue.map((item: any) => item.truck_id)
    const { data: truckData } = await supabase
      .from('Inventory Data')
      .select('*')
      .in('id', truckIds)

    const truckMap = Object.fromEntries((truckData || []).map((t: any) => [t.id, t]))

    const truckCards = queue.map((item: any) => {
      const t = truckMap[item.truck_id]
      const truckUrl = `https://aamirandsonstrading.com/inventory`
      return `
        <div style="background:#161616;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;margin-bottom:24px;">
          <div style="background:linear-gradient(90deg,#c9a84c,#e8c96a,#c9a84c);height:3px;"></div>
          <div style="padding:20px 24px 14px;">
            <p style="color:#c9a84c;font-size:11px;font-weight:800;letter-spacing:3px;margin:0 0 4px;text-transform:uppercase;">New Arrival</p>
            <h2 style="color:#ffffff;font-size:20px;margin:0 0 14px;font-weight:900;">${t?.year || ''} ${t?.make || ''} ${t?.model || ''}</h2>
            <a href="${truckUrl}" style="display:block;margin-bottom:16px;background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#000;padding:13px;border-radius:8px;font-weight:800;text-decoration:none;text-align:center;letter-spacing:1px;font-size:13px;">VIEW TRUCK →</a>
          </div>
          ${item.photo_url ? `<img src="${item.photo_url}" style="width:100%;height:auto;display:block;" />` : ''}
          <div style="padding:16px 24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">YEAR</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t?.year || '—'}</td></tr>
              <tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">MAKE</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t?.make || '—'}</td></tr>
              <tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">MODEL</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t?.model || '—'}</td></tr>
              <tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">KILOMETERS</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t?.kilometers ? Number(t.kilometers).toLocaleString() + ' km' : '—'}</td></tr>
              ${t?.horsepower ? `<tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">HORSEPOWER</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t.horsepower} HP</td></tr>` : ''}
              ${t?.ratio ? `<tr><td style="color:#666;padding:8px 0;font-size:11px;letter-spacing:1px;">RATIO</td><td style="color:#fff;font-weight:700;text-align:right;padding:8px 0;">${t.ratio}</td></tr>` : ''}
            </table>
          </div>
          <div style="background:linear-gradient(90deg,#c9a84c,#e8c96a,#c9a84c);height:3px;"></div>
        </div>
      `
    }).join('')

    const count = queue.length
    const subject = count === 1
      ? `New Truck Just Added — Aamir & Sons Trading`
      : `${count} New Trucks Just Added — Aamir & Sons Trading`

    const htmlContent = `
      <div style="background:#0a0a0a;padding:40px 20px;font-family:Helvetica,sans-serif;">
        <div style="max-width:560px;margin:0 auto;">
          <p style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:4px;text-align:center;margin:0 0 6px;text-transform:uppercase;">Aamir &amp; Sons Trading Ltd.</p>
          <p style="color:#6b5a2e;font-size:11px;letter-spacing:3px;text-align:center;margin:0 0 28px;text-transform:uppercase;">${count === 1 ? 'New Arrival — 1 Truck Just Added' : `New Arrivals — ${count} Trucks Just Added`}</p>
          ${truckCards}
          <p style="color:#333;font-size:11px;text-align:center;margin:24px 0 0;">You're receiving this because you signed up for truck alerts at aamirandsonstrading.com</p>
        </div>
      </div>
    `

    const createResponse = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Truck Alert - ${new Date().toLocaleDateString()}`,
        subject,
        sender: { name: 'Aamir & Sons Trading', email: 'farazaamir23@gmail.com' },
        type: 'classic',
        recipients: { listIds: [3] },
        htmlContent,
      }),
    })

    const campaign = await createResponse.json()
    if (!campaign.id) return NextResponse.json({ success: false, error: 'Campaign creation failed', details: campaign })

    await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaign.id}/sendNow`, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    await supabase.from('alert_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ success: true, trucksSent: count })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}