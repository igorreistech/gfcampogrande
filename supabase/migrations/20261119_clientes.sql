-- Cadastro de clientes do ERP (cadcliente): código, nome e CNPJ/CPF.
-- Fica no banco (só para usuários logados e aprovados) — não vai no HTML público.
create table if not exists public.clientes (
  codigo        integer primary key,
  nome          text not null,
  doc           text,
  atualizado_em timestamptz not null default now()
);
alter table public.clientes enable row level security;
drop policy if exists clientes_ler on public.clientes;
drop policy if exists clientes_gravar on public.clientes;
create policy clientes_ler on public.clientes for select to authenticated
  using (exists (select 1 from public.usuarios u where u.id::text = auth.uid()::text and coalesce(u.role, '') not in ('pendente', 'recusado')));
create policy clientes_gravar on public.clientes for all to authenticated
  using (exists (select 1 from public.usuarios u where u.id::text = auth.uid()::text and u.role in ('admin', 'operador')))
  with check (exists (select 1 from public.usuarios u where u.id::text = auth.uid()::text and u.role in ('admin', 'operador')));
notify pgrst, 'reload schema';
