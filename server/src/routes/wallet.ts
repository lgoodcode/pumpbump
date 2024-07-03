import { Hono } from "hono";
import { z } from "zod";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { captureException } from "Sentry";

import { validate } from "@/lib/middleware.ts";
import { supabase } from "@/lib/supabase/client.ts";

export const Wallet = new Hono();

Wallet.get(
  "/generate/:userId",
  validate({ params: { userId: z.string().uuid() } }),
  async (ctx) => {
    const userId = ctx.req.param("userId");
    const keypair = Keypair.generate();

    const { error } = await supabase.from("wallets").insert({
      user_id: userId,
      public_key: keypair.publicKey.toBase58(),
      secret_key: bs58.encode(keypair.secretKey),
    });

    if (error) {
      console.error(error);
      captureException(error);
      return ctx.json({ error: "Failed to insert wallet into database" }, 500);
    }

    return ctx.body(null, 201);
  },
);
