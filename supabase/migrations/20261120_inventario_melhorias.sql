-- Inventário (04/11/2026): justificativas dos faltantes, assinatura na tela, fotos de evidência, contagem cega,
-- recontagem e resumo para o histórico (coluna extra) + local de cada leitura (estoque).
-- Rodar no SQL Editor de CADA projeto (gfcampogrande e gfcuiaba). Pode rodar mais de uma vez.
alter table public.inventarios add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.inventario_leituras add column if not exists local text;
notify pgrst, 'reload schema';
