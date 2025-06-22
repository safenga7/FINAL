import Stripe from 'stripe';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const subscriptionPlans = {
  basic: {
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    name: 'Basic Plan',
    sessions: 1
  },
  standard: {
    priceId: process.env.STRIPE_STANDARD_PRICE_ID,
    name: 'Standard Plan',
    sessions: 4
  },
  premium: {
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    name: 'Premium Plan',
    sessions: 12
  }
};

const createSubscription = async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = subscriptionPlans[planId];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Create or get Stripe customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      await user.update({ stripeCustomerId: customer.id });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{
        price: plan.priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
      metadata: {
        userId: user.id,
        planId
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Payment Controller Error:', error);
    res.status(500).json({ 
      message: 'Error creating subscription', 
      error: error.message 
    });
  }
};

const verifySubscription = async (req, res) => {
  const { session_id } = req.query;
  
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }

    const user = await User.findByPk(session.metadata.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const plan = subscriptionPlans[session.metadata.planId];
    
    await user.update({
      subscriptionStatus: 'active',
      subscriptionPlan: session.metadata.planId,
      sessionsRemaining: plan.sessions,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    });

    res.json({ 
      success: true, 
      message: 'Subscription activated successfully' 
    });
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying subscription',
      error: error.message 
    });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const user = await User.findByPk(session.metadata.userId);
        if (user) {
          const plan = subscriptionPlans[session.metadata.planId];
          await user.update({
            subscriptionStatus: 'active',
            subscriptionPlan: session.metadata.planId,
            sessionsRemaining: plan.sessions,
            subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = await User.findOne({
          where: { stripeCustomerId: subscription.customer }
        });
        if (user) {
          await user.update({
            subscriptionStatus: 'cancelled',
            sessionsRemaining: 0,
            subscriptionEndDate: new Date()
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const user = await User.findOne({
          where: { stripeCustomerId: invoice.customer }
        });
        if (user) {
          await user.update({
            subscriptionStatus: 'inactive'
          });
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Handler Error:', error);
    res.status(500).json({ 
      received: false,
      error: error.message 
    });
  }
};

export { createSubscription, handleWebhook, verifySubscription };