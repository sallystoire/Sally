import { Router } from "express";
import { db } from "@workspace/db";
import { shopItems, kingdoms } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const SEED_ITEMS = [
  { name: "Sac d'or", description: "+500 or immédiatement", type: "resource_pack", costGold: 0, effectType: "gold", effectValue: 500, icon: "💰" },
  { name: "Bois de guerre", description: "+500 bois immédiatement", type: "resource_pack", costGold: 300, effectType: "wood", effectValue: 500, icon: "🪵" },
  { name: "Pierre solide", description: "+500 pierre immédiatement", type: "resource_pack", costGold: 300, effectType: "stone", effectValue: 500, icon: "⛰️" },
  { name: "Festin royal", description: "+500 nourriture immédiatement", type: "resource_pack", costGold: 200, effectType: "food", effectValue: 500, icon: "🍖" },
  { name: "Bouclier 1h", description: "Protège ton royaume pendant 1h", type: "shield", costGold: 800, effectType: "shield", effectValue: 60, icon: "🛡️" },
  { name: "Élixir de vitesse", description: "Réduit le temps de construction de 50%", type: "boost", costGold: 1000, effectType: "build_speed", effectValue: 50, icon: "⚡" },
];

async function ensureSeed() {
  const existing = await db.select().from(shopItems).limit(1);
  if (existing.length > 0) return;
  for (const item of SEED_ITEMS) {
    await db.insert(shopItems).values(item);
  }
}

router.get("/", requireAuth, async (_req, res) => {
  await ensureSeed();
  const items = await db.select().from(shopItems);
  res.json(items);
});

router.post("/buy", requireAuth, async (req, res) => {
  const { itemId } = req.body as { itemId?: number };
  if (!itemId) { res.status(400).json({ error: "itemId required" }); return; }

  await ensureSeed();
  const item = await db.select().from(shopItems).where(eq(shopItems.id, itemId)).limit(1);
  if (!item[0]) { res.status(404).json({ error: "Item not found" }); return; }

  const kingdomRows = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!kingdomRows[0]) { res.status(404).json({ error: "Kingdom not found" }); return; }

  const k = kingdomRows[0];
  const it = item[0];

  if (k.gold < it.costGold) {
    res.status(400).json({ error: "Not enough gold" }); return;
  }

  const updates: Record<string, number> = { gold: k.gold - it.costGold };

  if (it.effectType === "gold") updates.gold = Math.min((updates.gold ?? k.gold) + it.effectValue, 10000);
  if (it.effectType === "wood") updates.wood = Math.min(k.wood + it.effectValue, 10000);
  if (it.effectType === "stone") updates.stone = Math.min(k.stone + it.effectValue, 10000);
  if (it.effectType === "food") updates.food = Math.min(k.food + it.effectValue, 10000);

  const updated = await db.update(kingdoms).set(updates).where(eq(kingdoms.id, k.id)).returning();
  const uk = updated[0];

  const buildingRows = await db.select().from(buildings).where(eq(buildings.kingdomId, k.id));

  res.json({
    success: true,
    message: `${it.name} acheté avec succès !`,
    kingdom: {
      ...uk,
      buildings: buildingRows.map(b => ({
        id: b.id, type: b.type, level: b.level,
        positionX: b.positionX, positionY: b.positionY,
        upgradeFinishAt: b.upgradeFinishAt?.toISOString() ?? null,
      })),
      owner: { id: req.user!.userId, discordId: req.user!.discordId, username: req.user!.username, isSys: false },
    },
  });
});

export default router;
