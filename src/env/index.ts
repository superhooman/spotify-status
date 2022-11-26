import { z } from "zod";
import { config } from "dotenv";

const envSchema = z.object({
    PORT: z.preprocess((arg) => {
        if (!arg) {
            return 3000;
        }

        const port = parseInt(arg as string, 10);

        if (isNaN(port)) {
            throw new Error(`Invalid port: ${arg}`);
        }

        return port;
    }, z.number()),
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
    REDIRECT_URI: z.string(),
});

export type Env = z.infer<typeof envSchema>;

config();

export const env = envSchema.parse(process.env);
