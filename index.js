const puppeteer = require('puppeteer');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
let {webhook_url, base_url, current_page, last_comment} = require ("./config.json")

const hook = new Webhook(webhook_url);
const fs = require('fs');

async function getArticleInfo() {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    const lastPage = base_url + `?page=${current_page}`

    await page.goto(lastPage);

    let data = await page.evaluate(() => {
        let articles = document.querySelectorAll("article");
        let articles_count = articles.length;
        let last_article = articles.item(articles_count - 1);

        let comment_id = last_article.id.replace("elComment_","")
        return [ articles_count, comment_id ]
    });

    [articles_count, actual_comment] = data;

    // If last comment stored isequalto actual last comment then exit
    if (last_comment == actual_comment) {
        console.log("Exiting.. there is no new builds released")

        await browser.close()
        return;
    }

    // Check if we have to move to the next page
    if (articles_count == 25) {
        console.log("Max articles reeched updating page and retrying...")
        current_page += 1

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
        let content = article.querySelector(".ipsType_normal.ipsType_richText.ipsContained").textContent

        return [author, author_img, content]
    }, actual_comment);

    [author, author_img, content] = data;

    const article_url = lastPage + `#comment-${actual_comment}`;

    sendWebHook({author, author_img, content, article_url})
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

function sendWebHook({author, author_img, content, article_url}) {
    const embed = new MessageBuilder()
    .setTitle('New Dev Build Released')
    .setAuthor(author, author_img)
    .setURL(article_url)
    .setColor('#FFA500')
    .setDescription(content + `\n[Go to the article](${article_url})`)
    .setTimestamp();

    hook.send(embed);
}

getArticleInfo();