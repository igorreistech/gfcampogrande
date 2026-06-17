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
