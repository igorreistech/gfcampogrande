// Edge Function: logins individuais por nome de usuário, chamada pela tela "Gerenciar Usuários".
// Criar conta, trocar senha de outra pessoa e bloquear exigem a service_role, que nunca pode rodar no navegador;
// por isso a function confere primeiro se quem chama é um admin.
//
// Ações (corpo JSON):
//   { acao: 'criar', email, nome, role, senha }  → conta nova; a pessoa troca a senha no primeiro acesso
//   { acao: 'senha', email, senha }              → nova senha provisória
//   { acao: 'bloquear', email }                  → não entra mais e o perfil fica "recusado"
//   { acao: 'desbloquear', email }               → libera a entrada (o perfil é definido pelo admin na tela)
//
// Deploy: supabase functions deploy gerenciar-login --project-ref <ref>
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas pelo Supabase.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const resp = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const ROLES = ['admin', 'operador', 'agendador', 'visualizacao'];

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return resp({ error: 'Método não permitido.' }, 405);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return resp({ error: 'Não autenticado.' }, 401);

  const admin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const { data: { user: caller }, error: errCaller } = await admin.auth.getUser(token);
  if (errCaller || !caller) return resp({ error: 'Sessão inválida.' }, 401);
  const { data: perfil } = await admin.from('usuarios').select('role').eq('id', caller.id).maybeSingle();
  if (perfil?.role !== 'admin') return resp({ error: 'Apenas administradores podem gerenciar logins.' }, 403);

  let body;
  try { body = await req.json(); } catch { return resp({ error: 'Corpo da requisição inválido.' }, 400); }
  const acao = body.acao, email = String(body.email || '').trim().toLowerCase(), senha = typeof body.senha === 'string' ? body.senha : '';
  if (!email) return resp({ error: 'Informe o usuário.' }, 400);
  if ((acao === 'criar' || acao === 'senha') && senha.length < 8) return resp({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, 400);

  if (acao === 'criar') {
    const nome = String(body.nome || '').trim() || email;
    const role = ROLES.includes(body.role) ? body.role : 'agendador';
    const { data: criado, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome, trocar_senha: true } });
    if (error) return resp({ error: /registered|exists/i.test(error.message) ? 'Esse usuário já existe.' : error.message }, 400);
    const { error: errPerfil } = await admin.from('usuarios').upsert({ id: criado.user.id, email, nome, role });
    if (errPerfil) { await admin.auth.admin.deleteUser(criado.user.id); return resp({ error: errPerfil.message }, 400); }
    return resp({ ok: true, id: criado.user.id });
  }

  // as demais ações agem sobre quem já tem perfil
  const { data: alvo } = await admin.from('usuarios').select('id').eq('email', email).maybeSingle();
  if (!alvo) return resp({ error: 'Usuário não encontrado nesta unidade.' }, 404);
  const { data: { user: conta }, error: errConta } = await admin.auth.admin.getUserById(alvo.id);
  if (errConta || !conta) return resp({ error: 'Conta de acesso não encontrada.' }, 404);

  if (acao === 'senha') {
    const { error } = await admin.auth.admin.updateUserById(alvo.id, { password: senha, user_metadata: { ...conta.user_metadata, trocar_senha: true } });
    return error ? resp({ error: error.message }, 400) : resp({ ok: true });
  }
  if (acao === 'bloquear' || acao === 'desbloquear') {
    if (alvo.id === caller.id) return resp({ error: 'Você não pode bloquear a si mesmo.' }, 400);
    const { error } = await admin.auth.admin.updateUserById(alvo.id, { ban_duration: acao === 'bloquear' ? '876000h' : 'none' });
    if (error) return resp({ error: error.message }, 400);
    if (acao === 'bloquear') await admin.from('usuarios').update({ role: 'recusado' }).eq('id', alvo.id);
    return resp({ ok: true });
  }
  return resp({ error: 'Ação desconhecida.' }, 400);
});
