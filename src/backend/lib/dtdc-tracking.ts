const TRACK_URL = 'https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails';

export type TrackStep = 'placed' | 'confirmed' | 'shipped' | 'out_for_delivery' | 'delivered';

export interface TrackEvent { status: string; location: string; time: string }
export interface TrackResult {
  ok: boolean;
  step: TrackStep;
  label: string;
  issue: boolean;          // true for returned / undelivered / held shipments
  events: TrackEvent[];    // newest first
  expectedDelivery?: string;
  error?: string;
}

// DTDC sends dates as DDMMYYYY and times as HHMM (or HHMMSS)
function formatTime(date?: string, time?: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let out = '';
  if (date && /^\d{8}$/.test(date)) {
    const m = parseInt(date.slice(2, 4), 10) - 1;
    out = `${date.slice(0, 2)} ${months[m] ?? ''} ${date.slice(4)}`;
  }
  if (time && /^\d{4,6}$/.test(time)) out += `, ${time.slice(0, 2)}:${time.slice(2, 4)}`;
  return out.trim();
}

function mapStep(text: string): { step: TrackStep; label: string; issue: boolean } {
  const t = text.toLowerCase().trim();
  if (!t) return { step: 'confirmed', label: 'Booked with courier', issue: false };

  if (/(rto|return to origin|undeliver|not deliver|refused|held|misrout)/.test(t))
    return { step: 'shipped', label: text, issue: true };
  if (t.includes('out for delivery'))
    return { step: 'out_for_delivery', label: 'Out for delivery', issue: false };
  if (t.includes('deliver'))
    return { step: 'delivered', label: 'Delivered', issue: false };
  if (/(pickup|picked up awaited|booked|softdata|schedul)/.test(t) && !t.includes('picked up'))
    return { step: 'confirmed', label: text, issue: false };   // e.g. "Pickup scheduled"
  return { step: 'shipped', label: text, issue: false };       // picked up, in transit, manifested...
}

export async function getDtdcTracking(awb: string): Promise<TrackResult> {
  const fail = (error: string): TrackResult =>
    ({ ok: false, step: 'confirmed', label: 'Booked with courier', issue: false, events: [], error });

  const token = process.env.DTDC_TRACKING_TOKEN;
  if (!token) return fail('Tracking not configured');

  try {
    const res = await fetch(TRACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Access-Token': token },
      body: JSON.stringify({ trkType: 'cnno', strcnno: awb, addtnlDtl: 'Y' }),
      cache: 'no-store',
    });
    const data = await res.json();
    console.log('[DTDC] Tracking:', res.status, data?.status, data?.trackHeader?.strStatus);

    if (!res.ok || data?.statusFlag === false) {
      return fail(data?.errorDetails || data?.status || `HTTP ${res.status}`);
    }

    const details: any[] = Array.isArray(data?.trackDetails) ? data.trackDetails : [];
    const events: TrackEvent[] = details
      .map((d) => ({
        status: d.strAction || '',
        location: d.strOrigin || d.strDestination || '',
        time: formatTime(d.strActionDate, d.strActionTime),
      }))
      .reverse(); // DTDC returns oldest first

    const header = data?.trackHeader ?? {};
    const latest: string = header.strStatus || details[details.length - 1]?.strAction || '';
    const { step, label, issue } = mapStep(latest);
    const exp = header.strExpectedDeliveryDate;

    return {
      ok: true, step, label, issue, events,
      expectedDelivery: exp && /^\d{8}$/.test(exp) ? formatTime(exp) : undefined,
    };
  } catch (e: any) {
    return fail(e?.message || 'DTDC tracking failed');
  }
}