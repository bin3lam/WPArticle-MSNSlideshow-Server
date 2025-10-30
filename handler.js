const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const RSS = require("rss");
const cheerio = require("cheerio");

module.exports = {
  deleteData: function (feedName, title) {
    const filePath = `./storage/${feedName}.json`;
    try {
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf8");
        let json;
        try {
          json = JSON.parse(fileData);
        } catch (parseError) {
          console.error(
            `Error parsing JSON from ${feedName}:`,
            parseError.message,
          );
          return;
        }

        const slideshowIndex = json.slideshows.findIndex(
          (slideshow) => slideshow.title === title,
        );

        if (slideshowIndex !== -1) {
          json.slideshows.splice(slideshowIndex, 1); // Remove the slideshow
          fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
          console.log(`Slideshow titled "${title}" has been deleted.`);
        } else {
          console.log(`Slideshow titled "${title}" not found.`);
        }
      } else {
        console.log(
          `Error: Could not find or modify ${feedName} in the folder storage.`,
        );
      }
    } catch (err) {
      console.log(`Error: Could not process ${feedName}.`, err.message);
    }
  },

  handleData: function (feedName, data) {
    const filePath = `./storage/${feedName}.json`;
    try {
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, "utf8");
        let json;
        try {
          json = JSON.parse(fileData);
        } catch (parseError) {
          console.error(
            `Error parsing JSON from ${feedName}:`,
            parseError.message,
          );
          return;
        }

        json.lastBuildDate = new Date().toUTCString();

        const existingSlideshowIndex = json.slideshows.findIndex(
          (slideshow) => slideshow.title === data.info.title,
        );

        if (existingSlideshowIndex !== -1) {
          json.slideshows[existingSlideshowIndex].pubDate =
            new Date().toUTCString();
          json.slideshows[existingSlideshowIndex].description =
            data.info.description;
          json.slideshows[existingSlideshowIndex].slides = data.articles;
          console.log(
            `Slideshow titled "${data.info.title}" has been updated.`,
          );
        } else {
          const slideshow = {
            guid: uuidv4(),
            title: data.info.title,
            pubDate: new Date().toUTCString(),
            featured_image: data.info.featured_image,
            creator: "Micheal Jordan",
            description: data.info.description,
            wordpress_article_url: data.info.tableLink,
            slides: data.articles,
          };

          json.slideshows.push(slideshow);
          // console.log(`A new slideshow titled "${data.info.title}" has been added.`);
        }

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
        console.log(`${feedName} has been updated successfully.`);
      } else {
        console.log(
          `Error: Could not find or modify ${feedName} in the folder rss-feeds.`,
        );
      }
    } catch (err) {
      console.log(`Error: Could not process ${feedName}.`, err.message);
    }
  },
  createTable: function (tableTitle, tableLink, tableFeaturedImage, html) {
    let articles = [];
    const $ = cheerio.load(html);

    // Extract the intro description (assuming it's the first paragraph in the HTML)
    const introDescription = $("p").first().text();
    console.log("Intro Description: ", introDescription);
    console.log(tableLink);

    const tableInfo = {
      info: {
        title: tableTitle,
        tableLink: tableLink,
        featured_image: tableFeaturedImage,
        description: introDescription,
      },
    };

    $(".wp-block-heading").each(function (index) {
      // console.log("Processing article #" + (index + 1));
      const title = $(this).text();
      let description = ""; // Initialize description as an empty string
      let imageUrl = "";
      let imageCredit = "";

      let nextElement = $(this).next();

      // Flags to indicate if the description and image have been captured
      let descriptionCaptured = false;
      let imageFound = false;

      while (nextElement.length && (!descriptionCaptured || !imageFound)) {
        // Capture the first paragraph text as description if not already captured
        if (!descriptionCaptured && nextElement.is("p")) {
          description = nextElement.text();
          console.log(
            "Description captured for article #" + (index + 1) + ": ",
            description,
          );
          descriptionCaptured = true; // Mark that the description has been captured
        }

        // Once the description is captured, look for an image
        if (
          !imageFound &&
          (nextElement.is("img") || nextElement.find("img").length)
        ) {
          const img = nextElement.is("img")
            ? nextElement
            : nextElement.find("img");
          console.log(img);
          imageUrl = img.attr("src");
          imageCredit = img.attr("alt"); // Assume image credit is in the alt attribute; adjust as necessary
          // console.log("Image found for article #" + (index + 1));
          imageFound = true; // Mark that the image has been found
        }

        // If both description and image have been found, no need to continue
        if (descriptionCaptured && imageFound) {
          break;
        }

        nextElement = nextElement.next(); // Move to the next sibling
      }

      articles.push({
        title: title,
        description: description,
        imageUrl: imageUrl, // Updated to use captured imageUrl
        imageCredit: `Provided on page.`, // Updated to use captured imageCredit
      });
    });

    const results = {
      info: tableInfo.info,
      articles: articles,
    };

    console.log(results);

    return results;
  },
getFeed: function (feedName) {
  const path = require("path");
  const fs = require("fs");
  const RSS = require("rss");

  const filePath = path.join(__dirname, "storage", `${feedName}.json`);
  let feedData = fs.readFileSync(filePath, "utf8");
  feedData = JSON.parse(feedData);
  const formattedDate = feedData.lastBuildDate;

  const feed = new RSS({
    title: `${feedData.title} RSS Slides`,
    description: feedData.description,
    feed_url: `http://${feedData.link}/rss.xml`,
    site_url: `http://${feedData.link}`,
    language: "en",
    pubDate: formattedDate,
    custom_namespaces: {
      media: "http://search.yahoo.com/mrss/",
      dc: "http://purl.org/dc/elements/1.1/",
    },
  });

  feedData.slideshows.forEach((slideshow) => {
    // Prepare the description for the first slide (base description and featured image).
    let firstSlideDescription = `<p>${slideshow.description}</p>`;

    // Add the first slide as an item to the feed with its unique WordPress URL
    feed.item({
      title: slideshow.title,
      url: slideshow.wordpress_article_url, // Use the unique URL for the slideshow
      guid: slideshow.guid,
      date: slideshow.pubDate,
      author: slideshow.creator,
      custom_elements: [
        {
          "media:content": [
            {
              _attr: {
                url: slideshow.featured_image,
                type: "image/jpeg",
                medium: "image",
              },
            },
            { "media:title": slideshow.title },
            { "media:description": firstSlideDescription },
            { "media:credit": "Featured Image" }, // If you have specific credit for the featured image, replace this
          ]
        },
        // Map over the other slides and add them after the first slide
        ...slideshow.slides.map((slide) => ({
          "media:content": [
            {
              _attr: {
                url: slide.imageUrl,
                type: "image/jpeg",
                medium: "image",
              },
            },
            { "media:title": slide.title },
            { "media:description": slide.description },
            { "media:credit": slide.imageCredit },
          ],
        }))
      ],
    });
  });

  return feed.xml({ indent: true });
},
};
