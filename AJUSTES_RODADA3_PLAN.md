# Plano Rodada 3 (mudancas estruturais)

Origem: review do usuario (documento "Ajustes do CRM"). Rodada 1 (bugs) e Rodada 2
(features medias) ja entregues. Aqui ficam os 3 itens que mexem em modelo de dados
e em fluxo de trabalho, por isso pedem planejamento e algumas decisoes do Gabriel
antes de codar.

---

## Item 11 - Reestruturar o Pipeline (etapas de pre-vendas / prospeccao)

### Situacao hoje
As colunas do pipeline sao os proprios status do lead (campo `resultado`):
Aguardando retorno, Follow-up, De molho, Reuniao agendada, Enviar proposta,
Proposta enviada, Fechado, Recusado, Sem interesse, Nao atende.
Nao existe a fase inicial de prospeccao/pre-vendas que ele sentiu falta.

### Proposta
Introduzir estagios de topo de funil antes de "Aguardando retorno". Sugestao a
validar com ele (e decisao do processo comercial dele, nao tecnica):
1. Lead novo (ainda nao trabalhado)
2. Prospeccao / cadencia ativa
3. Contato efetivo
4. Aguardando retorno
5. Follow-up
6. (segue o funil atual: De molho, Reuniao agendada, Enviar proposta, ...)

### Trabalho tecnico
- Confirmar se `resultado` e coluna `text` ou enum no Postgres. Se for text, nao
  precisa migracao (so constantes no app). Se for enum, migracao pra adicionar valores.
- Atualizar num lugar so de constantes: STATUSES, FUNNEL_STAGES, STAGE_PROBABILITY,
  cores de status, e as opcoes dos selects que repetem essa lista.
- Leads atuais mantem o status que ja tem; os novos estagios sao aditivos.

### Esforco: medio. Risco: baixo (aditivo). Bloqueio: definir a lista de estagios com o Gabriel.

---

## Item 7 - Checkbox de acompanhamento no hover (estilo planilha)

### O que ele pediu
Uma coluna ao lado do lead, que aparece ao passar o mouse, pra marcar rapidinho o
que ja fez (igual aos "Checkbox de Ligacoes Discadas / Contatos Efetivos" da
planilha antiga), some depois, principalmente em Follow-up e Pipeline.

### Proposta
Acao rapida no hover da linha do lead que, em 1 clique, registra a atividade e
incrementa o contador do dia. Conecta com o que ja fizemos na Rodada 2:
- "Liguei" -> +1 LD no diario do dia + atividade na timeline do lead
- "Falei" (contato efetivo) -> +1 CE no diario + atividade
- "FU feito" (ja existe no Follow-up) -> marca o proximo follow-up

Aparece so no hover (ja temos o utilitario `.hover-actions` no main.css) e some ao
tirar o mouse. Reaproveita o endpoint de diario (Feat 6) e o de atividades (Feat 8).

### Trabalho tecnico
- Componente de acoes rapidas reutilizavel na LeadRow (lista do Pipeline) e na
  FuSection (lista "Todos" do Follow-up).
- Chamar `useDiaryToday().bump()` e/ou o POST de atividade.
- Feedback visual curtinho (o contador do topo ja reflete via o composable).

### Esforco: medio. Risco: baixo. Bloqueio: alinhar exatamente o que cada checkbox marca (ligacao? CE? follow-up?).

---

## Item 10 - Campos personalizados

### O que ele pediu
Poder criar campos extras/adicionais no lead e escolher quais informacoes aparecem.

### Proposta (o item mais pesado da lista)
- Banco: tabela `custom_field_defs` por organizacao (nome, chave, tipo: texto/numero/
  data/selecao, opcoes) + uma coluna `custom_fields jsonb` na tabela `leads` pra
  guardar os valores. jsonb evita uma tabela de valores separada e e flexivel.
- Config: secao em Configuracoes pra criar/editar/remover definicoes de campo.
- Lead: o formulario de novo lead e o painel de detalhe renderizam os campos
  personalizados dinamicamente, lendo as definicoes da org.
- Migracao: criar a tabela de definicoes + a coluna jsonb + RLS por org.

### Riscos e cuidados
- Validacao dinamica (tipos por campo) no servidor.
- Nao misturar com os campos fixos atuais; tratar custom como bloco separado.
- Exportacao CSV e filtros podem querer incluir custom fields depois (fase 2).

### Esforco: alto. Risco: medio (mexe em schema, form, detalhe, config). Melhor fazer isolado, depois dos itens 11 e 7.

---

## Fora de escopo / a esclarecer com o Gabriel

- Item 13 (WhatsApp "em ingles"): e a interface do app WhatsApp Desktop dele, nao
  uma tela do CRM. O idioma e definido dentro do WhatsApp/Windows; o CRM nao
  controla isso. O que controlamos (texto da mensagem do wa.me) ja sai em portugues.

---

## Ordem sugerida da Rodada 3
1. Item 11 (pipeline) - destrava a visao do funil que ele mais reclamou. Depende so
   de decidir os estagios.
2. Item 7 (checkbox no hover) - rapido depois da Rodada 2, reaproveita LD e atividades.
3. Item 10 (campos personalizados) - isolado, por ser o maior e mais arriscado.
