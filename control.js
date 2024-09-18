const fs = require('fs');

console.log(JSON.parse(fs.readFileSync(__dirname + '/database/anime_informations.json'))['animes']['1']);
// console.log(Object.keys(JSON.parse(fs.readFileSync(__dirname + '/database/anime-titles.json'))));