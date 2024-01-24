type ValidateType = 'boolean' | 'number' | 'string' | 'array' | 'date' | 'url';
type ValidatorFunc = (value: unknown) => unknown;
const validators: Record<ValidateType, ValidatorFunc> = {
    boolean: (value) => typeof value === 'boolean' ? value : null,
    string: (value) => typeof value === 'string' ? value : null,
    number: (value) => typeof value === 'number' ? value : null,
    array: (value) => Array.isArray(value) ? value : null,
    date: (value: any) =>
    {
        const date = new Date(value);
        return Number.isNaN(date) ? null : date;
    },
    url: (value: any) =>
    {
        try {
            const url = new URL(value);
            return url;
        } catch (err) {
            return null;
        }
    },
}

function validateValue(value: unknown, type: 'boolean', entityName: string, fallbackOnNull: true): boolean | null;
function validateValue(value: unknown, type: 'boolean', entityName: string, fallbackOnNull: false): boolean;
function validateValue(value: unknown, type: 'string', entityName: string, fallbackOnNull: true): string | null;
function validateValue(value: unknown, type: 'string', entityName: string, fallbackOnNull: false): string;
function validateValue(value: unknown, type: 'number', entityName: string, fallbackOnNull: true): number | null;
function validateValue(value: unknown, type: 'number', entityName: string, fallbackOnNull: false): number;
function validateValue(value: unknown, type: 'date', entityName: string, fallbackOnNull: true): Date | null;
function validateValue(value: unknown, type: 'date', entityName: string, fallbackOnNull: false): Date;
function validateValue(value: unknown, type: 'url', entityName: string, fallbackOnNull: true): URL | null;
function validateValue(value: unknown, type: 'url', entityName: string, fallbackOnNull: false): URL;
function validateValue(value: unknown, type: 'array', entityName: string, fallbackOnNull: true): unknown[] | null;
function validateValue(value: unknown, type: 'array', entityName: string, fallbackOnNull: false): unknown[];

function validateValue(value: unknown, type: ValidateType, entityName: string, fallbackOnNull: boolean) {
    const validatedValue = validators[type](value);
    if (validatedValue === null && !fallbackOnNull) {
        throw new Error(`Expected type: ${entityName} but received: ${value}`);
    }
    return validatedValue;
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

export { getEnvVar, validateValue };