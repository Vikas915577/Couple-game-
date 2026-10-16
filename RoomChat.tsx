import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { MessageCircle, Send, ShieldCheck } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';

interface RoomMessage {
  id: number;
  room_id: string;
  user_id: string;
  display_name: string;
  body: string;
  created_at: string;
}

export function RoomChat({ roomId, myUserId }: { roomId: string; myUserId: string | null }) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const client = requireSupabase();
    const loadMessages = async () => {
      const { data, error: queryError } = await client.from('room_messages')
        .select('id, room_id, user_id, display_name, body, created_at')
        .eq('room_id', roomId).order('created_at', { ascending: false }).limit(60);
      if (cancelled) return;
      if (queryError) { setError(`Chat setup needed: ${queryError.message}`); setLoading(false); return; }
      setMessages(((data ?? []) as RoomMessage[]).reverse());
      setLoading(false);
    };
    void loadMessages();
    const channel = client.channel(`room-chat:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        const row = payload.new as RoomMessage;
        if (!cancelled) setMessages((current) => current.some((m) => m.id === row.id) ? current : [...current, row].slice(-60));
      })
      .subscribe((status, subscribeError) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          if (!cancelled) setError(subscribeError?.message ?? 'Chat connection paused. Refresh the room to reconnect.');
        }
      });
    return () => { cancelled = true; void client.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    if (body.length > 500) { setError('Messages are limited to 500 characters.'); return; }
    setSending(true); setError('');
    try {
      const { error: rpcError } = await requireSupabase().rpc('send_room_message', { p_room_id: roomId, p_body: body });
      if (rpcError) throw new Error(rpcError.message);
      setDraft('');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Message could not be sent. Apply the V1.1 SQL migration and retry.');
    } finally { setSending(false); }
  }

  return <section className="room-chat" aria-label="Room chat">
    <div className="room-chat-heading"><div className="room-chat-icon"><MessageCircle size={18} /></div><div><strong>Room chat</strong><span>Talk while you play</span></div><span className="chat-live-pill"><i /> LIVE</span></div>
    <div className="room-chat-messages" ref={listRef} aria-live="polite">
      {loading ? <p className="chat-empty">Loading messages…</p> : messages.length === 0 ? <p className="chat-empty">Say hello 👋 The first message starts the chat.</p> : messages.map((message) => <div key={message.id} className={`chat-message ${message.user_id === myUserId ? 'mine' : ''}`}><span className="chat-message-name">{message.user_id === myUserId ? 'You' : message.display_name}</span><p>{message.body}</p><time>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>)}
    </div>
    {error && <p className="chat-error" role="alert">{error}</p>}
    <form className="room-chat-form" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="Message your friends…" aria-label="Chat message" /><button className="button button-primary" type="submit" disabled={sending || !draft.trim()} aria-label="Send message"><Send size={16} /></button></form>
    <p className="chat-safety"><ShieldCheck size={13} /> Room members only · Be kind · Don’t share private information</p>
  </section>;
}
