import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
export async function requireAdmin() {
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect('/login');
 const {data:profile,error}=await db.from('profiles').select('role').eq('id',user.id).single();
 if(error||!profile||!['admin','superadmin'].includes(profile.role))redirect('/login?error=unauthorized');
 return {db,user};
}
