import { z } from "zod";

// stub for the red step, real schema lands in the green commit
export const HotlineConfigSchema = z.object({});

export type HotlineConfig = z.infer<typeof HotlineConfigSchema>;
