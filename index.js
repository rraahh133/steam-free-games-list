const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = 'https://store.steampowered.com/app/';
const OUTPUT_FILE = 'free_games_with_achievements.txt';
const CARDS_OUTPUT_FILE = 'free_games_with_cards.txt';
const PAID_OUTPUT_FILE = 'paid_games_with_achievements.txt';
const PAID_CARDS_OUTPUT_FILE = 'paid_games_with_cards.txt';
const PROGRESS_FILE = 'progress.json';
const CONCURRENCY_LIMIT = 20; // safest value is 20
const DELAY = 5000; // safest value is 5000
const RETRY_DELAY = 300000; // 5 minutes

let lastChecked = 0;
if (fs.existsSync(PROGRESS_FILE)) {
    const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE));
    lastChecked = progress.lastChecked || lastChecked;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isFree = ($) => {
    const priceEl = $(".game_purchase_price.price");
    return !priceEl.attr("data-price-final") && priceEl.text().trim().toLowerCase().includes("free");
};

const isPaid = ($) => {
    const priceEl = $(".game_purchase_price.price");
    return priceEl.attr("data-price-final") || !priceEl.text().trim().toLowerCase().includes("free");
};

const hasAchievements = ($) => {
    return $("#achievement_block > div.block_title").text().includes("Includes");
};

const hasCards = ($) => {
    return $(".game_area_features_list_ctn .label")
        .filter((i, el) => $(el).text().trim() === "Steam Trading Cards").length > 0;
};

const isFreeWithAchievements = (data) => {
    const $ = cheerio.load(data);
    return isFree($) && hasAchievements($);
};

const isFreeWithCards = (data) => {
    const $ = cheerio.load(data);
    return isFree($) && hasCards($);
};

const isPaidWithAchievements = (data) => {
    const $ = cheerio.load(data);
    return isPaid($) && hasAchievements($);
};

const isPaidWithCards = (data) => {
    const $ = cheerio.load(data);
    return isPaid($) && hasCards($);
};

const fetchGameData = async (id) => {
    const url = `${BASE_URL}${id}`;
    try {
        const { data } = await axios.get(url, { timeout: 5000 });
        return data;
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.error(`Error fetching ${url}: ${error.message}. Retrying in 5 minutes...`);
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
    if (!data) return false;

    let updated = false;

    if (isFreeWithAchievements(data)) {
        fs.appendFileSync(OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        updated = true;
        if (isFreeWithCards(data)) {
            fs.appendFileSync(CARDS_OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        }
    }

    if (isPaidWithAchievements(data)) {
        fs.appendFileSync(PAID_OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        updated = true;
    }

    if (isPaidWithCards(data)) {
        fs.appendFileSync(PAID_CARDS_OUTPUT_FILE, `'${BASE_URL}${id}',\n`);
        updated = true;
    }

    return updated;
};

const processBatch = async (start, end) => {
    const gamePromises = [];
    for (let i = start; i <= end; i++) {
        gamePromises.push(checkGame(i));
    }
    const results = await Promise.all(gamePromises);
    return results.some(updated => updated);
};

const pushToGitHub = () => {
    try {
        execSync('git add .');
        execSync(`git commit -m "Update progress and results at ${new Date().toISOString()}"`);
        execSync('git push');
        console.log('Changes pushed to GitHub.');
    } catch (err) {
        console.error('Failed to push to GitHub:', err.message);
    }
};

const run = async () => {
    let start = lastChecked;
    let end = start + CONCURRENCY_LIMIT - 1;

    while (start <= 2000000) {
        console.log(`Processing apps ${start} to ${end}`);
        const hasUpdates = await processBatch(start, end);

        fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastChecked: end + 1 }));
        if (hasUpdates) {
            pushToGitHub();
        }

        await delay(DELAY);
        start += CONCURRENCY_LIMIT;
        end += CONCURRENCY_LIMIT;
    }
    console.log('Finished processing all batches');
};

run().catch((error) => console.error('Error during processing:', error));
