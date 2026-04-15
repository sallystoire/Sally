import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { db } from "@workspace/db";
import { sysUsers, promoCodes } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function isSys(discordId: string): Promise<boolean> {
  const rows = await db.select().from(sysUsers).where(eq(sysUsers.discordId, discordId)).limit(1);
  return rows.length > 0;
}

const commands = [
  new SlashCommandBuilder()
    .setName("code")
    .setDescription("Créer un code promo (sys uniquement)")
    .addStringOption(o => o.setName("ressource").setDescription("Type de ressource").setRequired(true).addChoices(
      { name: "Or", value: "gold" },
      { name: "Bois", value: "wood" },
      { name: "Pierre", value: "stone" },
      { name: "Nourriture", value: "food" },
    ))
    .addIntegerOption(o => o.setName("montant").setDescription("Montant à donner").setRequired(true)),
  new SlashCommandBuilder()
    .setName("sys")
    .setDescription("Ajouter un membre sys (sys uniquement)")
    .addUserOption(o => o.setName("membre").setDescription("Membre à ajouter").setRequired(true)),
  new SlashCommandBuilder()
    .setName("unsys")
    .setDescription("Retirer un membre sys (sys uniquement)")
    .addUserOption(o => o.setName("membre").setDescription("Membre à retirer").setRequired(true)),
  new SlashCommandBuilder()
    .setName("syslist")
    .setDescription("Voir la liste des membres sys"),
];

async function handleCode(interaction: ChatInputCommandInteraction) {
  if (!await isSys(interaction.user.id)) {
    await interaction.reply({ content: "❌ Commande réservée aux membres **sys**.", ephemeral: true }); return;
  }
  const resourceType = interaction.options.getString("ressource", true);
  const amount = interaction.options.getInteger("montant", true);
  if (amount <= 0) { await interaction.reply({ content: "❌ Le montant doit être positif.", ephemeral: true }); return; }

  const code = generateCode();
  await db.insert(promoCodes).values({
    code,
    resourceType,
    amount,
    maxUses: 100,
    uses: 0,
    createdBy: interaction.user.id,
    active: true,
  });

  const names: Record<string, string> = { gold: "or", wood: "bois", stone: "pierre", food: "nourriture" };
  await interaction.reply({
    content: `✅ Code créé : \`${code}\`\nDonne **+${amount} ${names[resourceType]}** dans Paname City.`,
    ephemeral: true,
  });
}

async function handleSys(interaction: ChatInputCommandInteraction) {
  if (!await isSys(interaction.user.id)) {
    await interaction.reply({ content: "❌ Commande réservée aux membres **sys**.", ephemeral: true }); return;
  }
  const target = interaction.options.getUser("membre", true);
  const exists = await isSys(target.id);
  if (exists) { await interaction.reply({ content: `⚠️ ${target.username} est déjà sys.`, ephemeral: true }); return; }

  await db.insert(sysUsers).values({ discordId: target.id, username: target.username, addedBy: interaction.user.id });
  await interaction.reply({ content: `✅ **${target.username}** a été ajouté aux sys.`, ephemeral: true });
}

async function handleUnsys(interaction: ChatInputCommandInteraction) {
  if (!await isSys(interaction.user.id)) {
    await interaction.reply({ content: "❌ Commande réservée aux membres **sys**.", ephemeral: true }); return;
  }
  const target = interaction.options.getUser("membre", true);
  const exists = await isSys(target.id);
  if (!exists) { await interaction.reply({ content: `⚠️ ${target.username} n'est pas sys.`, ephemeral: true }); return; }

  await db.delete(sysUsers).where(eq(sysUsers.discordId, target.id));
  await interaction.reply({ content: `✅ **${target.username}** a été retiré des sys.`, ephemeral: true });
}

async function handleSyslist(interaction: ChatInputCommandInteraction) {
  const list = await db.select().from(sysUsers);
  if (list.length === 0) {
    await interaction.reply({ content: "Aucun membre sys pour le moment.", ephemeral: true }); return;
  }
  const text = list.map((s, i) => `${i + 1}. **${s.username}** (ajouté par <@${s.addedBy}>)`).join("\n");
  await interaction.reply({ content: `👥 **Membres sys (${list.length})**\n${text}`, ephemeral: true });
}

export function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !clientId) {
    logger.warn("Discord bot not started: DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID missing");
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    logger.info({ tag: client.user?.tag }, "Discord bot ready");

    const rest = new REST().setToken(token);
    try {
      const route = guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId);
      await rest.put(route, { body: commands.map(c => c.toJSON()) });
      logger.info("Slash commands registered");
    } catch (err) {
      logger.error({ err }, "Failed to register slash commands");
    }
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      if (interaction.commandName === "code") await handleCode(interaction);
      else if (interaction.commandName === "sys") await handleSys(interaction);
      else if (interaction.commandName === "unsys") await handleUnsys(interaction);
      else if (interaction.commandName === "syslist") await handleSyslist(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, "Bot command error");
      if (!interaction.replied) {
        await interaction.reply({ content: "❌ Une erreur s'est produite.", ephemeral: true }).catch(() => {});
      }
    }
  });

  client.login(token).catch(err => logger.error({ err }, "Bot login failed"));
}
