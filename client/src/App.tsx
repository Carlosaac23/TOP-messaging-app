import { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { AuthPage } from '@/pages/auth';
import Home from '@/pages/home';
import { Inbox, NewConversation, Profile } from '@/pages/messaging';
import { useApp } from '@/store/app';

function Gate({ guest = false }: { guest?: boolean }) {
  const user = useApp(s => s.user);
  if (guest && user) return <Navigate to='/inbox' replace />;
  if (!guest && !user) return <Navigate to='/login' replace />;
  return <Outlet />;
}
function AppRoutes() {
  const session = useApp(s => s.session);
  const error = useApp(s => s.sessionError);
  const restore = useApp(s => s.restore);
  useEffect(() => {
    void restore();
  }, [restore]);
  if (session !== 'ready')
    return (
      <main className='flex min-h-svh flex-col items-center justify-center gap-4 px-5 text-center'>
        <p>{session === 'loading' ? 'Loading your session…' : error}</p>
        {session === 'error' && <Button onClick={() => void restore()}>Try again</Button>}
      </main>
    );
  return (
    <Routes>
      <Route element={<Gate guest />}>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<AuthPage kind='login' />} />
        <Route path='/register' element={<AuthPage kind='register' />} />
      </Route>
      <Route element={<Gate />}>
        <Route path='/inbox' element={<Inbox />} />
        <Route path='/inbox/:conversationId' element={<Inbox />} />
        <Route path='/new' element={<NewConversation />} />
        <Route path='/profile' element={<Profile />} />
      </Route>
      <Route
        path='*'
        element={
          <main className='flex min-h-svh flex-col items-center justify-center gap-4'>
            <h1 className='text-3xl font-semibold'>Page not found</h1>
            <Button nativeButton={false} render={<Link to='/' />}>
              Go home
            </Button>
          </main>
        }
      />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
