import apiHandler from './apiHandler';

apiHandler([7, 10, 20]).then((movies) =>
{
    console.log('movies', JSON.stringify(movies, undefined, 2))
})