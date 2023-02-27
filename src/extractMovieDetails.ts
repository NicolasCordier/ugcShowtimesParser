import { HTMLElement } from 'node-html-parser';
import { ParsedMovieDetails } from './types';

function extractMovieThumbnails(page: HTMLElement) {
    const regex = /goToFilm_(\d+)/;
    const links = page.querySelectorAll('div.img-wrapper>a[id^=goToFilm_]>img') || [];
    const thumbnailUrls = links.reduce((parsedThumbnails: Record<string, string>, img) => {
        const [_, movieId] = regex.exec(img.parentNode.id) || [];
        if (!movieId) return parsedThumbnails;

        const thumbnailUrl = img.getAttribute('data-src');
        if (thumbnailUrl) parsedThumbnails[movieId] = thumbnailUrl;

        return parsedThumbnails;
    }, {});
    return thumbnailUrls;
}

function extractMovieDescription(description: string) {
    const descEndWith = '  voir moins  ';
    if (description.endsWith(descEndWith)) {
        description = description.slice(0, description.length - descEndWith.length);
    }
    return description.trim();
}

export default function extractMovieDetails(page: HTMLElement) {
    const thumbnailUrls = extractMovieThumbnails(page);

    const regex = /allSynopsisMobile_(\d+)/;
    const descriptions = page.querySelectorAll('span[id^=allSynopsisMobile_]') || [];
    const details = descriptions.reduce((parsedDescriptions: ParsedMovieDetails, description) => {
        const [_, movieId] = regex.exec(description.id) || [];
        if (!movieId) return parsedDescriptions;

        const groupInfo = description.parentNode.parentNode.parentNode;

        const movieDescription = extractMovieDescription(description.textContent);
        const movieDirector = groupInfo.querySelector("p:nth-child(1) > span")?.textContent || '';
        const movieActors = groupInfo.querySelector("p:nth-child(2) > span")?.textContent || '';

        parsedDescriptions[movieId] = {
            actors: movieActors,
            description: movieDescription,
            directors: movieDirector,
            thumbnailUrl: thumbnailUrls[movieId] || null,
        }
        return parsedDescriptions;
    }, {});
    return details;
}