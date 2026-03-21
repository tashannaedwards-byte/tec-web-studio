// netlify/functions/create-order.js
exports.handler = async function(event) {

  // Handle CORS preflight
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

  const PAYPAL_CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_API           = 'https://api-m.paypal.com';

  try {
    const body = JSON.parse(event.body);
    const amount      = body.amount;
    const description = body.description || 'TEC Web Studio Services';

    // ── Step 1: Get access token ─────────────────────────────
    const authRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const authData = await authRes.json();
    const access_token = authData.access_token;

    if (!access_token) {
      console.error('PayPal auth failed:', authData);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'PayPal authentication failed', details: authData })
      };
    }

    // ── Step 2: Create order with Apple Pay payment source ───
    const orderPayload = {
      intent: 'CAPTURE',
      payment_source: {
        apple_pay: {}
      },
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        },
        description: description
      }]
    };

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':        'application/json',
        'Authorization':       `Bearer ${access_token}`,
        'PayPal-Request-Id':   Date.now().toString(),
        'Prefer':              'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });

    const order = await orderRes.json();
    console.log('PayPal order response:', JSON.stringify(order));

    if (!order.id) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Order creation failed', details: order })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ id: order.id })
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
