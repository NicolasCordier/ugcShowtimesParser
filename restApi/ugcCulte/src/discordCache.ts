import { getDiscordMessageContent, updateDiscordMessage } from "./discordApi";
import { discordCacheChannelId, discordCacheMessageId } from "./params"
import { ApiResult } from "./types";
import { strToCinemasData, CinemasData, cinemasDataToStr, computeCrc32, convertCinemasDataToRecord } from "./utils";

async function getDiscordCacheMessage() {
    return getDiscordMessageContent(discordCacheChannelId, discordCacheMessageId);
}

export async function getDiscordCinemasCache() {
    const hash = await getDiscordCacheMessage();
    return strToCinemasData(hash);
}

async function updateDiscordCacheMessage(message: string) {
    await updateDiscordMessage(discordCacheChannelId, discordCacheMessageId, {
        content: message,
    });
}

export async function updateDiscordCinemasCache(data: CinemasData) {
    const message = cinemasDataToStr(data);
    await updateDiscordCacheMessage(message);
}

export function computeCache(cinemasMovies: ApiResult) {
    return cinemasMovies.map((cinema) => ({
        cinemaId: cinema.cinemaId,
        data: computeCrc32(JSON.stringify(cinema.movies)),
    }));
}

export function getOutdatedCinemaIds(currentCache: CinemasData, newCache: CinemasData) {
    const currentCacheR = convertCinemasDataToRecord(currentCache);
    const newCacheR = convertCinemasDataToRecord(newCache);

    const missingCinemaIds = newCache
        .filter((cache) => !currentCacheR[cache.cinemaId])
        .map((cache) => cache.cinemaId);

    const outdatedCinemaIds = currentCache.reduce((cinemaIds, cache) => {
        if (newCacheR[cache.cinemaId] !== cache.data)
        {
            cinemaIds.push(cache.cinemaId);
        }
        return cinemaIds;
    }, missingCinemaIds);

    return outdatedCinemaIds;
}