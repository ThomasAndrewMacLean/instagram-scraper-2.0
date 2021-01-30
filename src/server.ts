import * as dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import logger from "morgan";
import Airtable from "airtable";
import puppeteer from "puppeteer";
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

// ROUTES 🛣
app.get("/", async (req: Request, res: Response) => {
  const instagramURL = "https://www.instagram.com/franssiss/";
  let links;
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // open the page to scrape
    await page.goto(instagramURL);

    // execute the JS in the context of the page to get all the links
    links = await page.evaluate(() =>
      // let's just get all links and create an array from the resulting NodeList
      Array.from(document.querySelectorAll("img")).map(
        (anchor: HTMLImageElement) => anchor.src
      )
    );

    // output all the links
    console.log(links);

    // close the browser
    await browser.close();

    links.forEach(async (linkie) => {
      const results = await base("Table 1")
        .select({
          filterByFormula: `{ImageUrlWithoutParams} = "${linkie.split("?")[0]}"`,
        })
        .all();
      if (!results.length) {
        await base("Table 1").create([
          {
            fields: {
              Name: instagramURL,
              ImageUrl: linkie,
            },
          },
        ]);
      }
    });
  } catch (error) {
    res.json({ error });
  }

  res.json(links);
});

app.get("/test", async (req: Request, res: Response) => {
  res.json("test");
});

app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + process.env.PORT);
});
