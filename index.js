const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Configuration
const BASE_URL = 'https://store.steampowered.com/app/';
const OUTPUT_FILE = 'free_games_with_achievements.txt';
const CARDS_OUTPUT_FILE = 'free_games_with_cards.txt';
const PROGRESS_FILE = 'progress.json';
const CONCURRENCY_LIMIT = 20; // safest value is 20
const DELAY = 5000; // safest value is 5000
const RETRY_DELAY = 300000; // 1 minute

let lastChecked = 81279;
if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE));
    lastChecked = progress.lastChecked || lastChecked;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isFreeWithAchievements = (data) => {
    const $ = cheerio.load(data);
    const hasAchievements = $("#achievement_block > div.block_title").text().includes("Includes");
    const isFree = $("#game_area_purchase .game_purchase_price").text().trim().includes("Free");
    return hasAchievements && isFree;
};

const isFreeWithCards = (data) => {
    const $ = cheerio.load(data);
    const cardLabel = $(".game_area_features_list_ctn .label").filter((i, el) => $(el).text().trim() === "Steam Trading Cards");
    return cardLabel.length > 0;
};

const fetchGameData = async (id) => {
    const url = `${BASE_URL}${id}`;
    try {
        const { data } = await axios.get(url, { timeout: 5000 });
        return data;
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.error(`Error fetching ${url}: ${error.message}. Retrying in 1 minute...`);
            await delay(RETRY_DELAY);
            try {
                const { data } = await axios.get(url, { timeout: 5000 });
                return data;
            } catch (retryError) {
                console.error(`Retry failed for ${url}: ${retryError.message}. Skipping.`);
                return null;
            }
        } else {
            console.error(`Error fetching ${url}: ${error.message}`);
            return null;
        }
    }
};

const checkGame = async (id) => {
    const data = await fetchGameData(id);
    if (!data) return;

    if (isFreeWithAchievements(data)) {
        fs.appendFileSync(OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        if (isFreeWithCards(data)) {
            fs.appendFileSync(CARDS_OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        }
    }
};

const processBatch = async (start, end) => {
    const gamePromises = [];
    for (let i = start; i <= end; i++) {
        gamePromises.push(checkGame(i));
    }
    await Promise.all(gamePromises);
};

const run = async () => {
    let start = lastChecked;
    let end = start + CONCURRENCY_LIMIT - 1;

    while (start <= 2000000) {
        console.log(`Processing apps ${start} to ${end}`);
        await processBatch(start, end);

        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastChecked: end + 1 }));
        await delay(DELAY);

        start += CONCURRENCY_LIMIT;
        end += CONCURRENCY_LIMIT;
    }
    console.log('Finished processing all batches');
};

run().catch((error) => console.error('Error during processing:', error));

