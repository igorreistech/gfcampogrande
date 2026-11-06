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
  // senha provisória ainda não trocada: só a tela inicial do GF Hub pede a nova, então as outras páginas mandam para lá
  window.gfExigeTrocaSenha = function (user) {
    if (user && user.user_metadata && user.user_metadata.trocar_senha) { location.href = 'index.html'; return true; }
    return false;
  };
})();
