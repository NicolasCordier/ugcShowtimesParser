import { getDiscordCinemasCache, computeCache, getOutdatedCinemaIds, updateDiscordCinemasCache } from "./discordCache";
import { reportCinemaMovies } from "./discordChannelReport";
import { ApiResult } from "./types";

export async function reportMoviesToDiscord(cinemasMovies: ApiResult) {
    const currentCache = await getDiscordCinemasCache();
    const newCache = computeCache(cinemasMovies);

    const outdatedCinemaIds = getOutdatedCinemaIds(currentCache, newCache);

    const cinemasMoviesR = cinemasMovies.reduce((result, cinema) => {
        result[cinema.cinemaId] = cinema;
        return result;
    }, {} as Record<number, ApiResult[0]>);

    //
    // Use "for of" instead of "Promise.all" to avoid flooding Discord's API
    //
    for (const cinemaId of outdatedCinemaIds) {
        const cinemaMovies = cinemasMoviesR[cinemaId];
        if (cinemaMovies) {
            await reportCinemaMovies(cinemaId, cinemaMovies);
        }
    }

    await updateDiscordCinemasCache(newCache);
}