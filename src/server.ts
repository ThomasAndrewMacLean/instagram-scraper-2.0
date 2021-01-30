import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import logger from "morgan";
import Airtable from "airtable";
import puppeteer from "puppeteer";
import delay from "delay";
import { removeParams } from "./utils";

// SETUP EXPRESS 🚀
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(logger("dev"));

// SETUP DATABASE 🥎
var base = new Airtable({ apiKey: process.env.AIRTABLE_KEY }).base(
  process.env.AIRTABLE_APP
);
const user = {
  username: process.env.INSTAGRAM_USER,
  password: process.env.INSTAGRAM_PASSWORD,
};
// ROUTES 🛣
app.get("/", async (req: Request, res: Response) => {
  const instagramURL = "https://www.instagram.com/franssiss/";
  let links;
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3683.103 Safari/537.36"
    );

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
    });

    await page.goto("https://www.instagram.com/accounts/login/");

    const [accept] = await page.$x('//button[contains(.,"Accept")]');
    await accept.click({ delay: 30 });
    await page.waitFor("input[name=username]", { visible: true });
    await delay(100);
    await page.type("input[name=username]", user.username, {
      delay: 50,
    });

    await delay(100);
    await page.type("input[name=password]", user.password, { delay: 50 });

    await delay(100);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await delay(5000);

    await page.goto(instagramURL);

    links = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("main article a div img")
      ).map((anchor: HTMLImageElement) => anchor.src);
    });

    await browser.close();

    links.forEach(async (linkie) => {
      if (!linkie.includes("www.instagram.com")) {
        const results = await base("Table 1")
          .select({
            filterByFormula: `{ImageUrlWithoutParams} = "${removeParams(
              linkie
            )}"`,
          })
          .all();
        if (!results.length) {
          await base("Table 1").create([
            {
              fields: {
                Name: instagramURL,
                ImageUrl: linkie,
                ImageUrlWithoutParams: removeParams(linkie),
              },
            },
          ]);
        }
      }
    });
  } catch (error) {
    console.error(error);
    return res.json({ error });
  }

  res.json(links);
});

app.get("/test", async (req: Request, res: Response) => {
  res.json("test");
});

app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + process.env.PORT);
});
