import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

console.log("🚀 Stripe Webhook Function Started");

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function mapPriceToPlanId(priceId: string, metadataPlanId?: string | null) {
    if (metadataPlanId) {
        return metadataPlanId;
    }

    const proPriceId = Deno.env.get('STRIPE_PRICE_PRO');
    const enterprisePriceId = Deno.env.get('STRIPE_PRICE_ENTERPRISE');

    if (proPriceId && priceId === proPriceId) return 'pro';
    if (enterprisePriceId && priceId === enterprisePriceId) return 'enterprise';

    return null;
}

serve(async (req) => {
    try {
        const signature = req.headers.get("Stripe-Signature");
        const body = await req.text();
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

        if (!signature || !webhookSecret) {
            return new Response("Missing signature or secret", { status: 400 });
        }

        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                webhookSecret,
                undefined,
                cryptoProvider
            );
        } catch (err) {
            console.error(`⚠️ Webhook signature verification failed.`, err.message);
            return new Response(err.message, { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        console.log(`🔔 Event received: ${event.type}`);

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await manageSubscriptionStatusChange(
                    supabase,
                    subscription.id,
                    subscription.customer as string,
                    event.type === 'customer.subscription.created'
                );
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                if (invoice.subscription) {
                    // Optional: Handle payment success specifically if needed
                    // Usually subscription.updated covers the status change to 'active'
                }
                break;
            }
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        console.error("❌ Error processing webhook:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});

async function manageSubscriptionStatusChange(
    supabase: any,
    subscriptionId: string,
    customerId: string,
    createAction = false
) {
    // Get customer's UUID from mapping table.
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (profileError || !profileData) {
        console.error('❌ Customer lookup failed:', profileError);
        return;
    }

    const { id: uuid } = profileData;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['default_payment_method']
    });

    const priceId = subscription.items.data[0]?.price?.id;
    const planId = priceId ? mapPriceToPlanId(priceId, subscription.metadata?.plan_id ?? null) : null;
    if (!planId) {
        console.warn("Plan mapping not found for price:", priceId);
    }

    // Upsert subscription data into Supabase
    const subscriptionData = {
        id: subscription.id,
        user_id: uuid,
        metadata: subscription.metadata,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id,
        // TODO: Map price_id to plan_id if needed, or store price_id directly
        quantity: subscription.items.data[0].quantity,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        created: new Date(subscription.created * 1000).toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    };

    // We need to map this to our schema. 
    // Our schema has: id (uuid), user_id, stripe_subscription_id, status, plan_id...
    // The 'id' in our table is UUID, but Stripe ID is string 'sub_...'. 
    // We should probably use stripe_subscription_id as the unique key for upsert, 
    // OR we should have made 'id' text to hold 'sub_...'.
    // Looking at migration: `stripe_subscription_id text UNIQUE`.
    // So we upsert based on stripe_subscription_id.

    const { error } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: uuid,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: subscription.status,
            plan_id: planId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'stripe_subscription_id'
        });

    if (error) {
        console.error('❌ Error upserting subscription:', error);
    } else {
        console.log(`✅ Subscription ${subscription.id} updated for user ${uuid}`);

        // Update profile status for quick access
        await supabase
            .from('profiles')
            .update({
                subscription_status: subscription.status,
                subscription_tier: planId || 'free'
            })
            .eq('id', uuid);
    }
}
