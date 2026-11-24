import { ArrowLeft, LogOut, MessageCircle, Plus, Search, Send, UserRound } from 'lucide-react';
import { useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Message, MessageContent, MessageFooter } from '@/components/ui/message';
import {
  MessageScroller,
  MessageScrollerProvider,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerButton,
} from '@/components/ui/message-scroller';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useApp, type Person } from '@/store/app';

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}
function PersonAvatar({ name }: { name: string }) {
  return (
    <Avatar size='lg'>
      <AvatarFallback>{initials(name) || '?'}</AvatarFallback>
    </Avatar>
  );
}
function ErrorNotice({ message, retry }: { message?: string; retry?: () => void }) {
  return message ? (
    <Alert variant='destructive' role='alert'>
      <AlertDescription>
        {message}
        {retry && (
          <Button className='mt-2' variant='outline' size='sm' onClick={retry}>
            Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  ) : null;
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
function PageHeader({ title }: { title: string }) {
  return (
    <header className='flex items-center gap-4 border-b px-5 py-4'>
      <Button
        variant='ghost'
        size='icon'
        nativeButton={false}
        render={<Link to='/inbox' aria-label='Back to inbox' />}
      >
        <ArrowLeft />
      </Button>
      <h1 className='text-lg font-semibold'>{title}</h1>
    </header>
  );
}
export function Inbox() {
  const { conversationId } = useParams();
  const user = useApp(s => s.user)!;
  const conversations = useApp(s => s.conversations);
  const messages = useApp(s => (conversationId ? s.messages[conversationId] : undefined));
  const error = useApp(s => s.errors);
  const busy = useApp(s => s.busy);
  const body = useApp(s => s.forms.message.body);
  const setField = useApp(s => s.setField);
  const loadConversations = useApp(s => s.loadConversations);
  const loadMessages = useApp(s => s.loadMessages);
  const sendMessage = useApp(s => s.sendMessage);
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    if (conversationId) {
      void loadMessages(conversationId);
      setField('message', 'body', '');
    }
  }, [conversationId, loadMessages, setField]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void loadConversations(true);
        if (conversationId) void loadMessages(conversationId, true);
      }
    };
    const timer = window.setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [conversationId, loadConversations, loadMessages]);
  const selected = conversations.find(item => item.id === conversationId);
  const person = selected?.participants.find(item => item.user.id !== user.id)?.user;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (conversationId && !busy.send) await sendMessage(conversationId);
  }
  return (
    <main className='mx-auto flex h-svh max-w-7xl overflow-hidden border-x'>
      <aside
        className={cn(
          'flex w-full shrink-0 flex-col border-r md:w-80 lg:w-96',
          conversationId && 'hidden md:flex'
        )}
      >
        <div className='flex items-center justify-between gap-3 border-b px-5 py-5'>
          <div>
            <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              Messaging App
            </p>
            <h1 className='mt-1 text-2xl font-semibold'>Conversations</h1>
          </div>
          <div className='flex gap-1'>
            <Button
              variant='outline'
              size='icon-lg'
              nativeButton={false}
              render={<Link to='/new' aria-label='New conversation' />}
            >
              <Plus />
            </Button>
            <Button
              variant='ghost'
              size='icon-lg'
              nativeButton={false}
              render={<Link to='/profile' aria-label='Profile' />}
            >
              <UserRound />
            </Button>
          </div>
        </div>
        <div className='flex-1 overflow-y-auto p-3'>
          <ErrorNotice message={error.conversations} retry={() => void loadConversations()} />
          {busy.conversations && !conversations.length ? (
            <div className='flex flex-col gap-3 p-3'>
              <Skeleton className='h-14 w-full' />
              <Skeleton className='h-14 w-full' />
            </div>
          ) : conversations.length ? (
            <ul className='flex flex-col gap-1'>
              {conversations.map(item => {
                const other = item.participants.find(
                  participant => participant.user.id !== user.id
                )?.user;
                const last = item.messages[0];
                return (
                  <li key={item.id}>
                    <Link
                      className={cn(
                        'flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted',
                        item.id === conversationId && 'bg-muted'
                      )}
                      to={`/inbox/${encodeURIComponent(item.id)}`}
                    >
                      <PersonAvatar name={other?.displayName || '?'} />
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between gap-2'>
                          <span className='truncate font-medium'>
                            {other?.displayName || 'Conversation'}
                          </span>
                          {last && (
                            <time
                              className='shrink-0 text-xs text-muted-foreground'
                              dateTime={last.createdAt}
                            >
                              {new Date(last.createdAt).toLocaleDateString()}
                            </time>
                          )}
                        </div>
                        <p className='truncate text-sm text-muted-foreground'>
                          {last
                            ? `${last.senderId === user.id ? 'You: ' : ''}${last.body}`
                            : 'Start the conversation'}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            !error.conversations && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No conversations yet</EmptyTitle>
                  <EmptyDescription>Find someone and say hello.</EmptyDescription>
                </EmptyHeader>
                <Button nativeButton={false} render={<Link to='/new' />}>
                  Start a conversation
                </Button>
              </Empty>
            )
          )}
        </div>
        <Link className='flex items-center gap-3 border-t p-4 hover:bg-muted' to='/profile'>
          <PersonAvatar name={user.displayName} />
          <div className='min-w-0'>
            <p className='truncate font-medium'>{user.displayName}</p>
            <p className='truncate text-sm text-muted-foreground'>@{user.username}</p>
          </div>
        </Link>
      </aside>
      {conversationId ? (
        <section className='flex min-w-0 flex-1 flex-col'>
          <header className='flex items-center gap-3 border-b px-4 py-4'>
            <Button
              className='md:hidden'
              variant='ghost'
              size='icon'
              nativeButton={false}
              render={<Link to='/inbox' aria-label='Back to conversations' />}
            >
              <ArrowLeft />
            </Button>
            <PersonAvatar name={person?.displayName || '?'} />
            <div className='min-w-0'>
              <h2 className='truncate font-semibold'>{person?.displayName || 'Conversation'}</h2>
              {person && <p className='text-sm text-muted-foreground'>@{person.username}</p>}
            </div>
          </header>
          <MessageScrollerProvider key={conversationId}>
            <MessageScroller className='flex-1'>
              <MessageScrollerViewport aria-label='Messages'>
                <MessageScrollerContent className='p-4 sm:p-6'>
                  <ErrorNotice
                    message={error[`messages:${conversationId}`]}
                    retry={() => void loadMessages(conversationId)}
                  />
                  {busy[`messages:${conversationId}`] && !messages ? (
                    <div className='flex flex-col gap-3'>
                      <Skeleton className='h-12 w-2/3' />
                      <Skeleton className='ml-auto h-12 w-1/2' />
                    </div>
                  ) : messages?.length ? (
                    <div className='flex flex-col gap-4' role='list'>
                      {messages.map(message => (
                        <Message
                          key={message.id}
                          role='listitem'
                          align={message.senderId === user.id ? 'end' : 'start'}
                        >
                          <MessageContent>
                            <Bubble variant={message.senderId === user.id ? 'default' : 'muted'}>
                              <BubbleContent className='whitespace-pre-wrap'>
                                {message.body}
                              </BubbleContent>
                            </Bubble>
                            <MessageFooter>
                              <time dateTime={message.createdAt}>
                                {dateLabel(message.createdAt)}
                              </time>
                            </MessageFooter>
                          </MessageContent>
                        </Message>
                      ))}
                    </div>
                  ) : (
                    !error[`messages:${conversationId}`] && (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>Say hello</EmptyTitle>
                          <EmptyDescription>Your conversation starts here.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    )
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
          <form className='flex flex-col gap-2 border-t p-4' onSubmit={submit}>
            <ErrorNotice message={error.send} />
            <div className='flex items-end gap-2'>
              <label className='sr-only' htmlFor='message'>
                Message
              </label>
              <Textarea
                id='message'
                className='max-h-36 min-h-11 resize-y'
                placeholder='Write a message…'
                value={body}
                maxLength={4000}
                onChange={e => setField('message', 'body', e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <Button
                aria-label='Send message'
                size='icon-lg'
                type='submit'
                disabled={busy.send || !body.trim()}
              >
                <Send />
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Enter to send · Shift + Enter for a new line
            </p>
          </form>
        </section>
      ) : (
        <section className='hidden flex-1 items-center justify-center md:flex'>
          <Empty>
            <EmptyHeader>
              <MessageCircle className='mx-auto mb-3 size-10 text-muted-foreground' />
              <EmptyTitle>Your conversations live here</EmptyTitle>
              <EmptyDescription>Choose a conversation or start a new one.</EmptyDescription>
            </EmptyHeader>
            <Button nativeButton={false} render={<Link to='/new' />}>
              New conversation
            </Button>
          </Empty>
        </section>
      )}
    </main>
  );
}
export function NewConversation() {
  const navigate = useNavigate();
  const query = useApp(s => s.forms.search.query);
  const users = useApp(s => s.users);
  const error = useApp(s => s.errors.search);
  const busy = useApp(s => s.busy);
  const setField = useApp(s => s.setField);
  const search = useApp(s => s.searchUsers);
  const start = useApp(s => s.startConversation);
  useEffect(() => {
    const timer = window.setTimeout(() => void search(), 250);
    return () => window.clearTimeout(timer);
  }, [query, search]);
  async function select(person: Person) {
    const id = await start(person.id);
    if (id) navigate(`/inbox/${encodeURIComponent(id)}`);
  }
  return (
    <main className='mx-auto min-h-svh max-w-2xl border-x'>
      <PageHeader title='New conversation' />
      <div className='flex flex-col gap-5 p-5'>
        <div>
          <label className='sr-only' htmlFor='search'>
            Search people
          </label>
          <div className='relative'>
            <Search
              aria-hidden='true'
              className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              className='pl-9'
              id='search'
              placeholder='Search by name or username'
              maxLength={50}
              value={query}
              onChange={e => setField('search', 'query', e.target.value)}
            />
          </div>
        </div>
        <ErrorNotice message={error} retry={() => void search()} />
        {busy.search ? (
          <div className='flex flex-col gap-3'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        ) : users.length ? (
          <ul className='flex flex-col gap-1'>
            {users.map(person => (
              <li key={person.id}>
                <button
                  className='flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-muted disabled:opacity-50'
                  disabled={busy.start}
                  onClick={() => void select(person)}
                >
                  <PersonAvatar name={person.displayName} />
                  <span className='min-w-0'>
                    <span className='block truncate font-medium'>{person.displayName}</span>
                    <span className='block truncate text-sm text-muted-foreground'>
                      @{person.username}
                      {person.bio && ` · ${person.bio}`}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !error && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No people found</EmptyTitle>
                <EmptyDescription>Try another search or come back later.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        )}
      </div>
    </main>
  );
}
export function Profile() {
  const navigate = useNavigate();
  const user = useApp(s => s.user)!;
  const form = useApp(s => s.forms.profile);
  const setField = useApp(s => s.setField);
  const save = useApp(s => s.saveProfile);
  const logout = useApp(s => s.logout);
  const error = useApp(s => s.errors.profile);
  const busy = useApp(s => s.busy);
  useEffect(() => {
    setField('profile', 'displayName', user.displayName);
    setField('profile', 'bio', user.bio);
  }, [user.id, user.displayName, user.bio, setField]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await save()) navigate('/inbox');
  }
  return (
    <main className='mx-auto min-h-svh max-w-2xl border-x'>
      <PageHeader title='Profile' />
      <div className='p-5'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-4'>
              <PersonAvatar name={user.displayName} />
              <div>
                <CardTitle>{user.displayName}</CardTitle>
                <CardDescription>
                  @{user.username} · {user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit}>
              <FieldGroup>
                <ErrorNotice message={error} />
                <Field>
                  <FieldLabel htmlFor='profile-name'>Display name</FieldLabel>
                  <Input
                    id='profile-name'
                    required
                    maxLength={50}
                    value={form.displayName}
                    onChange={e => setField('profile', 'displayName', e.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='profile-bio'>Bio</FieldLabel>
                  <Textarea
                    id='profile-bio'
                    maxLength={280}
                    value={form.bio}
                    onChange={e => setField('profile', 'bio', e.target.value)}
                  />
                  <p className='text-xs text-muted-foreground'>{form.bio.length}/280</p>
                </Field>
                <Button disabled={busy.profile} type='submit'>
                  {busy.profile ? 'Saving…' : 'Save changes'}
                </Button>
              </FieldGroup>
            </form>
            <div className='mt-6 border-t pt-5'>
              <Button variant='outline' disabled={busy.logout} onClick={() => void logout()}>
                <LogOut data-icon='inline-start' />
                {busy.logout ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
