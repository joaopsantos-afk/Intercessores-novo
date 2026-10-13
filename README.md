# Ave-Marias · Grupo de Intercessão 🕊️

Aplicativo web completo (React + Vite + TypeScript + Tailwind CSS + Express/Node.js) para contagem, gestão e fechamento semanal de Ave-Marias rezadas pelo Grupo de Intercessão.

---

## 🚀 Como subir este projeto no GitHub

### 1. Inicializar e enviar para o GitHub

No terminal do seu computador (dentro da pasta do projeto descompactado):

```bash
# 1. Inicializar repositório Git
git init

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer o primeiro commit
git commit -m "feat: Versao Base do Ave-Marias Intercessao"

# 4. Criar a branch principal
git branch -M main

# 5. Conectar com o seu repositório no GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# 6. Enviar para o GitHub
git push -u origin main
```

---

## ⚙️ Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto (ou configure as variáveis no serviço de hospedagem, como Render ou Railway):

```env
# Conexão Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica

# Porta do servidor (Render/Railway definem automaticamente)
PORT=3000
```

---

## 📦 Como rodar localmente

```bash
# Instalar dependências
npm install

# Rodar em modo de desenvolvimento (Frontend + Servidor de Webhooks e API)
npm run dev

# Compilar para produção
npm run build

# Iniciar servidor em produção
npm run start
```

---

## 📲 Como Conectar o WhatsApp (Evolution API)

1. **Acesse a aba "WhatsApp"** no aplicativo.
2. Insira as credenciais da sua instância da **Evolution API**:
   - **URL Base**: Ex: `https://sua-evolution-api.seu-dominio.com`
   - **Nome da Instância**: O nome da instância criada no seu painel.
   - **API Key**: Sua chave de autenticação da Evolution API.
   - **JID do Grupo**: O ID do grupo de WhatsApp (ex: `1203630xxxxxxxxxxx@g.us`).
3. **Webhook de Recebimento Automático**:
   - Ao hospedar o app (ex: no Render), aponte o webhook de mensagens da Evolution API para:
     `https://SEU-APP.onrender.com/api/webhook/whatsapp`
   - O app processará automaticamente respostas dos membros com o número de Ave-Marias rezadas!
