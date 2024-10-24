import Discord from "discord.js";
import fetch from 'node-fetch';
import keepAlive from "./server.js";
import dotenv from "dotenv";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  return formattedTime;
}

async function getHeroes() {
  const response = await fetch('https://api.opendota.com/api/heroes');
  const data = await response.json();
  return data;
}

async function getLastMatch() {
  const response = await fetch(`https://api.opendota.com/api/players/${accountId}/matches?limit=1`);
  const data = await response.json();
  return data[0];
}

async function getMatch(matchId) {
  const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
  const data = await response.json();
  return data;
}

async function refresh() {
  try {
    const lastMatch = await getLastMatch(); // Fetch last match details once
    const matchId = lastMatch.match_id;
    const hero_id = lastMatch.hero_id;

    // Logging
    const currentTimeET = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const glob_vars = ` Account: ${accountId} | Fetched match: ${matchId} | Stored match: ${storedMatch}`;
    console.log(currentTimeET, glob_vars);

    if (storedMatch == matchId) return; // End function, no new match found
    storedMatch = matchId

    const channel = client.channels.cache.get(process.env.CHANNEL_ID); // Replace with discord channel ID
    if (!channel) {
      console.log("Channel not found.");
      return;
    }

    const heroes = await getHeroes();
    const localized_name = heroes.find(hero => hero.id === hero_id)?.localized_name.toUpperCase();

    const match = await getMatch(matchId)

    const playerData = match.players.find(player => player.account_id == accountId);

    const {
      personaname,
      win,
      kills,
      deaths,
      assists,
      last_hits,
      denies,
      gold_per_min,
      xp_per_min,
      hero_damage,
      tower_damage,
      hero_healing,
      level,
      net_worth
    } = playerData || {}; // Fallback to an empty object if player is not found

    const duration = formatTime(match.duration)
    const match_result = win ? 'WON' : 'LOST';
    const encouragement = win ? `Let's keep the win streak going!` : `You know the rules: can't sleep on a loss!`
    const summary = `${personaname} just ${match_result} a match as ${localized_name}! 

K/D/A: ${kills}/${deaths}/${assists}
LH/DN: ${last_hits}/${denies}
GPM/XPM: ${gold_per_min}/${xp_per_min}
Hero damage: ${hero_damage}
Tower damage: ${tower_damage}
Hero healing: ${hero_healing}

Match Duration: ${duration}
Level: ${level}
Net worth: ${net_worth}

${encouragement}`

    await channel.send(`\`\`\`${summary}\`\`\`
https://www.dotabuff.com/matches/${matchId}`);
  } catch (error) {
    console.error(`Error occurred during refresh: ${error}`);
  }
}

async function refresh_loop() {
  await client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    while (true) {
      await refresh();
      await new Promise(resolve => setTimeout(resolve, fetch_timer)); 
    }
  });
}

const client = new Discord.Client({ intents: [
  Discord.GatewayIntentBits.Guilds, 
  Discord.GatewayIntentBits.MessageContent, 
  Discord.GatewayIntentBits.GuildMessages] });

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return; // Ignore bot messages

  if (msg.content === "$refresh") {
    refresh()
  }

  if (msg.content.startsWith("$player")) {
    let newAccountId = msg.content.split("$player ")[1]
    accountId = newAccountId
    msg.channel.send(`Now tracking user ${accountId}.`)
    console.log(`Now tracking user ${accountId}.`)
  }
});

let storedMatch = 0;
let accountId = '';
let fetch_timer = 300000 // Wait 300 seconds (5 minutes)
// OpenDota API max 2000 calls/day and 60/min (around 83 calls per hour)
// currently, each iteration uses 3 calls, or 1 if no new recent match found
// to check 1 person every 5 mins, max 18 calls per hour (assuming 3 games per hour max)

keepAlive()
dotenv.config()
client.login(process.env.DISCORD_TOKEN)
refresh_loop()