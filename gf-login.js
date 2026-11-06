// Login por nome de usuário: "igor.reis" entra com a conta interna igor.reis@login.gfmedical.net
// (esse endereço não recebe e-mail; quem esqueceu a senha pede ao administrador). Quem digita um e-mail entra como sempre.
// É o mesmo arquivo nos sites e vale para todas as páginas com login.
(function () {
  var DOMINIO = 'login.gfmedical.net';
  window.GF_LOGIN_DOMINIO = DOMINIO;
  window.gfLoginEmail = function (txt) {
    var s = String(txt || '').trim().toLowerCase();
    return !s || s.indexOf('@') >= 0 ? s : s + '@' + DOMINIO;
  };
  window.gfLoginEhUsuario = function (txt) {
    var s = String(txt || '').trim().toLowerCase();
    return !!s && (s.indexOf('@') < 0 || s.slice(-DOMINIO.length - 1) === '@' + DOMINIO);
  };
  // nome completo: nunca o nome de usuário. "igor.reis", e-mail ou uma palavra só não contam como nome completo
  window.gfNomeBom = function (nome, email) {
    var n = String(nome || '').trim();
    if (!n || n.indexOf('@') >= 0 || !/\s/.test(n)) return false;
    return n.toLowerCase() !== String(email || '').split('@')[0].toLowerCase();
  };
  window.gfNomeDe = function (user) {
    var e = (user && user.email) || '', m = (user && user.user_metadata) || {}, l = [window._gfNomePerfil, m.nome, m.full_name, m.name];
    for (var i = 0; i < l.length; i++) if (window.gfNomeBom(l[i], e)) return String(l[i]).trim();
    return e.split('@')[0];
  };
  // registros antigos gravados com "igor.reis" ou o e-mail: mostra o nome completo do cadastro
  window._gfNomes = new Map();
  window.gfCarregarNomes = function (cliente, depois) {
    cliente.from('usuarios').select('email,nome').then(function (r) {
      (r.data || []).forEach(function (p) {
        if (!p.email || !window.gfNomeBom(p.nome, p.email)) return;
        var e = String(p.email).toLowerCase(); window._gfNomes.set(e, p.nome); window._gfNomes.set(e.split('@')[0], p.nome);
      });
      if (depois) depois();
    }, function () {});
  };
  window.gfNomeDoLogin = function (txt) {
    var t = String(txt || '').trim(); return window._gfNomes.get(t.toLowerCase()) || t;
  };
  // senha provisória ainda não trocada: só a tela inicial do GF Hub pede a nova, então as outras páginas mandam para lá
  window.gfExigeTrocaSenha = function (user) {
    if (user && user.user_metadata && user.user_metadata.trocar_senha) { location.href = 'index.html'; return true; }
    return false;
  };
})();
