<template>
  <div>
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:18px">
      <div>
        <div class="page-title">Pipeline</div>
        <div class="page-sub">{{ totalLeads }} leads · {{ activeLeads.length }} ativos</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn" @click="exportCSV">
          <i class="ti ti-download" aria-hidden="true"></i> CSV
        </button>
        <button class="btn" @click="showImport = true">Importar CSV</button>
        <button class="btn btn-primary" @click="showModal = true">+ Novo lead</button>
      </div>
    </div>

    <!-- Resumo de valor do pipeline -->
    <div v-if="pipelineValue > 0" class="pipe-summary">
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Valor em pipeline</span>
        <span class="pipe-summary-value">R$ {{ fmtMoney(pipelineValue) }}</span>
        <span class="pipe-summary-hint">{{ leadsWithValue.length }} leads com valor</span>
      </div>
      <div class="pipe-summary-divider"></div>
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Previsão ponderada</span>
        <span class="pipe-summary-value" style="color:var(--ok)">R$ {{ fmtMoney(Math.round(weightedForecast)) }}</span>
        <span class="pipe-summary-hint">por probabilidade de estágio</span>
      </div>
      <div class="pipe-summary-divider"></div>
      <div class="pipe-summary-item">
        <span class="pipe-summary-label">Ticket médio aberto</span>
        <span class="pipe-summary-value">R$ {{ fmtMoney(avgTicket) }}</span>
        <span class="pipe-summary-hint">média dos leads ativos</span>
      </div>
    </div>

    <!-- Visualizacao (primaria) + filtros (secundarios) -->
    <div class="pipe-bar">
      <div class="pipe-views">
        <button class="pipe-view" :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>
          Kanban
        </button>
        <button class="pipe-view" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Lista
        </button>
      </div>
      <div class="pipe-filters">
        <input v-model="searchQ" class="pipe-search" :placeholder="viewMode === 'kanban' ? 'Filtrar cards...' : 'Buscar lead...'" />
        <select v-if="tags.length" v-model="filterTag" class="pipe-filter-select" title="Filtrar por etiqueta">
          <option value="">Todas etiquetas</option>
          <option v-for="t in tags" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select v-model="filterCreated" class="pipe-filter-select" title="Filtrar por data de criação">
          <option value="">Qualquer criação</option>
          <option value="7">Criados: 7 dias</option>
          <option value="30">Criados: 30 dias</option>
          <option value="month">Criados: este mês</option>
        </select>
        <button class="pipe-toggle" :class="{ active: filterOverdue }"
          @click="filterOverdue = !filterOverdue" title="Apenas leads com retorno atrasado">
          Atrasados
        </button>
        <select v-if="viewMode === 'list'" v-model="filterStatus" class="pipe-filter-select" title="Filtrar por status">
          <option value="Todos">Todos os status ({{ totalLeads }})</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }} ({{ countByStatus[s] || 0 }})</option>
        </select>
        <select v-if="viewMode === 'list'" v-model="sortBy" class="pipe-filter-select" title="Ordenar">
          <option value="created_at">Mais recentes</option>
          <option value="data_retorno">Retorno próximo</option>
          <option value="fu_done">Menos follow-ups</option>
          <option value="score">Maior score</option>
        </select>
        <UiCardCustomizer />
      </div>
    </div>

    <!-- Kanban view -->
    <UiKanbanBoard
      v-if="viewMode === 'kanban'"
      :leads="filteredForKanban"
      :pending="pending"
      :prefs="cardPrefs"
      @select="openDetail"
      @status-change="onKanbanStatusChange"
    />

    <!-- List view -->
    <template v-else>
      <div v-if="pending" style="display:flex;flex-direction:column;gap:6px">
        <div v-for="i in 5" :key="i"
          style="height:66px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite" />
      </div>

      <UiEmptyLeads v-else-if="!filtered.length && filterStatus === 'Todos' && !searchQ" @create="showModal = true" />

      <div v-else-if="!filtered.length" style="text-align:center;padding:36px;color:var(--text-3);font-size:13px">
        Nenhum lead encontrado.
      </div>

      <div v-else class="lead-list">
        <div
          v-for="l in filtered" :key="l.id"
          @click="selectLead(l)"
          class="lead-row"
          :class="{ 'lead-row--selected': selectedId === l.id }">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:7px">
            <div style="min-width:0;flex:1">
              <div style="font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                {{ l.decisor || 'Sem nome' }}
              </div>
              <div v-if="cardPrefs.company" style="display:flex;align-items:center;gap:6px">
                <span style="font-size:12px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                  {{ l.negocio || '' }}
                </span>
                <span v-if="l.fonte && FONTE_LABEL[l.fonte]"
                  style="font-size:10px;color:var(--text-3);background:var(--bg-subtle);border-radius:4px;padding:1px 5px;white-space:nowrap;flex-shrink:0">
                  {{ FONTE_LABEL[l.fonte] }}
                </span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;margin-left:8px">
              <span v-if="isVencido(l)" style="font-size:10px;color:#dc2626;font-weight:600">vencido</span>
              <UiScorePill v-if="cardPrefs.score" :lead="l" />
              <UiStatusTag :status="l.resultado" />
            </div>
          </div>
          <div v-if="cardPrefs.tags && leadTags(l).length" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:7px">
            <UiTagChip v-for="t in leadTags(l)" :key="t.id" :tag="t" />
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div v-if="cardPrefs.fu" style="display:flex;gap:2px;align-items:center">
              <div v-for="fu in sortedFU(l.followups)" :key="fu.attempt_index"
                class="fu-dot" :class="fu.completed_at ? 'fu-dot-done' : 'fu-dot-todo'" />
            </div>
            <span v-else></span>
            <div style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:8px">
              <UiLeadQuickActions class="lead-row-qa" :lead="l" @fu="handleToggleFU(l.id, fuDone(l))" />
              <UiMoneyPill v-if="cardPrefs.value" :value="l.valor_estimado" compact />
              <span v-if="cardPrefs.fu">{{ fuDone(l) }}/10</span>
              <span>{{ daysIn(l.created_at) }}d</span>
            </div>
          </div>
        </div>

        <div v-if="hasMore" style="padding:12px 0;text-align:center">
          <button class="btn" :disabled="loadingMore" @click="loadMore">
            {{ loadingMore ? 'Carregando...' : `Carregar mais (${totalLeads - (leads?.length ?? 0)} restantes)` }}
          </button>
        </div>
      </div>
    </template>

    <!-- Detail drawer (slide-over) -->
    <Transition name="drawer">
      <div v-if="selectedLead" class="drawer-backdrop" @click.self="confirmClose">
        <aside class="drawer">
          <div class="drawer-head">
            <div style="min-width:0;flex:1">
              <div class="drawer-title-row">
                <span class="drawer-title">{{ selectedLead.decisor }}</span>
                <UiScorePill :lead="selectedLead" prefix="Score" />
              </div>
              <div class="drawer-sub">{{ selectedLead.negocio }} · {{ daysIn(selectedLead.created_at) }} dias no funil</div>
              <div v-if="selectedLead.motivo_perda" style="margin-top:6px">
                <span style="font-size:11px;color:#dc2626;background:var(--bad-bg);border:1px solid var(--bad-bd);border-radius:4px;padding:2px 7px;font-weight:500">
                  Perda: {{ selectedLead.motivo_perda }}
                </span>
              </div>
            </div>
            <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
              <span v-if="hasUnsavedChanges" style="font-size:11px;color:#d97706;font-weight:500">Não salvo</span>
              <button class="btn btn-danger" @click="removeLead(selectedLead.id)" style="padding:5px 8px">
                <i class="ti ti-trash" aria-hidden="true"></i>
              </button>
              <button class="btn" @click="confirmClose" style="padding:5px 10px">X</button>
            </div>
          </div>
          <div class="drawer-body">

          <!-- Etiquetas -->
          <div style="margin-bottom:14px">
            <div class="input-label" style="margin-bottom:6px">Etiquetas</div>
            <UiTagPicker :model-value="editForm.tag_ids || []" @update:model-value="onTagsChange" />
          </div>

          <!-- Funnel progress -->
          <div style="display:flex;align-items:center;margin-bottom:16px;background:var(--bg-subtle);border-radius:10px;padding:10px 12px">
            <template v-for="(stage, i) in FUNNEL_STAGES" :key="stage.key">
              <div style="flex:1;text-align:center;min-width:0">
                <div style="width:9px;height:9px;border-radius:50%;margin:0 auto 4px"
                  :style="{ background: funnelStageColor(selectedLead.resultado, i) }" />
                <div style="font-size:9px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"
                  :style="{ color: funnelStageColor(selectedLead.resultado, i) }">
                  {{ stage.label }}
                </div>
              </div>
              <div v-if="i < FUNNEL_STAGES.length - 1"
                style="width:16px;height:2px;flex-shrink:0"
                :style="{ background: funnelStagePassed(selectedLead.resultado, i) ? '#0f62fe' : 'var(--border)' }" />
            </template>
          </div>

          <!-- Fields -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div v-for="f in detailFields" :key="f.key"
              :style="{ gridColumn: f.wide ? 'span 2' : 'span 1' }">
              <div class="input-label" style="margin-bottom:4px">{{ f.label }}</div>
              <input v-if="f.type !== 'select' && f.type !== 'textarea'"
                :type="f.type || 'text'" v-model="editForm[f.key]"
                @input="hasUnsavedChanges = true" />
              <select v-else-if="f.type === 'select'" v-model="editForm[f.key]" @change="onStatusChange">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
              <textarea v-else v-model="editForm[f.key]" rows="2" @input="hasUnsavedChanges = true" />
            </div>
            <div style="grid-column:span 2;display:flex;align-items:center;gap:7px">
              <input type="checkbox" v-model="editForm.reuniao_agendada" id="reun" @change="hasUnsavedChanges = true" />
              <label for="reun" class="input-label" style="cursor:pointer">Reunião agendada</label>
            </div>

            <!-- Campos personalizados -->
            <template v-if="customDefs.length && editForm.custom_fields">
              <div v-for="cf in customDefs" :key="cf.id" style="grid-column:span 2">
                <div class="input-label" style="margin-bottom:4px">{{ cf.label }}</div>
                <select v-if="cf.field_type === 'select'" v-model="editForm.custom_fields[cf.key]" @change="hasUnsavedChanges = true">
                  <option value="">--</option>
                  <option v-for="o in (cf.options || [])" :key="o" :value="o">{{ o }}</option>
                </select>
                <input v-else
                  :type="cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'"
                  v-model="editForm.custom_fields[cf.key]" @input="hasUnsavedChanges = true" />
              </div>
            </template>
          </div>

          <button class="btn btn-primary" :disabled="detailSaving" @click="saveLead"
            style="width:100%;justify-content:center;margin-bottom:10px">
            {{ detailSaving ? 'Salvando...' : 'Salvar alterações' }}
          </button>

          <!-- Template selector -->
          <div v-if="templates.length" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <UiTemplateSelector :templates="templates" @select="applyTemplate" />
            <a v-if="selectedLead.telefone" :href="`tel:${selectedLead.telefone}`" class="btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 2 2 0 012 1.84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              Ligar
            </a>
            <a v-if="selectedLead.telefone" :href="`https://wa.me/55${selectedLead.telefone.replace(/\D/g,'')}`" target="_blank" class="btn" style="color:#16a34a;border-color:var(--ok-bd);background:var(--ok-bg)">
              WhatsApp
            </a>
          </div>

          <!-- Template preview -->
          <div v-if="templatePreview" style="margin-bottom:12px;background:var(--bg-subtle);border:1px solid var(--border);border-radius:8px;padding:12px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:11px;font-weight:600;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em">{{ templatePreview.channel }} · {{ templatePreview.name }}</span>
              <button style="border:none;background:none;font-size:11px;color:var(--accent);cursor:pointer;font-family:inherit;font-weight:500;padding:0"
                @click="copyTemplate">
                Copiar
              </button>
            </div>
            <div style="font-size:13px;color:var(--text-1);white-space:pre-wrap;line-height:1.6">{{ templatePreview.content }}</div>
          </div>

          <div class="divider"></div>

          <!-- Tabs -->
          <div class="detail-tabs">
            <button v-for="t in ['follow-ups','notas','histórico']" :key="t"
              @click="detailTab = t"
              class="detail-tab-btn"
              :class="{ active: detailTab === t }">
              {{ t === 'follow-ups' ? `FU (${fuDone(selectedLead)}/10)` : t === 'notas' ? `Notas${leadNotes.length ? ` (${leadNotes.length})` : ''}` : 'Atividades' }}
            </button>
          </div>

          <!-- FU tab -->
          <div v-if="detailTab === 'follow-ups'"
            style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-top:12px">
            <button v-for="fu in sortedFU(selectedLead.followups)" :key="fu.attempt_index"
              @click="handleToggleFU(selectedLead.id, fu.attempt_index)"
              style="border-radius:8px;padding:8px 4px;text-align:center;cursor:pointer;border:1px solid;transition:all .12s;font-family:inherit"
              :style="fu.completed_at
                ? 'background:var(--ok-bg);border-color:var(--ok-bd)'
                : 'background:var(--bg-subtle);border-color:var(--border)'">
              <div style="font-size:12px;font-weight:500"
                :style="{ color: fu.completed_at ? '#16a34a' : 'var(--text-2)' }">{{ fu.attempt_index + 1 }}º</div>
              <div style="font-size:10px;color:var(--text-3)">{{ FU_DAYS[fu.attempt_index] }}d</div>
            </button>
          </div>

          <!-- Notas tab -->
          <div v-if="detailTab === 'notas'" style="margin-top:12px">
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
              <textarea v-model="newNote" rows="2" placeholder="Adicionar nota..."
                style="resize:vertical" @keydown.ctrl.enter="submitNote" maxlength="2000" />
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span style="font-size:11px;color:var(--text-3)">Ctrl+Enter para salvar</span>
                <span style="font-size:11px;color:var(--text-3)"
                  :style="{ color: newNote.length > 1900 ? '#d97706' : 'var(--text-3)' }">
                  {{ newNote.length }} / 2000
                </span>
              </div>
              <button class="btn btn-primary" :disabled="noteSaving || !newNote.trim()"
                style="align-self:flex-end" @click="submitNote">
                {{ noteSaving ? 'Salvando...' : 'Adicionar nota' }}
              </button>
            </div>
            <div v-if="notesLoading" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">Carregando...</div>
            <div v-else-if="!leadNotes.length" style="text-align:center;padding:16px;color:var(--text-3);font-size:13px">
              Nenhuma nota registrada.
            </div>
            <div v-else style="display:flex;flex-direction:column;gap:8px">
              <div v-for="note in leadNotes" :key="note.id"
                style="background:var(--bg-subtle);border:1px solid var(--border-soft);border-radius:8px;padding:12px;font-size:13px">
                <div style="color:var(--text-1);line-height:1.6;white-space:pre-wrap">{{ note.content }}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
                  <span style="font-size:11px;color:var(--text-3)">
                    {{ note.profiles?.name || 'Usuário' }} &middot; {{ formatEventDate(note.created_at) }}
                  </span>
                  <button @click="deleteNote(note.id)"
                    style="border:none;background:none;color:var(--text-3);cursor:pointer;font-size:12px;padding:2px 4px;border-radius:4px;transition:color .1s"
                    onmouseenter="this.style.color='#dc2626'"
                    onmouseleave="this.style.color='#cbd5e1'">
                    Remover
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Atividades / Histórico tab -->
          <div v-if="detailTab === 'histórico'" style="margin-top:12px">
            <!-- Registro rapido de atividade -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
              <button v-for="a in ACTIVITY_KINDS" :key="a.kind" class="btn"
                style="padding:5px 11px;font-size:12px" :disabled="activitySaving"
                @click="logActivity(a.kind)">
                {{ a.label }}
              </button>
            </div>
            <div v-if="eventsLoading" style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">Carregando...</div>
            <div v-else-if="!leadEvents.length" style="text-align:center;padding:24px;color:var(--text-3);font-size:13px">
              Nenhuma atividade registrada.
            </div>
            <div v-else style="display:flex;flex-direction:column;gap:8px">
              <div v-for="ev in leadEvents" :key="ev.id" style="display:flex;gap:10px;font-size:12px">
                <div style="width:30px;height:30px;background:var(--bg-subtle);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:var(--text-2);font-weight:600">
                  {{ eventIcon(ev.type) }}
                </div>
                <div style="flex:1;min-width:0;padding-top:5px">
                  <div style="color:var(--text-1)">{{ eventLabel(ev) }}</div>
                  <div style="color:var(--text-3);font-size:11px;margin-top:2px">
                    {{ ev.profiles?.name || 'Usuário' }} · {{ formatEventDate(ev.created_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </aside>
      </div>
    </Transition>

    <!-- New lead modal -->
    <Transition name="fade">
      <div v-if="showModal"
        style="position:fixed;inset:0;background:rgba(40,40,40,.6);backdrop-filter:blur(2px);z-index:50;display:flex;align-items:center;justify-content:center;padding:16px"
        @click.self="showModal = false">
        <div style="background:var(--bg-card);border-radius:14px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.15),0 8px 24px rgba(0,0,0,.08)">
          <div style="padding:20px 24px 16px;border-bottom:1px solid var(--border-soft);display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:16px;font-weight:600;color:var(--text-1)">Novo lead</div>
            <button class="btn" @click="showModal = false" style="padding:4px 10px">X</button>
          </div>
          <div style="padding:20px 24px">
            <div v-if="createError"
              style="background:var(--bad-bg);border:1px solid var(--bad-bd);color:#dc2626;font-size:13px;padding:10px 12px;border-radius:8px;margin-bottom:14px">
              {{ createError }}
              <span v-if="duplicateLeadId">
                &nbsp;
                <button @click="goToDuplicate"
                  style="text-decoration:underline;background:none;border:none;color:#dc2626;cursor:pointer;font-size:13px;font-family:inherit;padding:0">
                  Ver lead existente
                </button>
              </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div style="grid-column:span 2" class="form-field">
                <label class="input-label">Decisor *</label>
                <input v-model="newForm.decisor" placeholder="João Silva" />
                <div style="font-size:11px;color:var(--text-3)">Nome de quem decide a compra</div>
              </div>
              <div class="form-field">
                <label class="input-label">Telefone</label>
                <input v-model="newForm.telefone" placeholder="(85) 9 9999-9999" />
                <div style="font-size:11px;color:var(--text-3)">Usado para detectar duplicatas</div>
              </div>
              <div class="form-field">
                <label class="input-label">Empresa</label>
                <input v-model="newForm.negocio" placeholder="Empresa XYZ" />
              </div>
              <div class="form-field">
                <label class="input-label">Instagram</label>
                <input v-model="newForm.instagram" placeholder="@empresa" />
              </div>
              <div class="form-field">
                <label class="input-label">Vendedores</label>
                <input v-model.number="newForm.num_vendedores" type="number" min="0" />
              </div>
              <div style="grid-column:span 2" class="form-field">
                <label class="input-label">Indicação / Ponte</label>
                <input v-model="newForm.nome_ponte" placeholder="Ex: Maria do RH que te apresentou" />
                <div style="font-size:11px;color:var(--text-3)">Quem te apresentou este lead? (opcional)</div>
              </div>
              <div class="form-field">
                <label class="input-label">Resultado</label>
                <select v-model="newForm.resultado">
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="form-field">
                <label class="input-label">
                  Data de retorno
                  <button type="button" @click="suggestRetorno"
                    style="border:none;background:none;color:#0f62fe;font-size:11px;cursor:pointer;padding:0 0 0 4px;font-family:inherit">
                    +2d
                  </button>
                </label>
                <input type="date" v-model="newForm.data_retorno" />
              </div>
              <div style="grid-column:span 2" class="form-field">
                <label class="input-label">Observações</label>
                <textarea v-model="newForm.info" rows="2"
                  placeholder="Contexto relevante, dores mencionadas, próximo passo..." />
              </div>
              <div style="grid-column:span 2" class="form-field">
                <label class="input-label">Cadência de prospecção</label>
                <select v-model="newForm.cadence_id">
                  <option value="">Nenhuma</option>
                  <option v-for="c in cadences" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <div style="font-size:11px;color:var(--text-3)">Sequência de passos que guia o follow-up</div>
              </div>

              <div style="grid-column:span 2">
                <button type="button" @click="showExtra = !showExtra"
                  style="background:none;border:none;color:#0f62fe;font-size:12px;cursor:pointer;padding:0;font-family:inherit;font-weight:500">
                  {{ showExtra ? '▲ Ocultar dados adicionais' : '▼ Dados adicionais (ICP)' }}
                </button>
              </div>
              <template v-if="showExtra">
                <div class="form-field">
                  <label class="input-label">Fonte</label>
                  <select v-model="newForm.fonte">
                    <option value="">Nenhum</option>
                    <option value="cold_call">Cold Call</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="indicacao">Indicação</option>
                    <option value="evento">Evento</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="input-label">Porte</label>
                  <select v-model="newForm.porte">
                    <option value="">Nenhum</option>
                    <option value="micro">Micro</option>
                    <option value="pequena">Pequena</option>
                    <option value="media">Média</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="input-label">Segmento</label>
                  <input v-model="newForm.segmento" placeholder="Ex: SaaS, Varejo, Saúde" />
                </div>
                <div class="form-field">
                  <label class="input-label">Cidade</label>
                  <input v-model="newForm.cidade" placeholder="São Paulo" />
                </div>
                <div v-for="cf in customDefs" :key="cf.id" class="form-field" style="grid-column:span 2">
                  <label class="input-label">{{ cf.label }}</label>
                  <select v-if="cf.field_type === 'select'" v-model="newForm.custom_fields[cf.key]">
                    <option value="">--</option>
                    <option v-for="o in (cf.options || [])" :key="o" :value="o">{{ o }}</option>
                  </select>
                  <input v-else
                    :type="cf.field_type === 'number' ? 'number' : cf.field_type === 'date' ? 'date' : 'text'"
                    v-model="newForm.custom_fields[cf.key]" />
                </div>
              </template>

              <div style="grid-column:span 2;display:flex;justify-content:flex-end;gap:8px;padding-top:4px">
                <button class="btn" @click="showModal = false">Cancelar</button>
                <button class="btn btn-primary" :disabled="createSaving" @click="handleCreateLead">
                  {{ createSaving ? 'Criando...' : 'Criar lead' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <UiImportLeadsModal v-if="showImport" @close="showImport = false" @imported="onImported" />

    <UiLossReasonModal
      :show="showLossModal"
      :status="lossModalStatus"
      @confirm="onLossConfirm"
      @cancel="showLossModal = false" />

    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Lead, Followup, LeadStatus, Cadence, MessageTemplate, LeadEvent, LeadNote } from '~/types'
import {
  STATUSES, FU_DAYS, LOSS_STATUSES, STAGE_PROBABILITY, FUNNEL_STAGES,
  funnelStageColor, funnelStagePassed, FONTE_LABEL,
  fuDone, sortedFU, daysIn, isActive, calcLeadScore,
  fmtMoney, daysUntil, localDateISO,
} from '~/utils/leadDomain'
definePageMeta({ layout: 'dashboard' })

type LeadWithFU = Lead & { followups: Followup[] }

const viewMode = ref<'list' | 'kanban'>('kanban')
onMounted(() => {
  const saved = localStorage.getItem('pipeline-view')
  if (saved === 'kanban' || saved === 'list') viewMode.value = saved
})
watch(viewMode, v => localStorage.setItem('pipeline-view', v))

const {
  leads, pending, hasMore, loadingMore, loadMore, leadsTotal,
  activeLeads, toggleFU, patchStatus, patchLead,
  createLead: createLeadComposable, deleteLead: deleteLeadComposable,
  exportCSV, refresh: refreshLeads,
} = useLeads()

const filterStatus       = ref('Todos')
const filterTag          = ref('')
const filterCreated      = ref<''|'7'|'30'|'month'>('')
const filterOverdue      = ref(false)
const searchQ            = ref('')
const sortBy             = ref<'created_at'|'data_retorno'|'fu_done'|'score'>('created_at')

const todayISO = localDateISO()
const monthStartISO = localDateISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

function matchesCreated(l: LeadWithFU): boolean {
  if (!filterCreated.value) return true
  const created = (l.created_at || '').slice(0, 10)
  if (!created) return false
  if (filterCreated.value === 'month') return created >= monthStartISO
  const d = new Date(); d.setDate(d.getDate() - Number(filterCreated.value))
  return created >= localDateISO(d)
}

// Filtros que valem tanto na lista quanto no kanban: etiqueta, atrasados, data de criação.
function passesExtra(l: LeadWithFU): boolean {
  const mt = !filterTag.value || (l.tag_ids || []).includes(filterTag.value)
  const mo = !filterOverdue.value || (!!l.data_retorno && l.data_retorno < todayISO)
  return mt && mo && matchesCreated(l)
}

const { tags, fetchTags, resolve: resolveTags } = useTags()
const { prefs: cardPrefs, init: initCardPrefs } = useCardPrefs()
const { defs: customDefs, load: loadCustomFields } = useCustomFields()
const route = useRoute()
onMounted(() => {
  fetchTags(); initCardPrefs(); loadCustomFields()
  // Drill-down vindo dos Relatórios (?status=...&view=list)
  if (typeof route.query.status === 'string') {
    filterStatus.value = route.query.status
    if (route.query.view === 'list') viewMode.value = 'list'
  }
})
const leadTags = (l: LeadWithFU) => resolveTags(l.tag_ids)
const selectedId         = ref<string | null>(null)
const showModal          = ref(false)
const showImport         = ref(false)
const toastMsg           = ref<string | null>(null)
const detailSaving       = ref(false)
const createSaving       = ref(false)
const createError        = ref<string | null>(null)
const duplicateLeadId    = ref<string | null>(null)
const hasUnsavedChanges  = ref(false)
const detailTab          = ref<'follow-ups' | 'notas' | 'histórico'>('follow-ups')
const leadEvents         = ref<LeadEvent[]>([])
const eventsLoading      = ref(false)
const leadNotes          = ref<LeadNote[]>([])
const notesLoading       = ref(false)
const noteSaving         = ref(false)
const newNote            = ref('')

const showLossModal   = ref(false)
const lossModalStatus = ref('')
const templates       = ref<MessageTemplate[]>([])
const templatePreview = ref<MessageTemplate | null>(null)

const showToast = (m: string) => { toastMsg.value = m; setTimeout(() => toastMsg.value = null, 2500) }
const isVencido = (l: LeadWithFU) => {
  const d = daysUntil(l.data_retorno)
  return d !== null && d < 0 && isActive(l)
}

const totalLeads    = computed(() => leadsTotal.value || (leads.value||[]).length)
const countByStatus = computed(() =>
  (leads.value||[]).reduce((a: Record<string,number>, l) => {
    a[l.resultado] = (a[l.resultado]||0) + 1; return a
  }, {})
)

// ── Inteligencia de valor do pipeline ──────────────────────────────────
const leadsWithValue = computed(() =>
  activeLeads.value.filter(l => l.valor_estimado && l.valor_estimado > 0)
)
const pipelineValue = computed(() =>
  leadsWithValue.value.reduce((s, l) => s + (l.valor_estimado || 0), 0)
)
const weightedForecast = computed(() =>
  leadsWithValue.value.reduce((s, l) => s + (l.valor_estimado || 0) * (STAGE_PROBABILITY[l.resultado] ?? 0), 0)
)
const avgTicket = computed(() =>
  leadsWithValue.value.length ? Math.round(pipelineValue.value / leadsWithValue.value.length) : 0
)

const filtered = computed(() => {
  let list = (leads.value||[]).filter(l => {
    const ms = filterStatus.value === 'Todos' || l.resultado === filterStatus.value
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) ||
               (l.negocio||'').toLowerCase().includes(q) ||
               (l.telefone||'').includes(q)
    return ms && mq && passesExtra(l)
  })
  if (sortBy.value === 'data_retorno') {
    list = [...list].sort((a, b) => {
      if (!a.data_retorno && !b.data_retorno) return 0
      if (!a.data_retorno) return 1
      if (!b.data_retorno) return -1
      return a.data_retorno.localeCompare(b.data_retorno)
    })
  } else if (sortBy.value === 'fu_done') {
    list = [...list].sort((a, b) => fuDone(a) - fuDone(b))
  } else if (sortBy.value === 'score') {
    list = [...list].sort((a, b) => calcLeadScore(b) - calcLeadScore(a))
  }
  return list
})

// No Kanban as colunas ja representam os status, entao so busca e etiqueta filtram.
const filteredForKanban = computed(() =>
  (leads.value||[]).filter(l => {
    const q  = searchQ.value.toLowerCase()
    const mq = !q || l.decisor.toLowerCase().includes(q) || (l.negocio||'').toLowerCase().includes(q)
    return mq && passesExtra(l)
  })
)

async function onKanbanStatusChange(leadId: string, resultado: LeadStatus) {
  try {
    await patchStatus(leadId, resultado)
    showToast('Status atualizado!')
  } catch {
    showToast('Erro ao mover card.')
  }
}

const selectedLead = computed(() =>
  (leads.value||[]).find(l => l.id === selectedId.value) || null
)

function selectLead(l: LeadWithFU) {
  if (selectedId.value === l.id) return
  if (hasUnsavedChanges.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value        = l.id
  hasUnsavedChanges.value = false
  detailTab.value         = 'follow-ups'
  leadEvents.value        = []
  leadNotes.value         = []
  newNote.value           = ''
}

watch(detailTab, async (tab) => {
  if (tab === 'histórico' && selectedId.value && !leadEvents.value.length) {
    eventsLoading.value = true
    try { leadEvents.value = await $fetch<LeadEvent[]>(`/api/leads/${selectedId.value}/events`) }
    finally { eventsLoading.value = false }
  }
  if (tab === 'notas' && selectedId.value) await loadNotes()
})

async function loadNotes() {
  if (!selectedId.value) return
  notesLoading.value = true
  try { leadNotes.value = await $fetch<LeadNote[]>(`/api/leads/${selectedId.value}/notes`) }
  finally { notesLoading.value = false }
}

async function submitNote() {
  if (!newNote.value.trim() || !selectedId.value) return
  noteSaving.value = true
  try {
    const note = await $fetch<LeadNote>(`/api/leads/${selectedId.value}/notes`, {
      method: 'POST', body: { content: newNote.value.trim() },
    })
    leadNotes.value.unshift(note)
    newNote.value = ''
  } catch { showToast('Erro ao salvar nota.') }
  finally { noteSaving.value = false }
}

async function deleteNote(noteId: string) {
  if (!selectedId.value) return
  try {
    await $fetch(`/api/leads/${selectedId.value}/notes/${noteId}`, { method: 'DELETE' })
    leadNotes.value = leadNotes.value.filter(n => n.id !== noteId)
  } catch { showToast('Erro ao remover nota.') }
}

const ACTIVITY_KINDS = [
  { kind: 'ligacao',  label: 'Ligação'  },
  { kind: 'whatsapp', label: 'WhatsApp' },
  { kind: 'reuniao',  label: 'Reunião'  },
  { kind: 'email',    label: 'Email'    },
] as const

const ACTIVITY_LABELS: Record<string, string> = {
  ligacao: 'Ligação registrada', whatsapp: 'WhatsApp registrado',
  reuniao: 'Reunião registrada', email: 'Email registrado', outro: 'Atividade registrada',
}

const activitySaving = ref(false)
async function logActivity(kind: string) {
  if (!selectedId.value) return
  activitySaving.value = true
  try {
    const ev = await $fetch<LeadEvent>(`/api/leads/${selectedId.value}/events`, {
      method: 'POST', body: { kind },
    })
    if (ev) leadEvents.value.unshift(ev)
    showToast('Atividade registrada')
  } catch {
    showToast('Erro ao registrar atividade.')
  } finally {
    activitySaving.value = false
  }
}

const EVENT_ICONS: Record<string, string> = {
  created: '+', status_change: '>', field_update: '~', followup: 'v', note: '@', activity: '*',
}
function eventIcon(type: string) { return EVENT_ICONS[type] ?? '·' }

function eventLabel(ev: LeadEvent): string {
  const p = (ev.payload ?? {}) as Record<string, any>
  switch (ev.type) {
    case 'created':       return 'Lead criado'
    case 'status_change': return `Status: ${p.from} → ${p.to}`
    case 'field_update':  return `Campos atualizados: ${(p.fields ?? []).join(', ')}`
    case 'followup':      return p.completed
      ? `Follow-up ${p.attempt_index + 1} concluído`
      : `Follow-up ${p.attempt_index + 1} reaberto`
    case 'activity': {
      const base = ACTIVITY_LABELS[p.kind] ?? 'Atividade registrada'
      return p.note ? `${base}: ${p.note}` : base
    }
    default: return ev.type
  }
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

function openDetail(l: LeadWithFU) {
  selectLead(l)
}

function confirmClose() {
  if (hasUnsavedChanges.value && !confirm('Há alterações não salvas. Deseja descartar?')) return
  selectedId.value        = null
  hasUnsavedChanges.value = false
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') confirmClose()
}

const editForm = reactive<Record<string,any>>({})
watch(selectedLead, l => {
  if (!l) return
  Object.assign(editForm, {
    decisor: l.decisor, telefone: l.telefone||'', negocio: l.negocio||'',
    instagram: l.instagram||'', num_vendedores: l.num_vendedores||null,
    nome_ponte: l.nome_ponte||'', resultado: l.resultado,
    data_retorno: l.data_retorno||'', reuniao_agendada: l.reuniao_agendada,
    turno: l.turno||'', horario: l.horario||'', info: l.info||'',
    proposta_url: l.proposta_url||'',
    valor_estimado: l.valor_estimado||null, motivo_perda: l.motivo_perda||'',
    tag_ids: [...(l.tag_ids || [])],
    custom_fields: { ...(l.custom_fields || {}) },
  })
  templatePreview.value = null
  hasUnsavedChanges.value = false
}, { immediate: true })

// Etiquetas salvam na hora (UX instantanea) e refletem nos cards.
async function onTagsChange(ids: string[]) {
  editForm.tag_ids = ids
  if (!selectedLead.value) return
  try { await patchLead(selectedLead.value.id, { tag_ids: ids }) }
  catch { showToast('Erro ao salvar etiquetas.') }
}

function onStatusChange() {
  hasUnsavedChanges.value = true
  if (editForm.resultado === 'Follow-up' && !editForm.data_retorno) {
    const d = new Date(); d.setDate(d.getDate() + 2)
    editForm.data_retorno = localDateISO(d)
  }
  if (LOSS_STATUSES.includes(editForm.resultado)) {
    lossModalStatus.value = editForm.resultado
    showLossModal.value   = true
  }
}

function onLossConfirm(reason: string) {
  editForm.motivo_perda = reason
  showLossModal.value   = false
}

function applyTemplate(tpl: MessageTemplate) {
  templatePreview.value = tpl
}

function copyTemplate() {
  if (!templatePreview.value) return
  navigator.clipboard?.writeText(templatePreview.value.content)
  showToast('Copiado!')
}

const detailFields = [
  { key:'decisor',        label:'Decisor' },
  { key:'telefone',       label:'Telefone' },
  { key:'negocio',        label:'Empresa' },
  { key:'instagram',      label:'Instagram' },
  { key:'nome_ponte',     label:'Indicação / Ponte', wide:true },
  { key:'resultado',      label:'Resultado',       type:'select' },
  { key:'data_retorno',   label:'Data retorno',    type:'date' },
  { key:'valor_estimado', label:'Valor estimado (R$)', type:'number' },
  { key:'turno',          label:'Turno' },
  { key:'horario',        label:'Horário' },
  { key:'info',           label:'Observações',     type:'textarea', wide:true },
  { key:'proposta_url',   label:'URL da proposta', type:'url', wide:true },
]

// Campos opcionais que, vazios (''), devem virar null antes de salvar.
// Sem isso, data_retorno='' quebra a coluna date e o patch inteiro falha (nada salva).
const SAVE_NULLABLE = [
  'telefone','negocio','instagram','nome_ponte','data_retorno','info',
  'turno','horario','proposta_url','motivo_perda','valor_estimado','num_vendedores',
]

async function saveLead() {
  if (!selectedLead.value) return
  detailSaving.value = true
  try {
    // tag_ids salva separado (onTagsChange, instantaneo); fora do payload generico.
    const payload: Record<string, any> = { ...editForm }
    delete payload.tag_ids
    for (const k of SAVE_NULLABLE) if (payload[k] === '') payload[k] = null
    // mantem so os campos personalizados preenchidos
    payload.custom_fields = Object.fromEntries(
      Object.entries(payload.custom_fields || {}).filter(([, v]) => v !== '' && v != null)
    )
    await patchLead(selectedLead.value.id, payload)
    hasUnsavedChanges.value = false
    showToast('Salvo!')
  } catch {
    showToast('Erro ao salvar. Verifique os campos.')
  } finally {
    detailSaving.value = false
  }
}

async function removeLead(id: string) {
  if (!confirm('Remover este lead?')) return
  await deleteLeadComposable(id)
  selectedId.value = null
  showToast('Lead removido.')
}

async function handleToggleFU(leadId: string, idx: number) {
  await toggleFU(leadId, idx)
}

const newForm = reactive<Record<string,any>>({
  decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null,
  nome_ponte:'', resultado:'Novo', data_retorno:'', info:'',
  fonte:'', segmento:'', cidade:'', estado:'', porte:'', cadence_id:'',
  custom_fields:{},
})
const showExtra = ref(false)
const cadences  = ref<Cadence[]>([])
onMounted(async () => {
  try { cadences.value = await $fetch<Cadence[]>('/api/cadences') } catch {}
  try { templates.value = await $fetch<MessageTemplate[]>('/api/templates') } catch {}
})

function suggestRetorno() {
  const d = new Date(); d.setDate(d.getDate() + 2)
  newForm.data_retorno = localDateISO(d)
}

function goToDuplicate() {
  if (!duplicateLeadId.value) return
  showModal.value = false
  viewMode.value = 'list'
  selectedId.value = duplicateLeadId.value
  duplicateLeadId.value = null
}

async function onImported() {
  await refreshLeads()
  showToast('Leads importados com sucesso!')
}

async function handleCreateLead() {
  if (!newForm.decisor) { createError.value = 'Informe o nome do decisor.'; return }
  createSaving.value = true; createError.value = null; duplicateLeadId.value = null
  try {
    // String vazia em campos opcionais (cadence_id, fonte, porte, datas...) quebra a validacao; vira null.
    const NULLABLE = ['telefone','negocio','instagram','nome_ponte','data_retorno','info','fonte','segmento','cidade','estado','porte','cadence_id']
    const payload: Record<string, any> = { ...newForm, reuniao_agendada: false }
    for (const k of NULLABLE) if (payload[k] === '') payload[k] = null
    // mantem so os campos personalizados preenchidos
    payload.custom_fields = Object.fromEntries(
      Object.entries(payload.custom_fields || {}).filter(([, v]) => v !== '' && v != null)
    )
    await createLeadComposable(payload)
    showModal.value = false
    showToast('Lead criado!')
    Object.assign(newForm, {
      decisor:'', telefone:'', negocio:'', instagram:'', num_vendedores:null,
      nome_ponte:'', resultado:'Novo', data_retorno:'', info:'',
      fonte:'', segmento:'', cidade:'', estado:'', porte:'', cadence_id:'',
      custom_fields:{},
    })
    showExtra.value = false
  } catch (e: any) {
    if (e?.data?.code === 'DUPLICATE_PHONE') {
      duplicateLeadId.value = e.data.existingId ?? null
      createError.value = `Já existe um lead com este telefone${e.data.existingName ? ` (${e.data.existingName})` : ''}.`
    } else {
      createError.value = e?.data?.message || 'Erro ao criar.'
    }
  } finally {
    createSaving.value = false
  }
}
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

/* ── Resumo de valor do pipeline ─────────────────────────── */
.pipe-summary {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--bg-card, #fff);
  border: 1px solid var(--border, var(--border-soft));
  border-radius: var(--radius);
  padding: 16px 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  box-shadow: var(--shadow-sm);
}
.pipe-summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 22px;
  flex: 1;
  min-width: 150px;
}
.pipe-summary-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-3, var(--text-3));
}
.pipe-summary-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-1, var(--text-1));
  letter-spacing: -.01em;
  line-height: 1.05;
  font-family: var(--font-mono);
}
.pipe-summary-hint { font-size: 11px; color: var(--text-3, var(--text-3)); }
.pipe-summary-divider { width: 1px; background: var(--border-soft, var(--border-soft)); align-self: stretch; }

.lead-value {
  font-weight: 600;
  color: var(--ok);
  background: var(--ok-bg);
  border: 1px solid var(--ok-bd);
  border-radius: 4px;
  padding: 0 5px;
}

/* ── Control bar: visualizacao (primaria) + filtros (secundarios) ── */
.pipe-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.pipe-views {
  display: flex;
  gap: 3px;
  background: var(--bg-subtle, var(--border-soft));
  border-radius: 9px;
  padding: 3px;
  flex-shrink: 0;
}
.pipe-view {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pipe-view:hover { color: var(--text-1); }
.pipe-view.active {
  background: var(--bg-card, #fff);
  color: var(--text-1);
  box-shadow: var(--shadow-sm);
}
.pipe-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 0;
}
.pipe-search { width: 220px; max-width: 100%; }
.pipe-filter-select { width: auto; flex-shrink: 0; }
.pipe-toggle {
  flex-shrink: 0;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text-2);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
}
.pipe-toggle:hover { border-color: var(--bad); color: var(--bad); }
.pipe-toggle.active { background: var(--bad-bg); border-color: var(--bad-bd); color: var(--bad); font-weight: 500; }

/* ── Lista (largura total) ───────────────────────────────── */
.lead-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* ── Drawer de detalhe (slide-over) ──────────────────────── */
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(40, 40, 40, .45);
  backdrop-filter: blur(2px);
  z-index: 60;
  display: flex;
  justify-content: flex-end;
}
.drawer {
  width: 100%;
  max-width: 480px;
  height: 100%;
  background: var(--bg-card, #fff);
  border-left: 1px solid var(--border, var(--border));
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, .14);
}
.drawer-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border-soft, var(--border-soft));
  flex-shrink: 0;
}
.drawer-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.drawer-title { font-size: 17px; font-weight: 600; color: var(--text-1, var(--text-1)); letter-spacing: -.01em; }
.drawer-sub { font-size: 13px; color: var(--text-2, var(--text-2)); margin-top: 2px; }
.drawer-body { flex: 1; overflow-y: auto; padding: 18px 20px; }

.drawer-enter-active, .drawer-leave-active { transition: opacity .2s ease; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform .24s cubic-bezier(.16, 1, .3, 1); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(100%); }

.view-toggle {
  display: flex;
  background: var(--border-soft);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
}
.view-toggle-btn:hover { color: var(--text-1) }
.view-toggle-btn.active {
  background:var(--bg-card);
  color: var(--text-1);
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}

.lead-row {
  border: 1px solid var(--border-soft);
  border-radius: 10px;
  padding: 11px 14px;
  cursor: pointer;
  background: var(--bg-card);
  transition: all .12s;
}
.lead-row:hover       { border-color: var(--border); }
.lead-row--selected   { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(15,98,254,.12); }
.lead-row-qa          { opacity: 0; transition: opacity .12s; }
.lead-row:hover .lead-row-qa,
.lead-row:focus-within .lead-row-qa { opacity: 1; }

.detail-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-soft);
  margin-bottom: 0;
}
.detail-tab-btn {
  padding: 8px 14px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--text-3);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all .12s;
  margin-bottom: -1px;
}
.detail-tab-btn:hover { color: var(--text-2) }
.detail-tab-btn.active { color: var(--text-1); border-bottom-color: var(--accent); }

.fade-enter-active,.fade-leave-active { transition: opacity .15s }
.fade-enter-from,.fade-leave-to       { opacity: 0 }
</style>
