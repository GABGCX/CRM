<template>
  <!-- Aba "Equipe": membros, convite e log de auditoria. -->
  <div class="card">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
      Equipe
      <span v-if="members?.length" class="badge">{{ members.length }}</span>
    </div>

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

  <div v-if="profile?.role === 'owner'" class="card" style="grid-column:1/-1">
    <div class="card-header">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#0f62fe;flex-shrink:0">
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

<script setup lang="ts">
import type { Profile } from '~/types'

const emit = defineEmits<{ notify: [msg: string] }>()

const { profile } = useProfile()

const ROLE_LABELS: Record<string, string> = { owner:'Proprietário', admin:'Admin', bdr:'BDR' }

// ── Membros ───────────────────────────────────────────────────────────
const membersLoading = ref(false)
const inviteEmail = ref('')
const inviteRole  = ref('bdr')
const inviting    = ref(false)
const inviteError = ref<string | null>(null)

// Sem await: o componente monta sob v-if (apos o Suspense da pagina ja resolver);
// um setup async aqui re-disparesaria o fallback. Os refs populam reativamente.
const { data: members, refresh: refreshMembers } = useAsyncData<(Profile & { email: string })[]>(
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
    emit('notify', 'Papel atualizado!')
  } catch (e: any) {
    emit('notify', e?.data?.message || 'Erro ao alterar papel.')
  }
}

async function removeMember(memberId: string, memberName: string) {
  if (!confirm(`Remover ${memberName} da equipe? Esta ação é irreversível.`)) return
  try {
    await $fetch(`/api/settings/members/${memberId}`, { method: 'DELETE' })
    await refreshMembers()
    emit('notify', 'Membro removido.')
  } catch (e: any) {
    emit('notify', e?.data?.message || 'Erro ao remover membro.')
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
    emit('notify', 'Convite enviado!')
  } catch (e: any) {
    inviteError.value = e?.data?.message || e?.message || 'Erro ao enviar convite.'
  } finally {
    inviting.value = false
  }
}

// ── Auditoria ─────────────────────────────────────────────────────────
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

onMounted(() => { loadAuditLog() })
</script>

<style scoped>
.members-list  { display:flex;flex-direction:column;gap:2px }
.member-row    { display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:var(--radius-md);transition:background var(--transition);cursor:default }
.member-row:hover { background:var(--bg) }
.avatar        { width:28px;height:28px;border-radius:50%;background:var(--border-soft);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-2);flex-shrink:0 }
.member-info   { flex:1;min-width:0 }
.member-name   { font-size:13px;font-weight:500;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.member-email  { font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis }
.members-empty { font-size:12px;color:var(--text-3);padding:6px 10px }
.role-tag      { font-size:10px;font-weight:500;padding:2px 7px;border-radius:4px;letter-spacing:.03em;flex-shrink:0 }
.role-owner    { background:var(--accent-soft);color:#0f62fe;border:1px solid var(--accent-bd) }
.role-default  { background:var(--bg);color:var(--text-3);border:1px solid var(--border) }

.invite-box   { border-top:1px solid var(--border-soft);padding-top:16px;display:flex;flex-direction:column;gap:10px }

.audit-table-wrap { overflow-x:auto;border:1px solid var(--border-soft);border-radius:var(--radius-md) }
.audit-table { width:100%;border-collapse:collapse;font-size:12px }
.audit-table th { font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:var(--text-3);padding:8px 12px;border-bottom:1px solid var(--border-soft);text-align:left;white-space:nowrap;background:var(--bg) }
.audit-table td { padding:8px 12px;border-bottom:1px solid var(--border-soft);vertical-align:middle }
.audit-table tr:last-child td { border-bottom:none }
.audit-table tr:hover td { background:var(--bg) }
.audit-action { font-size:11px;font-family:"SF Mono","Fira Code",ui-monospace,monospace;background:var(--bg);border:1px solid var(--border);padding:2px 6px;border-radius:4px;color:var(--text-1) }
</style>
