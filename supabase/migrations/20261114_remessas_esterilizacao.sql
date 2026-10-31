-- Remessas: novo status "Em esterilização" (tipo "Remessa em esterilização" é texto livre, não precisa mudar)
alter table public.remessas_volumes drop constraint if exists remessas_volumes_status_check;
alter table public.remessas_volumes add constraint remessas_volumes_status_check
  check (status in ('No cliente','Em esterilização','Retornou parcial','Retornou','Cancelada'));

-- Remessas já lançadas para a Bioesteril passam para esterilização
update public.remessas_volumes
   set tipo = 'Remessa em esterilização', status = 'Em esterilização', atualizado_em = now()
 where cliente ilike '%bioesteril%' and status = 'No cliente';

notify pgrst, 'reload schema';
