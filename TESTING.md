# Guia de Testes do Sistema

Este documento fornece instruções detalhadas para testar as funcionalidades do Sistema de Gerenciamento de Biblioteca após cloná-lo do GitHub.

## Preparação do Ambiente

Antes de iniciar os testes, certifique-se de ter seguido os passos de instalação no [README.md](README.md).

## Credenciais de Teste

O sistema vem pré-configurado com os seguintes usuários para teste:

- **Bibliotecário**:
  - Usuário: `admin`
  - Senha: `admin123`

- **Estudante**:
  - Usuário: `joao`
  - Senha: `senha123`

## Cenários de Teste

### 1. Autenticação e Acesso

#### 1.1 Login como Bibliotecário
- Acesse a página inicial
- Clique em "Entrar" ou vá para "/auth"
- Use as credenciais do bibliotecário
- Verifique se você é redirecionado para o dashboard de bibliotecário

#### 1.2 Login como Estudante
- Acesse a página inicial
- Clique em "Entrar" ou vá para "/auth"
- Use as credenciais do estudante
- Verifique se você é redirecionado para o dashboard de estudante

#### 1.3 Logout
- Após fazer login, clique no botão de logout no canto superior direito
- Verifique se você é redirecionado para a página de login
- Tente acessar uma rota protegida sem estar logado

### 2. Funcionalidades do Bibliotecário

#### 2.1 Gerenciamento de Livros

**Listar Livros**
- Navegue até "Livros" no menu lateral
- Verifique se todos os livros são exibidos corretamente

**Adicionar Livro**
- Clique no botão "Adicionar Livro"
- Preencha o formulário com:
  - Título: "Dom Casmurro"
  - Autor: "Machado de Assis"
  - Editora: "Companhia das Letras"
  - Ano: "1899"
  - Descrição: "Clássico da literatura brasileira"
  - Quantidade: "5"
  - Faça upload de uma imagem de capa (se disponível)
- Clique em "Salvar"
- Verifique se o livro aparece na lista de livros

**Editar Livro**
- Na lista de livros, encontre o livro que acabou de adicionar
- Clique no botão de edição (ícone de lápis)
- Altere o título para "Dom Casmurro - Edição Especial"
- Clique em "Salvar"
- Verifique se as alterações foram aplicadas

**Excluir Livro**
- Na lista de livros, encontre um livro que não esteja vinculado a empréstimos
- Clique no botão de exclusão (ícone de lixeira)
- Confirme a exclusão
- Verifique se o livro foi removido da lista

#### 2.2 Gerenciamento de Estudantes

**Listar Estudantes**
- Navegue até "Estudantes" no menu lateral
- Verifique se todos os estudantes são exibidos corretamente

**Adicionar Estudante**
- Clique no botão "Adicionar Estudante"
- Preencha o formulário com:
  - Nome: "Maria Silva"
  - Usuário: "maria"
  - Senha: "senha123"
  - Papel: "estudante"
- Clique em "Salvar"
- Verifique se o estudante aparece na lista

**Editar Estudante**
- Na lista de estudantes, encontre o estudante que acabou de adicionar
- Clique no botão de edição
- Altere o nome para "Maria Silva Santos"
- Clique em "Salvar"
- Verifique se as alterações foram aplicadas

#### 2.3 Gerenciamento de Empréstimos

**Visualizar Empréstimos**
- Navegue até "Empréstimos" no menu lateral
- Verifique se todos os empréstimos são exibidos corretamente

**Aprovar Empréstimo**
- Encontre um empréstimo com status "pendente"
- Clique no botão de aprovação
- Verifique se o status muda para "aprovado"

**Registrar Devolução**
- Encontre um empréstimo com status "aprovado"
- Clique no botão de devolução
- Verifique se o status muda para "devolvido"
- Verifique se a quantidade disponível do livro aumentou

### 3. Funcionalidades do Estudante

#### 3.1 Catálogo de Livros

**Visualizar Catálogo**
- Faça login como estudante
- Verifique se todos os livros são exibidos no catálogo

**Filtrar Livros**
- Use a barra de pesquisa para procurar por "Dom"
- Verifique se apenas os livros com "Dom" no título são exibidos

**Visualizar Detalhes do Livro**
- Clique em um livro no catálogo
- Verifique se os detalhes completos do livro são exibidos

#### 3.2 Empréstimos

**Solicitar Empréstimo**
- No catálogo, encontre um livro disponível
- Clique no botão "Solicitar Empréstimo"
- Verifique se uma confirmação é exibida
- Navegue até "Meus Empréstimos" e confirme se o novo empréstimo aparece com status "pendente"

**Visualizar Meus Empréstimos**
- Navegue até "Meus Empréstimos" no menu lateral
- Verifique se todos os seus empréstimos são exibidos corretamente com seus respectivos status

## Verificação de Responsividade

Teste a aplicação em diferentes tamanhos de tela:
- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

Para cada tamanho, verifique:
- Se a navegação se adapta corretamente
- Se os formulários são utilizáveis
- Se as tabelas/listas de itens são legíveis

## Relatando Problemas

Se encontrar algum problema durante os testes, por favor, abra uma issue no repositório GitHub com as seguintes informações:

1. Descrição do problema
2. Passos para reproduzir
3. Comportamento esperado vs. comportamento atual
4. Screenshots (se aplicável)
5. Ambiente de teste (navegador, sistema operacional)

---

Agradecemos sua contribuição para melhorar a qualidade do Sistema de Gerenciamento de Biblioteca!