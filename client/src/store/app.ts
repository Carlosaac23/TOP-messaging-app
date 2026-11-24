import { create } from 'zustand';

export type Person = { id: string; username: string; displayName: string; bio: string };
export type User = Person & { email: string; createdAt: string };
export type Message = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  sender: Pick<Person, 'id' | 'username' | 'displayName'>;
};
export type Conversation = {
  id: string;
  updatedAt: string;
  participants: { user: Person }[];
  messages: Message[];
};

type FormName = 'login' | 'register' | 'profile' | 'search' | 'message';
type Forms = Record<FormName, Record<string, string>>;
const initialForms: Forms = {
  login: { email: '', password: '' },
  register: { email: '', username: '', password: '', displayName: '' },
  profile: { displayName: '', bio: '' },
  search: { query: '' },
  message: { body: '' },
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (
      response.status === 401 &&
      !path.startsWith('/auth/login') &&
      !path.startsWith('/auth/register')
    )
      useApp.getState().expire();
    throw new ApiError(data.error || 'Something went wrong. Please try again.', response.status);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

type Store = {
  user: User | null;
  session: 'loading' | 'ready' | 'error';
  sessionError: string;
  forms: Forms;
  errors: Record<string, string>;
  busy: Record<string, boolean>;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  users: Person[];
  setField: (form: FormName, field: string, value: string) => void;
  clearError: (key: string) => void;
  expire: () => void;
  restore: () => Promise<void>;
  authenticate: (kind: 'login' | 'register') => Promise<boolean>;
  logout: () => Promise<boolean>;
  saveProfile: () => Promise<boolean>;
  loadConversations: (quiet?: boolean) => Promise<void>;
  loadMessages: (id: string, quiet?: boolean) => Promise<void>;
  searchUsers: () => Promise<void>;
  startConversation: (id: string) => Promise<string | null>;
  sendMessage: (id: string) => Promise<boolean>;
};
let sessionVersion = 0;
let searchVersion = 0;
let conversationsRequest = 0;
const messageRequests: Record<string, number> = {};
export const useApp = create<Store>((set, get) => {
  const pending = (key: string, value: boolean) =>
    set(s => ({ busy: { ...s.busy, [key]: value } }));
  const fail = (key: string, error: unknown) =>
    set(s => ({ errors: { ...s.errors, [key]: errorMessage(error) } }));
  const clear = (key: string) => set(s => ({ errors: { ...s.errors, [key]: '' } }));
  return {
    user: null,
    session: 'loading',
    sessionError: '',
    forms: structuredClone(initialForms),
    errors: {},
    busy: {},
    conversations: [],
    messages: {},
    users: [],
    setField: (form, field, value) => {
      if (form === 'search') searchVersion++;
      set(s => ({ forms: { ...s.forms, [form]: { ...s.forms[form], [field]: value } } }));
    },
    clearError: clear,
    expire: () => {
      sessionVersion++;
      searchVersion++;
      set({
        user: null,
        session: 'ready',
        conversations: [],
        messages: {},
        users: [],
        forms: structuredClone(initialForms),
        errors: {},
        busy: {},
      });
    },
    restore: async () => {
      const version = sessionVersion;
      set({ session: 'loading', sessionError: '' });
      try {
        const { user } = await api<{ user: User }>('/auth/me');
        if (version === sessionVersion) set({ user, session: 'ready' });
      } catch (error) {
        if (version !== sessionVersion) return;
        if (error instanceof ApiError && error.status === 401)
          set({ user: null, session: 'ready' });
        else set({ session: 'error', sessionError: errorMessage(error) });
      }
    },
    authenticate: async kind => {
      pending(kind, true);
      clear(kind);
      try {
        const fields = get().forms[kind];
        const body =
          kind === 'register'
            ? { ...fields, ...(fields.displayName.trim() ? {} : { displayName: undefined }) }
            : fields;
        const { user } = await api<{ user: User }>(`/auth/${kind}`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
        sessionVersion++;
        set(s => ({
          user,
          session: 'ready',
          forms: { ...s.forms, login: initialForms.login, register: initialForms.register },
        }));
        return true;
      } catch (error) {
        fail(kind, error);
        return false;
      } finally {
        pending(kind, false);
      }
    },
    logout: async () => {
      pending('logout', true);
      clear('profile');
      try {
        await api('/auth/logout', { method: 'POST' });
        get().expire();
        return true;
      } catch (error) {
        fail('profile', error);
        return false;
      } finally {
        pending('logout', false);
      }
    },
    saveProfile: async () => {
      pending('profile', true);
      clear('profile');
      try {
        const { user } = await api<{ user: User }>('/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(get().forms.profile),
        });
        set({ user });
        return true;
      } catch (error) {
        fail('profile', error);
        return false;
      } finally {
        pending('profile', false);
      }
    },
    loadConversations: async (quiet = false) => {
      const request = ++conversationsRequest;
      const version = sessionVersion;
      if (!quiet) pending('conversations', true);
      try {
        const { conversations } = await api<{ conversations: Conversation[] }>('/conversations');
        if (version === sessionVersion && request === conversationsRequest) {
          set({ conversations });
          clear('conversations');
        }
      } catch (error) {
        if (version === sessionVersion) fail('conversations', error);
      } finally {
        if (version === sessionVersion && !quiet) pending('conversations', false);
      }
    },
    loadMessages: async (id, quiet = false) => {
      const request = (messageRequests[id] ?? 0) + 1;
      messageRequests[id] = request;
      const version = sessionVersion;
      if (!quiet) pending(`messages:${id}`, true);
      try {
        const { messages } = await api<{ messages: Message[] }>(
          `/conversations/${encodeURIComponent(id)}/messages`
        );
        if (version === sessionVersion && request === messageRequests[id]) {
          set(s => ({ messages: { ...s.messages, [id]: messages } }));
          clear(`messages:${id}`);
        }
      } catch (error) {
        if (version === sessionVersion) fail(`messages:${id}`, error);
      } finally {
        if (version === sessionVersion && !quiet) pending(`messages:${id}`, false);
      }
    },
    searchUsers: async () => {
      const version = ++searchVersion;
      pending('search', true);
      clear('search');
      try {
        const { users } = await api<{ users: Person[] }>(
          `/users?search=${encodeURIComponent(get().forms.search.query)}`
        );
        if (version === searchVersion) set({ users });
      } catch (error) {
        if (version === searchVersion) fail('search', error);
      } finally {
        if (version === searchVersion) pending('search', false);
      }
    },
    startConversation: async id => {
      pending('start', true);
      clear('search');
      try {
        const { conversation } = await api<{ conversation: { id: string } }>('/conversations', {
          method: 'POST',
          body: JSON.stringify({ userId: id }),
        });
        await get().loadConversations();
        return conversation.id;
      } catch (error) {
        fail('search', error);
        return null;
      } finally {
        pending('start', false);
      }
    },
    sendMessage: async id => {
      const body = get().forms.message.body.trim();
      if (!body || body.length > 4000) return false;
      pending('send', true);
      clear('send');
      try {
        await api(`/conversations/${encodeURIComponent(id)}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body }),
        });
        if (get().forms.message.body.trim() === body) get().setField('message', 'body', '');
        await Promise.all([get().loadMessages(id, true), get().loadConversations(true)]);
        return true;
      } catch (error) {
        fail('send', error);
        return false;
      } finally {
        pending('send', false);
      }
    },
  };
});
