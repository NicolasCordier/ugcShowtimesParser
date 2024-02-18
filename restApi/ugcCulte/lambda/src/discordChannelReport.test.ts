import { expect, test } from 'vitest'
import { _compareWithDiscord } from "./discordChannelReport";

test('Comparison less showings', () => {
  const currentMovies = [
    {
      "messageId": "1204897215135617074",
      "movieId": 14046,
      "showingIds": [
        330020243058,
        330020243059
      ],
      "discordEmbed": {
        "type": "rich",
        "url": "https://www.ugc.fr/film.html?id=14046&cinemaId=7",
        "title": "DUNE",
        "description": "L'histoire de Paul Atreides, voué à connaître un destin hors du commun qui le dépasse totalement. Car s'il veut préserver l'avenir de sa famille et de son peuple, il devra se rendre sur la planète la plus dangereuse de l'univers.",
        "fields": [
          {
            "name": "Genres",
            "value": "Science Fiction, Drame",
            "inline": true
          },
          {
            "name": "Acteurs",
            "value": "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac",
            "inline": true
          },
          {
            "name": "Durée",
            "value": "2h46",
            "inline": true
          },
          {
            "name": "Date de sortie",
            "value": "15 septembre 2021",
            "inline": true
          },
          {
            "name": "VOSTF - lundi 26 févr., 17:00 (fin 20:06)",
            "value": "[Réserver](https://www.ugc.fr/reservationSeances.html?id=330020243058)",
            "inline": false
          },
          {
            "name": "VOSTF - mardi 27 févr., 17:00 (fin 20:06)",
            "value": "[Réserver](https://www.ugc.fr/reservationSeances.html?id=330020243059)",
            "inline": false
          }
        ],
        "thumbnail": {
          "url": "https://www.ugc.fr/dynamique/films/46/14046/fr/poster/large/4633954_grey_26.jpg",
          "proxy_url": "https://images-ext-2.discordapp.net/external/rXVh3XBiXUX7WyXXmY4k3YjZMSvNvqXScuuMPErp6G0/https/www.ugc.fr/dynamique/films/46/14046/fr/poster/large/4633954_grey_26.jpg",
          "width": 274,
          "height": 391
        }
      }
    }
  ];

  const cinemaMovies = {
    "cinemaId": 7,
    "cinemaName": "UGC Ciné Cité Maillot",
    "movies": [
      {
        "id": 14046,
        "thumbnailUrl": new URL("https://www.ugc.fr/dynamique/films/46/14046/fr/poster/large/4633954_grey_26.jpg"),
        "name": "DUNE",
        "genders": "Science Fiction, Drame",
        "directors": null,
        "actors": "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac",
        "description": "L'histoire de Paul Atreides, voué à connaître un destin hors du commun qui le dépasse totalement. Car s'il veut préserver l'avenir de sa famille et de son peuple, il devra se rendre sur la planète la plus dangereuse de l'univers.",
        "releaseDateFR": "15 septembre 2021",
        "durationFR": "2h46",
        "showings": [
          {
            "id": 330020243059,
            "startDate": new Date("2024-02-27T16:00:00.000Z"),
            "startDateFR": "mardi 27 févr., 17:00",
            "endDateFR": "20:06",
            "lang": "VOSTF",
            "bookingUrl": "https://www.ugc.fr/reservationSeances.html?id=330020243059"
          },
        ]
      },
    ]
  }

  const expectedResult = {
    "messageIdsToDelete": new Set([]),
    "messagesToEdit": [
      {
        "id": "1204897215135617074",
        "newEmbeds": [
          {
            "url": "https://www.ugc.fr/film.html?id=14046&cinemaId=7",
            "title": "DUNE",
            "description": "L'histoire de Paul Atreides, voué à connaître un destin hors du commun qui le dépasse totalement. Car s'il veut préserver l'avenir de sa famille et de son peuple, il devra se rendre sur la planète la plus dangereuse de l'univers.",
            "fields": [
              {
                "name": "Genres",
                "value": "Science Fiction, Drame",
                "inline": true
              },
              {
                "name": "Acteurs",
                "value": "Timothée Chalamet, Rebecca Ferguson, Oscar Isaac",
                "inline": true
              },
              {
                "name": "Durée",
                "value": "2h46",
                "inline": true
              },
              {
                "name": "Date de sortie",
                "value": "15 septembre 2021",
                "inline": true
              },
              {
                "name": "VOSTF - mardi 27 févr., 17:00 (fin 20:06)",
                "value": "[Réserver](https://www.ugc.fr/reservationSeances.html?id=330020243059)",
              }
            ],
            "thumbnail": {
              "url": "https://www.ugc.fr/dynamique/films/46/14046/fr/poster/large/4633954_grey_26.jpg",
            }
          }
        ]
      },
    ],
    "newMovies": []
  }

  const result = _compareWithDiscord(currentMovies, cinemaMovies);

  expect(result).toEqual(expectedResult)
})