# VeroRH — Guia de Deploy

## Estrutura de arquivos

```
verorh/
├── index.html              ← Site principal
├── vercel.json             ← Config Vercel
├── _redirects              ← Config Cloudflare Pages
├── api/
│   └── pix.js              ← API para VERCEL (Node.js)
└── functions/
    └── api/
        └── pix.js          ← API para CLOUDFLARE (Workers)
```

---

## 1. GITHUB — Subir o repositório

1. Acesse https://github.com e crie uma conta (se ainda não tiver)
2. Clique em **"New repository"**
3. Nome: `verorh-site` → **Public** → **Create repository**
4. Clique em **"uploading an existing file"**
5. Arraste TODOS os arquivos desta pasta mantendo a estrutura de pastas
6. Clique em **"Commit changes"**

---

## 2A. VERCEL — Deploy

1. Acesse https://vercel.com → faça login com o GitHub
2. Clique em **"Add New Project"**
3. Selecione o repositório `verorh-site` → **Import**
4. Framework Preset: **Other**
5. Clique em **"Deploy"**

### Variável de ambiente (IMPORTANTE)
Após o deploy, vá em:
**Settings → Environment Variables** e adicione:

| Nome | Valor |
|------|-------|
| `MEDUSA_SK` | `sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe` |

Clique em **"Redeploy"** após salvar a variável.

### URL gerada
`https://verorh-site.vercel.app`

---

## 2B. CLOUDFLARE PAGES — Deploy

1. Acesse https://dash.cloudflare.com → **Pages**
2. Clique em **"Create a project"** → **"Connect to Git"**
3. Autorize o GitHub → selecione `verorh-site`
4. Configurações:
   - Build command: *(deixe vazio)*
   - Build output directory: `/`
5. Clique em **"Save and Deploy"**

### Variável de ambiente (IMPORTANTE)
Vá em **Settings → Environment Variables** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `MEDUSA_SK` | `sk_live_v2IaJ7Pl5FQqItCibd4tuBbc2d6x6PY9jENJ5nDwxe` | Production |

Clique em **"Save and Deploy"** novamente.

### URL gerada
`https://verorh-site.pages.dev`

---

## 3. DOMÍNIO PERSONALIZADO

### Vercel
**Settings → Domains → Add** → digite seu domínio → siga as instruções de DNS

### Cloudflare
**Pages → Custom domains → Set up a custom domain** → digite seu domínio
(Se o domínio já está no Cloudflare, o DNS é configurado automaticamente)

---

## Observações

- A chave `MEDUSA_SK` nunca deve ficar exposta no código frontend
- Ela já está protegida nas variáveis de ambiente do servidor
- Qualquer push para o GitHub faz deploy automático nas duas plataformas
