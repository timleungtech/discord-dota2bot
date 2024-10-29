import Discord from "discord.js";
import fetch from 'node-fetch';
import keepAlive from "./server.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/database.js";
import Hero from "./model/Hero.js"
import Player from "./model/Player.js"
import Server from "./model/Server.js"

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  return formattedTime;
}

async function getLastMatch(id) {
  const response = await fetch(`https://api.opendota.com/api/players/${id}/matches?limit=1`);
  const data = await response.json();
  return data[0];
}

async function getMatch(matchId) {
  const response = await fetch(`https://api.opendota.com/api/matches/${matchId}`);
  const data = await response.json();
  return data;
}

// Main function to initialize both MongoDB and Discord client
async function init() {
  keepAlive()
  dotenv.config({ path: "./config/config.env" })
  await connectDB(); // Connect to MongoDB
  client.login(process.env.DISCORD_TOKEN); // Log in to Discord
}

async function refresh(account_id) {
  try {
    const lastMatch = await getLastMatch(account_id); // Fetch last match details once
    const matchId = lastMatch.match_id;
    const hero_id = lastMatch.hero_id;

    // Logging
    let storedMatch = await getRecentMatchId(account_id)
    
    const currentTimeET = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const glob_vars = ` Account: ${account_id} | Fetched match: ${matchId} | Stored match: ${storedMatch}`;
    console.log(currentTimeET, glob_vars);

    if (storedMatch == matchId) return; // End function, no new match found

    await updateStoredMatch(account_id, matchId)

    const channel = client.channels.cache.get(process.env.CHANNEL_ID); // Replace with discord channel ID
    if (!channel) {
      console.log("Channel not found.");
      return;
    }

    const hero = await find_hero(hero_id)
    const localized_name = hero.localized_name.toUpperCase()

    const match = await getMatch(matchId)

    const playerData = match.players.find(player => player.account_id == account_id);

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
      let players_tracking = await getPlayersFromDb(process.env.CHANNEL_ID)
      let account_ids = await getPlayersIdFromDb(players_tracking)

      for (let i = 0; i < account_ids.length; i++) {
        await refresh(account_ids[i]);
      }
      await new Promise(resolve => setTimeout(resolve, fetch_timer)); 
    }
  });
}

async function addPlayerToArray(player) {
  try {
    await Server.updateOne(
      { channel_id: process.env.CHANNEL_ID }, 
      { $push: { players_tracking: player } }
    );
  } catch (err) {
    console.error(err);
  }
}

async function removeFirstPlayerFromArray() {
  try {
    await Server.updateOne(
      { channel_id: process.env.CHANNEL_ID }, 
      { $pop: { players_tracking: -1 } }
    );
  } catch (err) {
    console.error(err);
  }
}

async function removePlayerFromArrayByName(player) {
  try {
    await Server.updateOne(
      { channel_id: process.env.CHANNEL_ID }, 
      { $pull: { players_tracking: player } }
    );
  } catch (err) {
    console.error(err);
  }
}

async function insertPlayer(account_id, name) {
  try {
    const newDocument = new Player({
      account_id: account_id,
      name: name,
      match_id: 0
    });

    const savedDocument = await newDocument.save();
    console.log('Player added:', savedDocument);
  } catch (err) {
    console.error('Error inserting document:', err);
  }
}

async function getPlayersFromDb(channelId) {
  try {
    const server = await Server.findOne({ channel_id: channelId });
    if (server) {
      return server.players_tracking;
    } else {
      return []; // Return an empty array if no channel found
    }
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error; // Optionally re-throw the error for further handling
  }
}

async function listPlayerNamesInDb() {
  try {
    const players = await Player.find({}, 'name'); // Fetch only the 'name' field
    const playerNames = players.map(player => player.name).sort(); // Extract names into an array
    return playerNames;
  } catch (error) {
    console.error('Error fetching player names:', error);
  }
}

async function getPlayersIdFromDb(names) {
  let ids = []
  for (let i = 0; i < names.length; i++){
    try {
      const player = await Player.findOne({ name: names[i] });
      if (player) {
        ids.push(player.account_id);
      } else {
        return []; // Return an empty array if no channel found
      }
    } catch (error) {
      console.error('Error fetching player ids:', error);
      throw error; // Optionally re-throw the error for further handling
    }
  }
  return ids
}

async function getRecentMatchId(id) {
  try {
    const player = await Player.findOne({ account_id: id });
    if (player) {
      return player.match_id;
    } else {
      return []; // Return an empty array if no channel found
    }
  } catch (error) {
    console.error('Error fetching players:', error);
    throw error; // Optionally re-throw the error for further handling
  }
}

async function updateStoredMatch(account_id, matchId) {
  try {
    await Player.updateOne(
      { account_id: account_id }, 
      { $set: { match_id: matchId } }
    );
  } catch (err) {
    console.error(err);
  }
}

async function find_player(playerName) {
  try {
    const player = await Player.findOne({ name: playerName });
    return player;
  } catch (error) {
    console.error("Error finding player:", error);
  }
}

async function find_hero(heroId) {
  try {
    const hero = await Hero.findOne({ id: heroId });
    return hero;
  } catch (error) {
    console.error("Error finding player:", error);
  }
}

// END OF FUNCTIONS

const client = new Discord.Client({ intents: [
  Discord.GatewayIntentBits.Guilds, 
  Discord.GatewayIntentBits.MessageContent, 
  Discord.GatewayIntentBits.GuildMessages] });

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return; // Ignore bot messages

  if (msg.content.startsWith("$insert")) {
    let prompt = msg.content.split(" ")
    let account_id = prompt[2]
    let name = prompt[1]

    await insertPlayer(account_id, name);
  }

  if (msg.content.startsWith("$track")) {
    let typed_player = msg.content.split("$track ")[1]
    let found_player = await find_player(typed_player)
    if (!found_player) {
      msg.channel.send('Player not found.')
    } else if (players_tracking.includes(found_player.name)) {
      msg.channel.send('Player already being tracked.')
    } else if (found_player.name == typed_player){ // && channel_id === channel_id)
      players_tracking.push(found_player.name)
      await addPlayerToArray(found_player.name)
      await refresh(found_player.account_id)
    }
    // if more than 'max_players_tracked' players, remove earliest
    while (players_tracking.length > max_players_tracked){
      players_tracking.shift()
      removeFirstPlayerFromArray()
    }
    if (players_tracking.length > 0) msg.channel.send(`Now tracking ${players_tracking}`)
    else msg.channel.send('No players being tracked.')
  }

  if (msg.content.startsWith("$untrack")) {
    let typed_player = msg.content.split("$untrack ")[1]
    let found_player = await find_player(typed_player)
    if (players_tracking.includes(found_player.name)){
      let index = players_tracking.indexOf(found_player.name)
      players_tracking = players_tracking.slice(0, index).concat(players_tracking.slice(index + 1))
      await removePlayerFromArrayByName(found_player.name)
    } else {
      msg.channel.send('Player not found.')
    }
    if (players_tracking.length > 0) msg.channel.send(`Now tracking ${players_tracking}`)
    else msg.channel.send('No players being tracked.')
  }

  if (msg.content === "$list") {
    if (players_tracking.length > 0) {
      let allPlayers = await listPlayerNamesInDb()
      msg.channel.send(`Available players: ${allPlayers}`)
      msg.channel.send(`Now tracking (max ${max_players_tracked}): ${players_tracking}`)
    }
    else msg.channel.send('No players being tracked.')
  }
});

// Set channel_id for discord server
// client.on('interactionCreate', async interaction => {
//   if (!interaction.isChatInputCommand()) return;
//   const guildId = interaction.guild.id;
//   const storedChannelId = await database.getChannelIdForServer(guildId); // Fetch from database
//   // Use storedChannelId to interact with the correct channel on the current server
//   const channel = await interaction.guild.channels.fetch(storedChannelId);
//   channel.send("Message sent to the configured channel"); 
// });

let max_players_tracked = 5
let fetch_timer = 300000; // Wait 300 seconds (5 minutes)
// OpenDota API max 2000 calls/day and 60/min (around 83 calls per hour)
// currently, each iteration uses 2 calls, or 1 if no new recent match found
// to check 1 person every 5 mins, max 15 calls per hour (assuming 3 games per hour max)

init();
let players_tracking = await getPlayersFromDb(process.env.CHANNEL_ID)
// let account_ids = await getPlayersIdFromDb(players_tracking)
refresh_loop();