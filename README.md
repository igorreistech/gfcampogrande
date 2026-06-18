# Monitor Cirúrgico · GF Medical — Cuiabá e Campo Grande

Monitor em tempo real de procedimentos cirúrgicos das filiais Cuiabá e Campo Grande, conectado ao Firebase (`gfcampogrande-3d886`).

## Estrutura

| Arquivo | Descrição |
|---|---|
| `index.html` | Estrutura HTML e Firebase module script |
| `styles.css` | Estilos principais da aplicação |
| `app.js` | Lógica principal (renderização, filtros, modais, export) |
| `sw.js` | Service Worker — cache offline |
| `manifest.json` | Configuração PWA |
| `icon.svg` | Ícone da aplicação |

## Funcionalidades

- Autenticação via e-mail/senha e Google (Firebase Auth)
- CRUD de procedimentos em tempo real (Firestore)
- Filtro operacional por filial (Todas, Cuiabá e Campo Grande)
- Notificações push de mudança de status
- Visualização em cards, tabela e timeline
- Exportação para Excel (XLSX)
- Curva ABC por vendedor e hospital
- Calendário semanal de procedimentos
- Modo offline via Service Worker
- Upload de anexos (Firebase Storage)

## Firebase

- **Projeto:** `gfcampogrande-3d886`
- **Coleção:** `procedimentos_cg`
- **Filial:** registros novos salvam `filial` (`cba`/`cgr`) e `cidade`; registros antigos sem filial são tratados como Campo Grande

## Deploy

Hospedado em: `devigorreis.github.io/gfcampogrande/`
