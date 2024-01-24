import { ParsedCinemas, ApiResult, ParsedMovieDetails } from "./types";

export default function getApiResult(cinemas: ParsedCinemas, movies: ParsedMovieDetails) {
    return Object.entries(cinemas).map<ApiResult>(([cinemaId, cinema]) => {
        return {
            id: cinemaId,
            url: `https://www.ugc.fr/cinema.html?id=${cinemaId}`,
            name: cinema.name,
            movies: Object.entries(cinema.movies).map(([movieId, movie]) => {
                const movieDetails = movies[movieId];
                return {
                    id: movieId,
                    url: `https://www.ugc.fr/film.html?id=${movieId}&cinemaId=${cinemaId}`,
                    genders: movie.genders,
                    label: movie.label,
                    name: movie.name,
                    directors: movieDetails?.directors || '',
                    actors: movieDetails?.actors || '',
                    description: movieDetails?.description || '',
                    thumbnailUrl: movieDetails?.thumbnailUrl || null,
                    screeningHours: movie.screeningHours.map((screening) => {
                        return {
                            id: screening.id,
                            url: `https://www.ugc.fr/reservationSeances.html?id=${screening.id}`,
                            start: screening.start,
                            end: screening.end,
                            lang: screening.lang,
                        };
                    })
                }
            })
        }
    });

}