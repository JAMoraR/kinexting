import { NextResponse } from "next/server"
import { Stripe } from "stripe"
import { createHash } from "node:crypto"

const PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])
const DOMAIN_OPTIONS = new Set(["domain-1", "domain-2"])
const MAX_EXTRA_IDS = 10
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 20

const globalForRateLimit = globalThis

if (!globalForRateLimit.__checkoutSessionRateLimit) {
	globalForRateLimit.__checkoutSessionRateLimit = new Map()
}

const rateLimitStore = globalForRateLimit.__checkoutSessionRateLimit

const DOMAIN_REGEX = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i
const IDEMPOTENCY_REGEX = /^[a-zA-Z0-9_-]{8,80}$/

const cleanText = (value, maxLength = 120) => String(value || "").trim().slice(0, maxLength)

const cleanDomain = (value) => cleanText(value, 120).toLowerCase().replace(/^https?:\/\//, "")

const dedupeTextList = (value, maxItems = MAX_EXTRA_IDS) => {
	if (!Array.isArray(value)) return []

	const seen = new Set()
	const result = []

	for (const item of value) {
		const normalized = cleanText(item, 80)
		if (!normalized || seen.has(normalized)) continue
		seen.add(normalized)
		result.push(normalized)
		if (result.length >= maxItems) break
	}

	return result
}

const getClientIp = (request) => {
	const forwardedFor = request.headers.get("x-forwarded-for")
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim()
	}

	return request.headers.get("x-real-ip") || "unknown"
}

const isRateLimited = (clientIp) => {
	const now = Date.now()
	const entry = rateLimitStore.get(clientIp)

	if (!entry || now > entry.resetAt) {
		rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
		return false
	}

	if (entry.count >= RATE_LIMIT_REQUESTS) {
		return true
	}

	entry.count += 1
	return false
}

const requiresDomain = (planId) => planId === "a-medida"

const PERIOD_SUFFIXES = ["_trimester", "_semester", "_year"]

const PERIOD_SUFFIX_MAP = {
	quarterly: "_trimester",
	semiannual: "_semester",
	annual: "_year",
}

const resolveExtraId = (price) => {
	const metadataId = price.metadata?.extra_id
	if (metadataId) return metadataId

	const lookupKey = price.lookup_key ?? ""
	if (lookupKey.startsWith("extra.")) {
		const lookupParts = lookupKey.split(".")
		const inferred = lookupParts.slice(1, -1).join("-")
		if (inferred) return inferred
	}

	return null
}

const isExtraPrice = (price, selectedExtraId) => {
	const interval = price.recurring?.interval
	return Boolean(interval && (interval === "month" || interval === "year") && resolveExtraId(price) === selectedExtraId)
}

const pickExtraPrice = (candidates, billing) => {
	if (billing === "annual") {
		const exact = candidates.find((price) => price.recurring?.interval === "year")
		if (exact) return exact
	}
	return candidates.find((price) => price.recurring?.interval === "month") ?? null
}

export async function POST(request) {
	try {
		const contentType = request.headers.get("content-type") || ""
		if (!contentType.includes("application/json")) {
			return NextResponse.json({ error: "Invalid content type" }, { status: 415 })
		}

		const clientIp = getClientIp(request)
		if (isRateLimited(clientIp)) {
			return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 })
		}

		const secretKey = process.env.STRIPE_SECRET_KEY

		if (!secretKey) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
		}

		const stripe = new Stripe(secretKey)
		const payload = await request.json()
		if (!payload || typeof payload !== "object") {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
		}

		const planId = cleanText(payload?.planId, 40)
		const billing = payload?.billing === "semiannual" ? "semiannual" : payload?.billing === "annual" ? "annual" : "quarterly"
		const extraIds = dedupeTextList(payload?.extraIds)
		const selectedDomain = cleanText(payload?.selectedDomain, 40)
		const newDomain = cleanDomain(payload?.newDomain)
		const idempotencyHeader = cleanText(request.headers.get("x-idempotency-key"), 80)

		if (!planId || !PLAN_IDS.has(planId)) {
			return NextResponse.json({ error: "Invalid planId" }, { status: 400 })
		}

		if (requiresDomain(planId)) {
			if (!selectedDomain || !DOMAIN_OPTIONS.has(selectedDomain)) {
				return NextResponse.json({ error: "Selecciona una opcion de dominio valida" }, { status: 400 })
			}

			if (selectedDomain === "domain-2" && (!newDomain || !DOMAIN_REGEX.test(newDomain))) {
				return NextResponse.json({ error: "Ingresa un dominio valido" }, { status: 400 })
			}
		}

		if (idempotencyHeader && !IDEMPOTENCY_REGEX.test(idempotencyHeader)) {
			return NextResponse.json({ error: "Idempotency key invalida" }, { status: 400 })
		}

		const prices = await stripe.prices.list({
			active: true,
			limit: 100,
			expand: ["data.product"],
		})

		const planSuffix = PERIOD_SUFFIX_MAP[billing]
		const expectedLookupKey = `${planId}${planSuffix}`
		const basePlanPrice = prices.data.find((price) => price.lookup_key === expectedLookupKey)
		if (!basePlanPrice) {
			return NextResponse.json({ error: "Price not found for selected plan" }, { status: 400 })
		}

		const lineItems = [{ price: basePlanPrice.id, quantity: 1 }]
		const unknownExtraIds = []

		for (const extraId of extraIds) {
			const extraCandidates = prices.data.filter((price) => isExtraPrice(price, extraId))
			const extraPrice = pickExtraPrice(extraCandidates, billing)
			if (extraPrice) {
				lineItems.push({ price: extraPrice.id, quantity: 1 })
			} else {
				unknownExtraIds.push(extraId)
			}
		}

		if (unknownExtraIds.length > 0) {
			return NextResponse.json({ error: "Se detectaron extras invalidos" }, { status: 400 })
		}

		const baseUrl = new URL(request.url).origin

		const idempotencySeed = idempotencyHeader
			? `${planId}:${billing}:${idempotencyHeader}`
			: `${planId}:${billing}:${extraIds.join("|")}:${selectedDomain}:${newDomain}`

		const idempotencyKey = createHash("sha256")
			.update(idempotencySeed)
			.digest("hex")
			.slice(0, 64)

		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: lineItems,
			success_url: `${baseUrl}/configurar-plan?status=success&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}/configurar-plan?status=cancel`,
			metadata: {
				planId,
				billing,
				selectedDomain,
				newDomain,
				extraIds: JSON.stringify(extraIds),
			},
			locale: "es",
		}, {
			idempotencyKey,
		})

		return NextResponse.json({ url: session.url, sessionId: session.id })
	} catch (error) {
		console.error("Failed to create Stripe checkout session", error)

		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
	}
}
