# Sistema de Gerenciamento de Biblioteca

Sistema web desenvolvido em português para gerenciamento de biblioteca, oferecendo painéis dedicados para bibliotecários e estudantes.

## Tecnologias Utilizadas

- **Frontend**: React.js, Shadcn UI, TailwindCSS
- **Backend**: Express.js
- **Banco de dados**: PostgreSQL
- **Linguagem**: TypeScript
- **Localização**: Português (Brasil)

## Funcionalidades

### Painel do Bibliotecário
- Cadastro, edição e remoção de livros (CRUD completo)
- Gerenciamento de acervo (controle de quantidades)
- Gerenciamento de estudantes/usuários
- Aprovação e acompanhamento de empréstimos

### Painel do Estudante
- Visualização do catálogo de livros
- Solicitação de empréstimos
- Acompanhamento de empréstimos ativos

## Guia de Instalação e Teste

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v16 ou superior)
- [npm](https://www.npmjs.com/) (v7 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (v12 ou superior)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Staryou9/Projetoda-Escola.git
   cd Projetoda-Escola
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados**
   
   Crie um banco de dados PostgreSQL e configure as variáveis de ambiente em um arquivo `.env` na raiz do projeto:
   ```
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco
   SESSION_SECRET=sua_chave_secreta_aqui
   ```

4. **Migração do banco de dados**
   ```bash
   npm run db:push
   ```

5. **Iniciar servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**
   
   Abra o navegador e acesse: http://localhost:5000

### Solução de Problemas Comuns

1. **Erro de conexão com banco de dados**
   - Verifique se o PostgreSQL está em execução
   - Confirme se as credenciais no DATABASE_URL estão corretas
   - Teste a conexão com: `psql "postgresql://usuario:senha@localhost:5432/nome_do_banco"`

2. **Problema com upload de imagens**
   - Certifique-se de que a pasta `/server/uploads` existe e tem permissões de escrita
   - Arquivos permitidos: .jpg, .jpeg, .png (máx. 5MB)

3. **Sessão expira rapidamente**
   - Aumente o tempo da sessão no arquivo `/server/auth.ts` modificando `cookie: { maxAge: ... }`

## Credenciais de Teste

- **Bibliotecário**: 
  - Usuário: `admin`
  - Senha: `admin123`

- **Estudante**: 
  - Usuário: `joao`
  - Senha: `senha123`

## Estrutura do Projeto

- `/client`: Frontend React
- `/server`: Backend Express
- `/shared`: Esquemas e tipos compartilhados
- `/server/uploads`: Armazenamento local de capas de livros

## Fluxo de Uso

1. **Como Bibliotecário**:
   - Faça login com as credenciais de bibliotecário
   - Adicione/edite livros no sistema
   - Gerencie estudantes
   - Aprove solicitações de empréstimo
   - Registre devoluções de livros

2. **Como Estudante**:
   - Faça login com as credenciais de estudante
   - Navegue pelo catálogo de livros
   - Solicite empréstimos de livros
   - Visualize seus empréstimos ativos

## Licença

Este projeto está sob a licença MIT.
