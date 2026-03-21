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
    const body          = JSON.parse(event.body);
    const amount        = body.amount;
    const description   = body.description || 'TEC Web Studio Services';
    const applePayToken = body.applePayToken;

    // ── Get access token ──────────────────────────────────
    const authRes = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
      },
      body: 'grant_type=client_credentials'
    });
    const { access_token } = await authRes.json();

    // ── Build the token — ensure version is always present ─
    const formattedToken = {
      version:   applePayToken.version   || 'EC_v1',
      data:      applePayToken.data,
      signature: applePayToken.signature,
      header: {
        ephemeralPublicKey: applePayToken.header.ephemeralPublicKey,
        publicKeyHash:      applePayToken.header.publicKeyHash,
        transactionId:      applePayToken.header.transactionId
      }
    };

    console.log('Formatted token:', JSON.stringify(formattedToken));

    // ── Create order with Apple Pay token ─────────────────
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: amount },
        description: description
      }],
      payment_source: {
        apple_pay: {
          token: formattedToken
        }
      }
    };

    const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'Authorization':     `Bearer ${access_token}`,
        'PayPal-Request-Id': Date.now().toString(),
        'Prefer':            'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });
    const order = await orderRes.json();
    console.log('Order response:', JSON.stringify(order));

    if (!order.id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, error: 'Order creation failed', details: order })
      };
    }

    // ── Capture order ─────────────────────────────────────
    const captureRes = await fetch(`${PAYPAL_API}/v2/checkout/orders/${order.id}/capture`, {
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

    const status = captured?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
    if (status === 'COMPLETED') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ success: false, details: captured })
      };
    }

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
