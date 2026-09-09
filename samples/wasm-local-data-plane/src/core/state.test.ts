import { OutboxState, transitionOutbox } from './state';

describe('outbox and conflict transitions', () => {
  test('pending -> sending -> sent and conflict is terminal until resolution', () => {
    expect(transitionOutbox('pending', 'send')).toBe('sending');
    expect(transitionOutbox('sending', 'success')).toBe('sent');
    expect(transitionOutbox('sending', 'conflict')).toBe('conflict');
    expect(transitionOutbox('conflict', 'send')).toBe('conflict');
    const all: OutboxState[] = ['pending', 'sending', 'sent', 'conflict', 'failed'];
    expect(all).toContain(transitionOutbox('failed', 'retry'));
  });
});
