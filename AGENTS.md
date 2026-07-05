# AGENTS.md

## Cursor Cloud specific instructions

Este repositório é um **site estático (PWA) em HTML/CSS/JavaScript puro**, sem backend próprio.
Todo o backend é o **Firebase em produção** (projeto `gfcampogrande-3d886`): Auth, Firestore e Storage.

### O que NÃO existe (não procure / não tente instalar)
- Sem `package.json`, sem gerenciador de pacotes, sem lockfile.
- Sem etapa de build, sem bundler.
- Sem testes automatizados e sem linter configurado.
- Sem emuladores do Firebase configurados (`firebase.json` não tem bloco `emulators`).

Por isso **não há comandos de lint/test/build** — não invente nenhum.

### Como rodar (dev)
Servir os arquivos estáticos a partir da raiz do repositório e abrir no navegador:

```bash
python3 -m http.server 8000
```

- App principal (Monitor Cirúrgico): `http://localhost:8000/index.html`
- Sub-app (Fichas OPME): `http://localhost:8000/fichas-opme.html`

Qualquer servidor estático serve (ex.: `npx serve .`, ou `firebase serve --only hosting` na porta 5000 se o `firebase-tools` estiver instalado — não é obrigatório).

### Caveats importantes (não óbvios)
- **Internet é obrigatória em runtime**: o Firebase SDK (gstatic), XLSX (cdnjs) e pdf.js são carregados via CDN dentro do navegador. Sem internet o app não funciona.
- **Login é obrigatório**: todas as coleções do Firestore exigem `request.auth != null` (ver `firestore.rules`). É possível criar conta pela própria tela ("Cadastrar-se"); sem código de acesso o papel padrão é `agendador` (vê apenas as próprias cirurgias).
- **O backend é PRODUÇÃO, não há ambiente de teste**: criar/editar/excluir procedimentos (`procedimentos_cg`) ou fichas (`fichas_opme*`) escreve direto na base real e pode disparar notificações para usuários reais. Para validar o ambiente, prefira ações de baixo impacto (criar uma conta de teste e visualizar o dashboard) e evite poluir dados de produção.
- A config do Firebase está **hardcoded inline** no `index.html` e no `fichas-opme.html` (não há `.env`). Para apontar para outro projeto Firebase, edite o objeto `firebaseConfig` diretamente nesses arquivos.
- O `app.js` na raiz **não é referenciado** pelo `index.html` (o `index.html` tem ~1,2MB de JS/HTML inline). Trate `app.js` como possivelmente legado ao investigar a lógica em execução.

### Repositório irmão e portar melhorias
- Existe um repo paralelo **`devigorreis/gfcuiaba`** (unidade de Cuiabá, MT — projeto Firebase `gfcuiaba-53b8d`, coleção `procedimentos_cba`). É o mesmo produto para outra cidade. Os dois repos têm históricos git separados ("Add files via upload"), então **não dá para fazer merge via git** — para portar melhorias, compare o conteúdo (ex.: `diff` normalizando tokens de cidade) e copie os blocos de função/IIFE faltantes, ajustando rótulos/coleção/projeto.
- Padrão de extensão: novas features são adicionadas como **módulos `<script>` aditivos no fim do `<body>`** que injetam abas/botões e fazem _override_ encadeado de `window.switchView`/`window.renderCards` — sem alterar o core. Siga esse padrão ao portar.
- **Cuidado ao portar lógica do `onSnapshot`:** o Cuiabá tem regras de auto-transição de status (ex.: "Em Trânsito sem NF → Em Separação", "data de retirada = hoje → Aguardando Retirada") que chamam `setDoc` e **reescrevem registros de produção no carregamento**. Avalie o impacto antes de portar essas mudanças de comportamento.

### Caveat de teste: visão de admin vs agendador
- Contas criadas pelo cadastro (sem código de acesso válido) recebem papel `agendador` e veem apenas a lista "Minhas Cirurgias" — o **monitor principal** (`.container`, com abas Central/Dashboard/Semana) fica oculto. O cadastro com código de acesso tende a falhar porque `doRegister()` lê `config/acesso` antes de autenticar, e o `firestore.rules` versionado não tem regra para `config/acesso`/`usuarios`.
- Para testar localmente as views só-de-admin (ex.: Calendário Semanal), logue com uma conta agendador e revele o monitor via console: `document.querySelector('.container').style.display=''; document.getElementById('agendadorView').style.display='none';`. Os dados (`window.procedimentos`) já são carregados para qualquer papel pelo `onSnapshot`, então as views renderizam com dados reais (somente leitura).
