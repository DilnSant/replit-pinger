import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not available');
          setLocation('/login?error=config_error');
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          // Send token to our backend
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: data.session.access_token
            })
          });

          const responseData = await response.json();

          if (response.ok && responseData.user) {
            // Store user data and redirect
            login(responseData.user, responseData.token);
            setLocation('/dashboard');
          } else {
            console.error('Backend auth error:', responseData.message);
            setLocation('/login?error=auth_failed');
          }
        } else {
          setLocation('/login?error=no_session');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setLocation('/login?error=callback_failed');
      }
    };

    handleAuthCallback();
  }, [setLocation, login]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Processando login...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}