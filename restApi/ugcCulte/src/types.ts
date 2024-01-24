export type ApiResult = Movie & {
    showings: Showing[];
};

type Movie = {
    id: number;
    thumbnailUrl: URL | null;
    name: string;
    genders: string | null;
    directors: string | null;
    actors: string | null;
    description: string | null;
    releaseDateFR: string | null;
    durationFR: string | null;
};

export type Movies = Record<number, Movie>

export type Showing = {
    id: number;
    start: Date;
    end: Date;
    lang: string | null;
    cinema: {
        id: number;
        name: string;
    }
}