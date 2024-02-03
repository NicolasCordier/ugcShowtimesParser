import { convertCinemasDataToRecord, getEnvVar, strToCinemasData } from "./utils";

export const discordToken = getEnvVar("DISCORD_TOKEN");

export const discordCacheChannelId = getEnvVar("DISCORD_CACHE_CHANNEL_ID");
export const discordCacheMessageId = getEnvVar("DISCORD_CACHE_MESSAGE_ID");

const discordCinemasChannelsStr = getEnvVar("DISCORD_CINEMAS_CHANNELS");
const discordCinemasChannelsList = strToCinemasData(discordCinemasChannelsStr);
export const discordCinemasChannels = convertCinemasDataToRecord(discordCinemasChannelsList);
export const cinemaIds = discordCinemasChannelsList.map((cinema) => cinema.cinemaId);