import { parse } from 'node-html-parser';

export default async function getCinemaHtmlPage(cinemaId: string, date: Date) {
    const searchDate = date.toISOString().slice(0, 10);
    const url = new URL('https://www.ugc.fr/showingsCinemaAjaxAction!getShowingsForCinemaPage.action');
    url.searchParams.append('cinemaId', cinemaId);
    url.searchParams.append('date', searchDate);

    const fetched = await fetch(url);
    if (fetched.status < 200 || fetched.status >= 300)
    {
        throw new Error(`Unexpected status code ${fetched.status}`);
    }
    return parse(await fetched.text());
}