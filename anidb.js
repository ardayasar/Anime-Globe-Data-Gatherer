const request = require('request');
const xml2js = require('xml2js');
const zlib = require('zlib');
const fs = require('fs');

class AniDB {
    constructor() {
        this.client = 'nodepoint';
        this.clientver = '1';
        this.protover = '1';
        this.path = '.';
        this.public_path = this.path + '/public';
        this.photo_download_path = this.public_path + '/images';
        this.anime_information_database_path = this.path + '/database/anime_informations.json';
        this.local_information_database = {'animes': {}};

        if(!fs.existsSync(this.photo_download_path)) {
            fs.mkdirSync(this.photo_download_path);
        }
        
    }

    async getAnimeInfo_auto(title) {
        let id = await this.getAnimeId(title);
        let info = await this.getAnimeInfo(id);
        return info;
    }

    async getAnimeInfo(id) {
        return new Promise((resolve, reject) => {
            try {

                if(this.local_information_database['animes'] && this.local_information_database['animes'][id]) {
                    resolve("already loaded");
                    return;
                }

                let headers = {url: `http://api.anidb.net:9001/httpapi?request=anime&client=${this.client}&clientver=${this.clientver}&protover=${this.protover}&aid=${id}`, encoding: null};

                request.get(headers, (err, res, body) => {
                    if (err){
                        console.log(err);
                        resolve(false);
                        return;
                    }

                    if(res.statusCode !== 200) {
                        resolve(false);
                        return;
                    }

                    const encoding = res.headers['content-encoding'];
                    if (encoding === 'gzip') {
                        zlib.gunzip(body, (err, decoded) => {
                            if (err) reject(err);
                            resolve(decoded.toString('utf-8'));
                        });
                    } else if (encoding === 'deflate') {
                        zlib.inflate(body, (err, decoded) => {
                            if (err) reject(err);
                            resolve(decoded.toString('utf-8'));
                        });
                    } else {
                        resolve(body.toString('utf-8'));
                    }
                });
            } catch (error) {
                console.log(error);
                resolve(false);
            }
        });
    }

    async getAnimeImage(id) {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.local_information_database['animes'] && this.local_information_database['animes'][id] && this.local_information_database['animes'][id]['picture']) {
                    await this.downloadAnimeImage(this.local_information_database['animes'][id]['picture']);
                    resolve(this.local_information_database['animes'][id]['picture']);
                    return;
                }
                else{
                    
                    let anime_information = await this.getAnimeInfo(id);
                    if(anime_information === false) {
                        resolve(false);
                    }

                    let parsed_information = await this.parse_rss(anime_information);

                    if(parsed_information['error'] && parsed_information['error']['$']['code'] == '500'){
                        resolve(false);
                        console.log('Currently banned');
                        return;
                    }

                    this.local_information_database['animes'][id] = parsed_information['anime'];
                    this.saveAnimeInformation();
                    
                    if(await this.downloadAnimeImage(this.local_information_database['animes'][id]['picture'])){
                        resolve(this.local_information_database['animes'][id]['picture']);
                    }
                    else{
                        resolve(false);
                    }
                }
            } catch (error) {
                console.log(error);
                resolve(false);
            }
        });
    }

    async saveAnimeInformation() {
        return new Promise((resolve, reject) => {
            fs.writeFileSync(this.anime_information_database_path, JSON.stringify(this.local_information_database));
            resolve(true);
        }
        );
    }

    async getAnimeEpisodes(id) {
        return new Promise((resolve, reject) => {
            request.get(`http://api.anidb.net:9001/httpapi?request=ep&client=${this.client}&clientver=${this.clientver}&protover=${this.protover}&aid=${id}`, (err, res, body) => {
                if (err) reject(err);
                resolve(body);
            });
        });
    }

    async getEpisodeInfo(id) {
        return new Promise((resolve, reject) => {
            request.get(`http://api.anidb.net:9001/httpapi?request=ep&client=${this.client}&clientver=${this.clientver}&protover=${this.protover}&eid=${id}`, (err, res, body) => {
                if (err) reject(err);
                resolve(body);
            });
        });
    }

    async parse_rss(rss) {
        return new Promise((resolve, reject) => {
            try {
                const parser = new xml2js.Parser({ explicitArray: false });
    
                parser.parseString(rss, (err, result) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    } else {
                        resolve(result);
                    }
                });
            } catch (error) {
                console.log(error);
                resolve(false);
            }
        });
    };

    async downloadAnimeImage(id) {
        return new Promise(async (resolve, reject) => {
            try {
                if(fs.existsSync(this.photo_download_path + '/' + id)) {
                    resolve(true);
                    return;
                }

                // Save to database

                let image_url = `https://cdn-eu.anidb.net/images/main/${id}`;
                request.get(image_url).pipe(fs.createWriteStream(this.photo_download_path + '/' + id))
                .on('finish', () => {
                    resolve(true);
                }
                );
            } catch (error) {
                console.log(error);
                resolve(false);
            }
        });
    }
}

module.exports = new AniDB();