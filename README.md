# 📰 WPArticle-MSNSlideshow Server

A lightweight **Node.js + Express** backend that processes slideshow content from WordPress, stores it as JSON, and serves dynamic RSS feeds for external consumption. This server is designed to work with the **WPArticle-MSNSlideshow WordPress Plugin** (or a custom plugin) that sends slideshow data via HTTP requests.

---

## 🚀 Overview

This backend processes slideshow content received from a WordPress plugin, converts it into a structured format, stores it as JSON, and serves dynamic **RSS feeds**.  

It is intended to be used alongside the **WPArticle-MSNSlideshow WordPress Plugin** or any custom plugin that sends data in the expected format.

### Core Features

- Accepts slideshow content via `POST /req` from WordPress or a custom plugin  
- Parses HTML slideshows into structured JSON using **Cheerio**  
- Supports adding, updating, and deleting slideshows  
- Generates RSS feeds dynamically with the **RSS** package  
- Stores data per feed in `/storage/<feedName>.json`  
- Returns a formatted RSS feed via `GET /rss/feed/:feedName`  

---

## ⚙️ Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd wparticle-msnslideshow-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the server
```bash
node index.js
```

The server will run by default on port `3000`.

---

## 📡 API Endpoints

### `POST /req`

Receives slideshow data from WordPress (or a custom plugin) and stores or updates it in the backend.

#### Request Body Example
```json
{
  "content": {
    "type": "slideshow",
    "post_title": "My Sample Slideshow",
    "post_link": "https://example.com/my-slideshow",
    "featured_image": "https://example.com/image.jpg",
    "post_content": "<p>Intro text</p><h2>Slide 1</h2><p>Details...</p>",
    "delete": false
  }
}
```

#### Parameters

| Parameter       | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `type`          | Must be `"slideshow"`                                                       |
| `post_title`    | The title of the slideshow                                                  |
| `post_link`     | URL of the WordPress post                                                   |
| `featured_image`| URL to the slideshow's featured image                                      |
| `post_content`  | Full HTML content of the WordPress post                                     |
| `delete`        | Optional. `true` to delete the slideshow; `false` to add/update it         |

#### Behavior
- `"delete": true` → Removes the slideshow from the feed  
- `"delete": false` → Adds or updates the slideshow  

HTML content is parsed for slide titles, descriptions, and images. Data is stored in `/storage/<feedName>.json`.

#### Response Example
```json
{
  "message": "Data received!",
  "yourData": { ... }
}
```

---

### `GET /rss/feed/:feedName`

Generates and returns an RSS feed for the specified feed name.

- **Example:** `GET /rss/feed/jibriel-testing`  
- **Response:** Returns the RSS feed as `application/rss+xml`  
- Aggregates slideshows from `/storage/<feedName>.json`  
- Includes `<media:content>` tags for featured images and slide images

---

## 🧩 Internal Functions (`handler.js`)

| Function | Description |
|----------|-------------|
| `createTable(title, link, image, html)` | Parses raw HTML from WordPress and extracts slide titles, descriptions, and images. |
| `handleData(feedName, data)` | Adds or updates slideshow entries in the corresponding feed JSON file. |
| `deleteData(feedName, title)` | Removes a slideshow by its title from the JSON file. |
| `getFeed(feedName)` | Converts the feed’s JSON data into an RSS XML document. |

---

## 🗂️ Example JSON Structure
```json
{
  "title": "Example Feed",
  "description": "Feed for Example.com slideshows",
  "link": "example.com",
  "lastBuildDate": "Thu, 30 Oct 2025 12:00:00 GMT",
  "slideshows": [
    {
      "guid": "uuid",
      "title": "Sample Slideshow",
      "pubDate": "Thu, 30 Oct 2025 12:00:00 GMT",
      "featured_image": "https://example.com/image.jpg",
      "creator": "Micheal Jordan",
      "description": "Intro paragraph...",
      "wordpress_article_url": "https://example.com/my-slideshow",
      "slides": [
        {
          "title": "Slide 1",
          "description": "Slide details...",
          "imageUrl": "https://example.com/slide1.jpg",
          "imageCredit": "Provided on page."
        }
      ]
    }
  ]
}
```

---

## 🔒 Authentication

Authentication is implemented via file-based access control. Only requests related to a valid feed file in `/storage/` will be processed.

- **File Existence-Based Authentication:** A feed file must exist in `/storage/` for the server to accept POST or GET requests for that feed.

**Example:**  
If `jibriel-testing.json` exists in `/storage/`, requests to `/rss/feed/jibriel-testing` are accepted. Otherwise, they are rejected.

---

## 🧰 Dependencies

| Package  | Purpose |
|----------|---------|
| express  | REST API server |
| rss      | RSS feed generation |
| cheerio  | HTML parsing |
| uuid     | Generates unique IDs for slideshows |
| fs / path| Handles file reading/writing |

---

## ⚠️ Notes for WordPress Plugin Integration

The backend is designed to work with the WPArticle-MSNSlideshow WordPress Plugin or any custom plugin sending slideshow data via HTTP POST to `/req`. Required data keys:

- `post_title`
- `post_link`
- `featured_image`
- `post_content`

Ensure the plugin sends data in the correct format.

---

## 📄 License

MIT License — Use and modify freely.
