const fs = require('fs');

const data = fs.readFileSync(__dirname + '/database/anime_informations.json');
const data_json = JSON.parse(data);
const local_information_database = data_json;

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    red: '\x1b[31m',
};

const total_animes = Object.keys(local_information_database['animes']);

(async() => {

    // console.log(local_information_database['animes'].length);

    for (let i = 0; i < total_animes.length; i++) { // total_animes.length
        id = total_animes[i];
        let anime = await get_information(id);
        
        console.log(colors.green + 'Title: ' + colors.reset + colors.blue + anime.data.title + colors.reset);
        if(anime.data.description.toLowerCase().includes('source:') || anime.data.description.toLowerCase().includes('note:')){
            console.log(colors.green + 'Description: ' + colors.reset + colors.yellow + anime.data.description + colors.reset);
        }else{
            console.log(colors.green + 'Description: ' + colors.reset + colors.blue + anime.data.description + colors.reset);
        }
        console.log(colors.green + 'Picture: ' + colors.reset + colors.blue + anime.data.picture_jpg + colors.reset);
        console.log(colors.green + 'Rating: ' + colors.reset + colors.blue + anime.data.ratings + colors.reset);
        console.log(colors.green + 'Tags: ' + colors.reset + colors.blue + anime.data.tags.join(', ') + colors.reset);
        console.log('-----------------------------------');
    }

})();

function get_information(id) {
    return new Promise((resolve, reject) => {
        let anime = local_information_database['animes'][id] || null;

        if(anime === null) {
            reject({status: false, message: 'Anime not found!'});
        }

        let anime_data = {};

        for(let i = 0; i < anime['titles']['title'].length; i++) {
            if(anime['titles']['title'][i]['$']['type'] === 'main' && anime['titles']['title'][i]['$']['xml:lang'] === 'x-jat') {
                anime_data['title'] = anime['titles']['title'][i]['_'];
                break;
            }
        }

        if(anime_data['title'] === undefined) {
            anime_data['title'] = anime['titles']['title'][0]['_'];
            console.log(colors.yellow + 'Title not found! Using the first title found...' + colors.reset);
        }

        var anime_tags = [];
        for(let i = 0; i < anime['tags']['tag'].length; i++) {
            if(anime['tags']['tag'][i]['$']['infobox'] == 'true') {
                let name = anime['tags']['tag'][i]['name'];

                name = name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
                anime_tags.push(name);
            }
        }

        var description = anime['description'];
        description = description.replace(/http[^\s]+\s*\[|\]/g, '');

        anime_data['description'] = description;
        anime_data['picture_jpg'] = anime['picture'];
        anime_data['ratings'] = (parseFloat(anime['ratings']['temporary']['_'])/2).toFixed(1);
        anime_data['tags'] = anime_tags;

        resolve({status: true, data: anime_data});
    });
}