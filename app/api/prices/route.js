import { NextResponse } from "next/server"
import { Stripe } from "stripe"

const PLAN_IDS = new Set(["asistente", "recepcionista", "soporte-tecnico", "a-medida"])

const PLAN_FLAGS = {
    asistente: { cheap: true },
    recepcionista: { popular: true },
    "soporte-tecnico": { highQuality: true },
    "a-medida": { recommended: true },
}

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

    if (candidate.includes("asistente")) return "asistente"
    if (candidate.includes("recepcionista")) return "recepcionista"
    if (candidate.includes("soporte tecnico") || candidate.includes("soporte-tecnico")) return "soporte-tecnico"
    if (candidate.includes("a medida") || candidate.includes("a-medida") || candidate.includes("personalizado")) return "a-medida"

    return null
}

const parseList = (value) => {
    if (!value) return []

    return String(value)
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean)
}

const parseBoolean = (value) => String(value).toLowerCase() === "true"

const getPriceAmount = (price) => Number((price.unit_amount ?? 0) / 100)

const getPriceInterval = (price) => price.recurring?.interval

const isCatalogPlan = (price) => {
    const metadataId = price.metadata?.plan_id
    if (metadataId && PLAN_IDS.has(metadataId)) return true

    const lookupKey = price.lookup_key ?? ""
    return lookupKey.startsWith("plan.")
}

const isCatalogExtra = (price) => {
    const metadataId = price.metadata?.extra_id
    if (metadataId) return true

    const lookupKey = price.lookup_key ?? ""
    return lookupKey.startsWith("extra.")
}

const ensurePlanEntry = (plansById, planId, price) => {
    if (plansById.has(planId)) return plansById.get(planId)

    const product = price.product && typeof price.product !== "string" ? price.product : null
    const featureNames = Array.isArray(product?.marketing_features)
        ? product.marketing_features.map((feature) => feature?.name).filter(Boolean)
        : []
    const entry = {
        id: planId,
        title: price.metadata?.title || price.nickname || product?.name || planId,
        description: price.metadata?.description || product?.description || "",
        features: parseList(price.metadata?.features).length > 0
            ? parseList(price.metadata?.features)
            : featureNames,
        differences: parseList(price.metadata?.differences),
        buttonText: price.metadata?.button_text || `Elegir ${price.metadata?.title || price.nickname || product?.name || planId}`,
        flags: {
            cheap: parseBoolean(price.metadata?.cheap) || Boolean(PLAN_FLAGS[planId]?.cheap),
            popular: parseBoolean(price.metadata?.popular) || Boolean(PLAN_FLAGS[planId]?.popular),
            recommended: parseBoolean(price.metadata?.recommended) || Boolean(PLAN_FLAGS[planId]?.recommended),
            highQuality: parseBoolean(price.metadata?.high_quality) || Boolean(PLAN_FLAGS[planId]?.highQuality),
        },
        prices: {
            monthly: null,
            annual: null,
        },
    }

    plansById.set(planId, entry)
    return entry
}

const ensureExtraEntry = (extrasById, extraId, price) => {
    if (extrasById.has(extraId)) return extrasById.get(extraId)

    const product = price.product && typeof price.product !== "string" ? price.product : null
    const entry = {
        id: extraId,
        category: price.metadata?.category || "general",
        name: price.metadata?.name || product?.name || extraId,
        description: price.metadata?.description || product?.description || "",
        prices: {
            monthly: null,
            annual: null,
        },
    }

    extrasById.set(extraId, entry)
    return entry
}

export async function GET() {
    try {
        const secretKey = process.env.STRIPE_SECRET_KEY
        if (!secretKey) {
            return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 })
        }

        const stripe = new Stripe(secretKey)
        const prices = await stripe.prices.list({
            active: true,
            limit: 100,
            expand: ["data.product"],
        })

        // ── DEBUG: Todos los servicios recuperados de Stripe ──
        const allServices = prices.data.map((p) => ({
            id: p.id,
            nickname: p.nickname,
            lookup_key: p.lookup_key,
            product_name: p.product && typeof p.product !== "string" ? p.product.name : "N/A",
            metadata: p.metadata,
            unit_amount: p.unit_amount,
            currency: p.currency,
            interval: p.recurring?.interval,
        }))
        console.log("=== TODOS los servicios recuperados de Stripe ===")
        console.table(allServices)

        const plansById = new Map()
        const extrasById = new Map()
        const matchedPlanIds = []
        const unmatchedPrices = []

        prices.data.forEach((price) => {
            const interval = getPriceInterval(price)
            if (!interval || (interval !== "month" && interval !== "year")) {
                unmatchedPrices.push({
                    reason: `Intervalo no soportado: "${interval}"`,
                    priceId: price.id,
                    nickname: price.nickname,
                })
                return
            }

            const planIdResolved = resolvePlanId(price)
            const isPlan = isCatalogPlan(price) || planIdResolved

            if (isPlan) {
                const planId = resolvePlanId(price)
                if (!planId) {
                    unmatchedPrices.push({
                        reason: "isCatalogPlan true pero resolvePlanId devolvió null",
                        priceId: price.id,
                        nickname: price.nickname,
                    })
                    return
                }

                matchedPlanIds.push({ planId, priceId: price.id, nickname: price.nickname })

                const plan = ensurePlanEntry(plansById, planId, price)
                const targetInterval = interval === "month" ? "monthly" : "annual"
                plan.prices[targetInterval] = {
                    id: price.id,
                    amount: getPriceAmount(price),
                    currency: price.currency,
                }
                return
            }

            if (isCatalogExtra(price)) {
                const extraId = price.metadata?.extra_id
                if (!extraId) {
                    unmatchedPrices.push({
                        reason: "isCatalogExtra true pero metadata.extra_id vacío",
                        priceId: price.id,
                        nickname: price.nickname,
                    })
                    return
                }

                const extra = ensureExtraEntry(extrasById, extraId, price)
                const targetInterval = interval === "month" ? "monthly" : "annual"
                extra.prices[targetInterval] = {
                    id: price.id,
                    amount: getPriceAmount(price),
                    currency: price.currency,
                }
                return
            }

            // No es plan ni extra
            unmatchedPrices.push({
                reason: "No coincide como plan ni como extra",
                priceId: price.id,
                nickname: price.nickname,
                lookup_key: price.lookup_key,
                metadata: price.metadata,
            })
        })

        // ── DEBUG: Los que SÍ coincidieron con la lógica ──
        console.log("=== Servicios que SÍ coincidieron como planes ===")
        console.table(matchedPlanIds.length > 0 ? matchedPlanIds : "Ninguno")

        // ── DEBUG: Los que NO se renderizan y causas ──
        console.log("=== Servicios que NO se renderizan y posibles causas ===")
        console.table(unmatchedPrices.length > 0 ? unmatchedPrices : "Ninguno")

        const plans = Array.from(plansById.values())
            .map((plan) => {
                if (!plan.prices.monthly) {
                    return null
                }

                if (!plan.prices.annual) {
                    const annualAmount = Math.round(plan.prices.monthly.amount * 12 * 0.85)
                    plan.prices.annual = {
                        id: `${plan.prices.monthly.id}-derived-annual`,
                        amount: annualAmount,
                        currency: plan.prices.monthly.currency,
                    }
                }

                return plan
            })
            .filter(Boolean)

        const extras = Array.from(extrasById.values()).filter(
            (extra) => extra.prices.monthly && extra.prices.annual,
        )

        return NextResponse.json({
            prices: prices.data,
            plans,
            extras,
            currency: "mxn",
        })
    } catch (error) {
        console.error("Failed to retrieve Stripe prices", error)

        return NextResponse.json({ error: "Failed to retrieve Stripe catalog" }, { status: 500 })
    }
}