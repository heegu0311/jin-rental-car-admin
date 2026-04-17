import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { NoticeForm } from '../NoticeForm'

interface EditNoticePageProps {
  params: Promise<{ id: string }>
}

export default async function EditNoticePage({ params }: EditNoticePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notice, error } = await supabase
    .from('notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !notice) {
    notFound()
  }

  return <NoticeForm initialData={notice} />
}
