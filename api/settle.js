import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// In-memory rate limit store — keyed by IP, value is array of request timestamps
const rateLimitStore = new Map()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(ip) {
  const now = Date.now()
  const timestamps = (rateLimitStore.get(ip) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  )
  if (timestamps.length >= RATE_LIMIT) return true
  rateLimitStore.set(ip, [...timestamps, now])
  return false
}

function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ??
    req.socket?.remoteAddress ??
    'unknown'
  )
}

const SYSTEM_PROMPT = `You are the Settle It arbitrator — a witty, fair, slightly savage friend who cuts through the nonsense and delivers honest verdicts on arguments. You've heard every excuse and you're not impressed by either side, but you always find the truth.

Rules:
- sideAPercentage must be between 1 and 99 (never 0 or 100) — always find nuance on both sides
- sideBPercentage must equal 100 - sideAPercentage
- ruling must be 2–4 sentences: brutally honest, occasionally funny, never cruel, always fair
- topicLabel must be 4–6 words summarising the argument (e.g. "who forgot the anniversary")
- Match tone to subject — playful for trivial disputes, measured for serious ones
- Respond ONLY with a valid JSON object, no markdown, no explanation

Response format:
{"sideAPercentage": number, "sideBPercentage": number, "ruling": "string", "topicLabel": "string"}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: true, errorType: 'invalid_request', message: 'Method not allowed' })
  }

  const ip = getIp(req)
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: true,
      errorType: 'rate_limited',
      message: 'Too many requests. Try again in an hour.',
    })
  }

  const { sideA, sideB } = req.body ?? {}

  if (
    typeof sideA !== 'string' || typeof sideB !== 'string' ||
    sideA.trim().length === 0 || sideB.trim().length === 0
  ) {
    return res.status(400).json({
      error: true,
      errorType: 'invalid_request',
      message: 'Both sides of the argument are required.',
    })
  }

  if (sideA.length > 500 || sideB.length > 500) {
    return res.status(400).json({
      error: true,
      errorType: 'invalid_request',
      message: 'Each side must be 500 characters or fewer.',
    })
  }

  const userMessage = `Side A says: "${sideA.trim()}"\n\nSide B says: "${sideB.trim()}"`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Handle content filtering stop reason
    if (message.stop_reason === 'end_turn' && message.content[0]?.type === 'text') {
      const text = message.content[0].text.trim()
      let verdict
      try {
        verdict = JSON.parse(text)
      } catch {
        // Model returned non-JSON despite instructions — treat as unknown
        return res.status(502).json({
          error: true,
          errorType: 'unknown',
          message: 'Unexpected response from the arbitrator. Try again.',
        })
      }

      const { sideAPercentage, sideBPercentage, ruling, topicLabel } = verdict

      // Validate shape before returning
      if (
        typeof sideAPercentage !== 'number' || typeof sideBPercentage !== 'number' ||
        sideAPercentage < 1 || sideAPercentage > 99 ||
        typeof ruling !== 'string' || typeof topicLabel !== 'string'
      ) {
        return res.status(502).json({
          error: true,
          errorType: 'unknown',
          message: 'The arbitrator gave an invalid verdict. Try again.',
        })
      }

      return res.status(200).json({ sideAPercentage, sideBPercentage, ruling, topicLabel })
    }

    // stop_reason === 'max_tokens' or something unexpected
    return res.status(502).json({
      error: true,
      errorType: 'unknown',
      message: 'The arbitrator ran out of words. Try again.',
    })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 429) {
        return res.status(429).json({
          error: true,
          errorType: 'rate_limited',
          message: 'The arbitrator is swamped. Try again shortly.',
        })
      }
      if (err.status === 400) {
        return res.status(400).json({
          error: true,
          errorType: 'content_rejected',
          message: 'That argument couldn\'t be processed. Try rephrasing.',
        })
      }
      if (err.status >= 500) {
        return res.status(503).json({
          error: true,
          errorType: 'api_unavailable',
          message: 'The arbitrator is offline. Try again later.',
        })
      }
    }

    return res.status(500).json({
      error: true,
      errorType: 'unknown',
      message: 'Something went wrong. Try again.',
    })
  }
}
