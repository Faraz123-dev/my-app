import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { make, model, year, kilometers, horsepower, ratio, photo_url, truck_id } = await req.json()

    const truckUrl = `https://aamirandsonstrading.com/inventory/${truck_id}`

    const createResponse = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `New Truck Alert - ${year} ${make} ${model}`,
        subject: `🚛 New Truck Just Added — Aamir & Sons Trading`,
        sender: { name: 'Aamir & Sons Trading', email: 'farazaamir23@gmail.com' },
        type: 'classic',
        recipients: { listIds: [3] },
        htmlContent: `<div style="background:#0a0a0a;padding:40px 20px;font-family:Helvetica,sans-serif;"><div style="max-width:560px;margin:0 auto;"><p style="color:#c9a84c;font-size:22px;font-weight:900;letter-spacing:4px;text-align:center;margin:0 0 24px;text-transform:uppercase;">Aamir &amp; Sons Trading Ltd.</p><div style="background:#161616;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;"><div style="background:linear-gradient(90deg,#c9a84c,#e8c96a,#c9a84c);height:3px;"></div><div style="padding:24px 28px 16px;"><p style="color:#c9a84c;font-size:16px;font-weight:800;letter-spacing:3px;margin:0 0 4px;text-transform:uppercase;">New Arrival</p><h1 style="color:#ffffff;font-size:26px;margin:0 0 6px;font-weight:900;">${year} ${make} ${model}</h1><p style="color:#555;font-size:13px;margin:0 0 16px;">A new truck has just been added to our inventory.</p><a href="${truckUrl}" style="display:block;margin-bottom:20px;background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#000;padding:16px;border-radius:8px;font-weight:800;text-decoration:none;text-align:center;letter-spacing:1px;font-size:14px;">VIEW TRUCK →</a></div>${photo_url ? `<img src="${photo_url}" style="width:100%;height:auto;display:block;pointer-events:none;" />` : ''}<div style="padding:20px 28px;"><table style="width:100%;border-collapse:collapse;"><tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">YEAR</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${year}</td></tr><tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">MAKE</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${make}</td></tr><tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">MODEL</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${model}</td></tr><tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">KILOMETERS</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${Number(kilometers).toLocaleString()} km</td></tr>${horsepower ? `<tr style="border-bottom:1px solid #222;"><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">HORSEPOWER</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${horsepower} HP</td></tr>` : ''}${ratio ? `<tr><td style="color:#666;padding:12px 0;font-size:11px;letter-spacing:1px;">RATIO</td><td style="color:#fff;font-weight:700;text-align:right;padding:12px 0;">${ratio}</td></tr>` : ''}</table></div><div style="background:linear-gradient(90deg,#c9a84c,#e8c96a,#c9a84c);height:3px;"></div></div></div></div>`
      }),
    })

    const campaign = await createResponse.json()
    console.log('BREVO CAMPAIGN RESPONSE:', JSON.stringify(campaign))

    if (!campaign.id) {
      return NextResponse.json({ success: false, error: 'Campaign creation failed', details: campaign })
    }

    //await fetch('https://api.brevo.com/v3/emailCampaigns/' + campaign.id + '/sendNow', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    return NextResponse.json({ success: true, campaignId: campaign.id })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
