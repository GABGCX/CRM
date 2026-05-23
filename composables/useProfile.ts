// composables/useProfile.ts
// Busca profile e org do usuário autenticado.
// useState garante que o estado é compartilhado entre SSR e cliente.

import type { Profile, Organization } from '~/types'

export const useProfile = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<Profile | null>('profile', () => null)
  const org = useState<Organization | null>('org', () => null)
  const loading = useState<boolean>('profile:loading', () => false)

  async function fetchProfile() {
    if (!user.value) return
    loading.value = true
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.value.id)
        .single()

      if (data) {
        profile.value = data as Profile
        org.value = (data as any).organizations as Organization
      }
    } finally {
      loading.value = false
    }
  }

  return { profile, org, loading, fetchProfile }
}
