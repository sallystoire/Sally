import { DiscordSDK } from "@discord/embedded-app-sdk";

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;
export const discordSdk = clientId ? new DiscordSDK(clientId) : null;

export async function setupDiscordSdk() {
  if (!discordSdk) return;
  await discordSdk.ready();
}
