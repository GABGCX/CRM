-- Etapas de pre-vendas no inicio do pipeline: Novo, Prospeccao, Qualificacao.
-- Atualiza o CHECK do campo resultado pra aceitar os novos status.
-- Leads existentes mantem o status atual; os novos status sao aditivos.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_resultado_check;

ALTER TABLE leads ADD CONSTRAINT leads_resultado_check CHECK (resultado IN (
  'Novo','Prospecção','Qualificação',
  'Aguardando retorno','Follow-up','De molho','Reunião agendada',
  'Enviar proposta','Proposta enviada','Fechado','Recusado',
  'Sem interesse','Não atende'
));
