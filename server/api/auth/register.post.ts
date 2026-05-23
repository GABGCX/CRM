// server/api/auth/register.post.ts
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const schema = z.object({
  name:     z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(8),
  org_name: z.string().min(2),
  org_slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password, org_name, org_slug } = parsed.data
  const config = useRuntimeConfig()

  // Admin client — ignora RLS
  const admin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // 1. Verificar slug único
  const { data: existing } = await admin
    .from('organizations').select('id').eq('slug', org_slug).single()
  if (existing) return { error: 'Este subdomínio já está em uso. Escolha outro.' }

  // 2. Criar organização
  const { data: org, error: orgErr } = await admin
    .from('organizations').insert({ name: org_name, slug: org_slug }).select().single()
  if (orgErr || !org) return { error: 'Erro ao criar organização.' }

  // 3. Criar usuário
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { name, org_id: org.id },
  })

  if (authErr || !authData.user) {
    await admin.from('organizations').delete().eq('id', org.id)
    return { error: 'E-mail já em uso ou erro ao criar conta.' }
  }

  // 4. Criar profile como owner
  const { error: profileErr } = await admin.from('profiles').insert({
    id: authData.user.id,
    org_id: org.id,
    name,
    role: 'owner',
  })

  if (profileErr) {
    await admin.auth.admin.deleteUser(authData.user.id)
    await admin.from('organizations').delete().eq('id', org.id)
    return { error: 'Erro ao configurar perfil.' }
  }

  return { ok: true }
})
