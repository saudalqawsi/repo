// Supabase "Send SMS" auth hook -> Unifonic.
// Secrets (set in Supabase > Edge Functions > Secrets, never in code):
//   SEND_SMS_HOOK_SECRET  "v1,whsec_..." from Auth > Hooks (supports "a|b" rotation)
//   UNIFONIC_APP_SID      Unifonic AppSid
//   UNIFONIC_SENDER_ID    approved sender name (e.g. SHAYUL)
//   UNIFONIC_API_URL      optional, defaults to the Unifonic REST send endpoint
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const API_URL = Deno.env.get('UNIFONIC_API_URL') ?? 'https://el.cloud.unifonic.com/rest/SMS/messages'
const APP_SID = Deno.env.get('UNIFONIC_APP_SID')
const SENDER = Deno.env.get('UNIFONIC_SENDER_ID')
const SECRETS = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '')
  .split('|')
  .map((s) => s.trim().replace(/^v1,whsec_/, ''))
  .filter(Boolean)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const fail = (http_code: number, message: string) => json({ error: { http_code, message } }, http_code)

type Payload = { user: { phone?: string; user_metadata?: { locale?: string } }; sms: { otp: string } }

function verify(raw: string, headers: Record<string, string>): Payload | null {
  for (const s of SECRETS) {
    try {
      return new Webhook(s).verify(raw, headers) as Payload
    } catch { /* try next secret */ }
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'method not allowed')
  if (!SECRETS.length || !APP_SID || !SENDER) {
    console.error('send-sms: missing configuration')
    return fail(500, 'SMS provider not configured')
  }

  const raw = await req.text()
  const payload = verify(raw, Object.fromEntries(req.headers))
  if (!payload) return fail(401, 'invalid signature')

  const phone = (payload.user?.phone ?? '').replace(/\D/g, '')
  const otp = payload.sms?.otp ?? ''
  if (!/^\d{8,15}$/.test(phone) || !/^\d{6}$/.test(otp)) return fail(400, 'invalid payload')

  const body = `رمز الدخول إلى شيول: ${otp}\nShayul code: ${otp}\nلا تشاركه مع أحد. Do not share it.`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000) // hook budget is 5s
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: new URLSearchParams({ AppSid: APP_SID, SenderID: SENDER, Recipient: phone, Body: body, responseType: 'JSON' }),
      signal: ctrl.signal,
    })
    const out = await res.json().catch(() => ({} as Record<string, unknown>))
    const ok = res.ok && (out as { success?: unknown }).success !== false && (out as { success?: unknown }).success !== 'false'
    if (!ok) {
      // log provider error code only; never the OTP or full number
      console.error('send-sms: provider rejected', res.status, (out as { errorCode?: unknown }).errorCode ?? '')
      return fail(502, 'SMS could not be sent')
    }
    return json({})
  } catch (e) {
    console.error('send-sms: provider unreachable', (e as Error).name)
    return fail(504, 'SMS provider timeout')
  } finally {
    clearTimeout(timer)
  }
})
