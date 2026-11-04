-- Inventário consignado nos clientes: importa o relatório "C457 - Itens Consignados" (PDF do ERP), bipa as etiquetas
     (leitor ou câmera do celular) e compara o que deveria estar no cliente com o que foi encontrado. Mesmo login do Monitor.
     fretes-config.js (de cada site) fixa a filial; sem ele, vale ?filial= ou a filial escolhida no GF Hub. -->
<script src="fretes-config.js"></script>
<script>
(function(){
  var p = new URLSearchParams(location.search);
  var fixa = (window.FRETES_CONFIG || {}).filialFixa;
  if (fixa === 'cgr' || fixa === 'cba') { window._fretesBranch = fixa; window._filialFixa = true; return; }
  var f = p.get('filial');
  if (f === 'cgr' || f === 'cba') { try { localStorage.setItem('gf_fretes_branch', f); } catch (e) {} }
  var b = null;
  try { b = f || localStorage.getItem('gf_fretes_branch') || localStorage.getItem('gf_branch'); } catch (e) {}
  window._fretesBranch = b === 'cba' ? 'cba' : 'cgr';
})();
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Inventário consignado · GF Medical</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
<script src="nf-import.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#e8f5ee;--surface:#f0faf3;--surface2:#d8f0e0;--border:#b8dfc4;--accent:#1a7a4a;--accent2:#2a9fbf;
  --text:#0a2a18;--text2:#2a5a3a;--text3:#5a8a6a;
  --mono:'JetBrains Mono',monospace;--sans:'Inter',sans-serif;--display:'Space Grotesk',sans-serif;
  --radius:10px;--shadow:0 2px 12px rgba(10,42,24,0.08);--shadow-md:0 4px 24px rgba(10,42,24,0.14);
  --ok-c:#15803d;--ok-bg:rgba(21,128,61,0.10);--warn-c:#b45309;--warn-bg:rgba(217,119,6,0.13);
  --crit-c:#dc2626;--crit-bg:rgba(239,68,68,0.10);--info-c:#0e7490;--info-bg:rgba(42,159,191,0.12);
}
html{font-size:15px}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh;padding-bottom:60px}
html.embed body{padding-bottom:0}
button{font-family:inherit}
.top{position:sticky;top:0;z-index:50;background:var(--surface);border-bottom:1px solid var(--border);box-shadow:var(--shadow);display:flex;align-items:center;gap:10px;padding:8px 16px;flex-wrap:wrap}
.top img{width:30px;height:30px;border-radius:7px;object-fit:cover}
.top .tit{font-family:var(--display);font-weight:700;font-size:.95rem;margin-right:auto}
.top .tit small{display:block;font-family:var(--mono);font-size:.58rem;color:var(--text3);letter-spacing:.08em;text-transform:uppercase;font-weight:400}
.top a,.top .lk{font-size:.72rem;color:var(--text2);text-decoration:none;border:1px solid var(--border);border-radius:8px;padding:5px 9px;background:var(--bg);cursor:pointer}
html.embed .top .so-solto{display:none}
.wrap{max-width:1200px;margin:0 auto;padding:16px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:var(--radius);border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.78rem;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap}
.btn:hover{border-color:var(--accent)}
.btn.p{background:var(--accent);border-color:var(--accent);color:#fff}
.btn.b{background:var(--accent2);border-color:var(--accent2);color:#fff}
.btn.r{color:var(--crit-c)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);padding:16px}
.muted{color:var(--text3);font-size:.74rem}
.mono{font-family:var(--mono)}
.lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-top:14px}
.inv{cursor:pointer;transition:border-color .13s}
.inv:hover{border-color:var(--accent)}
.inv h3{font-family:var(--display);font-size:.92rem;margin-bottom:3px}
.tag{display:inline-block;font-family:var(--mono);font-size:.6rem;font-weight:600;padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em}
.tag.ab{background:var(--info-bg);color:var(--info-c)}.tag.fe{background:var(--ok-bg);color:var(--ok-c)}
.barra{height:7px;border-radius:9px;background:var(--surface2);overflow:hidden;margin:9px 0 5px}
.barra i{display:block;height:100%;background:linear-gradient(90deg,var(--accent2),var(--accent))}
.cab{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.cab h2{font-family:var(--display);font-size:1.1rem}
.bip{margin-top:14px;display:grid;grid-template-columns:1fr auto;gap:8px}
.bip input{padding:14px 15px;border-radius:12px;border:2px solid var(--accent2);background:#fff;font-family:var(--mono);font-size:1rem;font-weight:600;outline:none;min-width:0}
.bip input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(26,122,74,.15)}
#ultimo{margin-top:10px;padding:13px 15px;border-radius:12px;background:var(--surface2);font-weight:600;font-size:.9rem;min-height:50px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#ultimo.ok{background:#dcfce7;color:#14532d}#ultimo.av{background:#fef3c7;color:#78350f}#ultimo.er{background:#fee2e2;color:#7f1d1d}
#ultimo .q{margin-left:auto;font-family:var(--mono);font-size:1.15rem}
#cam{margin-top:10px;border-radius:14px;overflow:hidden;background:#000;display:none;max-width:520px}
#cam.on{display:block}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-top:14px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer}
.kpi b{display:block;font-family:var(--display);font-size:1.25rem}
.kpi span{font-family:var(--mono);font-size:.6rem;text-transform:uppercase;letter-spacing:.06em;color:var(--text3)}
.kpi small{display:block;font-size:.68rem;color:var(--text3)}
.kpi.on{border-color:var(--accent);box-shadow:0 0 0 2px rgba(26,122,74,.15)}
.kpi.ok b{color:var(--ok-c)}.kpi.av b{color:var(--warn-c)}.kpi.er b{color:var(--crit-c)}
.filtros{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:14px 0 8px}
.filtros input{flex:1;min-width:180px;padding:8px 11px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);font-size:.8rem;outline:none}
.tw{overflow-x:auto;border:1px solid var(--border);border-radius:12px;background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:.76rem}
th{font-family:var(--mono);font-size:.58rem;letter-spacing:.07em;text-transform:uppercase;color:var(--text3);text-align:left;padding:8px;background:var(--surface2);white-space:nowrap}
td{padding:7px 8px;border-top:1px solid var(--border);vertical-align:top}
td.n,th.n{text-align:right;font-family:var(--mono);white-space:nowrap}
tr.st-ok td:first-child{box-shadow:inset 3px 0 var(--ok-c)}tr.st-falta td:first-child{box-shadow:inset 3px 0 var(--warn-c)}tr.st-sobra td:first-child,tr.st-exc td:first-child{box-shadow:inset 3px 0 var(--crit-c)}
.st{font-weight:700;white-space:nowrap}.st.ok{color:var(--ok-c)}.st.falta{color:var(--warn-c)}.st.sobra,.st.exc{color:var(--crit-c)}
.venc{color:var(--crit-c);font-weight:700}
.leit{margin-top:14px}
.leit div.l{display:flex;gap:8px;align-items:center;padding:6px 4px;border-top:1px dashed var(--border);font-size:.74rem}
.leit div.l span.h{margin-left:auto;color:var(--text3);font-family:var(--mono);font-size:.65rem;white-space:nowrap}
.x{border:0;background:none;color:var(--crit-c);cursor:pointer;font-size:.8rem;padding:2px 5px}
.acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.ov{position:fixed;inset:0;background:rgba(10,42,24,.45);backdrop-filter:blur(3px);z-index:300;display:none;align-items:center;justify-content:center;padding:16px}
.ov.open{display:flex}
.mod{background:var(--surface);border-radius:16px;width:100%;max-width:560px;max-height:calc(100vh - 32px);overflow:auto;box-shadow:var(--shadow-md)}
.mod .mh{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--surface2);font-family:var(--display);font-weight:700}
.mod .mb{padding:16px 18px}
.mod .mf{padding:12px 18px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.mod textarea{width:100%;height:280px;font-family:var(--mono);font-size:.7rem;padding:10px;border:1px solid var(--border);border-radius:8px}
.mod select,.mod input[type=text]{width:100%;padding:9px 11px;border:1px solid var(--border);border-radius:8px;font-size:.82rem;background:#fff}
.drop{border:2px dashed var(--accent2);border-radius:14px;padding:26px 16px;text-align:center;background:rgba(42,159,191,.05);cursor:pointer}
.drop.over{background:rgba(42,159,191,.14)}
.toasts{position:fixed;bottom:60px;right:16px;z-index:400;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.toast{padding:9px 14px;color:#fff;border-radius:10px;font-size:.76rem;background:var(--accent);box-shadow:var(--shadow-md);max-width:340px}
.toast.err{background:var(--crit-c)}.toast.info{background:var(--accent2)}
.login{position:fixed;inset:0;z-index:500;background:var(--bg);display:none;align-items:center;justify-content:center;padding:16px}
.login .card{max-width:360px;width:100%;padding:28px 24px}
.login input,.login select{width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:10px;margin-top:6px;margin-bottom:12px;font-size:.85rem;background:#fff}
.login label{font-family:var(--mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text3)}
.rodape{position:fixed;bottom:0;left:0;right:0;background:rgba(6,10,9,.85);padding:7px 16px;text-align:center;font-family:monospace;font-size:.68rem;color:#8a9e97;z-index:40}
html.embed .rodape{display:none}
body.fechado .so-aberto{display:none!important}
body:not(.fechado) .so-fechado{display:none!important}
@media (max-width:640px){
  .wrap{padding:12px}
  .top{padding:8px 12px}
  .top a.so-solto{display:none}
  .kpi b{font-size:1.05rem}
  th.mob-x,td.mob-x{display:none}
}
</style>
<script>if (/[?&]embed=1/.test(location.search)) document.documentElement.classList.add('embed');</script>
</head>
<body>

<div class="login" id="login">
  <div class="card">
    <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px"><img src="logo.jpg" alt="" style="width:46px;height:46px;border-radius:10px"><div><b style="font-family:var(--display)">GF Medical</b><div class="muted">Inventário consignado</div></div></div>
    <select id="login-filial" aria-label="Filial" onchange="trocarFilial(this.value)"><option value="cgr">Campo Grande · MS</option><option value="cba">Cuiabá · MT</option></select>
    <label for="l-email">E-mail</label><input id="l-email" type="email" autocomplete="email" placeholder="seu@email.com">
    <label for="l-senha">Senha</label><input id="l-senha" type="password" autocomplete="current-password" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()">
    <button class="btn p" style="width:100%;justify-content:center;padding:11px" onclick="doLogin()">Entrar</button>
    <div id="l-err" style="display:none;color:var(--crit-c);font-size:.75rem;margin-top:10px;text-align:center"></div>
    <div class="muted" style="margin-top:12px;text-align:center">Use o mesmo login do Monitor Cirúrgico.</div>
  </div>
</div>

<div class="top">
  <img src="logo.jpg" alt="GF Medical">
  <div class="tit">📋 Inventário consignado<small id="filial-lbl">—</small></div>
  <span class="lk" id="user-nm" onclick="pedirOperador()" title="Quem está fazendo o inventário">—</span>
  <a class="so-solto" href="index.html">⬅ Monitor</a>
  <a class="so-solto" href="index.html?hub=1">🏠 GF Hub</a>
  <span class="lk" onclick="doLogout()">Sair</span>
</div>

<div class="wrap" id="v-lista" style="display:none">
  <div class="card">
    <div class="drop" id="drop" onclick="document.getElementById('f-pdf').click()">
      <div style="font-size:1.6rem">📥</div>
      <b>Novo inventário</b>
      <div class="muted" style="margin-top:4px">Clique ou arraste aqui o PDF do relatório <b>C457 - Itens Consignados</b> do cliente (pode ser mais de um, ex.: um por fornecedor).</div>
    </div>
    <input type="file" id="f-pdf" accept="application/pdf,.pdf" multiple style="display:none">
  </div>
  <div class="filtros"><input id="busca-inv" placeholder="🔍 Buscar cliente ou fornecedor…"><button class="btn" data-fl="aberto" id="fl-aberto">⏳ Em andamento</button><button class="btn" data-fl="fechado" id="fl-fechado">✔ Encerrados</button><button class="btn" data-fl="" id="fl-todos">Todos</button></div>
  <div class="lista" id="lista"></div>
</div>

<div class="wrap" id="v-inv" style="display:none">
  <div style="margin-bottom:10px"><a href="#" class="btn" onclick="voltarLista();return false">⬅ Inventários</a></div>
  <div class="card">
    <div class="cab">
      <div style="flex:1;min-width:220px">
        <h2 id="i-cli">—</h2>
        <div class="muted" id="i-info"></div>
      </div>
      <span class="tag" id="i-status"></span>
    </div>
    <div class="so-aberto">
      <form class="bip" id="f-bip" autocomplete="off"><input id="bip" placeholder="🔫 Bipe aqui a etiqueta (ou digite o lote)" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="send"><button class="btn p">OK</button></form>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn b" id="b-cam" type="button" onclick="alternarCamera()">📷 Câmera deste aparelho</button>
        <button class="btn" type="button" onclick="abrirCelular()">📱 Bipar com outro celular</button>
        <span class="muted" style="align-self:center">Bipe <b>uma etiqueta por embalagem</b> (as caixas têm várias etiquetas iguais).</span>
      </div>
      <div id="cam"></div>
      <div id="ultimo">Aguardando a primeira leitura…</div>
    </div>
    <div class="so-fechado muted" style="margin-top:10px" id="i-fechado-info"></div>
  </div>

  <div class="kpis" id="kpis"></div>
  <div class="filtros"><input id="busca" placeholder="🔍 Buscar código, produto, lote, NF…"></div>
  <div class="tw"><table id="tb"></table></div>

  <div class="acoes">
    <button class="btn" onclick="imprimir()">🖨 Relatório para assinatura</button>
    <button class="btn" onclick="baixarExcel()">📊 Excel</button>
    <button class="btn p so-aberto" onclick="encerrar()">✔ Encerrar inventário</button>
    <button class="btn so-fechado" onclick="reabrir()">🔓 Reabrir</button>
    <button class="btn r" id="b-excluir" onclick="excluir()">🗑 Excluir</button>
  </div>

  <div class="card leit">
    <b style="font-family:var(--display)">Leituras</b> <span class="muted" id="n-leit"></span>
    <div id="leituras"></div>
  </div>
</div>

<div class="ov" id="m-novo"><div class="mod">
  <div class="mh"><span>📥 Novo inventário</span><button class="x" onclick="fecharModal('m-novo')">✕</button></div>
  <div class="mb" id="novo-corpo"></div>
  <div class="mf"><button class="btn" onclick="fecharModal('m-novo')">Cancelar</button><button class="btn p" id="novo-ok">Iniciar inventário</button></div>
</div></div>

<div class="ov" id="m-cel"><div class="mod" style="max-width:380px">
  <div class="mh"><span>📱 Bipar com o celular</span><button class="x" onclick="fecharModal('m-cel')">✕</button></div>
  <div class="mb" style="text-align:center">
    <div id="cel-qr" style="display:inline-block;background:#fff;padding:10px;border-radius:12px"></div>
    <div class="muted" style="margin-top:10px">Aponte a câmera do celular para o QR. Ele abre <b>este inventário</b> já com o leitor ligado (entre com o seu login). Tudo o que for bipado lá aparece aqui na hora — dá para várias pessoas biparem juntas.</div>
    <div class="mono" id="cel-url" style="font-size:.6rem;word-break:break-all;margin-top:8px;color:var(--text3)"></div>
  </div>
  <div class="mf"><button class="btn" id="cel-copiar">📋 Copiar link</button></div>
</div></div>

<div class="ov" id="m-op"><div class="mod" style="max-width:380px">
  <div class="mh"><span>👤 Quem está fazendo o inventário?</span></div>
  <div class="mb"><div class="muted" style="margin-bottom:10px">Conta compartilhada: escolha seu nome — ele fica gravado em cada leitura.</div>
    <select id="op-sel" onchange="document.getElementById('op-outro').style.display = this.value === '__outro' ? '' : 'none'"></select>
    <input type="text" id="op-outro" placeholder="Seu nome" style="display:none;margin-top:8px"></div>
  <div class="mf"><button class="btn p" onclick="confirmarOperador()">Confirmar</button></div>
</div></div>

<div class="ov" id="m-sql"><div class="mod" style="max-width:760px">
  <div class="mh"><span>🛠 Falta criar as tabelas do inventário</span><button class="x" onclick="fecharModal('m-sql')">✕</button></div>
  <div class="mb"><div class="muted" style="margin-bottom:8px">Rode este SQL uma vez no <b>SQL Editor do Supabase desta filial</b> (pode rodar mais de uma vez sem problema).</div><textarea id="sql-txt" readonly></textarea></div>
  <div class="mf"><a class="btn" id="sql-abrir" target="_blank" rel="noopener">🔗 Abrir SQL Editor</a><button class="btn p" onclick="navigator.clipboard.writeText(document.getElementById('sql-txt').value).then(() => toast('SQL copiado'))">📋 Copiar SQL</button></div>
</div></div>

<div class="toasts" id="toasts"></div>
<div class="rodape">© GF Medical · Desenvolvido por Igor Reis</div>

<script type="module">
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const BRANCHES = {
  cgr: { url: 'https://rqzqetfoxiutabsooqqn.supabase.co', key: 'sb_publishable_P3EggMdsxQUoKnX_pLMaRQ_ZrGEYpIP', label: 'Campo Grande · MS', ref: 'rqzqetfoxiutabsooqqn' },
  cba: { url: 'https://cyztucqhfotqhauavepu.supabase.co', key: 'sb_publishable_LnJYIlIDvTF6l4MMQwZ-Kg_uCBXnZRM', label: 'Cuiabá · MT', ref: 'cyztucqhfotqhauavepu' },
};
const BRANCH = window._fretesBranch, BR = BRANCHES[BRANCH], FILIAL = BRANCH.toUpperCase();
const supabase = window._filialFixa ? createClient(BR.url, BR.key) : createClient(BR.url, BR.key, { auth: { storageKey: 'sb-' + BRANCH + '-auth' } });
const auth = supabase.auth;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qtd = v => (Number(v) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const dataBR = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4) : '—';
const dataHoraBR = iso => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const hojeISO = () => new Date().toISOString().slice(0, 10);
const diasAte = iso => iso ? Math.floor((Date.parse(iso) - Date.parse(hojeISO())) / 864e5) : null;
function toast(msg, tipo = 'ok') { const t = document.createElement('div'); t.className = 'toast ' + (tipo === 'err' ? 'err' : tipo === 'info' ? 'info' : ''); t.textContent = msg; $('toasts').appendChild(t); setTimeout(() => t.remove(), tipo === 'err' ? 7000 : 4000); }
window.toast = toast;
window.fecharModal = id => $(id).classList.remove('open');

// ───────── Leitura do relatório C457 - Itens Consignados (PDF do ERP) ─────────
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const numBR = s => { const n = Number(String(s ?? '').replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const dISO = s => { const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const juntar = its => its.sort((a, b) => a.x - b.x).reduce((s, i, k, arr) => { if (!k) return i.s; const p = arr[k - 1]; return s + (i.x - (p.x + p.w) > 1.5 ? ' ' : '') + i.s; }, '').replace(/\s+/g, ' ').trim();
function linhasDaPagina(its) {
  const ord = [...its].sort((a, b) => b.y - a.y || a.x - b.x), out = [];
  ord.forEach(i => { const l = out[out.length - 1]; if (l && Math.abs(l.y - i.y) <= 1.8) l.its.push(i); else out.push({ y: i.y, its: [i] }); });
  return out.map(l => juntar(l.its));
}
const RE_PROD = /^(\d\d\/\d\d\/\d{4}) ([\d.]+) (?:(\d+) )?(.*?) ?(\d{1,3}(?:\.\d{3})*) (\S+) (.+) (\d[\d.]*,\d+) (\d[\d.]*,\d+) (\d[\d.]*,\d+)$/;
const RE_LOTE = /Lote:\s*(\S+)\s+Num\.\s*S.rie:\s*(.*?)\s*Qtd:\s*([\d.,]+)\s+Dt\.\s*Validade:\s*(\d\d\/\d\d\/\d{4})?\s*Qtd\.\s*Saldo:\s*([\d.,]+)/;
// devolve { cliente, fornecedor, data, esperado: [{ cod, produto, lote, validade, saldo, vunit, nfs:[{nf, pedido, data}] }] }
function lerC457(linhas) {
  const ach = re => { for (const l of linhas) { const m = re.exec(l); if (m) return m[1].trim(); } return ''; };
  const cliente = ach(/Cliente:\s*(.+?)\.?$/), fornecedor = ach(/Fornecedor:\s*(.+?)\.?$/), data = dISO(ach(/Data de impress.o:\s*(\S+)/));
  if (!cliente || !linhas.some(l => /Itens Consignados/i.test(l))) throw new Error('não parece o relatório "C457 - Itens Consignados"');
  const mapa = new Map(); let prod = null, nLin = 0;
  for (const l of linhas) {
    const p = RE_PROD.exec(l);
    if (p) { const q = numBR(p[8]); prod = { data: dISO(p[1]), nf: p[2], pedido: p[3] || '', cod: p[6], produto: p[7], vunit: q ? numBR(p[10]) / q : 0 }; nLin++; continue; }
    const m = RE_LOTE.exec(l);
    if (!m || !prod) continue;
    const saldo = numBR(m[5]); if (saldo <= 0) continue;          // saldo 0 = já vendido / devolvido
    const k = norm(prod.cod) + '|' + norm(m[1]);
    const e = mapa.get(k) || { cod: prod.cod, produto: prod.produto, lote: m[1], serie: m[2] || '', validade: dISO(m[4]), saldo: 0, vunit: prod.vunit, nfs: [] };
    e.saldo += saldo;
    if (!e.nfs.some(n => n.nf === prod.nf)) e.nfs.push({ nf: prod.nf, pedido: prod.pedido, data: prod.data });
    mapa.set(k, e);
  }
  if (!nLin) throw new Error('não encontrei as linhas de produto do relatório');
  return { cliente, fornecedor, data, esperado: [...mapa.values()] };
}

// ───────── Etiqueta GS1 (GS1-128 / DataMatrix): (01) GTIN · (17) validade · (10) lote · (21) série ─────────
const AI_FIXO = { '00': 18, '01': 14, '02': 14, '11': 6, '12': 6, '13': 6, '15': 6, '16': 6, '17': 6, '20': 2 };
const AI_VAR = ['10', '21', '22', '30', '37', '240', '241', '250', '251', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
function gs1(bruto) {
  let s = String(bruto || '').replace(/^\][A-Za-z]\d/, '').replace(/[\r\n]/g, '').trim(); const out = {};
  if (/\(\d{2,4}\)/.test(s)) { const re = /\((\d{2,4})\)([^(]*)/g; let m; while ((m = re.exec(s))) out[m[1]] = m[2].replace(/\x1d/g, '').trim(); return out['01'] || out['10'] ? out : null; }
  s = s.replace(/\s+/g, '\x1d').replace(/^\x1d+/, '');           // alguns leitores mandam espaço no lugar do separador GS
  if (!/^(01|02)\d{14}/.test(s)) return null;
  let i = 0, n = 0;
  while (i < s.length && n++ < 15) {
    if (s[i] === '\x1d') { i++; continue; }
    let ai = s.substr(i, 2);
    if (AI_FIXO[ai]) { out[ai] = s.substr(i + 2, AI_FIXO[ai]); i += 2 + AI_FIXO[ai]; continue; }
    if (AI_VAR.includes(s.substr(i, 3))) ai = s.substr(i, 3); else if (!AI_VAR.includes(ai)) break;
    let j = s.indexOf('\x1d', i + ai.length); if (j < 0) j = s.length;
    out[ai] = s.slice(i + ai.length, j); i = j;
  }
  return out['01'] || out['10'] ? out : null;
}
// (17) AAMMDD → ISO; dia 00 = último dia do mês
const validade17 = v => { if (!/^\d{6}$/.test(v || '')) return null; const a = 2000 + +v.slice(0, 2), m = +v.slice(2, 4), d = +v.slice(4, 6) || new Date(a, m, 0).getDate(); return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
// casa a leitura com uma linha do relatório pelo lote (a etiqueta não tem o código do ERP)
function identificar(bruto, esperado) {
  const g = gs1(bruto), semEsp = s => norm(s).replace(/[\s\x1d]+/g, '');
  const loteLido = g ? semEsp(g['10'] || '') : '', onde = g ? semEsp((g['10'] || '') + ' ' + (g['21'] || '')) : semEsp(bruto);
  let e = loteLido ? esperado.find(x => semEsp(x.lote) === loteLido) : null;
  if (!e) e = esperado.find(x => { const L = semEsp(x.lote); return L.length >= 5 && (onde.includes(L) || (loteLido && loteLido.startsWith(L))); });
  if (!e && !g) e = esperado.find(x => semEsp(x.serie) && semEsp(x.serie) === onde);
  return {
    gtin: g?.['01'] || null, lote: e ? e.lote : (g ? (g['10'] || null) : String(bruto).trim().slice(0, 60)),
    validade: g?.['17'] ? validade17(g['17']) : (e?.validade || null), serie: g?.['21'] || null,
    codigo: e?.cod || null, produto: e?.produto || null,
  };
}

$('filial-lbl').textContent = 'Filial ' + BR.label;
document.title = 'Inventário consignado · GF Medical · ' + BR.label;
$('login-filial').value = BRANCH; if (window._filialFixa) $('login-filial').style.display = 'none';
window.trocarFilial = code => { try { localStorage.setItem('gf_fretes_branch', code); } catch (e) {} const u = new URL(location.href); u.searchParams.set('filial', code); location.href = u.href; };

// ───────── SQL (rodar uma vez no Supabase de cada filial) ─────────
const SQL = `-- Inventário consignado nos clientes (relatório C457 × etiquetas bipadas)
create table if not exists public.inventarios (
  id             uuid primary key default gen_random_uuid(),
  filial         text not null default 'CGR',
  cliente        text not null,
  fornecedor     text,
  relatorio_data date,
  arquivos       text,
  esperado       jsonb not null default '[]'::jsonb,
  status         text not null default 'aberto' check (status in ('aberto','fechado')),
  criado_por     text,
  criado_em      timestamptz not null default now(),
  fechado_por    text,
  fechado_em     timestamptz,
  obs            text
);
create index if not exists inventarios_filial on public.inventarios (filial, criado_em desc);
create table if not exists public.inventario_leituras (
  id             uuid primary key default gen_random_uuid(),
  inventario_id  uuid not null references public.inventarios(id) on delete cascade,
  bruto          text not null,
  gtin           text,
  lote           text,
  validade       date,
  serie          text,
  codigo         text,
  produto        text,
  qtd            numeric not null default 1,
  origem         text,
  usuario        text,
  criado_em      timestamptz not null default now()
);
create index if not exists inventario_leituras_inv on public.inventario_leituras (inventario_id);
create index if not exists inventario_leituras_gtin on public.inventario_leituras (gtin);
do $$
declare t text;
begin
  foreach t in array array['inventarios','inventario_leituras'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_write', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (not exists (select 1 from public.usuarios u where u.id::text = auth.uid()::text and u.role in (''pendente'',''recusado'')))
         with check (not exists (select 1 from public.usuarios u where u.id::text = auth.uid()::text and u.role in (''pendente'',''recusado'')))',
      t || '_write', t);
  end loop;
end $$;
-- leituras de outros aparelhos aparecem na hora
do $$ begin
  alter publication supabase_realtime add table public.inventario_leituras;
exception when others then null; end $$;
notify pgrst, 'reload schema';
