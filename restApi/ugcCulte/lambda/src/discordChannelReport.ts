import { deleteDiscordMessage, getDiscordChannelMessages, sendDiscordMessage, updateDiscordMessage } from "./discordApi";
import { discordCinemasChannels } from "./params";
import { splitDiscordEmbeds } from "./splitDiscordEmbeds";
import { ApiResult, EmbedMessage, EmbedMessageField } from "./types";
import { splitToChunks } from "./utils";

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

    return {
        shouldDelete: !currentIncludesExpected, // There are more/different showings
        shouldEdit: !expectedIncludesCurrent, // There are less showings (probably passed showings)
    };
}

function convertToDiscordEmbed(movie: ApiMovie, cinemaId: number) {
    return {
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
    };
}

type TaintedMessageReduce = {
    toDelete: Record<number, DiscordChannelMovie>,
    toEdit: Record<number, DiscordChannelMovie>,
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

export function _compareWithDiscord(
    currentMovies: DiscordChannelMovie[],
    cinemaMovies: ApiResult[0],
): DiscordComparisonResult {
    const newMoviesR = cinemaMovies.movies.reduce((movies, movie) => {
        movies[movie.id] = movie;
        return movies;
    }, {} as Record<number, ApiMovie>);

    const { toDelete, toEdit, untainted } = currentMovies.reduce((movies, movie) => {
        const comparison = newMoviesR[movie.movieId] && compareMovies(movie, newMoviesR[movie.movieId]);

        if (!comparison || comparison.shouldDelete) {
            movies.toDelete[movie.movieId] = movie;
        } else if (comparison.shouldEdit) {
            movies.toEdit[movie.movieId] = movie;
        } else {
            movies.untainted[movie.movieId] = movie;
        }
        return movies;
    }, { toDelete: {}, untainted: {}, toEdit: {} } as TaintedMessageReduce);

    const toDeleteMessageIds = new Set(Object.values(toDelete).map((movie) => movie.messageId));
    const toEditMessageIds = new Set(Object.values(toEdit).map((movie) => movie.messageId));
    const untaintedMessageIds = new Set(Object.values(untainted).map((movie) => movie.messageId));

    //
    // Delete Discord embeds of passed movies or tainted embeds (tained ex: more/less showings)
    // Edit messages to remove tainted embeds
    // Delete messages without any embeds anymore
    //
    const messageIdsToDelete = new Set([...toDeleteMessageIds].filter((messageId) => !untaintedMessageIds.has(messageId))); // Difference
    const messageIdsToEdit = new Set([
        ...toEditMessageIds.keys(),
        ...[...untaintedMessageIds].filter((messageId) => toDeleteMessageIds.has(messageId)) // Intersection
    ]);
    
    const messagesToEditR = Object.values({ ...untainted, ...toEdit }).reduce((messages, discordMovie) => {
        const movie = newMoviesR[discordMovie.movieId];
        if (messageIdsToEdit.has(discordMovie.messageId) && movie) {
            const currentEmbeds = messages[discordMovie.messageId]?.newEmbeds ?? [];
            messages[discordMovie.messageId] = {
                id: discordMovie.messageId,
                newEmbeds: [
                    ...currentEmbeds,
                    convertToDiscordEmbed(movie, cinemaMovies.cinemaId),
                ],
            };
        }
        return messages;
    }, {} as Record<string, DiscordTaintedMessage>);
    const messagesToEdit = Object.values(messagesToEditR);

    //
    // Create new movies and recreate tainted movies
    //
    const newMovies = cinemaMovies.movies.filter((movie) => !untainted[movie.id] && !toEdit[movie.id]);

    return {
        messageIdsToDelete,
        messagesToEdit,
        newMovies,
    };
}

async function compareWithDiscord(channelId: string, cinemaMovies: ApiResult[0]): Promise<DiscordComparisonResult> {
    const currentMovies = await getDiscordChannelMovies(channelId);
    return _compareWithDiscord(currentMovies, cinemaMovies);
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
    const embeds = movies.map((movie) => convertToDiscordEmbed(movie, cinemaId));

    const embedsChunks = splitDiscordEmbeds(embeds);

    for (const embedsChunk of embedsChunks) {
        await sendDiscordMessage(channelId, {
            username: 'UGC',
            embeds: embedsChunk,
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