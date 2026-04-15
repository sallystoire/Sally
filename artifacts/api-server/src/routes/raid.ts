import { Router } from "express";
import { db } from "@workspace/db";
import { kingdoms, buildings, raids, users } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function calcAttackPower(buildingList: typeof buildings.$inferSelect[]) {
  return buildingList.reduce((acc, b) => {
    if (b.type === "barracks") return acc + b.level * 60;
    if (b.type === "cannon") return acc + b.level * 40;
    return acc + b.level * 10;
  }, 50);
}

function calcDefensePower(buildingList: typeof buildings.$inferSelect[]) {
  return buildingList.reduce((acc, b) => {
    if (b.type === "wall") return acc + b.level * 50;
    if (b.type === "cannon") return acc + b.level * 45;
    if (b.type === "townhall") return acc + b.level * 30;
    return acc + b.level * 5;
  }, 50);
}

router.post("/", requireAuth, async (req, res) => {
  const { targetDiscordId } = req.body as { targetDiscordId?: string };
  if (!targetDiscordId) { res.status(400).json({ error: "targetDiscordId required" }); return; }
  if (targetDiscordId === req.user!.discordId) { res.status(400).json({ error: "Cannot raid yourself" }); return; }

  const attackerKingdom = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!attackerKingdom[0]) { res.status(404).json({ error: "Your kingdom not found" }); return; }

  const targetUser = await db.select().from(users).where(eq(users.discordId, targetDiscordId)).limit(1);
  if (!targetUser[0]) { res.status(404).json({ error: "Target not found" }); return; }

  const defenderKingdom = await db.select().from(kingdoms).where(eq(kingdoms.userId, targetUser[0].id)).limit(1);
  if (!defenderKingdom[0]) { res.status(404).json({ error: "Target kingdom not found" }); return; }

  const attackerBuildings = await db.select().from(buildings).where(eq(buildings.kingdomId, attackerKingdom[0].id));
  const defenderBuildings = await db.select().from(buildings).where(eq(buildings.kingdomId, defenderKingdom[0].id));

  const attackPower = calcAttackPower(attackerBuildings);
  const defensePower = calcDefensePower(defenderBuildings);

  const won = attackPower >= defensePower * 0.8;

  const ak = attackerKingdom[0];
  const dk = defenderKingdom[0];

  let goldLooted = 0, woodLooted = 0, stoneLooted = 0;
  let trophiesGained = 0;

  if (won) {
    goldLooted = Math.floor(dk.gold * 0.2);
    woodLooted = Math.floor(dk.wood * 0.2);
    stoneLooted = Math.floor(dk.stone * 0.2);
    trophiesGained = 15;

    await db.update(kingdoms).set({
      gold: ak.gold + goldLooted,
      wood: ak.wood + woodLooted,
      stone: ak.stone + stoneLooted,
      trophies: ak.trophies + trophiesGained,
    }).where(eq(kingdoms.id, ak.id));

    await db.update(kingdoms).set({
      gold: dk.gold - goldLooted,
      wood: dk.wood - woodLooted,
      stone: dk.stone - stoneLooted,
      trophies: Math.max(0, dk.trophies - 10),
    }).where(eq(kingdoms.id, dk.id));
  } else {
    trophiesGained = -5;
    await db.update(kingdoms).set({
      trophies: Math.max(0, ak.trophies - 5),
    }).where(eq(kingdoms.id, ak.id));
  }

  await db.insert(raids).values({
    attackerKingdomId: ak.id,
    defenderKingdomId: dk.id,
    result: won ? "win" : "lose",
    goldLooted, woodLooted, stoneLooted,
  });

  res.json({
    result: won ? "win" : "lose",
    goldLooted, woodLooted, stoneLooted,
    trophiesGained,
    message: won
      ? `Victoire ! Tu as pillé ${goldLooted} or, ${woodLooted} bois et ${stoneLooted} pierre.`
      : "Défaite ! Tes troupes ont été repoussées.",
  });
});

router.get("/", requireAuth, async (req, res) => {
  const myKingdom = await db.select().from(kingdoms).where(eq(kingdoms.userId, req.user!.userId)).limit(1);
  if (!myKingdom[0]) { res.json([]); return; }
  const kid = myKingdom[0].id;

  const raidRows = await db.select().from(raids).where(
    or(eq(raids.attackerKingdomId, kid), eq(raids.defenderKingdomId, kid))
  ).limit(20);

  const result = await Promise.all(raidRows.map(async (r) => {
    const isAttacker = r.attackerKingdomId === kid;
    const opponentKingdomId = isAttacker ? r.defenderKingdomId : r.attackerKingdomId;
    const oppKingdom = await db.select({
      id: kingdoms.id, name: kingdoms.name, trophies: kingdoms.trophies, userId: kingdoms.userId,
      discordId: users.discordId, username: users.username, avatar: users.avatar,
    }).from(kingdoms).leftJoin(users, eq(kingdoms.userId, users.id)).where(eq(kingdoms.id, opponentKingdomId)).limit(1);
    const opp = oppKingdom[0];
    return {
      id: r.id,
      result: r.result,
      goldLooted: r.goldLooted,
      woodLooted: r.woodLooted,
      stoneLooted: r.stoneLooted,
      createdAt: r.createdAt.toISOString(),
      isAttacker,
      opponent: {
        id: opp?.id ?? 0,
        name: opp?.name ?? "Unknown",
        trophies: opp?.trophies ?? 0,
        owner: { id: opp?.userId ?? 0, discordId: opp?.discordId ?? "", username: opp?.username ?? "?", avatar: opp?.avatar, isSys: false },
      },
    };
  }));

  res.json(result);
});

export default router;
