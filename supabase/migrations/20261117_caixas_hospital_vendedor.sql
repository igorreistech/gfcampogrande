-- Caixas/bags/sacolas: novas situações "No hospital" (fica no hospital/hemodinâmica sem NF) e "Com vendedor".
-- Rodar no SQL Editor de CADA projeto (Campo Grande e Cuiabá). Pode rodar mais de uma vez.
alter table public.caixas_bags drop constraint if exists caixas_bags_status_check;
alter table public.caixas_bags add constraint caixas_bags_status_check check (status in ('Disponível', 'Fora', 'Pendente', 'Consignado', 'No hospital', 'Com vendedor', 'Não localizada', 'Em limpeza', 'Esterilização', 'Manutenção', 'Baixada'));
notify pgrst, 'reload schema';
select 'ok' as caixas_hospital_vendedor;
