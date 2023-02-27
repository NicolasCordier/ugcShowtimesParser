import { getTime } from "./utils";

export default function getTranslatedSearchPeriod(searchPeriodStart: Date, searchPeriodEnd: Date) {
    const date = searchPeriodStart.toLocaleDateString('fr-FR', {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    const startTime = getTime(searchPeriodStart);
    const endTime = getTime(searchPeriodEnd);

    return `Films diffusés le ${date} entre ${startTime} et ${endTime}`;
}