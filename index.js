const puppeteer = require('puppeteer');
const fs = require('fs');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
let {webhook_url, current_page, last_comment} = require ("./config.json")

const hook = new Webhook(webhook_url);
const BASE_URL = "https://forums.bohemia.net/forums/topic/140837-development-branch-changelog/"

let nextPageRestart = false

async function getArticleInfo() {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const lastPageStored = BASE_URL + `?page=${current_page}`

    await page.goto(lastPageStored);

    let data = await page.evaluate(() => {
        let articles = document.querySelectorAll("article");
        let articles_count = articles.length;
        let last_article = articles.item(articles_count - 1);
        let lastPageAvailable = document.querySelector(".ipsPagination").getAttribute("data-pages");

        let comment_id = last_article.id.replace("elComment_","")
        return [ articles_count, comment_id, lastPageAvailable ]
    });

    const [articles_count, actual_comment, lastPageAvailable] = data;

    current_page = lastPageAvailable

    // If last comment stored isequalto actual last comment then exit
    if (last_comment == actual_comment) {
        console.log("Exiting.. there is no new dev builds released")

        await browser.close()
        return;
    }

    // Check if we have to move to the next page and check if we didnt restart already
    if (articles_count == 25 && !nextPageRestart) {
        console.log("Max articles reach going to next page and retrying...")
        current_page += 1
        nextPageRestart = true

        getArticleInfo()
        await browser.close()
        return;
    }

    // Update config with new page and last comment
    await updateConfig(current_page, actual_comment)

    // Get author info from last post and his content
    data = await page.evaluate((actual_comment) => {
        let article = document.getElementById(`elComment_${actual_comment}`);

        // get Author info
        let author_aside = article.querySelector(".ipsComment_author");
        let author = author_aside.querySelector(".ipsType_sectionHead strong").textContent.replace("\n","")
        let author_img = author_aside.querySelector(".cAuthorPane_info .cAuthorPane_photo img").src

        // get Content info
        let content = ""
        const articleContent = article.querySelector(".ipsType_normal.ipsType_richText.ipsContained")
        const lists = articleContent.querySelectorAll("ul")
        let headers = [...articleContent.querySelectorAll("p:has(> strong)")]
        let binaryInfoElement = headers.shift()

        const date = binaryInfoElement.querySelector("strong").textContent
        const binaryInfo = binaryInfoElement.querySelector("em").textContent

        content += `**${date}**\n*${binaryInfo}*\n\n`;

        for (let index = 0; index < headers.length; index++) {
            const header = headers[index];
            const list = [...lists[index].querySelectorAll("li")].map(li => li.innerText);

            content += `### ${header.textContent}\n`;
            list.forEach(change => content += `- ${change}\n`);
        }

        return {
            author: {
                name: author,
                avatar: author_img
            },
            content
        }
    }, actual_comment);

    ({author, content} = data);

    const article_url = lastPageStored + `#comment-${actual_comment}`;

    sendWebHook({author, content, article_url})
    await browser.close()
}

async function updateConfig(actual_page, actual_comment) {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config:', err);
            return;
        }

        const jsonData = JSON.parse(data);

        jsonData.current_page = actual_page;
        jsonData.last_comment = actual_comment;

        const updatedData = JSON.stringify(jsonData, null, 2);

        fs.writeFile('config.json', updatedData, (err) => {
            if (err) {
                console.error('Error writing to config:', err);
            } else {
                console.log('config updated successfully.');
            }
        });
    });
}

function sendWebHook({author, content, article_url}) {
    const embed = new MessageBuilder()
    .setTitle('New Dev Build Released')
    .setAuthor(author.name, author.avatar)
    .setURL(article_url)
    .setColor('#FFA500')
    .setDescription(content)
    .setTimestamp();

    hook.send(embed);
    console.log("Webhook Sent");
}

getArticleInfo();