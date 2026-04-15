import { Router } from "express";
import { db } from "@workspace/db";
import { users, sysUsers } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken } from "../middlewares/auth.js";

const router = Router();

router.post("/discord/token", async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Discord not configured" });
    return;
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      req.log.error({ err }, "Discord token exchange failed");
      res.status(401).json({ error: "Invalid code" });
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: "Failed to fetch Discord user" });
      return;
    }

    const discordUser = (await userRes.json()) as {
      id: string;
      username: string;
      global_name?: string;
      avatar?: string;
    };

    const existing = await db.select().from(users).where(eq(users.discordId, discordUser.id)).limit(1);

    let user = existing[0];
    const displayName = discordUser.global_name || discordUser.username;

    if (!user) {
      const inserted = await db.insert(users).values({
        discordId: discordUser.id,
        username: displayName,
        avatar: discordUser.avatar ?? null,
      }).returning();
      user = inserted[0];

      await db.execute(`
        INSERT INTO kingdoms (user_id, name)
        VALUES (${user.id}, '${displayName.replace(/'/g, "''")} City')
      `);
      const kingdom = await db.execute(`SELECT id FROM kingdoms WHERE user_id = ${user.id} LIMIT 1`);
      const kingdomId = (kingdom.rows[0] as { id: number }).id;

      const defaultBuildings = [
        { type: "townhall", px: 4, py: 4 },
        { type: "goldmine", px: 1, py: 1 },
        { type: "farm", px: 7, py: 2 },
        { type: "lumbermill", px: 2, py: 7 },
        { type: "quarry", px: 7, py: 7 },
        { type: "barracks", px: 4, py: 7 },
        { type: "cannon", px: 6, py: 4 },
        { type: "wall", px: 3, py: 4 },
        { type: "wall", px: 5, py: 4 },
      ];
      for (const b of defaultBuildings) {
        await db.execute(`INSERT INTO buildings (kingdom_id, type, position_x, position_y) VALUES (${kingdomId}, '${b.type}', ${b.px}, ${b.py})`);
      }
    } else {
      await db.update(users).set({ username: displayName, avatar: discordUser.avatar ?? null }).where(eq(users.id, user.id));
    }

    const sysCheck = await db.select().from(sysUsers).where(eq(sysUsers.discordId, discordUser.id)).limit(1);
    const isSys = sysCheck.length > 0;

    const token = signToken({ userId: user.id, discordId: discordUser.id, username: displayName, isSys });

    res.json({
      token,
      user: { id: user.id, discordId: discordUser.id, username: displayName, avatar: discordUser.avatar ?? null, isSys },
    });
  } catch (err) {
    req.log.error({ err }, "Auth error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await db.select().from(users).where(eq(users.discordId, req.user!.discordId)).limit(1);
  if (!user[0]) { res.status(404).json({ error: "User not found" }); return; }
  const sysCheck = await db.select().from(sysUsers).where(eq(sysUsers.discordId, req.user!.discordId)).limit(1);
  res.json({ ...user[0], isSys: sysCheck.length > 0 });
});

export default router;
