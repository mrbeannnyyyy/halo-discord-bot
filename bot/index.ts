import { config } from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { resolve } from "node:path";
import { syncInterviewQueue } from "../lib/interview-queue";

// The bot runs outside Next.js, so load the project environment before reading it.
const environment = config({ path: resolve(process.cwd(), ".env"), quiet: true });
if (environment.error) {
  throw new Error("Unable to load the project .env file for the Discord bot.");
}

const requiredEnvironment = [
  "DISCORD_BOT_TOKEN",
  "INTERVIEW_GUILD_ID",
  "INTERVIEW_QUEUE_CHANNEL_ID",
  "DATABASE_URL",
] as const;

const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]);
if (missingEnvironment.length > 0) {
  throw new Error(`Missing required bot environment variable(s): ${missingEnvironment.join(", ")}`);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
async function refreshQueue() { await syncInterviewQueue(); }
client.once("clientReady", () => {
  console.log(`Halo bot online as ${client.user?.tag}`);
  refreshQueue();
  setInterval(refreshQueue, 60_000);
});

void client.login(process.env.DISCORD_BOT_TOKEN);
