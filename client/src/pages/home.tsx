import { ArrowUpRight, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { conversations } from '@/data/conversations';

export default function App() {
  return (
    <div className='flex min-h-svh flex-col bg-background text-foreground'>
      <header className='border-b border-border/70'>
        <div className='mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8'>
          <a aria-label='Messaging App home' className='flex items-center gap-3' href='#home'>
            <span className='flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground'>
              <MessageCircle aria-hidden='true' className='size-5' />
            </span>
            <span className='font-semibold tracking-tight'>Messaging App</span>
          </a>
          <Badge className='hidden sm:inline-flex' variant='outline'>
            A calmer space to connect
          </Badge>
        </div>
      </header>

      <main
        className='mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 px-5 py-14 sm:px-8 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20'
        id='home'
      >
        <section aria-labelledby='home-heading' className='mx-auto w-full max-w-xl'>
          <Badge className='mb-6 gap-1.5 px-3 py-1' variant='secondary'>
            <Sparkles aria-hidden='true' data-icon='inline-start' />
            Made for meaningful conversations
          </Badge>

          <h1
            className='text-balance text-4xl leading-[1.08] font-semibold tracking-tight sm:text-5xl lg:text-6xl'
            id='home-heading'
          >
            More meaningful conversations. Less noise.
          </h1>
          <p className='mt-6 max-w-lg text-lg leading-8 text-muted-foreground'>
            A simple place to keep up with the people who matter. Pick up a conversation, share a
            moment, and stay close—without the clutter.
          </p>

          <div className='mt-9 flex flex-col gap-3 sm:flex-row'>
            <Button
              className='w-full sm:w-auto'
              size='lg'
              nativeButton={false}
              render={<Link to='/login' />}
            >
              Sign in
              <ArrowUpRight aria-hidden='true' data-icon='inline-end' />
            </Button>
            <Button
              className='w-full sm:w-auto'
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<Link to='/register' />}
            >
              Create an account
            </Button>
          </div>

          <div className='mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground'>
            <span className='inline-flex items-center gap-2'>
              <ShieldCheck aria-hidden='true' className='size-4' />
              Private conversations
            </span>
            <span className='inline-flex items-center gap-2'>
              <MessageCircle aria-hidden='true' className='size-4' />
              Simple by design
            </span>
          </div>
        </section>

        <section aria-labelledby='preview-heading' className='mx-auto grid w-full max-w-2xl gap-4'>
          <h2 className='sr-only' id='preview-heading'>
            Messaging app preview
          </h2>

          <Card className='w-full'>
            <CardHeader>
              <CardTitle>Recent conversations</CardTitle>
              <CardDescription>Your people, all in one place.</CardDescription>
              <CardAction>
                <Badge variant='outline'>Inbox preview</Badge>
              </CardAction>
            </CardHeader>

            <CardContent className='pt-2'>
              <ul aria-label='Sample conversations' className='flex flex-col gap-1'>
                {conversations.map(conversation => (
                  <li
                    className='flex min-w-0 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60 sm:gap-4 sm:px-3'
                    key={conversation.name}
                  >
                    <Avatar>
                      <AvatarFallback>{conversation.initials}</AvatarFallback>
                    </Avatar>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-3'>
                        <p className='truncate font-medium'>{conversation.name}</p>
                        <time
                          className='shrink-0 text-xs text-muted-foreground'
                          dateTime={conversation.dateTime}
                        >
                          {conversation.time}
                        </time>
                      </div>
                      <p className='mt-1 truncate text-sm text-muted-foreground'>
                        {conversation.preview}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className='justify-between gap-4 text-muted-foreground'>
              <span>Thoughtful messaging, without the noise.</span>
              <span aria-hidden='true' className='hidden sm:inline'>
                •••
              </span>
            </CardFooter>
          </Card>

          <div className='grid gap-4 sm:grid-cols-2'>
            <Card size='sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShieldCheck aria-hidden='true' className='size-4 text-muted-foreground' />
                  Your space, your pace
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                Keep conversations personal and easy to find.
              </CardContent>
            </Card>
            <Card size='sm'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MessageCircle aria-hidden='true' className='size-4 text-muted-foreground' />
                  Made for people
                </CardTitle>
              </CardHeader>
              <CardContent className='text-sm leading-6 text-muted-foreground'>
                The little moments are the ones worth sharing.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className='border-t border-border/70'>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8'>
          <span>Messaging App</span>
          <span>Made for the conversations that matter.</span>
        </div>
      </footer>
    </div>
  );
}
