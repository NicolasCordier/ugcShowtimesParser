const hourRegex = /([0-2][0-9]):([0-6][0-9])/;
export default function getDateFromHour(date: Date, screeningHour: string) {
    const result = new Date(date);
    const [_, hours, minutes] = hourRegex.exec(screeningHour) || [];
    if (!hours || !minutes) return null;

    result.setHours(Number(hours), Number(minutes));
    return result;
}