import { supabase } from './supabaseClient';

export function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export async function createRoom(creatorId) {
  const short_code = generateShortCode();
  const expires_at = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('rooms')
    .insert({ short_code, status: 'waiting', creator_id: creatorId, expires_at })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelRoom(roomId) {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);
  if (error) throw error;
}

export async function submitCreatorSide(roomId, sideA) {
  const { error } = await supabase
    .from('rooms')
    .update({ side_a: sideA })
    .eq('id', roomId);
  if (error) throw error;
}
