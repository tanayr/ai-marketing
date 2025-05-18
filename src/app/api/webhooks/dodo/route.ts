import { NextRequest, NextResponse } from 'next/server';
import { StandardWebhook, WebhookVerificationError } from 'standardwebhooks';
import { db } from '@/db';
import { organizations } from '@/db/schema/organization';
import { eq } from 'drizzle-orm';

// Define the structure of Dodo webhook events
interface DodoWebhookEvent {
  type: string;
  data: {
    id: string;
    customer_id?: string;
    subscription_id?: string;
    status?: string;
    // Add other Dodo-specific fields as needed
  };
}

/**
 * Webhook handler for Dodo Payments
 * This processes webhooks sent from Dodo Payments when payment events occur
 */
export async function POST(request: NextRequest) {
  console.log('Received Dodo webhook');
  
  try {
    // Get the webhook signature from the request headers
    const signature = request.headers.get('dodo-signature');
    
    if (!signature) {
      console.error('No Dodo signature in webhook request');
      return new NextResponse('No signature', {
        status: 400,
      });
    }
    
    // Get the raw body as text
    const payload = await request.text();
    
    try {
      // Verify the webhook signature using the secret from environment variables
      const webhook = new StandardWebhook(process.env.DODO_WEBHOOK_SECRET!);
      const { id } = await webhook.verify(payload, signature) as { id: string };
      
      // Parse the payload
      const event = JSON.parse(payload) as DodoWebhookEvent;
      
      console.log(`Processing Dodo webhook event: ${event.type}`);
      
      // Handle different event types
      switch(event.type) {
        // Subscription created or updated
        case 'subscription.created':
        case 'subscription.updated':
          if (event.data.customer_id && event.data.subscription_id) {
            // Update organization with subscription info
            await handleSubscriptionEvent(
              event.data.customer_id,
              event.data.subscription_id,
              event.data.status || 'active'
            );
          }
          break;
          
        // Subscription cancelled
        case 'subscription.cancelled':
          if (event.data.customer_id) {
            // Handle subscription cancellation
            await handleSubscriptionCancellation(event.data.customer_id);
          }
          break;
          
        // Payment succeeded
        case 'payment.succeeded':
          // Process successful payment
          console.log('Payment succeeded:', event.data.id);
          break;
          
        // Payment failed
        case 'payment.failed':
          // Handle failed payment
          console.log('Payment failed:', event.data.id);
          break;
          
        default:
          // Log unhandled event types
          console.log(`Unhandled Dodo webhook event type: ${event.type}`);
      }
      
      // Return success response
      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
      });
    } catch (err) {
      // Handle webhook verification errors
      if (err instanceof WebhookVerificationError) {
        console.error('Webhook verification failed:', err.message);
        return new NextResponse('Webhook signature verification failed', {
          status: 400,
        });
      }
      throw err;
    }
  } catch (error) {
    // Handle other errors
    console.error('Error processing Dodo webhook:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Error processing webhook' }),
      { status: 500 }
    );
  }
}

/**
 * Handle subscription events (created or updated)
 */
async function handleSubscriptionEvent(
  customerId: string,
  subscriptionId: string,
  status: string
) {
  try {
    if (status === 'active') {
      // Update organization with new subscription info
      await db
        .update(organizations)
        .set({
          dodoCustomerId: customerId,
          dodoSubscriptionId: subscriptionId,
        })
        .where(eq(organizations.dodoCustomerId, customerId));
      
      console.log(`Updated organization with Dodo subscription: ${subscriptionId}`);
    } else {
      console.log(`Subscription status is ${status}, not updating`);
    }
  } catch (error) {
    console.error('Error updating organization subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(customerId: string) {
  try {
    // Find organization with this customer ID
    const orgs = await db
      .select()
      .from(organizations)
      .where(eq(organizations.dodoCustomerId, customerId));
    
    if (orgs.length > 0) {
      // Clear subscription ID but keep customer ID for future subscriptions
      await db
        .update(organizations)
        .set({
          dodoSubscriptionId: null,
        })
        .where(eq(organizations.dodoCustomerId, customerId));
      
      console.log(`Cancelled Dodo subscription for customer: ${customerId}`);
    } else {
      console.log(`No organization found with Dodo customer ID: ${customerId}`);
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}
