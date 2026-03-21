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

  const PAYPAL_CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
  const PAYPAL_API           = 'https://api-m.paypal.com';

  try {
    const body        = JSON.parse(event.body);
    const amount      = body.amount;
    const description = body.description || 'TEC Web Studio Services';
    const token       = body.token;       // Apple Pay token (if confirming)
    const orderId     = body.orderId;     // existing order ID (if confirming)

    // ── Get access token ────────────────────────────────────
    const authRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await authRes.json();

    // ── If we have a token + orderId, confirm & capture ─────
    if (orderId && token) {
      // Step A: Confirm the order with the Apple Pay token
      const confirmRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/confirm-payment-source`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${access_token}`,
          'Prefer':        'return=representation'
        },
        body: JSON.stringify({
          payment_source: {
            apple_pay: {
              token: token
            }
          }
        })
      });
      const confirmed = await confirmRes.json();
      console.log('Confirm response:', JSON.stringify(confirmed));

      // Step B: Capture the order
      const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${access_token}`,
          'Prefer':        'return=representation'
        },
        body: '{}'
      });
      const captured = await captureRes.json();
      console.log('Capture response:', JSON.stringify(captured));

      const captureStatus = captured?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
      if (captureStatus === 'COMPLETED') {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: true, capture: captured })
        };
      } else {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ success: false, details: captured })
        };
      }
    }

    // ── Otherwise, just create the order ────────────────────
    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'Authorization':     `Bearer ${access_token}`,
        'PayPal-Request-Id': Date.now().toString(),
        'Prefer':            'return=representation'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount },
          description: description
        }]
      })
    });
    const order = await orderRes.json();
    console.log('Order created:', JSON.stringify(order));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
