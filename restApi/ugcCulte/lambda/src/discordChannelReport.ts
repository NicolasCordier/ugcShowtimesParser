import { deleteDiscordMessage, getDiscordChannelMessages, sendDiscordMessage } from "./discordApi";
import { discordCinemasChannels } from "./params";
import { ApiResult, EmbedMessageField } from "./types";

type DiscordChannelMovie = {
    messageId: string;
    movieId: number;
    showingIds: number[];
}

const fieldUrlExtractorReg = /\[.*\]\((.*)\)/g;
async function getDiscordChannelMovies(channelId: string) {
    const messages = await getDiscordChannelMessages(channelId);

    const extractedMovies = messages.reduce((movies, message) => {
        const [embed] = message.embeds;
        const fields = embed.fields ?? [];

        try {
            const movieUrl = new URL(embed.url);
            const movieId = Number(movieUrl.searchParams.get('id'));

            const extractedShowings = fields.reduce((showingIds, field) => {
                const [, extractedUrl] = fieldUrlExtractorReg.exec(field.value) || [];
                if (extractedUrl) {
                    const showingUrl = new URL(extractedUrl);
                    const showingId = Number(showingUrl.searchParams.get('id'));
                    if (!Number.isNaN(showingId)) {
                        showingIds.push(showingId);
                    }
                }
                return showingIds;
            }, [] as DiscordChannelMovie["showingIds"]);

            if (!Number.isNaN(movieId) && extractedShowings.length > 0) {
                movies.push({
                    messageId: message.id,
                    movieId: movieId,
                    showingIds: extractedShowings,
                });
            }
        } catch (err) {
            // Ignore invalid/malformated messages
        }

        return movies;
    }, [] as DiscordChannelMovie[])

    return extractedMovies;
}

type ApiMovie = ApiResult[0]["movies"][0];

function compareMovies(current: DiscordChannelMovie, expected: ApiMovie) {
    const expectedIds = expected.showings.map((s) => s.id);

    const expectedIncludesCurrent = current.showingIds.every((showingId) => expectedIds.includes(showingId));
    const currentIncludesExpected = expectedIds.every((showingId) => current.showingIds.includes(showingId));

    return expectedIncludesCurrent && currentIncludesExpected;
}

type DiscordComparisonResult = {
    outdatedMessageIds: string[];
    newMovies: ApiMovie[];
}

async function compareWithDiscord(channelId: string, cinemaMovies: ApiResult[0]) {
    const currentMovies = await getDiscordChannelMovies(channelId);
    const currentMoviesR = currentMovies.reduce((movies, movie) => {
        movies[movie.movieId] = movie;
        return movies;
    }, {} as Record<number, DiscordChannelMovie>);

    const newMovies = cinemaMovies.movies.reduce((movies, movie) => {
        movies[movie.id] = movie;
        return movies;
    }, {} as Record<number, ApiMovie>);

    const outdatedMessageIds = currentMovies.reduce((outdated, movie) => {
        if (!newMovies[movie.movieId]) {
            outdated.push(movie.messageId);
        }
        return outdated;
    }, [] as string[]);

    return cinemaMovies.movies.reduce((result, movie) => {
        const currentMovie = currentMoviesR[movie.id];
        if (!currentMovie) {
            result.newMovies.push(movie);
        }
        else if (!compareMovies(currentMovie, movie)) {
            result.newMovies.push(movie);
            result.outdatedMessageIds.push(currentMovie.messageId);
        }
        return result;
    }, { outdatedMessageIds, newMovies: [] } as DiscordComparisonResult);
}

type OptionalField = {
    name: string;
    value: string | null;
    inline?: boolean;
}
function getOptionalFields(fields: OptionalField[]): EmbedMessageField[]
{
    return fields.reduce((nonNullFields: EmbedMessageField[], field) => {
        if (field.value) {
            nonNullFields.push(field as EmbedMessageField);
        }
        return nonNullFields;
    }, []);
}

export async function reportMovieToChannel(channelId: string, cinemaId: number, movie: ApiMovie) {
    const thumbnail = movie.thumbnailUrl ? { url: movie.thumbnailUrl.toString() } : undefined;

    await sendDiscordMessage(channelId, {
        username: 'UGC',
        embeds: [{
            title: movie.name,
            url: `https://www.ugc.fr/film.html?id=${movie.id}&cinemaId=${cinemaId}`,
            description: movie.description || '-',
            thumbnail: thumbnail,
            fields: getOptionalFields([
                { name: 'Genres', value: movie.genders, inline: true },
                { name: 'Réalisateurs', value: movie.directors, inline: true },
                { name: 'Acteurs', value: movie.actors, inline: true },
                { name: 'Durée', value: movie.durationFR, inline: true },
                ...movie.showings.map((s) => ({
                    name: `${s.lang} - ${s.startDateFR} (fin ${s.endDateFR})`,
                    value: `[Réserver](${s.bookingUrl})`,
                }))
            ]),
        }],
    });
}

export async function reportCinemaMovies(cinemaId: number, cinemaMovies: ApiResult[0]) {
    const channelId = discordCinemasChannels[cinemaId];
    if (!channelId)
    {
        return;
    }

    const { newMovies, outdatedMessageIds } = await compareWithDiscord(channelId, cinemaMovies);
    const sortedMovies = newMovies.sort((a, b) => a.showings[0]?.startDate > b.showings[0]?.startDate ? 1 : -1);

    //
    // Use "for of" instead of "Promise.all" to avoid flooding Discord's API
    //
    for (const movie of sortedMovies) {
        await reportMovieToChannel(channelId, cinemaId, movie);
    }
    for (const messageId of outdatedMessageIds) {
        await deleteDiscordMessage(channelId, messageId);
    }
}