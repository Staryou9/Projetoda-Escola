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

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## Credenciais de Teste

- **Bibliotecário**: 
  - Usuário: admin
  - Senha: admin123

- **Estudante**: 
  - Usuário: joao
  - Senha: senha123

## Estrutura do Projeto

- `/client`: Frontend React
- `/server`: Backend Express
- `/shared`: Esquemas e tipos compartilhados
- `/server/uploads`: Armazenamento local de capas de livros

## Licença

Este projeto está sob a licença MIT.
