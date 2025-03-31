# Guia de Contribuição

Obrigado pelo interesse em contribuir com o Sistema de Gerenciamento de Biblioteca! Este documento fornece orientações para contribuir com o projeto.

## Como Contribuir

### 1. Configurando o Ambiente de Desenvolvimento

Siga as instruções no [README.md](README.md) para configurar o ambiente de desenvolvimento.

### 2. Encontrando Tarefas

- Verifique as [issues](https://github.com/Staryou9/Projetoda-Escola/issues) abertas
- Procure por tags como `good first issue` para tarefas adequadas para iniciantes
- Se não encontrar uma issue para trabalhar, você pode criar uma nova descrevendo a melhoria ou correção

### 3. Processo de Desenvolvimento

1. **Fork do Repositório**
   - Faça um fork deste repositório para sua própria conta GitHub

2. **Clone seu Fork**
   ```bash
   git clone https://github.com/SEU_USUARIO/Projetoda-Escola.git
   cd Projetoda-Escola
   ```

3. **Crie uma Branch**
   ```bash
   git checkout -b nome-da-funcionalidade
   ```
   - Use nomes descritivos como `adicionar-paginacao` ou `corrigir-upload-imagens`

4. **Desenvolva a Funcionalidade**
   - Siga os padrões de código do projeto
   - Mantenha os commits organizados e com mensagens claras

5. **Teste suas Alterações**
   - Certifique-se de que sua funcionalidade funciona como esperado
   - Verifique se não quebrou funcionalidades existentes

6. **Envie um Pull Request**
   - Faça push para seu fork: `git push origin nome-da-funcionalidade`
   - Abra um Pull Request para a branch `main` do repositório original
   - Forneça uma descrição clara do que foi alterado e por quê

### 4. Padrões de Código

- **TypeScript**: Use tipos explícitos sempre que possível
- **Frontend**: Utilize os componentes do Shadcn UI e siga as práticas de TailwindCSS
- **Backend**: Mantenha as rotas organizadas e focadas em suas responsabilidades
- **Nomenclatura**: Use português para nomes de variáveis, funções e comentários

### 5. Diretrizes para Commits

- Use mensagens de commit em português
- Mantenha cada commit focado em uma única alteração lógica
- Estrutura recomendada:
  - `feat:` para novas funcionalidades
  - `fix:` para correções de bugs
  - `docs:` para alterações na documentação
  - `style:` para formatação de código
  - `refactor:` para refatorações de código
  - `test:` para adição/alteração de testes
  - Exemplo: `feat: Adiciona paginação na listagem de livros`

### 6. Relatando Bugs

Se encontrar um bug, abra uma issue com:
- Título claro e descritivo
- Passos detalhados para reproduzir o problema
- Comportamento esperado vs. comportamento atual
- Screenshots, se aplicável
- Informações sobre o ambiente (navegador, sistema operacional)

## Estrutura do Projeto

```
.
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── lib/             # Utilitários e configurações
│   │   └── pages/           # Páginas da aplicação
├── server/                  # Backend Express
│   ├── uploads/             # Armazenamento local de imagens
│   ├── auth.ts              # Autenticação
│   ├── index.ts             # Ponto de entrada do servidor
│   ├── routes.ts            # Definição de rotas da API
│   ├── storage.ts           # Interface de armazenamento
│   └── vite.ts              # Configuração do Vite para o servidor
└── shared/                  # Código compartilhado
    └── schema.ts            # Esquemas e tipos
```

## Dúvidas?

Se tiver dúvidas sobre o processo de contribuição, abra uma issue com a tag `question` ou entre em contato com os mantenedores do projeto.

---

Ao contribuir para este projeto, você concorda em seguir nosso código de conduta e a licença MIT do projeto.