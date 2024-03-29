import { Movie, Showing } from "./types";
import { getResponseJson, validateValue } from "./utils";

//
// UGC Rest API requires a valid Accept-Language header or it sends back a 500 status code.
// By default, fetch sets the header to "Accept-Language: *" which is considered invalid.
//
const headers = { 'Accept-Language': 'fr-FR' };

const date1yearAgo = new Date();
date1yearAgo.setFullYear(date1yearAgo.getFullYear() - 1);
const timestamp1YearAgo = date1yearAgo.getTime();

export async function getMovies(cinemaIds?: number[]) {
    const endpoint = new URL("https://backend.ugc.fr/api/films");

    //
    // Some old movies are rerun in cinema theaters without having the "UGC Cultes" label
    // Because they have another label (such as "100 ans Warner")
    // Or because they are rerun during a special event (ex: Love Festival)
    // So instead we consider a movie to be old if it was released > 1 year ago
    //
    // Keep legacy code here as the search param filter itself still works:
    // const labels = ["UGC Culte"];
    // endpoint.searchParams.set('labels', labels.join(','));
    //

    if (cinemaIds && cinemaIds.length > 0) {
        endpoint.searchParams.set('cinemas', cinemaIds.join(','));
    }

    const httpResponse = await fetch(endpoint, { headers });
    const response = await getResponseJson(httpResponse);

    const movieList = validateValue(response, 'array', 'response', false);

    return movieList.reduce((movies: Record<number, Movie>, movie: any) => {
        const movieId = validateValue(movie?.code_ugc, 'number', 'code_ugc', false);
        const releaseDateTimestamp = validateValue(movie?.date_sortie_timestamp, 'number', 'date_sortie_timestamp', true);

        if (releaseDateTimestamp && releaseDateTimestamp * 1000 < timestamp1YearAgo)
        {
            movies[movieId] = {
                id: movieId,
                name: validateValue(movie?.titre, 'string', 'titre', false),
                description: validateValue(movie?.synopsis, 'string', 'synopsis', true),
                thumbnailUrl: validateValue(movie?.image_affiche, 'url', 'image_affiche', true),
                genders: validateValue(movie?.genre, 'string', 'genre', true),
                directors: validateValue(movie?.realisteur, 'string', 'realisteur', true),
                actors: validateValue(movie?.acteur, 'string', 'acteur', true),
                releaseDateFR: validateValue(movie?.date_sortie, 'string', 'date_sortie', true),
                durationFR: validateValue(movie?.duree, 'string', 'duree', true),
            }
        }
        return movies;
    }, {});
}

async function getMovieShowingsDates(movieId: number): Promise<string[]> {
    const endpoint = new URL(`https://backend.ugc.fr/api/films/${movieId}/showings/days`);

    const httpResponse = await fetch(endpoint, { headers });
    const response = await getResponseJson(httpResponse);

    const dateList = validateValue(response, 'array', 'response', false);
    
    return dateList.reduce((dates: string[], date) => {
        //
        // Validate that each item is a string date
        //
        const dateStr = validateValue(date, 'string', 'date', false);
        validateValue(dateStr, 'date', 'date', false);

        dates.push(dateStr);
        return dates;
    }, []);
}

async function getMovieShowingsAtDate(movieId: number, date: string, cinemaIds?: number[]): Promise<Showing[]> {
    const endpoint = new URL(`https://backend.ugc.fr/api/films/${movieId}/showings/${date}`);

    const httpResponse = await fetch(endpoint, { headers });
    const response = await getResponseJson(httpResponse);

    const showingList = validateValue(response, 'array', 'response', false);
    
    return showingList.reduce((showings: Showing[], showing: any) => {
        const cinemaId = validateValue(showing?.cinema?.code_complexe, 'number', 'code_complexe', false);
        const cinemaName = validateValue(showing?.cinema?.libelle, 'string', 'libelle', false);

        const cinemaShowings = validateValue(showing?.seancesAndVersionTypes, 'array', 'seancesAndVersionTypes', false);
        const extractedShowings = cinemaShowings.flatMap((cinemaShowing: any) => {
            const cinemaShowingInfos = validateValue(cinemaShowing?.seances, 'array', 'seances', false);
            const showingLang = validateValue(cinemaShowing?.version, 'string', 'version', true);

            return cinemaShowingInfos.map<Showing>((showingInfo: any) => {
                const startDateTimestamp = validateValue(showingInfo?.date_heure, 'number', 'date_heure', false);
                const endDateTimestamp = validateValue(showingInfo?.date_fin, 'number', 'date_fin', false);
                return {
                    id: validateValue(showingInfo?.seance_id, 'number', 'seance_id', false),
                    start: validateValue(startDateTimestamp, 'date', 'date_heure', false),
                    end: validateValue(endDateTimestamp, 'date', 'date_fin', false),
    
                    lang: showingLang,
                    cinema: {
                        id: cinemaId,
                        name: cinemaName.trim(), // The API sometime returns untrimed names
                    }
                };
            });
        })

        if (!cinemaIds || cinemaIds.length === 0 || cinemaIds.includes(cinemaId))
        {
            showings.push(...extractedShowings);
        }

        return showings;
    }, []);
}

export async function getMovieShowings(movieId: number, cinemaIds?: number[]): Promise<Showing[]> {
    const dates = await getMovieShowingsDates(movieId);

    const dateMovieShowingPromises = dates.map((date) => getMovieShowingsAtDate(movieId, date, cinemaIds));
    return (await Promise.all(dateMovieShowingPromises)).flat();
}