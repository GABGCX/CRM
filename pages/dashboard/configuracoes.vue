<template>
  <div class="settings-page">

    <div class="page-header">
      <div class="page-title">Configurações</div>
      <div class="page-sub">{{ localOrg?.name || org?.name }} · {{ org?.slug }}.{{ appDomain }}</div>
    </div>

    <div v-if="!loading" class="cfg-tabs">
      <button v-for="t in cfgTabs" :key="t.id" class="cfg-tab" :class="{ active: tab === t.id }" @click="tab = t.id">
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div style="display:flex;flex-direction:column;gap:12px">
        <div v-for="i in 3" :key="i"
          style="height:200px;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:10px;animation:pulse 1.5s infinite" />
      </div>
    </div>

    <div v-else class="settings-grid">

      <template v-if="tab === 'conta'">
      <!-- ── Metas ─────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
          Metas e financeiro
        </div>
        <form @submit.prevent="saveSettings" class="form">
          <div v-if="settingsError" class="alert alert-error">{{ settingsError }}</div>

          <div class="field">
            <label class="label">Nome da organização</label>
            <input v-model="sf.name" required class="input" />
          </div>
          <div class="field">
            <label class="label">Meta de faturamento mensal (R$)</label>
            <input v-model.number="sf.meta_mensal" type="number" min="0" step="500" class="input mono" />
          </div>
          <div class="field">
            <label class="label">Ticket médio (R$)</label>
            <input v-model.number="sf.ticket_medio" type="number" min="0" step="100" class="input mono" />
          </div>

          <!-- Projeções via useOutboundMath (fix #9) -->
          <div class="projections">
            <div class="projections-title">Números de ouro calculados</div>
            <div v-for="p in projections" :key="p.label" class="projection-row">
              <span class="projection-label">{{ p.label }}</span>
              <span class="projection-value">{{ p.value.toLocaleString('pt-BR') }}</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingSettings">
            <span v-if="savingSettings" class="spinner"></span>
            {{ savingSettings ? 'Salvando...' : 'Salvar metas' }}
          </button>
        </form>
      </div>

      <!-- ── Identidade visual ──────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
          Personalização da marca
          <span class="badge">white-label</span>
        </div>
        <form @submit.prevent="saveTheme" class="form">
          <div v-if="themeError" class="alert alert-error">{{ themeError }}</div>

          <div class="field">
            <label class="label">Nome do produto</label>
            <input v-model="tf.product_name" required class="input" />
          </div>

          <div class="field">
            <label class="label">Cor primária</label>
            <div class="color-row">
              <div class="color-swatch-wrap">
                <input type="color" v-model="tf.primary_color" class="color-native" />
              </div>
              <input type="text" v-model="tf.primary_color" class="input mono"
                style="width:96px;flex-shrink:0" maxlength="7" />
              <div class="presets">
                <button v-for="c in PRESETS" :key="c" type="button"
                  class="preset" :class="{ 'preset-active': tf.primary_color === c }"
                  :style="{ background: c }" @click="tf.primary_color = c" :title="c" />
              </div>
            </div>
          </div>

          <div class="field">
            <label class="label">URL do logo</label>
            <input v-model="tf.logo_url" type="url" placeholder="https://..." class="input" />
          </div>
          <div class="field">
            <label class="label">URL do favicon</label>
            <input v-model="tf.favicon_url" type="url" placeholder="https://..." class="input" />
          </div>

          <div class="preview-block">
            <div class="preview-title">Preview</div>
            <div class="preview-card">
              <div class="preview-logo" :style="{ background: tf.primary_color }">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="preview-info">
                <div class="preview-name">{{ tf.product_name }}</div>
                <div class="preview-url" :style="{ color: tf.primary_color }">{{ org?.slug }}.{{ appDomain }}</div>
              </div>
              <button type="button" class="preview-cta" :style="{ background: tf.primary_color }">
                Entrar
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingTheme">
            <span v-if="savingTheme" class="spinner"></span>
            {{ savingTheme ? 'Salvando...' : 'Salvar tema' }}
          </button>
        </form>
      </div>

      <!-- ── Domínio ────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
          </svg>
          Domínio customizado
        </div>
        <form @submit.prevent="saveDomain" class="form">
          <div v-if="domainError" class="alert alert-error">{{ domainError }}</div>

          <div class="field">
            <label class="label">Domínio próprio</label>
            <input v-model="domainVal" placeholder="crm.suaempresa.com.br" class="input mono" />
          </div>

          <div class="dns-guide">
            <div class="dns-guide-title">Como configurar</div>
            <ol class="dns-steps">
              <li>No painel DNS, crie um registro CNAME</li>
              <li>Nome: <code>crm</code> → Valor: <code>cname.vercel-dns.com</code></li>
              <li>Salve o domínio completo aqui</li>
              <li>Aguarde até <strong>48h</strong> para propagação</li>
            </ol>
          </div>

          <div class="domain-status">
            <span class="status-dot" :class="localOrg?.custom_domain ? 'status-on' : 'status-off'" />
            <span>
              {{ localOrg?.custom_domain
                  ? `Ativo: ${localOrg.custom_domain}`
                  : 'Nenhum domínio configurado' }}
            </span>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="savingDomain">
            <span v-if="savingDomain" class="spinner"></span>
            {{ savingDomain ? 'Salvando...' : 'Salvar domínio' }}
          </button>
        </form>
      </div>

      </template>

      <template v-if="tab === 'prospeccao'">
      <!-- ── Cadencias ─────────────────────────────────── -->
      <div v-if="profile?.role !== 'bdr'" class="card">
        <UiCadenceManager />
      </div>

      <!-- ── Exportar dados ───────────────────────────── -->
      <div v-if="profile?.role === 'owner'" class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar dados
        </div>
        <p style="font-size:12px;color:var(--text-2);line-height:1.6;margin:0">
          Baixe todos os dados da sua organização (leads, follow-ups, diário e membros) em formato JSON.
        </p>
        <a :href="exportUrl" download class="btn" style="text-decoration:none;text-align:center">
          ↓ Exportar todos os dados
        </a>
      </div>

      <!-- ── Etiquetas ───────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          Etiquetas
          <span v-if="tags.length" class="badge">{{ tags.length }}</span>
        </div>

        <div v-if="tags.length" class="tag-mgr-list">
          <div v-for="t in tags" :key="t.id" class="tag-mgr-row">
            <input type="color" :value="t.color" @change="updTagColor(t, $event)" class="tag-mgr-color" title="Cor" />
            <input :value="t.name" @change="updTagName(t, $event)" class="input tag-mgr-name" maxlength="40" />
            <button @click="delTag(t)" class="tag-mgr-del" title="Excluir etiqueta">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <div v-else style="font-size:12px;color:var(--text-3);padding:4px 0">
          Nenhuma etiqueta criada. Use o campo abaixo para criar a primeira.
        </div>

        <div class="tag-mgr-create">
          <input type="color" v-model="newTagColor" class="tag-mgr-color" title="Cor" />
          <input v-model="newTagName" placeholder="Nova etiqueta..." class="input" maxlength="40" @keydown.enter="addTag" />
          <button class="btn btn-primary" :disabled="!newTagName.trim() || addingTag" @click="addTag" style="flex-shrink:0">
            {{ addingTag ? '...' : 'Criar' }}
          </button>
        </div>
      </div>

      <!-- ── Templates de mensagem ───────────────────────── -->
      <div class="card" style="grid-column:1/-1">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Templates de mensagem
          <span v-if="templates.length" class="badge">{{ templates.length }}</span>
        </div>

        <div v-if="templatesLoading" style="display:flex;flex-direction:column;gap:6px">
          <div v-for="i in 3" :key="i"
            style="height:44px;background:var(--bg);border-radius:8px;animation:pulse 1.5s infinite" />
        </div>

        <div v-else-if="templates.length" style="display:flex;flex-direction:column;gap:1px;border:1px solid var(--border);border-radius:8px;overflow:hidden">
          <div v-for="tpl in templates" :key="tpl.id"
            style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border-soft);transition:background .08s"
            @mouseenter="hoveredTpl = tpl.id" @mouseleave="hoveredTpl = null"
            :style="{ background: hoveredTpl === tpl.id ? 'var(--bg)' : 'transparent' }">
            <span class="tpl-channel-tag" :class="'tpl-ch-' + tpl.channel.toLowerCase()">{{ tpl.channel }}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;color:var(--text-1)">{{ tpl.name }}</div>
              <div style="font-size:11px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px">
                {{ tpl.content.slice(0, 80) }}{{ tpl.content.length > 80 ? '...' : '' }}
              </div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <button @click="editTpl(tpl)"
                style="padding:3px 9px;font-size:11px;font-weight:500;border:1px solid var(--border);background:var(--surface);color:var(--text-2);border-radius:5px;cursor:pointer;font-family:inherit">
                Editar
              </button>
              <button @click="deleteTpl(tpl.id, tpl.name)"
                style="padding:3px 9px;font-size:11px;font-weight:500;border:1px solid var(--bad-bd);background:transparent;color:#dc2626;border-radius:5px;cursor:pointer;font-family:inherit">
                X
              </button>
            </div>
          </div>
          <div v-if="!templates.length" style="padding:16px;font-size:12px;color:var(--text-3);text-align:center">
            Nenhum template criado ainda.
          </div>
        </div>
        <div v-else style="font-size:12px;color:var(--text-3);padding:4px 0">
          Nenhum template criado ainda. Use o formulario abaixo para criar o primeiro.
        </div>

        <div style="border-top:1px solid var(--border-soft);padding-top:16px">
          <div class="invite-title" style="margin-bottom:12px">
            {{ tplForm.editingId ? 'Editar template' : 'Novo template' }}
          </div>
          <div v-if="tplError" class="alert alert-error" style="margin-bottom:10px">{{ tplError }}</div>
          <form @submit.prevent="saveTpl" class="form">
            <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
              <div class="field">
                <label class="label">Nome</label>
                <input v-model="tplForm.name" required maxlength="80" placeholder="Ex: Primeiro contato WhatsApp" class="input" />
              </div>
              <div class="field">
                <label class="label">Canal</label>
                <select v-model="tplForm.channel" class="select" style="width:auto">
                  <option v-for="ch in TPL_CHANNELS" :key="ch" :value="ch">{{ ch }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="label">Conteudo</label>
              <textarea v-model="tplForm.content" required rows="4" maxlength="2000"
                placeholder="Oi [nome], tudo bem?..." class="input" style="resize:vertical;min-height:80px" />
              <div style="font-size:10px;color:var(--text-3);margin-top:3px;text-align:right">
                {{ tplForm.content.length }}/2000
              </div>
            </div>
            <div style="display:flex;gap:8px">
              <button type="submit" class="btn btn-primary" :disabled="savingTpl" style="flex:1">
                <span v-if="savingTpl" class="spinner"></span>
                {{ savingTpl ? 'Salvando...' : (tplForm.editingId ? 'Atualizar template' : 'Criar template') }}
              </button>
              <button v-if="tplForm.editingId" type="button" class="btn" @click="cancelEditTpl" style="flex:0 0 auto">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      </template>

      <template v-if="tab === 'equipe'">
      <!-- ── Equipe ─────────────────────────────────────── -->
      <div class="card">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          Equipe
          <span v-if="members?.length" class="badge">{{ members.length }}</span>
        </div>

        <!-- Loading skeleton -->
        <div v-if="membersLoading" style="display:flex;flex-direction:column;gap:6px">
          <div v-for="i in 3" :key="i"
            style="height:40px;background:var(--border-soft);border-radius:8px;animation:pulse 1.5s infinite" />
        </div>

        <div v-else class="members-list">
          <div v-for="m in members" :key="m.id" class="member-row">
            <div class="avatar">{{ (m.name || 'U')[0].toUpperCase() }}</div>
            <div class="member-info">
              <div class="member-name">
                {{ m.name || '' }}
                <span v-if="m.id === profile?.id"
                  style="font-size:10px;background:var(--border-soft);color:var(--text-2);padding:1px 5px;border-radius:4px;margin-left:4px">
                  Você
                </span>
              </div>
              <div class="member-email">{{ m.email || '' }}</div>
            </div>

            <!-- Role selector (owner vê mas não altera owner; bdr/admin são editáveis) -->
            <select
              v-if="profile?.role === 'owner' && m.role !== 'owner' && m.id !== profile?.id"
              :value="m.role"
              @change="changeMemberRole(m.id, ($event.target as HTMLSelectElement).value)"
              style="font-size:11px;padding:3px 6px;border:1px solid var(--border);border-radius:5px;background:var(--bg-card);color:var(--text-2);cursor:pointer">
              <option value="bdr">BDR</option>
              <option value="admin">Admin</option>
            </select>
            <span v-else class="role-tag" :class="m.role === 'owner' ? 'role-owner' : 'role-default'"
              style="display:inline-flex;align-items:center;gap:3px">
              <svg v-if="m.role === 'owner'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 20h20M5 20l2-8 5 4 5-4 2 8M12 4l2 4h4l-3 2 1 4-4-3-4 3 1-4L6 8h4z"/>
              </svg>
              <svg v-else-if="m.role === 'admin'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
              </svg>
              <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.92z"/>
              </svg>
              {{ ROLE_LABELS[m.role] || m.role }}
            </span>

            <!-- Remove button (owner only, not self, not other owners) -->
            <button
              v-if="profile?.role === 'owner' && m.role !== 'owner' && m.id !== profile?.id"
              @click="removeMember(m.id, m.name || m.id)"
              style="padding:3px 8px;border:1px solid var(--bad-bd);background:var(--bg-card);color:#dc2626;border-radius:5px;font-size:11px;cursor:pointer;flex-shrink:0"
              title="Remover membro">
              X
            </button>
          </div>
          <div v-if="!members?.length" class="members-empty">Nenhum membro encontrado.</div>
        </div>

        <div class="invite-box">
          <div class="invite-title">Convidar membro</div>
          <div v-if="inviteError" class="alert alert-error">{{ inviteError }}</div>
          <form @submit.prevent="sendInvite" class="form">
            <div class="field">
              <label class="label">E-mail</label>
              <input v-model="inviteEmail" type="email" required
                placeholder="colega@empresa.com" class="input" />
            </div>
            <div class="field">
              <label class="label">Função</label>
              <select v-model="inviteRole" class="select">
                <option value="bdr">BDR</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" class="btn" :disabled="inviting">
              <span v-if="inviting" class="spinner spinner-dark"></span>
              {{ inviting ? 'Enviando...' : 'Enviar convite por e-mail' }}
            </button>
          </form>
        </div>
      </div>

      <!-- ── Auditoria (owner only) ─────────────────────── -->
      <div v-if="profile?.role === 'owner'" class="card" style="grid-column:1/-1">
        <div class="card-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#193497;flex-shrink:0">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Log de auditoria
          <span class="badge">owner</span>
        </div>

        <div v-if="auditLoading" style="display:flex;flex-direction:column;gap:6px">
          <div v-for="i in 5" :key="i"
            style="height:36px;background:var(--border-soft);border-radius:8px;animation:pulse 1.5s infinite" />
        </div>

        <div v-else-if="auditLogs.length === 0" style="font-size:12px;color:var(--text-3);padding:4px 0">
          Nenhuma ação registrada ainda.
        </div>

        <div v-else class="audit-table-wrap">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Usuário</th>
                <th>IP</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in auditLogs" :key="entry.id">
                <td><span class="audit-action">{{ entry.action }}</span></td>
                <td style="color:var(--text-2);font-size:11px">
                  {{ entry.resource_type }}
                  <span v-if="entry.resource_id" style="color:var(--text-3)"> ({{ entry.resource_id.slice(0,8) }})</span>
                </td>
                <td style="font-size:11px;color:var(--text-2)">{{ entry.profiles?.name || '' }}</td>
                <td style="font-size:11px;color:var(--text-3);font-family:monospace">{{ entry.ip || '' }}</td>
                <td style="font-size:11px;color:var(--text-3);white-space:nowrap">{{ formatAuditDate(entry.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </template>

    </div>

    <Transition name="toast">
      <div v-if="toast" class="toast">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ toast }}
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { Profile, MessageTemplate } from '~/types'

definePageMeta({ layout: 'dashboard' })

const config    = useRuntimeConfig()
const appDomain = config.public.appDomain
const supabase  = useSupabaseClient()
const { profile, org, fetchProfile } = useProfile()
const { applyTheme } = useTheme()

// ── UI state ──────────────────────────────────────────────────────────
const loading        = ref(true)
const membersLoading = ref(false)
const tab = ref<'conta' | 'prospeccao' | 'equipe'>('conta')
const cfgTabs = [
  { id: 'conta' as const,      label: 'Conta & Marca' },
  { id: 'prospeccao' as const, label: 'Prospeccao' },
  { id: 'equipe' as const,     label: 'Equipe' },
]
const toast          = ref<string | null>(null)

const showToast = (msg: string) => {
  toast.value = msg
  setTimeout(() => (toast.value = null), 2500)
}

// ── Constantes ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = { owner:'Proprietário', admin:'Admin', bdr:'BDR' }
const PRESETS = [
  '#193497','#0f2480','#0a0a0a','#7c3aed',
  '#db2777','#dc2626','#ea580c','#d97706','#16a34a','#0891b2',
]

// ── Estado local ──────────────────────────────────────────────────────
const localOrg = ref<typeof org.value>(null)

// ── Forms ─────────────────────────────────────────────────────────────
const sf = reactive({ name:'', meta_mensal:10000, ticket_medio:2000 })
const tf = reactive({ product_name:'Outbound', primary_color:'#0a0a0a', logo_url:'', favicon_url:'' })
const domainVal   = ref('')
const inviteEmail = ref('')
const inviteRole  = ref('bdr')

// ── Loading flags ─────────────────────────────────────────────────────
const savingSettings = ref(false)
const savingTheme    = ref(false)
const savingDomain   = ref(false)
const inviting       = ref(false)

// ── Erros ─────────────────────────────────────────────────────────────
const settingsError = ref<string | null>(null)
const themeError    = ref<string | null>(null)
const domainError   = ref<string | null>(null)
const inviteError   = ref<string | null>(null)

// ── Export ────────────────────────────────────────────────────────────
const exportUrl = '/api/export/full'

// ── Etiquetas ──────────────────────────────────────────────────────────
const { tags, fetchTags, createTag, updateTag, deleteTag } = useTags()
const newTagName  = ref('')
const newTagColor = ref('#2563eb')
const addingTag   = ref(false)

async function addTag() {
  if (!newTagName.value.trim()) return
  addingTag.value = true
  try { await createTag(newTagName.value.trim(), newTagColor.value); newTagName.value = ''; showToast('Etiqueta criada!') }
  catch (e: any) { showToast(e?.data?.message || 'Erro ao criar etiqueta.') }
  finally { addingTag.value = false }
}
function updTagName(t: { id: string; name: string }, e: Event) {
  const v = (e.target as HTMLInputElement).value.trim()
  if (v && v !== t.name) updateTag(t.id, { name: v }).catch(() => showToast('Erro ao renomear.'))
}
function updTagColor(t: { id: string }, e: Event) {
  updateTag(t.id, { color: (e.target as HTMLInputElement).value }).catch(() => showToast('Erro ao mudar cor.'))
}
async function delTag(t: { id: string; name: string }) {
  if (!confirm(`Excluir a etiqueta "${t.name}"? Ela some dos leads que a usam.`)) return
  try { await deleteTag(t.id); showToast('Etiqueta excluida.') }
  catch { showToast('Erro ao excluir.') }
}

// ── Templates de mensagem ──────────────────────────────────────────────
const TPL_CHANNELS = ['WhatsApp', 'Email', 'Ligacao', 'LinkedIn', 'Outro'] as const
const templates       = ref<MessageTemplate[]>([])
const templatesLoading = ref(false)
const hoveredTpl      = ref<string | null>(null)
const savingTpl       = ref(false)
const tplError        = ref<string | null>(null)
const tplForm = reactive({ name: '', channel: 'WhatsApp' as string, content: '', editingId: '' })

async function loadTemplates() {
  templatesLoading.value = true
  try {
    templates.value = await $fetch<MessageTemplate[]>('/api/templates')
  } catch {
    // silently ignore
  } finally {
    templatesLoading.value = false
  }
}

function editTpl(tpl: MessageTemplate) {
  tplForm.name      = tpl.name
  tplForm.channel   = tpl.channel
  tplForm.content   = tpl.content
  tplForm.editingId = tpl.id
  tplError.value    = null
}

function cancelEditTpl() {
  tplForm.name      = ''
  tplForm.channel   = 'WhatsApp'
  tplForm.content   = ''
  tplForm.editingId = ''
  tplError.value    = null
}

async function saveTpl() {
  savingTpl.value = true
  tplError.value  = null
  try {
    const isEdit = !!tplForm.editingId
    if (isEdit) {
      const updated = await $fetch<MessageTemplate>(`/api/templates/${tplForm.editingId}`, {
        method: 'PATCH',
        body: { name: tplForm.name, channel: tplForm.channel, content: tplForm.content },
      })
      const idx = templates.value.findIndex(t => t.id === tplForm.editingId)
      if (idx !== -1) templates.value[idx] = updated
    } else {
      const created = await $fetch<MessageTemplate>('/api/templates', {
        method: 'POST',
        body: { name: tplForm.name, channel: tplForm.channel, content: tplForm.content },
      })
      templates.value.push(created)
    }
    cancelEditTpl()
    showToast(isEdit ? 'Template atualizado!' : 'Template criado!')
  } catch (e: any) {
    tplError.value = e?.data?.message || e?.message || 'Erro ao salvar template.'
  } finally {
    savingTpl.value = false
  }
}

async function deleteTpl(id: string, name: string) {
  if (!confirm(`Excluir o template "${name}"? Esta acao e irreversivel.`)) return
  try {
    await $fetch(`/api/templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(t => t.id !== id)
    showToast('Template excluido.')
  } catch (e: any) {
    showToast(e?.data?.message || 'Erro ao excluir template.')
  }
}

// ── fix #9: useOutboundMath elimina lógica duplicada ──────────────────
const metaMensal  = computed(() => sf.meta_mensal  || 10000)
const ticketMedio = computed(() => sf.ticket_medio || 2000)
const { projections } = useOutboundMath(metaMensal, ticketMedio)

// ── Audit log ─────────────────────────────────────────────────────────
interface AuditEntry {
  id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  ip: string | null
  created_at: string
  profiles?: { name: string | null } | null
}
const auditLogs    = ref<AuditEntry[]>([])
const auditLoading = ref(false)

async function loadAuditLog() {
  if (profile.value?.role !== 'owner') return
  auditLoading.value = true
  try {
    auditLogs.value = await $fetch<AuditEntry[]>('/api/settings/audit')
  } catch {
    // silently ignore
  } finally {
    auditLoading.value = false
  }
}

function formatAuditDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ── Inicialização ─────────────────────────────────────────────────────
onMounted(async () => {
  await fetchProfile()
  loading.value = false
  loadAuditLog()
  loadTemplates()
  fetchTags()
})

function syncFromOrg(o: NonNullable<typeof org.value>) {
  localOrg.value   = o
  sf.name          = o.name || ''
  sf.meta_mensal   = o.settings?.meta_mensal  ?? 10000
  sf.ticket_medio  = o.settings?.ticket_medio ?? 2000
  tf.product_name  = o.theme?.product_name  || 'Outbound'
  tf.primary_color = o.theme?.primary_color || '#0a0a0a'
  tf.logo_url      = o.theme?.logo_url      || ''
  tf.favicon_url   = o.theme?.favicon_url   || ''
  domainVal.value  = o.custom_domain || ''
}

watch(org, (o) => { if (o) syncFromOrg(o) }, { immediate: true, deep: true })

// ── Membros ───────────────────────────────────────────────────────────
const { data: members, refresh: refreshMembers } = await useAsyncData<(Profile & { email: string })[]>(
  'cfg-members',
  async () => {
    if (!profile.value?.id) return []
    membersLoading.value = true
    try {
      return await $fetch<(Profile & { email: string })[]>('/api/settings/members')
    } catch {
      return []
    } finally {
      membersLoading.value = false
    }
  },
  { watch: [profile] }
)

async function changeMemberRole(memberId: string, role: string) {
  try {
    await $fetch(`/api/settings/members/${memberId}`, { method: 'PATCH', body: { role } })
    await refreshMembers()
    showToast('Papel atualizado!')
  } catch (e: any) {
    showToast(e?.data?.message || 'Erro ao alterar papel.')
  }
}

async function removeMember(memberId: string, memberName: string) {
  if (!confirm(`Remover ${memberName} da equipe? Esta ação é irreversível.`)) return
  try {
    await $fetch(`/api/settings/members/${memberId}`, { method: 'DELETE' })
    await refreshMembers()
    showToast('Membro removido.')
  } catch (e: any) {
    showToast(e?.data?.message || 'Erro ao remover membro.')
  }
}

// ── Handlers ──────────────────────────────────────────────────────────
async function saveSettings() {
  savingSettings.value = true
  settingsError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings', {
      method: 'PATCH',
      body: { name: sf.name, meta_mensal: sf.meta_mensal, ticket_medio: sf.ticket_medio },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    showToast('Configurações salvas!')
  } catch (e: any) {
    settingsError.value = e?.data?.message || e?.message || 'Erro ao salvar.'
  } finally {
    savingSettings.value = false
  }
}

async function saveTheme() {
  savingTheme.value = true
  themeError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings/theme', {
      method: 'PATCH',
      body: {
        product_name:  tf.product_name,
        primary_color: tf.primary_color,
        accent_color:  tf.primary_color,
        logo_url:      tf.logo_url    || null,
        favicon_url:   tf.favicon_url || null,
      },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    applyTheme({
      primary_color: tf.primary_color,
      product_name:  tf.product_name,
      logo_url:      tf.logo_url    || null,
      favicon_url:   tf.favicon_url || null,
    })
    useHead({ title: tf.product_name })
    showToast('Tema aplicado!')
  } catch (e: any) {
    themeError.value = e?.data?.message || e?.message || 'Erro ao salvar.'
  } finally {
    savingTheme.value = false
  }
}

async function saveDomain() {
  savingDomain.value = true
  domainError.value  = null
  try {
    const updated = await $fetch<any>('/api/settings', {
      method: 'PATCH',
      body: { custom_domain: domainVal.value || null },
    })
    syncFromOrg(updated)
    fetchProfile().catch(() => {})
    showToast('Domínio atualizado!')
  } catch (e: any) {
    domainError.value = e?.data?.message || e?.message || 'Domínio inválido ou já em uso.'
  } finally {
    savingDomain.value = false
  }
}

async function sendInvite() {
  inviting.value    = true
  inviteError.value = null
  try {
    await $fetch('/api/settings/invite', {
      method: 'POST',
      body: { email: inviteEmail.value, role: inviteRole.value },
    })
    inviteEmail.value = ''
    inviteRole.value  = 'bdr'
    await refreshMembers()
    showToast('Convite enviado!')
  } catch (e: any) {
    inviteError.value = e?.data?.message || e?.message || 'Erro ao enviar convite.'
  } finally {
    inviting.value = false
  }
}
</script>

<style scoped>
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }

.settings-page {
  --bg:var(--bg-subtle); --surface:#ffffff; --border:var(--border); --border-soft:var(--border-soft);
  --text-1:var(--text-1); --text-2:var(--text-2); --text-3:var(--text-3);
  --accent:#16a34a; --danger:#dc2626; --danger-bg:var(--bad-bg); --danger-bdr:var(--bad-bd);
  --radius-sm:6px; --radius-md:8px; --radius-lg:10px;
  --transition:140ms cubic-bezier(0.16,1,0.3,1);
  font-family:'Geist',-apple-system,sans-serif;
  -webkit-font-smoothing:antialiased;
}
[data-theme="dark"] .settings-page {
  --bg:#131210; --surface:#1c1a18; --border:#2e2c28; --border-soft:#242220;
  --text-1:#e8e4dc; --text-2:#8a857d; --text-3:#5a544c;
  --danger-bg:#2a1515; --danger-bdr:#4a2020;
}
.page-header   { margin-bottom:16px }
.page-title    { font-size:18px;font-weight:600;color:var(--text-1);letter-spacing:-.02em }
.page-sub      { font-size:13px;color:var(--text-3);margin-top:2px }
.loading-state { padding:56px 0 }

.cfg-tabs { display:flex;gap:3px;background:var(--bg-subtle,var(--border-soft));border-radius:10px;padding:3px;width:fit-content;margin-bottom:18px }
.cfg-tab { padding:6px 16px;border-radius:8px;border:none;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:var(--text-2);transition:all .12s }
.cfg-tab.active { background:var(--surface);color:var(--text-1);box-shadow:0 1px 3px rgba(0,0,0,.08) }
.settings-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px }
@media(max-width:820px){ .settings-grid{grid-template-columns:1fr} }

.card { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:16px }
.card-header { font-size:13px;font-weight:500;color:var(--text-1);letter-spacing:-.01em;display:flex;align-items:center;gap:8px }
.badge { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;color:var(--text-3);background:var(--bg);border:1px solid var(--border);padding:2px 6px;border-radius:4px }

.form  { display:flex;flex-direction:column;gap:12px }
.field { display:flex;flex-direction:column;gap:4px }
.label { font-size:11px;color:var(--text-3);letter-spacing:.01em }

.input,.select { background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-1);font-size:13px;padding:7px 10px;width:100%;outline:none;box-sizing:border-box;font-family:inherit;transition:border-color var(--transition),box-shadow var(--transition);-webkit-appearance:none;appearance:none }
.input::placeholder { color:var(--text-3) }
.input:focus,.select:focus { border-color:#193497;box-shadow:0 0 0 3px rgba(25,52,151,.12) }
.mono { font-family:"SF Mono","Fira Code",ui-monospace,monospace;font-size:12px;letter-spacing:.02em }
.select { cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a3a3a3' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:30px }

.alert { font-size:12px;padding:8px 11px;border-radius:var(--radius-sm);border:1px solid;line-height:1.5 }
.alert-error { background:var(--danger-bg);border-color:var(--danger-bdr);color:var(--danger) }

.projections { background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px }
.projections-title { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px }
.projection-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border-soft) }
.projection-row:last-child { border-bottom:none }
.projection-label { font-size:12px;color:var(--text-2) }
.projection-value { font-size:14px;font-weight:500;color:var(--text-1);font-variant-numeric:tabular-nums;letter-spacing:-.02em }

.color-row { display:flex;align-items:center;gap:8px;flex-wrap:wrap }
.color-swatch-wrap { width:34px;height:34px;border-radius:var(--radius-sm);border:1px solid var(--border);overflow:hidden;flex-shrink:0;cursor:pointer }
.color-native { width:200%;height:200%;margin:-50%;border:none;padding:0;cursor:pointer;outline:none }
.presets { display:flex;gap:5px;align-items:center;flex-wrap:wrap }
.preset { width:17px;height:17px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;flex-shrink:0;transition:transform var(--transition),border-color var(--transition) }
.preset:hover { transform:scale(1.2) }
.preset-active { border-color:var(--text-1)!important;transform:scale(1.15) }

.preview-block { border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px;background:var(--bg) }
.preview-title { font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);margin-bottom:10px }
.preview-card { display:flex;align-items:center;gap:10px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 12px }
.preview-logo { width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background var(--transition) }
.preview-name { font-size:12px;font-weight:500;color:var(--text-1) }
.preview-url  { font-size:11px;margin-top:1px;transition:color var(--transition) }
.preview-cta  { margin-left:auto;padding:4px 12px;border-radius:var(--radius-sm);border:none;font-size:11px;font-weight:500;cursor:pointer;color:#fff;flex-shrink:0;transition:opacity var(--transition) }
.preview-cta:hover { opacity:.85 }

.dns-guide { background:var(--bg);border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:12px 14px }
.dns-guide-title { font-size:11px;font-weight:500;color:var(--text-2);margin-bottom:7px }
.dns-steps { font-size:12px;color:var(--text-2);line-height:1.85;padding-left:16px;margin:0 }
.dns-steps code { font-family:"SF Mono","Fira Code",ui-monospace,monospace;font-size:11px;background:var(--border-soft);border:1px solid var(--border);padding:1px 5px;border-radius:3px;color:var(--text-1) }

.domain-status { display:flex;align-items:center;gap:7px;font-size:12px;color:var(--text-2) }
.status-dot  { width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background var(--transition) }
.status-on   { background:var(--accent) }
.status-off  { background:var(--border) }

.members-list  { display:flex;flex-direction:column;gap:2px }
.member-row    { display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:var(--radius-md);transition:background var(--transition);cursor:default }
.member-row:hover { background:var(--bg) }
.avatar        { width:28px;height:28px;border-radius:50%;background:var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-2);flex-shrink:0 }
.member-info   { flex:1;min-width:0 }
.member-name   { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.member-email  { font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.members-empty { font-size:12px;color:var(--text-3);padding:6px 10px }
.role-tag      { font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px;letter-spacing:.03em;flex-shrink:0 }
.role-owner    { background:var(--accent-soft);color:#193497;border:1px solid var(--accent-bd) }
.role-default  { background:var(--bg);color:var(--text-3);border:1px solid var(--border) }

.invite-box   { border-top:1px solid var(--border-soft);padding-top:16px;display:flex;flex-direction:column;gap:10px }
.invite-title { font-size:12px;font-weight:500;color:var(--text-1) }

.btn { display:flex;align-items:center;justify-content:center;gap:7px;padding:8px 14px;border-radius:var(--radius-md);font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text-1);width:100%;font-family:inherit;letter-spacing:-.01em;transition:background var(--transition),border-color var(--transition),transform var(--transition) }
.btn:hover:not(:disabled) { background:var(--bg);border-color:var(--border) }
.btn:active:not(:disabled) { transform:scale(.99) }
.btn:disabled { opacity:.45;cursor:not-allowed }
.btn-primary  { background:#193497;color:#fff;border-color:transparent }
.btn-primary:hover:not(:disabled) { background:#0f2480;border-color:transparent }

@keyframes spin { to{transform:rotate(360deg)} }
.spinner { width:12px;height:12px;border:1.5px solid rgba(255,255,255,.25);border-top-color:#fff;border-radius:50%;animation:spin .65s linear infinite;flex-shrink:0 }
.spinner-dark { border-color:rgba(0,0,0,.1);border-top-color:var(--text-2) }

.audit-table-wrap { overflow-x:auto;border:1px solid var(--border-soft);border-radius:var(--radius-md) }
.audit-table { width:100%;border-collapse:collapse;font-size:12px }
.audit-table th { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);padding:8px 12px;border-bottom:1px solid var(--border-soft);text-align:left;white-space:nowrap;background:var(--bg) }
.audit-table td { padding:8px 12px;border-bottom:1px solid var(--border-soft);vertical-align:middle }
.audit-table tr:last-child td { border-bottom:none }
.audit-table tr:hover td { background:var(--bg) }
.audit-action { font-size:11px;font-family:"SF Mono","Fira Code",ui-monospace,monospace;background:var(--bg);border:1px solid var(--border);padding:2px 6px;border-radius:4px;color:var(--text-1) }

.toast { position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--text-1);color:#fff;font-size:13px;font-weight:500;padding:9px 16px;border-radius:var(--radius-md);display:flex;align-items:center;gap:7px;box-shadow:0 4px 20px rgba(0,0,0,.18);z-index:9999;white-space:nowrap;pointer-events:none;letter-spacing:-.01em }
.toast-enter-active { transition:all .2s cubic-bezier(0.16,1,0.3,1) }
.toast-leave-active { transition:all .15s ease-in }
.toast-enter-from   { opacity:0;transform:translateX(-50%) translateY(8px) scale(.96) }
.toast-leave-to     { opacity:0;transform:translateX(-50%) translateY(4px) scale(.98) }

.tag-mgr-list { display:flex;flex-direction:column;gap:6px;margin-bottom:12px }
.tag-mgr-row { display:flex;align-items:center;gap:8px }
.tag-mgr-color { width:32px;height:32px;padding:0;border:1px solid var(--border);border-radius:7px;background:none;cursor:pointer;flex-shrink:0 }
.tag-mgr-name { flex:1 }
.tag-mgr-del { width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1px solid var(--danger-bdr);background:transparent;color:var(--danger);border-radius:7px;cursor:pointer }
.tag-mgr-del:hover { background:var(--danger-bg) }
.tag-mgr-create { display:flex;align-items:center;gap:8px;border-top:1px solid var(--border-soft);padding-top:12px }

.tpl-channel-tag { font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;flex-shrink:0;letter-spacing:.03em }
.tpl-ch-whatsapp { background:var(--ok-bg);color:var(--ok) }
.tpl-ch-email    { background:var(--info-bg);color:var(--info) }
.tpl-ch-ligacao  { background:var(--warn-bg);color:var(--warn) }
.tpl-ch-linkedin { background:var(--info-bg);color:#3730a3 }
.tpl-ch-outro    { background:var(--bg);color:var(--text-3);border:1px solid var(--border) }
</style>
