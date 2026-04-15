import { Router } from "express";
import { db } from "@workspace/db";
import { promoCodes, codeRedemptions, kingdoms } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/redeem", requireAuth, async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  const codeRows = await db.select().from(promoCodes).where(
    and(eq(promoCodes.code, code.toUpperCase()), eq(promoCodes.active, true))
  ).limit(1);

  if (!codeRows[0]) {
    res.status(400).json({ success: false, message: "Code invalide ou expiré.", resourceType: "", amount: 0 }); return;
  }

  const pc = codeRows[0];

  if (pc.expiresAt && pc.expiresAt < new Date()) {
    res.status(400).json({ success: false, message: "Ce code a expiré.", resourceType: "", amount: 0 }); return;
  }

  if (pc.uses >= pc.maxUses) {
    res.status(400).json({ success: false, message: "Ce code a atteint sa limite d'utilisations.", resourceType: "", amount: 0 }); return;
  }

  const alreadyUsed = await db.select().from(codeRedemptions).where(
    and(eq(codeRedemptions.codeId, pc.id), eq(codeRedemptions.userId, req.user!.userId))
  ).limit(1);

  if (alreadyUsed[0]) {
    res.status(400).json({ success: false, message: "Tu as déjà utilisé ce code.", resourceType: "", amount: 0 }); return;
  }

  const kingdomRows = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!kingdomRows[0]) { res.status(404).json({ error: "Kingdom not found" }); return; }

  const k = kingdomRows[0];
  const updates: Record<string, number> = {};

  if (pc.resourceType === "gold") updates.gold = Math.min(k.gold + pc.amount, 10000);
  else if (pc.resourceType === "wood") updates.wood = Math.min(k.wood + pc.amount, 10000);
  else if (pc.resourceType === "stone") updates.stone = Math.min(k.stone + pc.amount, 10000);
  else if (pc.resourceType === "food") updates.food = Math.min(k.food + pc.amount, 10000);

  await db.update(kingdoms).set(updates).where(eq(kingdoms.id, k.id));
  await db.update(promoCodes).set({ uses: pc.uses + 1 }).where(eq(promoCodes.id, pc.id));
  await db.insert(codeRedemptions).values({ codeId: pc.id, userId: req.user!.userId });

  const resourceNames: Record<string, string> = { gold: "or", wood: "bois", stone: "pierre", food: "nourriture" };

  res.json({
    success: true,
    message: `Code activé ! Tu as reçu +${pc.amount} ${resourceNames[pc.resourceType] ?? pc.resourceType}.`,
    resourceType: pc.resourceType,
    amount: pc.amount,
  });
});

export default router;
