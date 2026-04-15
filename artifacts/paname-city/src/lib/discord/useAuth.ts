import { useState, useEffect } from 'react';
import { useDiscordToken, setAuthTokenGetter } from "@workspace/api-client-react";
import { discordSdk } from './sdk';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const mutation = useDiscordToken();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem('paname_city_token'));

    const authenticate = async () => {
      const storedToken = localStorage.getItem('paname_city_token');
      if (storedToken) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      if (!discordSdk) {
        setIsLoading(false);
        return;
      }

      try {
        await discordSdk.ready();
        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: 'code',
          scope: ['identify', 'guilds'],
          prompt: 'none',
        });

        mutation.mutate(
          { data: { code } },
          {
            onSuccess: (data: any) => {
              localStorage.setItem('paname_city_token', data.token);
              setIsAuthenticated(true);
              setIsLoading(false);
            },
            onError: () => {
              setIsLoading(false);
            },
          }
        );
      } catch (error) {
        console.error('Discord auth failed', error);
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  return { isAuthenticated, isLoading };
}
