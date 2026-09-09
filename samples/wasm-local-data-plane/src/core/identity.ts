import { ContactRecord, UserRecord } from './types';

export function resolveContact(user: UserRecord, contacts: ContactRecord[]): ContactRecord | undefined { return contacts.find(contact => contact.email.trim().toLowerCase() === user.mail.trim().toLowerCase()); }
