import { deleteDiscordMessage, getDiscordChannelMessages, sendDiscordMessage, updateDiscordMessage } from "./discordApi";
import { discordCinemasChannels } from "./params";
import { ApiResult, EmbedMessage, EmbedMessageField } from "./types";
import { splitToChunks } from "./utils";

//
// TODO: Set to 10 and edit the split to chunk function to make sure
// The sum off embed don't exceed 6000 characters
//
const MAX_DISCORD_EMBEDS_PER_MSG = 5;
const MAX_EMBEDS_CHARS_PER_MSG = 6000;

type DiscordChannelMovie = {
    messageId: string;
    movieId: number;
    showingIds: number[];
    discordEmbed: EmbedMessage;
}

const fieldUrlExtractorReg = /\[.*\]\((.*)\)/;
async function getDiscordChannelMovies(channelId: string) {
    const messages = await getDiscordChannelMessages(channelId);

    const extractedMovies = messages.reduce((movies, message) => {
        for (const embed of message.embeds) {
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
                        discordEmbed: embed,
                    });
                }
            } catch (err) {
                // Ignore invalid/malformated messages
            }
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

type TaintedMessageReduce = {
    tainted: Record<number, DiscordChannelMovie>,
    untainted: Record<number, DiscordChannelMovie>,
}

type DiscordTaintedMessage = {
    id: string;
    newEmbeds: EmbedMessage[];
}

type DiscordComparisonResult = {
    messageIdsToDelete: Set<string>;
    messagesToEdit: DiscordTaintedMessage[];
    newMovies: ApiMovie[]; 
}

async function compareWithDiscord(channelId: string, cinemaMovies: ApiResult[0]): Promise<DiscordComparisonResult> {
    const currentMovies = await getDiscordChannelMovies(channelId);

    const newMoviesR = cinemaMovies.movies.reduce((movies, movie) => {
        movies[movie.id] = movie;
        return movies;
    }, {} as Record<number, ApiMovie>);

    const { tainted, untainted } = currentMovies.reduce((movies, movie) => {
        if (newMoviesR[movie.movieId] && compareMovies(movie, newMoviesR[movie.movieId])) {
            movies.untainted[movie.movieId] = movie;
        } else {
            movies.tainted[movie.movieId] = movie;
        }
        return movies;
    }, { tainted: {}, untainted: {} } as TaintedMessageReduce);

    const taintedMessageIds = new Set(Object.values(tainted).map((movie) => movie.messageId));
    const untaintedMessageIds = new Set(Object.values(untainted).map((movie) => movie.messageId));

    //
    // Delete Discord embeds of passed movies or tainted embeds (tained ex: more/less showings)
    // Edit messages to remove tainted embeds
    // Delete messages without any embeds anymore
    //
    const messageIdsToDelete = new Set([...taintedMessageIds].filter((messageId) => !untaintedMessageIds.has(messageId))); // Difference
    const messageIdsToEdit = new Set([...untaintedMessageIds].filter((messageId) => untaintedMessageIds.has(messageId)));  // Intersection

    const messagesToEditR = Object.values(untainted).reduce((messages, movie) => {
        if (messageIdsToEdit.has(movie.messageId)) {
            const currentEmbeds = messages[movie.messageId]?.newEmbeds ?? [];
            messages[movie.messageId] = {
                id: movie.messageId,
                newEmbeds: [
                    ...currentEmbeds,
                    movie.discordEmbed,
                ],
            };
        }
        return messages;
    }, {} as Record<string, DiscordTaintedMessage>);
    const messagesToEdit = Object.values(messagesToEditR);

    //
    // Create new movies and recreate tainted movies
    //
    const newMovies = cinemaMovies.movies.filter((movie) => !untainted[movie.id]);

    return {
        messageIdsToDelete,
        messagesToEdit,
        newMovies,
    };
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

export async function reportMoviesToChannel(channelId: string, cinemaId: number, movies: ApiMovie[]) {
    const moviesChunks = splitToChunks(movies, MAX_DISCORD_EMBEDS_PER_MSG);

    for (const movieChunk of moviesChunks) {
        await sendDiscordMessage(channelId, {
            username: 'UGC',
            embeds: movieChunk.map((movie) => ({
                title: movie.name,
                url: `https://www.ugc.fr/film.html?id=${movie.id}&cinemaId=${cinemaId}`,
                description: movie.description || '-',
                thumbnail: movie.thumbnailUrl ? { url: movie.thumbnailUrl.toString() } : undefined,
                fields: getOptionalFields([
                    { name: 'Genres', value: movie.genders, inline: true },
                    { name: 'Réalisateurs', value: movie.directors, inline: true },
                    { name: 'Acteurs', value: movie.actors, inline: true },
                    { name: 'Durée', value: movie.durationFR, inline: true },
                    { name: 'Date de sortie', value: movie.releaseDateFR, inline: true },
                    ...movie.showings.map((s) => ({
                        name: `${s.lang} - ${s.startDateFR} (fin ${s.endDateFR})`,
                        value: `[Réserver](${s.bookingUrl})`,
                    })),
                ]),
            })),
        });
    }
}

export async function reportCinemaMovies(cinemaId: number, cinemaMovies: ApiResult[0]) {
    const channelId = discordCinemasChannels[cinemaId];
    if (!channelId)
    {
        return;
    }

    const { newMovies, messageIdsToDelete, messagesToEdit } = await compareWithDiscord(channelId, cinemaMovies);
    const sortedMovies = newMovies.sort((a, b) => a.showings[0]?.startDate > b.showings[0]?.startDate ? 1 : -1);

    //
    // Use "for of" instead of "Promise.all" to avoid flooding Discord's API
    //
    for (const message of messagesToEdit) {
        await updateDiscordMessage(channelId, message.id, {
            embeds: message.newEmbeds,
        });
    }
    await reportMoviesToChannel(channelId, cinemaId, sortedMovies);
    for (const messageId of messageIdsToDelete) {
        await deleteDiscordMessage(channelId, messageId);
    }
}