# Monitor Cirúrgico · Campo Grande

Aplicativo web de monitoramento cirúrgico em tempo real para Campo Grande, MS.

## O que foi melhorado

- Extraiu o JavaScript principal para `app.js`.
- Extraiu os estilos principais para `styles.css`.
- Melhorou o Service Worker (`sw.js`) para cachear recursos locais e servir assets em modo offline.
- Adicionou `README.md` com resumo do projeto.
- Adicionou meta `description` ao `index.html`.

## Como usar

1. Coloque os arquivos em um servidor estático ou GitHub Pages.
2. Certifique-se de que o app seja servido em `/gfcampogrande/` ou ajuste as rotas no `manifest.json` e `sw.js`.
3. O Firebase já está configurado no `app.js` com as dependências importadas do CDN.

## Sugestões futuras

- Mover mais lógica para módulos separados para melhor manutenção.
- Configurar regras de segurança do Firestore para proteger o acesso a usuários e agendamentos.
- Adicionar testes simples para validação de formulários e permissões.
- Adicionar `favicon` e ícones locais para PWA.
