// netlify/functions/create-order.js
exports.handler = async function(event) {

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  try {
    const { amount, description } = JSON.parse(event.body);

    // Build form-encoded body for Stripe API
    const params = new URLSearchParams();
    params.append('amount', String(Math.round(amount)));
    params.append('currency', 'usd');
    params.append('description', description || 'TEC Web Studio Services');
    params.append('automatic_payment_methods[enabled]', 'true');

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type':  'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const paymentIntent = await response.json();
    console.log('PaymentIntent created:', paymentIntent.id, 'status:', paymentIntent.status);

    if (paymentIntent.error) {
      console.error('Stripe error:', paymentIntent.error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: paymentIntent.error.message })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
