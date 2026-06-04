import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
      import { getFirestore, collection, onSnapshot, addDoc, setDoc, deleteDoc, doc, getDoc, getDocs, query, where, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
      import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
      import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

      const firebaseConfig = {
        apiKey: "AIzaSyCKQ0IFOO-8bQDqBN7oV1GTFbATmXI8MTI",
        authDomain: "gfcampogrande-3d886.firebaseapp.com",
        projectId: "gfcampogrande-3d886",
        storageBucket: "gfcampogrande-3d886.firebasestorage.app",
        messagingSenderId: "1089347107124",
        appId: "1:1089347107124:web:2cf047dff32b642c1ecd61"
      };

      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      enableIndexedDbPersistence(db).catch(()=>{});
      const auth = getAuth(app);
      window._fbAuth = auth;
      const COLL = "procedimentos_cg";

      window._fbDb = db;
      window._fbColl = COLL;
      window._fbModules = { collection, onSnapshot, addDoc, setDoc, deleteDoc, doc, getDoc, getDocs, query, where };
      const storage = getStorage(app);
      window._fbStorage = storage;
      window._fbStorageModules = { ref, uploadBytes, getDownloadURL };

      // ─── NOTIFICAÇÕES PUSH ───
      window._notifStatusAnterior = null; // null = primeira carga, não notifica

      async function solicitarPermissaoNotificacoes() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') window.showSyncToast && window.showSyncToast('🔔 Notificações ativadas');
        }
      }

      function notificarMudancaStatus(proc, statusAnterior) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        // Agendador só recebe notificações das próprias cirurgias
        const u = window._currentUser;
        if (u && u.role === 'agendador' && proc.cadastradoPor !== u.uid) return;
        const labels = {
          a_agendar:'Autorizado', andamento:'Em Procedimento', preparacao:'Em Separação',
          agendado:'Agendado', em_transito:'Em Trânsito', concluido:'Concluído', cancelado:'Cancelado',
          reagendado:'Reagendado', a_retirar:'Aguardando Retirada',
          urgencia:'URGÊNCIA', coleta_urgente:'Coleta Prioritária'
        };
        const de   = labels[statusAnterior] || statusAnterior;
        const para = labels[proc.status]    || proc.status;
        const pac  = proc.paciente || 'Paciente';
        const titulo = proc.status === 'urgencia' ? '🚨 URGÊNCIA — Monitor Cirúrgico' : '🔔 Monitor Cirúrgico';
        try {
          const n = new Notification(titulo, {
            body: `${pac}: ${de} → ${para}`,
            tag:  proc._docId,
            requireInteraction: proc.status === 'urgencia'
          });
          n.onclick = () => { window.focus(); n.close(); };
        } catch(e) { console.warn('Notificação:', e); }
      }

      // ─── AUTH ───
      window.doLogin = async function() {
        const email = document.getElementById('loginUser').value.trim();
        const pass  = document.getElementById('loginPass').value;
        const btn   = document.getElementById('loginBtn');
        const err   = document.getElementById('loginError');
        if (!email || !pass) { err.textContent = 'Preencha e-mail e senha.'; err.style.display = 'block'; return; }
        btn.disabled = true; btn.textContent = 'Entrando...'; err.style.display = 'none';
        try {
          await signInWithEmailAndPassword(auth, email, pass);
        } catch(e) {
          let msg = 'E-mail ou senha incorretos.';
          if (e.code === 'auth/invalid-email')          msg = 'E-mail inválido.';
          if (e.code === 'auth/too-many-requests')      msg = 'Muitas tentativas. Tente mais tarde.';
          if (e.code === 'auth/network-request-failed') msg = 'Erro de rede. Verifique sua conexão.';
          err.textContent = msg; err.style.display = 'block';
          document.getElementById('loginPass').value = '';
          const box = document.querySelector('.login-box');
          if (box) { box.style.transform='translateX(-8px)'; setTimeout(()=>{box.style.transform='translateX(8px)';},80); setTimeout(()=>{box.style.transform='translateX(-5px)';},160); setTimeout(()=>{box.style.transform='translateX(0)';},240); }
        } finally { btn.disabled = false; btn.textContent = 'Entrar'; }
      };

      window.doRegister = async function() {
        const nome   = document.getElementById('regNome').value.trim();
        const email  = document.getElementById('regEmail').value.trim();
        const pass   = document.getElementById('regPass').value;
        const pass2  = document.getElementById('regPass2').value;
        const codigo = (document.getElementById('regCodigo')?.value || '').trim();
        const btn    = document.getElementById('regBtn');
        const err    = document.getElementById('loginError');
        err.style.display = 'none';
        if (!nome)          { err.textContent = 'Informe seu nome.'; err.style.display = 'block'; return; }
        if (!email)         { err.textContent = 'Informe seu e-mail.'; err.style.display = 'block'; return; }
        if (pass.length < 6){ err.textContent = 'Senha deve ter ao menos 6 caracteres.'; err.style.display = 'block'; return; }
        if (pass !== pass2) { err.textContent = 'As senhas não coincidem.'; err.style.display = 'block'; return; }
        btn.disabled = true; btn.textContent = 'Criando conta...';
        try {
          let role = 'agendador';
          if (codigo) {
            const acessoSnap = await getDoc(doc(db, 'config', 'acesso'));
            if (acessoSnap.exists() && acessoSnap.data().codigo && acessoSnap.data().codigo === codigo) {
              role = 'admin';
            }
          }
          const cred = await createUserWithEmailAndPassword(auth, email, pass);
          await setDoc(doc(db, 'usuarios', cred.user.uid), { email: email.toLowerCase(), nome, role, uid: cred.user.uid });
        } catch(e) {
          let msg = 'Erro ao criar conta.';
          if (e.code === 'auth/email-already-in-use') msg = 'E-mail já cadastrado. Faça login.';
          if (e.code === 'auth/invalid-email')        msg = 'E-mail inválido.';
          if (e.code === 'auth/weak-password')        msg = 'Senha muito fraca (mínimo 6 caracteres).';
          err.textContent = msg; err.style.display = 'block';
        } finally { btn.disabled = false; btn.textContent = 'Criar conta'; }
      };

      window.doAdminLoadCodigo = async function() {
        try {
          const snap = await getDoc(doc(db, 'config', 'acesso'));
          const el = document.getElementById('admin-codigo');
          if (el && snap.exists()) el.value = snap.data().codigo || '';
        } catch(e) {}
      };
      window.doAdminSaveCodigo = async function() {
        const el = document.getElementById('admin-codigo');
        const codigo = (el?.value || '').trim();
        try {
          await setDoc(doc(db, 'config', 'acesso'), { codigo });
          if (el) { el.style.borderColor = '#87c396'; setTimeout(()=>{ el.style.borderColor=''; }, 1500); }
        } catch(e) { alert('Erro ao salvar: '+e.message); }
      };

      window.showRegister = function() {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('registerPanel').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
      };
      window.showLogin = function() {
        document.getElementById('loginPanel').style.display = 'block';
        document.getElementById('registerPanel').style.display = 'none';
        document.getElementById('resetPanel').style.display = 'none';
        document.getElementById('loginError').style.display = 'none';
      };
      window.showResetPassword = function() {
        document.getElementById('loginPanel').style.display = 'none';
        document.getElementById('registerPanel').style.display = 'none';
        document.getElementById('resetPanel').style.display = 'block';
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('resetSuccessMsg').style.display = 'none';
        const emailField = document.getElementById('loginUser');
        if (emailField && emailField.value) document.getElementById('resetEmail').value = emailField.value;
      };
      window.doResetPassword = async function() {
        const email = (document.getElementById('resetEmail').value || '').trim();
        const err = document.getElementById('loginError');
        const btn = document.getElementById('resetBtn');
        if (!email) { err.textContent = 'Informe seu e-mail.'; err.style.display = 'block'; return; }
        btn.disabled = true; btn.textContent = 'Enviando…';
        try {
          await sendPasswordResetEmail(auth, email);
          err.style.display = 'none';
          document.getElementById('resetSuccessMsg').style.display = 'block';
        } catch(e) {
          let msg = 'Erro ao enviar e-mail.';
          if (e.code === 'auth/user-not-found') msg = 'E-mail não encontrado.';
          else if (e.code === 'auth/invalid-email') msg = 'E-mail inválido.';
          err.textContent = msg; err.style.display = 'block';
        } finally {
          btn.disabled = false; btn.textContent = 'Enviar link';
        }
      };

      async function _loginOAuth(provider, btnId) {
        const btn = document.getElementById(btnId);
        const err = document.getElementById('loginError');
        if (btn) btn.disabled = true;
        if (err) err.style.display = 'none';
        try {
          await signInWithPopup(auth, provider);
        } catch(e) {
          if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
            if (btn) btn.disabled = false;
            return;
          }
          if (e.code === 'auth/popup-blocked') {
            // Fallback: redireciona em vez de popup (útil em mobile)
            try { await signInWithRedirect(auth, provider); return; } catch(e2) {}
          }
          let msg = 'Erro ao entrar. ';
          if (e.code === 'auth/unauthorized-domain') msg = 'Domínio não autorizado no Firebase. Adicione este domínio nos domínios autorizados do Firebase Console.';
          else if (e.code === 'auth/network-request-failed') msg = 'Erro de rede. Verifique sua conexão.';
          else msg = (e.message || e.code || 'Erro desconhecido.');
          if (err) { err.textContent = msg; err.style.display = 'block'; }
        } finally {
          if (btn) btn.disabled = false;
        }
      }
      window.doLoginGoogle = () => _loginOAuth(new GoogleAuthProvider(), 'loginBtnGoogle');

      // Captura resultado de redirect (caso popup tenha falhado e usado redirect)
      getRedirectResult(auth).catch(() => {});

      window.doLogout = async function() {
        if (confirm('Deseja sair do sistema?')) {
          try { await signOut(auth); } catch(e) {}
        }
      };

      window.renderAgendadorLista = function() {
        if (!window._currentUser || window._currentUser.role !== 'agendador') return;
        const listaEl = document.getElementById('agendador-lista');
        if (!listaEl) return;
        const dados = window.procedimentos || [];
        const meus = dados.filter(p => p.cadastradoPor === window._currentUser.uid);
        const labels = { agendado:'Agendado', preparacao:'Em Separação', em_transito:'Em Trânsito', andamento:'Em Procedimento', concluido:'Concluído', a_agendar:'Autorizado', a_retirar:'Aguardando Retirada', cancelado:'Cancelado' };
        listaEl.innerHTML = meus.length === 0
          ? '<div class="agendador-empty">Nenhuma cirurgia cadastrada ainda.</div>'
          : `<table class="agendador-table"><thead><tr><th>Paciente</th><th>Hospital</th><th>Cirurgião</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>${
              meus.map(p => `<tr>
                <td>${p.paciente||'-'}</td>
                <td>${p.hospital||'-'}</td>
                <td>${p.medico||'-'}</td>
                <td>${p.data||'-'}</td>
                <td><span class="agendador-status status-${p.status||''}">${labels[p.status]||p.status||'-'}</span></td>
                <td style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                  ${p.status === 'a_retirar' ? `<button class="agendador-btn-retirada" onclick="confirmarRetiradaAgendador('${p._docId}')">📦 Confirmar Retirada</button>` : `<button class="agendador-btn-edit" onclick="editProc('${p._docId}')">✏ Editar</button>`}
                  <button class="agendador-btn-del" onclick="deleteProc('${p._docId}')">🗑</button>
                </td>
              </tr>`).join('')
            }</tbody></table>`;
      };

      window.confirmarRetiradaAgendador = async function(docId) {
        const proc = (window.procedimentos||[]).find(p => p._docId === docId);
        if (!proc) return;
        const nome = proc.paciente || proc.hospital || 'este registro';
        const ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px);';
        ov.innerHTML = `<div style="background:var(--surface,#fff);border:1px solid var(--border);border-top:3px solid #059669;border-radius:18px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);font-family:'Inter',sans-serif;">
          <div style="font-size:2rem;text-align:center;margin-bottom:10px;">📦</div>
          <div style="font-weight:700;font-size:1rem;color:#111;text-align:center;margin-bottom:6px;">Confirmar Retirada?</div>
          <div style="color:#666;font-size:0.83rem;text-align:center;margin-bottom:22px;font-family:var(--mono);">${nome}</div>
          <div style="display:flex;gap:10px;">
            <button id="btnCancelRet" style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--border);background:transparent;color:#555;font-family:var(--mono);font-size:0.8rem;font-weight:700;cursor:pointer;">Cancelar</button>
            <button id="btnConfirmRet" style="flex:1;padding:11px;border-radius:10px;border:none;background:#059669;color:#fff;font-family:var(--mono);font-size:0.8rem;font-weight:700;cursor:pointer;">✓ Confirmar</button>
          </div>
        </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#btnCancelRet').onclick = () => ov.remove();
        ov.onclick = e => { if (e.target === ov) ov.remove(); };
        ov.querySelector('#btnConfirmRet').onclick = async () => {
          ov.remove();
          const idx = window.procedimentos.findIndex(p => p._docId === docId);
          if (idx !== -1) window.procedimentos[idx].status = 'concluido';
          window.renderAgendadorLista();
          const { deleteDoc: _d, doc: docFn, setDoc: sd } = window._fbModules;
          try { await sd(docFn(window._fbDb, window._fbColl, docId), { ...window.procedimentos[idx] }); }
          catch(e) { alert('Erro ao confirmar: ' + e.message); }
        };
      };

      // Retry renderAgendadorLista após login para garantir que dados do Firestore já chegaram
      window._renderAgendadorRetry = function() {
        const tentativas = [400, 1000, 2000, 4000];
        tentativas.forEach(t => setTimeout(() => window.renderAgendadorLista && window.renderAgendadorLista(), t));
      };

      // Gerenciamento de usuários (admin)
      window.doAdminLoadUsers = async function() {
        const lista = document.getElementById('admin-users-list');
        if (!lista) return;
        lista.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:12px 0;">Carregando...</div>';
        try {
          const snap = await getDocs(collection(db, 'usuarios'));
          if (snap.empty) { lista.innerHTML = '<div style="color:var(--text-dim);font-size:0.85rem;padding:12px 0;">Nenhum usuário cadastrado.</div>'; return; }
          lista.innerHTML = snap.docs.map(d => {
            const u = d.data();
            const isMe = u.email === (window._currentUser?.email||'').toLowerCase();
            return `<div class="admin-user-row">
              <div><div class="admin-user-name">${u.nome||u.email}</div><div class="admin-user-email">${u.email}</div></div>
              <span class="admin-role-badge role-${u.role}">${u.role==='admin'?'Admin':'Agendador'}</span>
              <button class="admin-btn-del" onclick="doAdminDeleteUser('${d.id}')" ${isMe?'disabled title="Não pode remover a si mesmo"':''}>🗑 Excluir</button>
            </div>`;
          }).join('');
        } catch(e) { lista.innerHTML = '<div style="color:var(--red);font-size:0.85rem;">Erro ao carregar.</div>'; }
      };
      window.doAdminAddUser = async function() {
        const emailEl = document.getElementById('admin-new-email');
        const roleEl  = document.getElementById('admin-new-role');
        const nomeEl  = document.getElementById('admin-new-nome');
        const email   = (emailEl?.value||'').trim().toLowerCase();
        const role    = roleEl?.value || 'agendador';
        const nome    = (nomeEl?.value||'').trim();
        if (!email) { emailEl?.focus(); return; }
        try {
          await setDoc(doc(db, 'usuarios', email.replace(/[^a-z0-9]/g,'_')), { email, role, nome: nome||email });
          if (emailEl) emailEl.value = '';
          if (nomeEl)  nomeEl.value  = '';
          doAdminLoadUsers();
        } catch(e) { alert('Erro ao salvar: '+e.message); }
      };
      window.doAdminDeleteUser = async function(docId) {
        if (!confirm('Remover este usuário?')) return;
        try {
          const { deleteDoc: dd, doc: docFn } = window._fbModules;
          await dd(docFn(db, 'usuarios', docId));
          doAdminLoadUsers();
        } catch(e) { alert('Erro: '+e.message); }
      };
      window.openAdminModal = function() {
        const m = document.getElementById('adminModal');
        if (m) { m.style.display = 'flex'; doAdminLoadUsers(); doAdminLoadCodigo(); }
      };
      window.closeAdminModal = function() {
        const m = document.getElementById('adminModal');
        if (m) m.style.display = 'none';
      };

      onAuthStateChanged(auth, (user) => {
        async function aplicarAuth() {
          const overlay = document.getElementById('loginOverlay');
          if (!overlay) { setTimeout(aplicarAuth, 50); return; }

          const ADMIN_EMAILS_FIXOS = ['comercial@gfmedical.net', 'comercialmt@gfmedical.net'];

          if (user) {
            const emailLower = (user.email || '').toLowerCase();
            const isAdminFixo = ADMIN_EMAILS_FIXOS.includes(emailLower);
            let perfil = null;
            if (isAdminFixo) {
              perfil = { email: emailLower, nome: user.displayName || user.email, role: 'admin', uid: user.uid };
              try { await setDoc(doc(db, 'usuarios', user.uid), { ...perfil }); } catch(e) {}
            } else {
              try {
                const snap = await getDoc(doc(db, 'usuarios', user.uid));
                if (snap.exists()) {
                  perfil = snap.data();
                } else {
                  // Novo usuário via OAuth: auto-cadastra como agendador
                  perfil = { email: emailLower, nome: user.displayName || user.email, role: 'agendador', uid: user.uid };
                  await setDoc(doc(db, 'usuarios', user.uid), perfil);
                }
              } catch(e) { perfil = null; }
            }

            // Garante que sempre há um perfil válido (somente para não-admins)
            if (!perfil) {
              perfil = { email: emailLower, nome: user.displayName || user.email, role: 'agendador', uid: user.uid };
              try { await setDoc(doc(db, 'usuarios', user.uid), perfil, { merge: true }); } catch(e2) {}
            }

            // Segurança final: emails fixos SEMPRE são admin, nunca agendador
            if (isAdminFixo) perfil.role = 'admin';

            window._currentUser = { uid: user.uid, email: user.email, nome: perfil.nome || user.displayName || user.email, role: perfil.role };
            overlay.classList.add('hidden');
            const logoutEl  = document.getElementById('logoutBtn');
            const adminBtn  = document.getElementById('btn-gerenciar-usuarios');
            const agendView = document.getElementById('agendadorView');
            const mainCont  = document.querySelector('.container');
            if (logoutEl) logoutEl.style.display = 'block';

            const fabGroup = document.querySelector('.fab-group');
            if (perfil.role === 'agendador') {
              if (mainCont)  mainCont.style.display  = 'none';
              if (adminBtn)  adminBtn.style.display  = 'none';
              if (fabGroup)  fabGroup.style.display  = 'none';
              if (agendView) {
                agendView.style.display = 'flex';
                const nomeEl = document.getElementById('agendador-nome');
                if (nomeEl) nomeEl.textContent = (window._currentUser.nome||'').split(' ')[0] || user.email;
              }
              solicitarPermissaoNotificacoes();
              // Re-renderiza com retry para garantir que dados do Firestore já chegaram
              window._renderAgendadorRetry && window._renderAgendadorRetry();
            } else {
              if (mainCont)  mainCont.style.display  = '';
              if (adminBtn)  adminBtn.style.display  = '';
              if (fabGroup)  fabGroup.style.display  = '';
              if (agendView) agendView.style.display = 'none';
              solicitarPermissaoNotificacoes();
            }
          } else {
            window._currentUser = null;
            overlay.classList.remove('hidden');
            const logoutEl  = document.getElementById('logoutBtn');
            const adminBtn  = document.getElementById('btn-gerenciar-usuarios');
            const agendView = document.getElementById('agendadorView');
            const mainCont  = document.querySelector('.container');
            if (logoutEl)  logoutEl.style.display  = 'none';
            if (adminBtn)  adminBtn.style.display  = 'none';
            if (agendView) agendView.style.display = 'none';
            if (mainCont)  mainCont.style.display  = '';
          }
        }
        aplicarAuth();
      });

      // Garante que config/acesso existe com código padrão na primeira execução
      (async () => {
        try {
          const acessoRef = doc(db, 'config', 'acesso');
          const acessoSnap = await getDoc(acessoRef);
          if (!acessoSnap.exists()) {
            await setDoc(acessoRef, { codigo: '140424' });
          }
        } catch(e) {}
      })();

      window.addEventListener('DOMContentLoaded', () => {
        const { collection: col, onSnapshot: snap } = window._fbModules;
        snap(col(db, COLL), (snapshot) => {
          const dados = snapshot.docs.map(d => ({ _docId: d.id, ...d.data() }));

          // ─── Detectar mudanças de status e notificar ───
          if (window._notifStatusAnterior === null) {
            window._notifStatusAnterior = {};
            dados.forEach(p => { window._notifStatusAnterior[p._docId] = p.status; });
          } else {
            dados.forEach(p => {
              const prev = window._notifStatusAnterior[p._docId];
              if (prev !== undefined && prev !== p.status) notificarMudancaStatus(p, prev);
              window._notifStatusAnterior[p._docId] = p.status;
            });
            const ids = new Set(dados.map(p => p._docId));
            Object.keys(window._notifStatusAnterior).forEach(id => { if (!ids.has(id)) delete window._notifStatusAnterior[id]; });
          }

          // Aguarda o script principal E o DOM estarem prontos
          function aplicar() {
            if (!window.renderCards) { setTimeout(aplicar, 50); return; }
            if (!document.getElementById('procTable')) { setTimeout(aplicar, 50); return; }
            try {
                            // Auto-status por data de cirurgia:
              // - Agendado + véspera (D-1) → Em Separação (automático)
              // - Em Separação ou Em Trânsito + hoje é a cirurgia → pede confirmação para Em Procedimento
              const hoje = new Date().toISOString().split('T')[0];
              const amanhaD = new Date(); amanhaD.setDate(amanhaD.getDate() + 1);
              const amanha = amanhaD.getFullYear() + '-' + String(amanhaD.getMonth()+1).padStart(2,'0') + '-' + String(amanhaD.getDate()).padStart(2,'0');
              function autoTransitar(p, statusAnterior) {
                p.autoTransicaoEm = new Date().toISOString();
                try { notificarMudancaStatus(p, statusAnterior); } catch(e3) {}
                try {
                  const { setDoc: sd, doc: docFn } = window._fbModules;
                  if (p._docId) sd(docFn(db, COLL, p._docId), { ...p });
                } catch(e2) { console.warn('Auto-status:', e2); }
              }

              if (!window._confirmacaoInicioFeita) window._confirmacaoInicioFeita = new Set();

              const paraPromover = [];
              dados.forEach(p => {
                // Agendado + véspera (D-1) → Em Separação (silencioso)
                if (p.status === 'agendado' && p.data && p.data === amanha) {
                  p.status = 'preparacao';
                  autoTransitar(p, 'agendado');
                }
                // Em Separação ou Em Trânsito + dia da cirurgia → pede confirmação
                else if ((p.status === 'preparacao' || p.status === 'em_transito') && p.data && p.data === hoje
                         && !window._confirmacaoInicioFeita.has(p._docId)) {
                  paraPromover.push(p);
                }
              });

              if (paraPromover.length > 0) {
                setTimeout(() => confirmarInicioCircurgia(paraPromover, db, COLL), 800);
              }
              window.procedimentos.splice(0, window.procedimentos.length, ...dados);
              window.nextId = window.procedimentos.length > 0 ? Math.max(...window.procedimentos.map(p => p.id || 0)) + 1 : 1;

              // Renderizar lista do agendador (só para role agendador)
              window.renderAgendadorLista();


              window.renderCards();
              window.renderTable && window.renderTable();
              window.updateStats();
              window.updatePeriodResult();
              window.updateAlerts();
              window.showSyncToast('🔄 Sincronizado');
            } catch(e) { console.error('Erro ao aplicar dados:', e); }
          }
          aplicar();
        });
      });
    
