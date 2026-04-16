// functions/api/pix.js — Cloudflare Pages Function

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

  let params = {};
  if (request.method === 'POST') {
    try { params = await request.json(); } catch(e) { params = {}; }
  } else {
    const url = new URL(request.url);
    url.searchParams.forEach((v, k) => { params[k] = v; });
  }

  const { acao, valor, email, nome, cpf } = params;

  if (acao !== 'gerar_pix') {
    return new Response(JSON.stringify({ sucesso: false, erro: 'Acao invalida.' }), {
      status: 400, headers: corsHeaders
    });
  }

  const SK = env.MEDUSA_SK || 'sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe';
  const auth = btoa(SK.trim() + ':x');
  const valorCentavos = Math.round(parseFloat(valor || 49.99) * 100);
  const cpfLimpo = (cpf || '').replace(/[^0-9]/g, '');

  const payload = {
    amount: valorCentavos,
    paymentMethod: 'pix',
    customer: {
      name: String(nome || 'Candidato VeroRH'),
      email: String(email || 'candidato@verorh.com.br'),
      document: { number: cpfLimpo, type: 'cpf' }
    },
    items: [{
      title: 'Curso Obrigatorio VeroRH',
      unitPrice: valorCentavos,
      quantity: 1,
      tangible: false
    }],
    pix: { expiresInDays: 1 }
  };

  try {
    const response = await fetch('https://api.v2.medusapay.com.br/v1/transactions', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + auth
      },
      body: JSON.stringify(payload)
    });

    const resultado = await response.json();
    console.log('MedusaPay full response:', JSON.stringify(resultado));

    if (response.ok) {
      const d = resultado.data || resultado;
      const pix = d.pix || d.pixData || d.pixInfo || {};

      // QR Code imagem (base64)
      const qr_code =
        pix.qrcode_base64 || pix.qrcodeBase64 || pix.qrCodeBase64 ||
        pix.qr_code_base64 || pix.image || pix.qr_image ||
        d.qrcode_base64 || d.qrcodeBase64 || null;

      // Chave copia e cola
      const copia_cola =
        pix.qrcode || pix.payload || pix.emv ||
        pix.copiaCola || pix.copia_cola || pix.pix_code ||
        pix.code || pix.key || pix.pixKey ||
        d.qrcode || d.payload || d.pix_code || null;

      return new Response(JSON.stringify({
        sucesso: true,
        qr_code: qr_code,
        copia_cola: copia_cola,
        _raw: resultado
      }), { status: 200, headers: corsHeaders });

    } else {
      const msg = (resultado.message || resultado.error || resultado.errors && resultado.errors[0] && resultado.errors[0].message) || 'Erro desconhecido';
      return new Response(JSON.stringify({
        sucesso: false,
        erro: 'MedusaPay: ' + msg + ' (HTTP ' + response.status + ')',
        _raw: resultado
      }), { status: 200, headers: corsHeaders });
    }

  } catch(err) {
    return new Response(JSON.stringify({
      sucesso: false,
      erro: 'Erro de conexao: ' + err.message
    }), { status: 200, headers: corsHeaders });
  }
}
