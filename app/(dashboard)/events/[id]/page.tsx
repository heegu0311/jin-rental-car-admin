import { createClient } from '@/lib/supabase/server'
import { EventForm } from '../EventForm'
import { notFound } from 'next/navigation'

interface EditEventPageProps {
  params: Promise<{ id: string }>
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !event) {
    notFound()
  }

  return (
    <EventForm 
      initialData={{
        id: event.id,
        title: event.title,
        description: event.description || '',
        image_url: event.image_url || '',
        start_date: event.start_date || '',
        end_date: event.end_date || '',
        is_active: event.is_active
      }} 
    />
  )
}
