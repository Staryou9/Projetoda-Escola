# Guia de Implantação em Produção

Este documento fornece instruções para implantar o Sistema de Gerenciamento de Biblioteca em um ambiente de produção.

## Requisitos do Servidor

- Node.js (v16 ou superior)
- PostgreSQL (v12 ou superior)
- Servidor web (opcional, como Nginx ou Apache)
- 512MB RAM mínimo (recomendado 1GB+)
- 1GB de espaço em disco (para o código e uploads)

## Configuração do Ambiente

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Configuração do banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/biblioteca_prod

# Segurança
SESSION_SECRET=chave_secreta_longa_e_aleatoria
NODE_ENV=production

# Servidor
PORT=3000
```

### 2. Segurança

Para um ambiente de produção seguro:

- Use HTTPS (obtenha um certificado SSL da Let's Encrypt)
- Configure políticas de CORS adequadas
- Desative logs de debug
- Configure rate limiting para evitar ataques de força bruta

## Passos para Implantação

### 1. Preparação do Código

```bash
# Clone o repositório
git clone https://github.com/Staryou9/Projetoda-Escola.git
cd Projetoda-Escola

# Instale dependências de produção
npm install --production

# Construa o frontend
npm run build
```

### 2. Configuração do Banco de Dados

```bash
# Migre o banco de dados
npm run db:push

# Crie o usuário administrador inicial (se necessário)
# Use um script ou faça manualmente via SQL
```

### 3. Serviço de Processo

Recomendamos usar PM2 para gerenciar o processo Node.js:

```bash
# Instale PM2 globalmente
npm install -g pm2

# Inicie a aplicação
pm2 start dist/server/index.js --name biblioteca

# Configure para iniciar automaticamente
pm2 startup
pm2 save
```

### 4. Configuração do Servidor Web (Opcional)

Para Nginx, crie um arquivo de configuração:

```nginx
server {
    listen 80;
    server_name biblioteca.seudominio.com;

    # Redirecionar para HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name biblioteca.seudominio.com;

    ssl_certificate /caminho/para/certificado.crt;
    ssl_certificate_key /caminho/para/chave.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Configuração para uploads de arquivos grandes
    client_max_body_size 10M;
}
```

### 5. Backup e Manutenção

Configure backups regulares do banco de dados:

```bash
# Backup diário (exemplo)
pg_dump -U usuario -d biblioteca_prod > /backups/biblioteca_$(date +\%Y\%m\%d).sql
```

## Monitoramento

Para monitorar a aplicação em produção:

- Use o dashboard do PM2: `pm2 monit`
- Configure alertas para quedas de serviço
- Monitore uso de recursos (CPU, memória, disco)
- Implemente logging centralizado

## Atualizações

Para atualizar a aplicação:

```bash
# Pare o serviço
pm2 stop biblioteca

# Faça backup do banco de dados
pg_dump -U usuario -d biblioteca_prod > /backups/biblioteca_antes_atualizacao.sql

# Atualize o código
git pull

# Instale dependências e reconstrua
npm install
npm run build

# Atualize o banco de dados
npm run db:push

# Reinicie o serviço
pm2 restart biblioteca
```

## Solução de Problemas Comuns

### Erro de Conexão com o Banco de Dados
- Verifique as credenciais no `.env`
- Confirme se o PostgreSQL está em execução
- Verifique configurações de firewall

### Problemas de Permissão para Uploads
- Verifique as permissões na pasta `/server/uploads`
- Configure o usuário do processo Node.js corretamente

### Erro de Memória
- Aumente a memória alocada
- Verifique por vazamentos de memória com ferramentas como `node-memwatch`

## Suporte

Para problemas com a implantação, abra uma issue no repositório GitHub ou entre em contato com os mantenedores do projeto.