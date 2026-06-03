const fs = require('fs');
const cheerio = require('cheerio');
const { translate } = require('@vitalets/google-translate-api');

// File paths
const HTML_FILE = 'web v4_temp.html';
const TRANSLATIONS_FILE = 'translations.js';

async function main() {
    console.log('Starting Auto-Translation Script...');

    // 1. Read Translations File safely
    let translationsContent = fs.readFileSync(TRANSLATIONS_FILE, 'utf8');
    
    // Create a safe evaluation to extract the object
    // Strip out window assignments which cause errors in Node.js
    const safeContent = translationsContent
        .replace(/const translations =/, 'var translations =')
        .replace(/window\.translations = translations;/g, '')
        .replace(/window\.getTranslation = function[\s\S]*/g, '');

    const extractFunc = new Function(`
        ${safeContent}
        return translations;
    `);
    const translationsObj = extractFunc();
    
    const supportedLanguages = Object.keys(translationsObj);
    console.log(`Found ${supportedLanguages.length} supported languages.`);

    // 2. Read HTML File
    let htmlContent = fs.readFileSync(HTML_FILE, 'utf8');
    const $ = cheerio.load(htmlContent);

    // We will collect a mapping of { key: englishText }
    const textsToTranslate = {};

    // 3. Extract from data-i18n tags
    $('[data-i18n]').each((i, el) => {
        const key = $(el).attr('data-i18n');
        // Get text and clean up whitespace like the browser does
        const text = $(el).text().trim().replace(/\s+/g, ' ');
        if (key && text) {
            textsToTranslate[key] = text;
        }
    });

    // 4. Extract from data-i18n-placeholder tags
    $('[data-i18n-placeholder]').each((i, el) => {
        const key = $(el).attr('data-i18n-placeholder');
        const text = $(el).attr('placeholder');
        if (key && text) {
            textsToTranslate[key] = text;
        }
    });

    // 5. Extract existing englishToKey from HTML
    let englishToKey = {};
    const engToKeyMatch = htmlContent.match(/const englishToKey = (\{[\s\S]*?\});/);
    if (engToKeyMatch) {
        const getMap = new Function(`return ${engToKeyMatch[1]};`);
        englishToKey = getMap();
    }

    // Include existing englishToKey items as well
    for (const [engText, key] of Object.entries(englishToKey)) {
        textsToTranslate[key] = engText;
    }

    // 6. Find what needs to be translated
    const missingTranslations = [];
    
    for (const [key, engText] of Object.entries(textsToTranslate)) {
        for (const lang of supportedLanguages) {
            if (!translationsObj[lang][key]) {
                missingTranslations.push({ lang, key, engText });
            }
        }
    }

    if (missingTranslations.length === 0) {
        console.log('All translations are already up-to-date!');
        return;
    }

    console.log(`Found ${missingTranslations.length} missing translations to process.`);

    // 7. Translate missing strings
    for (let i = 0; i < missingTranslations.length; i++) {
        const item = missingTranslations[i];
        
        // If the missing language is English, just assign the base text
        if (item.lang === 'en') {
            translationsObj['en'][item.key] = item.engText;
            console.log(`[${i+1}/${missingTranslations.length}] Added English base text for: ${item.key}`);
            continue;
        }

        console.log(`[${i+1}/${missingTranslations.length}] Translating '${item.engText}' to '${item.lang}'...`);
        
        let success = false;
        let retries = 0;
        const maxRetries = 3;
        
        while (!success && retries < maxRetries) {
            try {
                const res = await translate(item.engText, { to: item.lang });
                translationsObj[item.lang][item.key] = res.text;
                success = true;
                
                // Wait 1.5 seconds between normal requests to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                if (error.message.includes('Too Many Requests')) {
                    retries++;
                    console.log(`  => Rate limited by Google. Waiting 15 seconds before retry ${retries}/${maxRetries}...`);
                    await new Promise(resolve => setTimeout(resolve, 15000));
                } else {
                    console.error(`  => Failed to translate to ${item.lang}:`, error.message);
                    break; // break the retry loop for other errors
                }
            }
        }
        
        if (!success) {
            console.error(`  => Skipped translating '${item.engText}' to '${item.lang}' after multiple attempts.`);
        }
    }

    // 8. Save updated translations back to file
    const newTranslationsContent = `const translations = ${JSON.stringify(translationsObj, null, 4)};\n\nwindow.translations = translations;\n\nwindow.getTranslation = function (languageCode, key) {\n    if (translations[languageCode] && translations[languageCode][key]) {\n        return translations[languageCode][key];\n    }\n\n    if (translations['en'] && translations['en'][key]) {\n        return translations['en'][key];\n    }\n\n    return key;\n};\n`;
    
    fs.writeFileSync(TRANSLATIONS_FILE, newTranslationsContent, 'utf8');
    console.log(`\nUpdated ${TRANSLATIONS_FILE} successfully!`);

    // 9. Update englishToKey dictionary in HTML
    const newEnglishToKey = {};
    for (const [key, engText] of Object.entries(translationsObj['en'])) {
        newEnglishToKey[engText] = key;
    }

    const newEnglishToKeyStr = `const englishToKey = {\n` + 
        Object.entries(newEnglishToKey)
            .map(([text, key]) => `                ${JSON.stringify(text)}: ${JSON.stringify(key)}`)
            .join(',\n') +
        `\n            };`;

    const updatedHtmlContent = htmlContent.replace(
        /const englishToKey = \{[\s\S]*?\};/,
        newEnglishToKeyStr
    );

    fs.writeFileSync(HTML_FILE, updatedHtmlContent, 'utf8');
    console.log(`Updated ${HTML_FILE} englishToKey dictionary successfully!`);
}

main().catch(console.error);
