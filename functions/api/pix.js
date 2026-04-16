// functions/api/pix.js — Cloudflare Pages Function
// Equivalente ao api_pix_final.php, reescrito para Cloudflare Workers

export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Lê parâmetros GET ou POST
  let params = {};
  if (request.method === 'POST') {
    try { params = await request.json(); } catch { params = {}; }
  } else {
    const url = new URL(request.url);
    url.searchParams.forEach((v, k) => { params[k] = v; });
  }

  const { acao, valor, email, nome, cpf } = params;

  if (acao !== 'gerar_pix') {
    return new Response(JSON.stringify({ sucesso: false, erro: 'Ação inválida.' }), {
      status: 400, headers: corsHeaders
    });
  }

  // Secret Key — use variável de ambiente no Cloudflare Dashboard
  // Settings → Environment Variables → MEDUSA_SK
  const SK = env.MEDUSA_SK || 'sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe';
  const auth = btoa(`${SK.trim()}:x`);

  const valorCentavos = Math.round(parseFloat(valor || 49.99) * 100);
  const cpfLimpo = (cpf || '').replace(/[^0-9]/g, '');

  const payload = {
    amount: valorCentavos,
    paymentMethod: 'pix',
    customer: {
      name: String(nome || 'Candidato VeroRH'),
      email: String(email || 'candidato@verorh.com.br'),
      document: {
        number: cpfLimpo,
        type: 'cpf'
      }
    },
    items: [
      {
        title: 'Curso Obrigatório — VeroRH',
        unitPrice: valorCentavos,
        quantity: 1,
        tangible: false
      }
    ],
    pix: {
      expiresInDays: 1
    }
  };

  try {
    const response = await fetch('https://api.v2.medusapay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const resultado = await response.json();

    if (response.ok) {
      const pixData = resultado?.data?.pix ?? resultado?.pix ?? {};

      return new Response(JSON.stringify({
        sucesso: true,
        qr_code: pixData.qrcode ?? null,
        copia_cola: pixData.qrcode_base64 ?? pixData.qrCodeBase64 ?? pixData.payload ?? null
      }), { status: 200, headers: corsHeaders });
    } else {
      const msg = resultado?.message ?? resultado?.error ?? 'Erro desconhecido';
      return new Response(JSON.stringify({
        sucesso: false,
        erro: `MedusaPay: ${msg} (HTTP ${response.status})`
      }), { status: 200, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      sucesso: false,
      erro: `Erro de conexão: ${err.message}`
    }), { status: 200, headers: corsHeaders });
  }
}
