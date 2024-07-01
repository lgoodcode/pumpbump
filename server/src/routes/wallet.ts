import { Hono } from "hono";
import { z } from "zod";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { captureException } from "Sentry";

import { validate } from "@/lib/middleware.ts";
import { supabase } from "@/lib/supabase/client.ts";

export const Wallet = new Hono();

Wallet.get(
  "/generate/:id",
  validate({ params: { id: z.string().uuid() } }),
  async (ctx) => {
    const id = ctx.req.param("id");
    const keypair = Keypair.generate();

    const { error } = await supabase.from("wallets").insert({
      id,
      public_key: keypair.publicKey.toBase58(),
      secret_key: bs58.encode(keypair.secretKey),
    });

    if (error) {
      console.error(error);
      captureException(error);
      return ctx.json({ error: "Failed to insert wallet into database" }, 500);
    }

    return ctx.text("Wallet generated successfully", 201);
  },
);
