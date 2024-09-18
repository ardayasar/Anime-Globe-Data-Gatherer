const anidb = require('./anidb');
const fs = require('fs');

const titles = fs.readFileSync(__dirname + '/database/anime-titles.json');
const titles_json = JSON.parse(titles);
const ids = Object.keys(titles_json);

const data = fs.readFileSync(__dirname + '/database/anime_informations.json');
const data_json = JSON.parse(data);
anidb.local_information_database = data_json;

const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
    red: '\x1b[31m',
};

(async() => {

    for(let i = 0; i < ids.length; i++) {
        let id = ids[i];

        let where_loaded = await load_data(id);

        if(where_loaded == 3){
            continue;
        }
        
        await new Promise(resolve => setTimeout(resolve, 8000));

    }
})();

async function load_data(id) {
    return new Promise(async (resolve, reject) => {
        try {
            let anime_information = await anidb.getAnimeInfo(id);
    
            if(anime_information === false) {
                resolve(false);
                return;
            }

            if(anime_information == 'already loaded'){
                resolve(3);
                return;
            }

            let parsed_information = await anidb.parse_rss(anime_information);

            if(parsed_information['error'] && parsed_information['error']['$']['code'] == '500'){
                resolve(false);
                console.log(`${colors.red}Currently banned!${colors.reset}`);
                process.exit(1);
                return;
            }

            console.log(`${colors.green}Anime ${id} loaded | ${colors.blue}${parsed_information['anime']['titles']['title'][0]['_']}${colors.green} / ${colors.yellow}${parsed_information['anime']['titles']['title'][0]['$']['xml:lang']}${colors.green} | ${colors.red}${new Date().toISOString()}${colors.reset} ${colors.reset}`);

            anidb.local_information_database['animes'][id] = parsed_information['anime'];
            await anidb.saveAnimeInformation();
            resolve(true);
        } catch (error) {
            console.log(`${colors.red}Error loading data for: ${id}${colors.reset}`);
            console.log(error);
            resolve(false);
        }
    });
}