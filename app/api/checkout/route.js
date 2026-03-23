import { NextResponse } from "next/server"
import { Stripe } from "stripe"

const PLAN_IDS = new Set(["landing", "chatbot", "webapp", "chatbot-webapp"])

const normalizeText = (value) =>
	String(value || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9+ ]/g, " ")
		.replace(/\s+/g, " ")
		.trim()

const resolvePlanId = (price) => {
	const metadataId = price.metadata?.plan_id
	if (metadataId && PLAN_IDS.has(metadataId)) return metadataId

	const lookupKey = price.lookup_key ?? ""
	if (lookupKey.startsWith("plan.")) {
		const lookupParts = lookupKey.split(".")
		const inferred = lookupParts.slice(1, -1).join("-")
		if (PLAN_IDS.has(inferred)) return inferred
	}

	const productName = price.product && typeof price.product !== "string" ? price.product.name : ""
	const candidate = normalizeText(price.nickname || productName)

	if (candidate.includes("chatbot") && candidate.includes("web")) return "chatbot-webapp"
	if (candidate.includes("web app") || candidate === "webapp" || candidate === "web app") return "webapp"
	if (candidate.includes("chatbot")) return "chatbot"
	if (candidate.includes("landing")) return "landing"

	return null
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

const getInterval = (billing) => (billing === "annual" ? "year" : "month")

const isRecurringPlanPrice = (price, selectedPlanId) => {
	const interval = price.recurring?.interval
	return Boolean(interval && (interval === "month" || interval === "year") && resolvePlanId(price) === selectedPlanId)
}

const isRecurringExtraPrice = (price, selectedExtraId) => {
	const interval = price.recurring?.interval
	return Boolean(interval && (interval === "month" || interval === "year") && resolveExtraId(price) === selectedExtraId)
}

const pickPriceForInterval = (candidates, targetInterval) => {
	const exact = candidates.find((price) => price.recurring?.interval === targetInterval)
	if (exact) return exact

	return candidates.find((price) => price.recurring?.interval === "month") ?? null
}

export async function POST(request) {
	try {
		const secretKey = process.env.STRIPE_SECRET_KEY

		if (!secretKey) {
			return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
		}

		const stripe = new Stripe(secretKey)
		const payload = await request.json()

		const planId = payload?.planId
		const billing = payload?.billing === "annual" ? "annual" : "monthly"
		const extraIds = Array.isArray(payload?.extraIds) ? payload.extraIds : []
		const selectedDomain = payload?.selectedDomain || ""
		const newDomain = payload?.newDomain || ""

		if (!planId || !PLAN_IDS.has(planId)) {
			return NextResponse.json({ error: "Invalid planId" }, { status: 400 })
		}

		const prices = await stripe.prices.list({
			active: true,
			limit: 100,
			expand: ["data.product"],
		})

		const targetInterval = getInterval(billing)
		const planCandidates = prices.data.filter((price) => isRecurringPlanPrice(price, planId))
		const basePlanPrice = pickPriceForInterval(planCandidates, targetInterval)
		if (!basePlanPrice) {
			return NextResponse.json({ error: "Price not found for selected plan" }, { status: 400 })
		}

		const lineItems = [{ price: basePlanPrice.id, quantity: 1 }]

		for (const extraId of extraIds) {
			const extraCandidates = prices.data.filter((price) => isRecurringExtraPrice(price, extraId))
			const extraPrice = pickPriceForInterval(extraCandidates, targetInterval)
			if (extraPrice) {
				lineItems.push({ price: extraPrice.id, quantity: 1 })
			}
		}

		const baseUrl = new URL(request.url).origin

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
		})

		return NextResponse.json({ url: session.url, sessionId: session.id })
	} catch (error) {
		console.error("Failed to create Stripe checkout session", error)

		return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
	}
}
