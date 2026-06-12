"use server";

import { z } from "zod";
import { getServerConfig } from "../config.server";

export async function getGreeting(args: { data: { name: string } }) {
  const { data } = args;
  const validated = z.object({ name: z.string().min(1) }).parse(data);
  const config = getServerConfig();
  return {
    greeting: `Hello, ${validated.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
}
