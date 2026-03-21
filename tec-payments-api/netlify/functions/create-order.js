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
    const { amount, description, currency } = JSON.parse(event.body);

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(STRIPE_SECRET_KEY + ':').toString('base64'),
        'Content-Type':  'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        amount:                        String(amount),
        currency:                      currency || 'usd',
        description:                   description || 'TEC Web Studio Services',
        'payment_method_types[]':      'card',
        'payment_method_types[]':      'apple_pay',
        'payment_method_types[]':      'google_pay',
        'payment_method_types[]':      'afterpay_clearpay',
        'payment_method_types[]':      'klarna',
        'payment_method_types[]':      'affirm',
        automatic_payment_methods:     'enabled',
      }).toString().replace('automatic_payment_methods=enabled', 'automatic_payment_methods[enabled]=true')
    });

    const paymentIntent = await response.json();
    console.log('PaymentIntent:', JSON.stringify(paymentIntent));

    if (paymentIntent.error) {
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
