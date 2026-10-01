/**
 * Real-Time Per-Device Classroom Telemetry Stream
 *
 * Utilizes Supabase Realtime Broadcast Channels (1 Hz packets) to stream
 * lightweight student attention state packets: { studentId, state, focusScore, timestamp }.
 *
 * Includes fallback local event dispatcher for offline / local-development modes.
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export interface TelemetryPacket {
  studentId: string | number;
  studentName?: string;
  state: string;
  focusScore: number;
  timestamp: number;
}

export type TelemetryCallback = (packet: TelemetryPacket) => void;

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    });
  } catch (err) {
    console.warn('Supabase Realtime client failed to initialize:', err);
  }
}

const activeChannels = new Map<string, RealtimeChannel>();
const lastSendTimes = new Map<string, number>();

/**
 * Publishes a 1 Hz telemetry packet to the classroom's realtime broadcast channel.
 * Automatically throttles to a maximum rate of 1 packet per second per student.
 */
export async function publishTelemetry(classId: string, packet: TelemetryPacket): Promise<void> {
  const throttleKey = `${classId}:${packet.studentId}`;
  const now = Date.now();
  const lastTime = lastSendTimes.get(throttleKey) || 0;

  // Rate-limit to 1 packet per second
  if (now - lastTime < 950) {
    return;
  }
  lastSendTimes.set(throttleKey, now);

  // Dispatch locally for same-window / local testing
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cognilearn:telemetry', {
        detail: { classId, packet },
      })
    );
  }

  if (!supabaseClient) return;

  try {
    const channelName = `classroom:${classId}`;
    let channel = activeChannels.get(channelName);

    if (!channel) {
      channel = supabaseClient.channel(channelName);
      activeChannels.set(channelName, channel);
      await channel.subscribe();
    }

    await channel.send({
      type: 'broadcast',
      event: 'telemetry',
      payload: packet,
    });
  } catch (err) {
    console.warn('Realtime telemetry broadcast error:', err);
  }
}

/**
 * Subscribes to 1 Hz telemetry packets for a classroom.
 * Returns an unsubscribe callback.
 */
export function subscribeToTelemetry(classId: string, callback: TelemetryCallback): () => void {
  // Listen to local fallback events
  const localHandler = (e: Event) => {
    const customEvent = e as CustomEvent<{ classId: string; packet: TelemetryPacket }>;
    if (customEvent.detail && customEvent.detail.classId === classId) {
      callback(customEvent.detail.packet);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('cognilearn:telemetry', localHandler);
  }

  let channel: RealtimeChannel | null = null;
  const channelName = `classroom:${classId}`;

  if (supabaseClient) {
    channel = activeChannels.get(channelName) || supabaseClient.channel(channelName);
    activeChannels.set(channelName, channel);

    channel.on('broadcast', { event: 'telemetry' }, (payload) => {
      if (payload.payload) {
        callback(payload.payload as TelemetryPacket);
      }
    });

    channel.subscribe();
  }

  // Unsubscribe cleanup
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('cognilearn:telemetry', localHandler);
    }
    if (channel && supabaseClient) {
      supabaseClient.removeChannel(channel);
      activeChannels.delete(channelName);
    }
  };
}
