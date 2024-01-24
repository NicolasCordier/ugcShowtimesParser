import { ApiResult } from './types';
import { getEnvVar, getTime, splitIntoChunks, waitFor } from './utils';

const DISCORD_WEBHOOK = getEnvVar('DISCORD_WEBHOOK');
const DISCORD_MAX_EMBED_PER_MSG = getEnvVar('DISCORD_MAX_EMBED_PER_MSG', 'number');

interface EmbedMessage {
    title: string;
    url: string;
    description: string;
    fields: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    thumbnail?: {
        url: string;
    };
}

interface EmbedMovie {
    url: string;
    thumbnailUrl: string | null;
    name: string;
    genders: string;
    label: string;
    directors: string;
    actors: string;
    description: string;
    screeningHours: {
        url: string;
        start: Date;
        end: Date;
        lang: string;
        cinemaName: string;
    }[];
}
type EmbedMovies = Record<string, EmbedMovie>;

function formatToEmbedMovies(apiResult: ApiResult[]) {
    return apiResult.reduce((embedMovies: EmbedMovies, cinema) => {
        cinema.movies.forEach((movie) => {
            const screeningHours = embedMovies[movie.id]?.screeningHours || [];
            screeningHours.push(...movie.screeningHours.map((screening) => {
                return {
                    url: screening.url,
                    start: screening.start,
                    end: screening.end,
                    lang: screening.lang,
                    cinemaName: cinema.name,
                }
            }));

            embedMovies[movie.id] = {
                ...embedMovies[movie.id],
                url: movie.url,
                thumbnailUrl: movie.thumbnailUrl,
                name: movie.name,
                genders: movie.genders,
                label: movie.label,
                directors: movie.directors,
                actors: movie.actors,
                description: movie.description,
                screeningHours: screeningHours.sort((a, b) => a.start.getTime() - b.start.getTime()),
            }
        });
        return embedMovies;
    }, {});
}

function sortEmbedMovies(movies: EmbedMovies) {
    return Object.values(movies)
        .sort((a, b) => a.screeningHours[0].start.getTime() - b.screeningHours[0].start.getTime());
}

export default async function sendDiscordMessage(apiResult: ApiResult[], msgAuthor?: string) {
    const movies = sortEmbedMovies(formatToEmbedMovies(apiResult));

    const embedMessages = movies.map<EmbedMessage>((movie) => {
        const thumbnail = movie.thumbnailUrl ? { url: movie.thumbnailUrl } : undefined;
        return {
            title: movie.name,
            url: movie.url,
            description: movie.description,
            thumbnail: thumbnail,
            fields: [
                { name: 'Label', value: movie.label, inline: true },
                { name: 'Genres', value: movie.genders, inline: true },
                { name: 'Realisateurs', value: movie.directors, inline: true },
                { name: 'Acteurs', value: movie.actors, inline: true },
                ...movie.screeningHours.map((sc) => ({
                    name: sc.cinemaName,
                    value: `[${sc.lang} ${getTime(sc.start)} (fin ${getTime(sc.end)})](${sc.url})`,
                }))
            ]
        }
    });

    const embedMessagesChunks = splitIntoChunks(embedMessages, DISCORD_MAX_EMBED_PER_MSG);

    //
    // For of to send messages sequentially as they are sorted by movie start time
    //
    for (const requestEmbedMessages of embedMessagesChunks) {
        const sendMessage = () => fetch(DISCORD_WEBHOOK,
            {
                method: 'POST',
                body: JSON.stringify({
                    username: msgAuthor,
                    embeds: requestEmbedMessages,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        const request = await sendMessage();
        if (request.status === 429) {
            const jsonError = await request.json();

            const { retry_after } = jsonError;
            if (typeof retry_after === 'number' && retry_after > 0) {
                await waitFor(retry_after * 1000);
                console.log('Retrying');
                const retryRequest = await sendMessage();
                console.log(retryRequest.status);
                console.log(await retryRequest.text());
            } else {
                console.log(await request.text());
            }
        }
        else {
            console.log(await request.text());
        }
    }
}