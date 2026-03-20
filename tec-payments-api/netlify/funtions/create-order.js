// netlify/functions/create-order.js
// Deploys to Netlify as a serverless function.
// This creates a PayPal order for Apple Pay / Google Pay to confirm.

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const PAYPAL_CLIENT_ID     = process.env.Ae0VR-L2B4DenAYy3NPAyRSXEX7BxSXWINaZIIhtQD8tMhniKndsLtrADeWyEf4J_JRr7of87Luc2H4L;
  const PAYPAL_CLIENT_SECRET = process.env.EL2Lw8IR8zpq7HUlDVpraNkrzKh_AeNKx6fFN_TK340W_x8wVe1_nKMXX3lG8uopMvVFkw0DwTk6QAk7;
  const PAYPAL_API           = 'https://api-m.paypal.com'; // live endpoint

  try {
    const { amount, description } = JSON.parse(event.body);

    // ── Step 1: Get an access token from PayPal ──────────────
    const authRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });

    const { access_token } = await authRes.json();

    // ── Step 2: Create the order ─────────────────────────────
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount
          },
          description: description || 'TEC Web Studio Services'
        }]
      })
    });

    const order = await orderRes.json();

    // ── Step 3: Return the order ID to the browser ───────────
    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*' // allows your GitHub Pages site to call this
      },
      body: JSON.stringify({ id: order.id })
    };

  } catch (err) {
    console.error('PayPal order creation error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Failed to create order' })
    };
  }
}
