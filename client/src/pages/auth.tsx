import type { FormEvent } from 'react';

import { MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useApp } from '@/store/app';

export function AuthPage({ kind }: { kind: 'login' | 'register' }) {
  const navigate = useNavigate();
  const form = useApp(s => s.forms[kind]);
  const setField = useApp(s => s.setField);
  const authenticate = useApp(s => s.authenticate);
  const error = useApp(s => s.errors[kind]);
  const busy = useApp(s => s.busy[kind]);
  const register = kind === 'register';
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await authenticate(kind)) navigate('/inbox', { replace: true });
  }
  return (
    <main className='flex min-h-svh flex-col items-center justify-center gap-8 px-5 py-12'>
      <Link className='flex items-center gap-3 font-semibold' to='/'>
        <span className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
          <MessageCircle aria-hidden='true' />
        </span>
        Messaging App
      </Link>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl'>
            {register ? 'Create an account' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {register
              ? 'Start a more meaningful conversation.'
              : 'Sign in to continue your conversations.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              {error && (
                <Alert variant='destructive' role='alert'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {register && (
                <>
                  <Field>
                    <FieldLabel htmlFor='displayName'>
                      Display name <span className='text-muted-foreground'>(optional)</span>
                    </FieldLabel>
                    <Input
                      id='displayName'
                      maxLength={50}
                      value={form.displayName}
                      onChange={e => setField(kind, 'displayName', e.target.value)}
                      autoComplete='name'
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='username'>Username</FieldLabel>
                    <Input
                      id='username'
                      value={form.username}
                      onChange={e => setField(kind, 'username', e.target.value)}
                      required
                      minLength={3}
                      maxLength={24}
                      pattern='[a-zA-Z0-9_]+'
                      title='Use 3–24 letters, numbers or underscores.'
                      autoComplete='username'
                    />
                  </Field>
                </>
              )}
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  type='email'
                  required
                  maxLength={254}
                  autoComplete='email'
                  value={form.email}
                  onChange={e => setField(kind, 'email', e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='password'>Password</FieldLabel>
                <Input
                  id='password'
                  type='password'
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={e => setField(kind, 'password', e.target.value)}
                />
              </Field>
              <Button disabled={busy} size='lg' type='submit'>
                {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
              </Button>
            </FieldGroup>
          </form>
          <p className='mt-6 text-center text-sm text-muted-foreground'>
            {register ? 'Already have an account?' : 'New here?'}{' '}
            <Link
              className='font-medium text-foreground underline underline-offset-4'
              to={register ? '/login' : '/register'}
            >
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
