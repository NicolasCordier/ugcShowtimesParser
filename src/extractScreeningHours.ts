import { HTMLElement } from 'node-html-parser';
import { ParsedCinemas } from './types';
import getDateFromHour from './getDateFromHour';

export default function extractScreeningHours(page: HTMLElement, searchStart: Date, searchEnd: Date) {
    const screeningHours = page.querySelectorAll('ul.component--screening-cards>li>button') || [];
    const parsedCinemaHours = screeningHours.reduce((cinemas: ParsedCinemas, screeningButtn) => {
        const cinemaId = screeningButtn.getAttribute('data-cinemaid');
        const movieId = screeningButtn.getAttribute('data-filmid');
        const screeningId = screeningButtn.getAttribute('data-showing');

        //
        // Skip screening if failed to extract ids
        //
        if (!cinemaId || !movieId || !screeningId) return cinemas;

        const cinemaName = screeningButtn.getAttribute('data-cinema') || 'unknown';
        const movieName = screeningButtn.getAttribute('data-film') || 'unknown';
        const movieGenders = screeningButtn.getAttribute('data-filmgender') || 'unknown';
        const movieLabel = screeningButtn.getAttribute('data-labelnom') || '';
        const screeningLang = screeningButtn.getAttribute('data-version') || 'unknown';

        const screeningStart = getDateFromHour(searchStart, screeningButtn.getAttribute('data-seancehour') || '');
        const screeningEnd = getDateFromHour(searchStart, screeningButtn.querySelector('.screening-end')?.textContent || '');

        //
        // Skip screening if failed to extract screening hours
        //
        if (!screeningStart || !screeningEnd) return cinemas;

        //
        // Skip screening if the movie starts outside the boudaries
        //
        if (screeningStart < searchStart || screeningStart > searchEnd)
        {
            return cinemas;
        }

        if (screeningStart > screeningEnd) {
            //
            // Screening ends after midnight
            //
            screeningEnd.setDate(screeningEnd.getDate() + 1);
        }

        const cinema = cinemas[cinemaId] ?? {
            name: cinemaName,
            movies: {},
        };
        cinema.movies[movieId] = {
            name: movieName,
            genders: movieGenders,
            label: movieLabel,
            screeningHours: [
                ...cinema.movies[movieId]?.screeningHours ?? [],
                {
                    id: screeningId,
                    start: screeningStart,
                    end: screeningEnd,
                    lang: screeningLang,
                }
            ]
        }
        cinemas[cinemaId] = cinema;

        return cinemas;
    }, {});

    return parsedCinemaHours;
}