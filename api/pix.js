// api/pix.js — Vercel Serverless Function
// Equivalente ao api_pix_final.php, reescrito em Node.js

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Lê parâmetros (GET ou POST)
  const params = req.method === 'POST'
    ? req.body
    : req.query;

  const { acao, valor, email, nome, cpf } = params;

  if (acao !== 'gerar_pix') {
    return res.status(400).json({ sucesso: false, erro: 'Ação inválida.' });
  }

  // Sua Secret Key Medusa Pay
  const SK = process.env.MEDUSA_SK || 'sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe';
  const auth = Buffer.from(`${SK.trim()}:x`).toString('base64');

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

      return res.status(200).json({
        sucesso: true,
        qr_code: pixData.qrcode ?? null,
        copia_cola: pixData.qrcode_base64 ?? pixData.qrCodeBase64 ?? pixData.payload ?? null
      });
    } else {
      const msg = resultado?.message ?? resultado?.error ?? 'Erro desconhecido';
      return res.status(200).json({
        sucesso: false,
        erro: `MedusaPay: ${msg} (HTTP ${response.status})`
      });
    }
  } catch (err) {
    return res.status(200).json({
      sucesso: false,
      erro: `Erro de conexão: ${err.message}`
    });
  }
}
