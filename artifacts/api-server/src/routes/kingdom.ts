import { Router } from "express";
import { db } from "@workspace/db";
import { kingdoms, buildings, users } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const GENERATORS: Record<string, string> = {
  goldmine: "gold",
  farm: "food",
  lumbermill: "wood",
  quarry: "stone",
};
const RATE_PER_LEVEL = 5;
const MAX_RESOURCE = 10000;

async function collectResources(kingdomId: number) {
  const rows = await db.select().from(kingdoms).where(eq(kingdoms.id, kingdomId)).limit(1);
  const k = rows[0];
  if (!k) return null;

  const now = new Date();
  const minutesPassed = Math.floor((now.getTime() - k.lastCollected.getTime()) / 60000);
  if (minutesPassed <= 0) return k;

  const buildingRows = await db.select().from(buildings).where(eq(buildings.kingdomId, kingdomId));

  let deltaGold = 0, deltaWood = 0, deltaStone = 0, deltaFood = 0;
  for (const b of buildingRows) {
    const resource = GENERATORS[b.type];
    const amount = b.level * RATE_PER_LEVEL * minutesPassed;
    if (resource === "gold") deltaGold += amount;
    else if (resource === "wood") deltaWood += amount;
    else if (resource === "stone") deltaStone += amount;
    else if (resource === "food") deltaFood += amount;
  }

  const updated = await db.update(kingdoms).set({
    gold: Math.min(k.gold + deltaGold, MAX_RESOURCE),
    wood: Math.min(k.wood + deltaWood, MAX_RESOURCE),
    stone: Math.min(k.stone + deltaStone, MAX_RESOURCE),
    food: Math.min(k.food + deltaFood, MAX_RESOURCE),
    lastCollected: now,
    updatedAt: now,
  }).where(eq(kingdoms.id, kingdomId)).returning();
  return updated[0];
}

async function getKingdomFull(kingdomId: number, ownerId: number) {
  const k = await collectResources(kingdomId);
  if (!k) return null;
  const bRows = await db.select().from(buildings).where(eq(buildings.kingdomId, kingdomId));
  const ownerRows = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
  return {
    ...k,
    buildings: bRows.map(b => ({
      id: b.id, type: b.type, level: b.level,
      positionX: b.positionX, positionY: b.positionY,
      upgradeFinishAt: b.upgradeFinishAt?.toISOString() ?? null,
    })),
    owner: { id: ownerRows[0].id, discordId: ownerRows[0].discordId, username: ownerRows[0].username, avatar: ownerRows[0].avatar, isSys: false },
  };
}

router.get("/me", requireAuth, async (req, res) => {
  const userKingdom = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!userKingdom[0]) { res.status(404).json({ error: "Kingdom not found" }); return; }
  const full = await getKingdomFull(userKingdom[0].id, req.user!.userId);
  res.json(full);
});

router.get("/", requireAuth, async (req, res) => {
  const allKingdoms = await db.select({
    id: kingdoms.id, name: kingdoms.name, trophies: kingdoms.trophies,
    userId: kingdoms.userId,
    discordId: users.discordId, username: users.username, avatar: users.avatar,
  }).from(kingdoms).leftJoin(users, eq(kingdoms.userId, users.id));

  const result = allKingdoms.filter(k => k.userId !== req.user!.userId).map(k => ({
    id: k.id, name: k.name, trophies: k.trophies,
    owner: { id: k.userId, discordId: k.discordId!, username: k.username!, avatar: k.avatar, isSys: false },
  }));
  res.json(result);
});

router.get("/:discordId", requireAuth, async (req, res) => {
  const ownerRows = await db.select().from(users).where(eq(users.discordId, req.params.discordId)).limit(1);
  if (!ownerRows[0]) { res.status(404).json({ error: "User not found" }); return; }
  const kingdomRows = await db.select().from(kingdoms).where(eq(kingdoms.userId, ownerRows[0].id)).limit(1);
  if (!kingdomRows[0]) { res.status(404).json({ error: "Kingdom not found" }); return; }
  const full = await getKingdomFull(kingdomRows[0].id, ownerRows[0].id);
  res.json(full);
});

const UPGRADE_COSTS = {
  gold: 200,
  wood: 100,
  stone: 100,
};

router.post("/me/buildings/:buildingId/upgrade", requireAuth, async (req, res) => {
  const buildingId = parseInt(req.params.buildingId);
  const bRows = await db.select().from(buildings).where(eq(buildings.id, buildingId)).limit(1);
  if (!bRows[0]) { res.status(404).json({ error: "Building not found" }); return; }

  const b = bRows[0];
  const kingdomRows = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!kingdomRows[0] || kingdomRows[0].id !== b.kingdomId) {
    res.status(403).json({ error: "Not your building" }); return;
  }

  if (b.upgradeFinishAt && b.upgradeFinishAt > new Date()) {
    res.status(400).json({ error: "Already upgrading" }); return;
  }

  const multiplier = Math.pow(2, b.level - 1);
  const costGold = UPGRADE_COSTS.gold * multiplier;
  const costWood = UPGRADE_COSTS.wood * multiplier;
  const costStone = UPGRADE_COSTS.stone * multiplier;

  const k = kingdomRows[0];
  if (k.gold < costGold || k.wood < costWood || k.stone < costStone) {
    res.status(400).json({ error: "Not enough resources" }); return;
  }

  const now = new Date();
  const upgradeTime = new Date(now.getTime() + b.level * 30000);

  await db.update(kingdoms).set({
    gold: k.gold - costGold,
    wood: k.wood - costWood,
    stone: k.stone - costStone,
  }).where(eq(kingdoms.id, k.id));

  const updated = await db.update(buildings).set({
    level: b.level + 1,
    upgradeFinishAt: upgradeTime,
  }).where(eq(buildings.id, buildingId)).returning();

  res.json({
    id: updated[0].id,
    type: updated[0].type,
    level: updated[0].level,
    positionX: updated[0].positionX,
    positionY: updated[0].positionY,
    upgradeFinishAt: updated[0].upgradeFinishAt?.toISOString() ?? null,
  });
});

export default router;
