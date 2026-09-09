export type OutboxState = 'pending' | 'sending' | 'sent' | 'conflict' | 'failed';
export type OutboxEvent = 'send' | 'success' | 'conflict' | 'failure' | 'retry';
export function transitionOutbox(state: OutboxState, event: OutboxEvent): OutboxState {
  if (state === 'pending' && event === 'send') return 'sending';
  if (state === 'sending' && event === 'success') return 'sent';
  if (state === 'sending' && event === 'conflict') return 'conflict';
  if ((state === 'sending' || state === 'pending') && event === 'failure') return 'failed';
  if (state === 'failed' && event === 'retry') return 'pending';
  return state;
}
