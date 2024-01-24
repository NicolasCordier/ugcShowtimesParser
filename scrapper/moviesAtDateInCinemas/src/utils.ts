export function getTime(date: Date) {
    const hours = date.getHours().toLocaleString(undefined, { minimumIntegerDigits: 2 });
    const minutes = date.getMinutes().toLocaleString(undefined, { minimumIntegerDigits: 2 });
    return `${hours}:${minutes}`;
}

export function splitIntoChunks<T>(array: T[], size: number): T[][] {
    if (size <= 0) {
        throw new Error(`Invalid chunk size ${size}`);
    }

    return array.reduce((chunks: T[][], chunk, index) => {
        if (index % size === 0) {
            chunks.push([chunk]);
        }
        else {
            chunks[Math.floor(index / size)].push(chunk);
        }
        return chunks;
    }, [])
}

export async function waitFor(durationInMs: number) {
    return new Promise((resolve) => setTimeout(resolve, durationInMs));
}

function getEnvVar(envName: string): string;
function getEnvVar(envName: string, type: 'string'): number;
function getEnvVar(envName: string, type: 'number'): number;
function getEnvVar(envName: string, type: 'string' | 'number' = 'string'): string | number {
    const envVar = process.env[envName];
    if (!envVar) {
        throw new Error(`Environment variable not set ${envName}`);
    }
    if (type === 'number') {
        const numEnvVar = Number(envVar);
        if (Number.isNaN(numEnvVar)) {
            throw new Error(`Environment variable ${envName} is not a number`);
        }
    }
    return envVar;
}

export { getEnvVar };