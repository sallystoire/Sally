import { pgTable, serial, text, integer, timestamp, boolean, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const kingdoms = pgTable("kingdoms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  name: text("name").notNull(),
  gold: integer("gold").default(500).notNull(),
  wood: integer("wood").default(300).notNull(),
  stone: integer("stone").default(200).notNull(),
  food: integer("food").default(400).notNull(),
  trophies: integer("trophies").default(0).notNull(),
  lastCollected: timestamp("last_collected").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  kingdomId: integer("kingdom_id").references(() => kingdoms.id).notNull(),
  type: text("type").notNull(),
  level: integer("level").default(1).notNull(),
  positionX: integer("position_x").notNull(),
  positionY: integer("position_y").notNull(),
  upgradeFinishAt: timestamp("upgrade_finish_at"),
});

export const raids = pgTable("raids", {
  id: serial("id").primaryKey(),
  attackerKingdomId: integer("attacker_kingdom_id").references(() => kingdoms.id).notNull(),
  defenderKingdomId: integer("defender_kingdom_id").references(() => kingdoms.id).notNull(),
  result: text("result").notNull(),
  goldLooted: integer("gold_looted").default(0).notNull(),
  woodLooted: integer("wood_looted").default(0).notNull(),
  stoneLooted: integer("stone_looted").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  costGold: integer("cost_gold").default(0).notNull(),
  effectType: text("effect_type").notNull(),
  effectValue: integer("effect_value").notNull(),
  icon: text("icon").notNull(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  resourceType: text("resource_type").notNull(),
  amount: integer("amount").notNull(),
  maxUses: integer("max_uses").default(100).notNull(),
  uses: integer("uses").default(0).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true).notNull(),
});

export const codeRedemptions = pgTable("code_redemptions", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").references(() => promoCodes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
}, (t) => [unique().on(t.codeId, t.userId)]);

export const sysUsers = pgTable("sys_users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  addedBy: text("added_by").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});
