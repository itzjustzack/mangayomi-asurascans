const mangayomiSources = [{
    "name": "Asura Scans DEV",
    "lang": "en",
    "baseUrl": "https://asurascans.com",
    "apiUrl": "",
    "iconUrl": "https://asurascans.com/favicon.ico",
    "typeSource": "single",
    "itemType": 0,
    "isNsfw": false,
    "version": "0.0.11",
    "pkgPath": "",
    "notes": "Stable Asura Scans extension"
}];

// Every method returns plain data (objects, arrays, strings, numbers and
// booleans). Async methods may return the value directly or a Promise.
//
// Helpers you can use anywhere in this file:
//
//   const client = new Client();
//   await client.get(url, headers) and client.post(url, headers, body)
//       Make HTTP requests. The response's text is `res.body`.
//   const doc = new Document(html);
//       Turns an HTML string into a document you can search:
//         doc.select("div.item")    all matches, as an array
//         doc.selectFirst("h1")     the first match
//       On a match: .text is its text and .attr("href") an attribute.
//       doc.xpath(expression) searches with XPath instead.
//   parseDates(dates, format, locale)
//       Described in getDetail.
//   new SharedPreferences().get(key)
//       Described in getSourcePreferences.

function cleanAsuraText(value) {
  if (!value) return "";

  return String(value)
    .replace(/\u00E2\u0080\u0099/g, "\u2019")
    .replace(/\u00E2\u0080\u0098/g, "\u2018")
    .replace(/\u00E2\u0080\u009C/g, "\u201C")
    .replace(/\u00E2\u0080\u009D/g, "\u201D")
    .replace(/\u00E2\u0080\u0093/g, "\u2013")
    .replace(/\u00E2\u0080\u0094/g, "\u2014")
    .replace(/\u00E2\u0080\u00A6/g, "\u2026")
    .replace(/\u00C2\u00A0/g, " ")
    .trim();
}

class DefaultExtension extends MProvider {
    /**
     * Optional. Extra HTTP headers to send with this source's requests.
     * @param {string} url the source's base URL
     * @returns {Object<string, string>} for example
     *     {"Referer": "https://example.com"}, or {} if none are needed
     */
    
getHeaders(url) {
  return {
    "User-Agent": "Mozilla/5.0",
    "Referer": "https://asurascans.com/"
  };
}


    /**
     * Returns one page of the source's popular entries (shown when browsing).
     * @param {number} page starts at 1 and goes up while more pages exist
     * @returns {Promise<{list: Object[], hasNextPage: boolean}>}
     *     list: the entries on this page. Each entry (a manga, anime or
     *     novel) is an object with a name (the title), a link (the URL or
     *     path of its page) and an imageUrl (its cover image). All three
     *     are needed.
     *     hasNextPage: true if there is another page after this one.
     * @example
     * return {
     *     list: [
     *         { name: "Title", link: "/title-page", imageUrl: "https://example.com/cover.jpg" }
     *     ],
     *     hasNextPage: true
     * };
     */



async getPopular(page) {
  if (page > 1) {
    return {
      list: [],
      hasNextPage: false
    };
  }

  const client = new Client();
  const url = "https://asurascans.com/series-ranking";

  const res = await client.get(
    url,
    this.getHeaders(url)
  );

  const doc = new Document(res.body);
  const links = doc.select('a[href*="/comics/"]');

  const list = [];
  const seen = new Set();

  for (const item of links) {
    const link = item.attr("href");
    const img = item.selectFirst("img");

    


const name = cleanAsuraText(
  img ? (img.attr("alt") || item.text) : item.text
)
  .replace(/^\s*\d+\s+/, "")
  .replace(/\s+\d+(?:\.\d+)?\s*$/, "")
  .trim();




    let imageUrl = img
      ? (img.attr("data-src") || img.attr("src") || "")
      : "";

    if (!link || !name || seen.has(link)) continue;

    seen.add(link);

    if (imageUrl.startsWith("/")) {
      imageUrl = "https://asurascans.com" + imageUrl;
    }

    list.push({
      name: name,
      link: link,
      imageUrl: imageUrl
    });

    if (list.length >= 30) break;
  }

  return {
    list: list,
    hasNextPage: false
  };
}





    /**
     * Optional. Whether this source has a "latest updates" listing.
     * @returns {boolean} true if you implement getLatestUpdates, otherwise
     *     false
     */
    get supportsLatest() {
    return true;
}

    /**
     * Returns one page of the most recently updated entries.
     * Only used when supportsLatest returns true.
     * @param {number} page starts at 1 and goes up while more pages exist
     * @returns {Promise<{list: Object[], hasNextPage: boolean}>}
     *     list: the entries on this page, each an object with name, link and
     *     imageUrl.
     *     hasNextPage: true if there is another page after this one.
     * @example
     * return {
     *     list: [
     *         { name: "Title", link: "/title-page", imageUrl: "https://example.com/cover.jpg" }
     *     ],
     *     hasNextPage: true
     * };
     */
    
async getLatestUpdates(page) {
  const client = new Client();

  const browseUrl =
    "https://asurascans.com/browse/comics?page=" + page;

  const res = await client.get(
    browseUrl,
    this.getHeaders(browseUrl)
  );

  const doc = new Document(res.body);
  const links = doc.select('a[href*="/comics/"]');

  const list = [];
  const seen = new Set();

  for (const item of links) {
    const link = item.attr("href");
    const img = item.selectFirst("img");

    
const name = cleanAsuraText(
  img ? (img.attr("alt") || item.text) : item.text
);


    const imageUrl = img
      ? (img.attr("data-src") || img.attr("src") || "")
      : "";

    if (!link || !name || seen.has(link)) continue;

    seen.add(link);

    list.push({
      name: name,
      link: link,
      imageUrl: imageUrl.startsWith("/")
        ? "https://asurascans.com" + imageUrl
        : imageUrl
    });
  }

  let hasNextPage = false;

  if (list.length > 0) {
    try {
      const nextUrl =
        "https://asurascans.com/browse/comics?page=" +
        (page + 1);

      const nextRes = await client.get(
        nextUrl,
        this.getHeaders(nextUrl)
      );

      const nextDoc = new Document(nextRes.body);
      const nextLinks =
        nextDoc.select('a[href*="/comics/"]');

      hasNextPage = nextLinks.length > 0;
    } catch (error) {
      hasNextPage = true;
    }
  }

  return {
    list: list,
    hasNextPage: hasNextPage
  };
}


    /**
     * Returns one page of search results.
     * @param {string} query the text the user typed
     * @param {number} page starts at 1 and goes up while more pages exist
     * @param {Object[]} filters the filters from getFilterList, with the
     *     user's selections applied. For each filter, type is the
     *     identifier you gave it in getFilterList and state is what the
     *     user chose: for "SelectFilter" the number of the chosen option
     *     (the option is values[state], and its value is what you gave it),
     *     for "CheckBox" true if checked, for "TriState" 0 ignored,
     *     1 included or 2 excluded, for "TextFilter" the text typed, for
     *     "GroupFilter" an array of the filters inside the group.
     * @returns {Promise<{list: Object[], hasNextPage: boolean}>}
     *     list: the results on this page, each an object with name, link and
     *     imageUrl.
     *     hasNextPage: true if there is another page after this one.
     * @example
     * return {
     *     list: [
     *         { name: "Title", link: "/title-page", imageUrl: "https://example.com/cover.jpg" }
     *     ],
     *     hasNextPage: false
     * };
     */
    
async search(query, page, filters) {
  const client = new Client();

  const searchUrl =
  "https://asurascans.com/browse/comics?search=" +
  encodeURIComponent(query) +
  "&page=" + page;

  const res = await client.get(
    searchUrl,
    this.getHeaders(searchUrl)
  );

  const doc = new Document(res.body);
  const links = doc.select('a[href*="/comics/"]');

  const list = [];
  const seen = new Set();

  for (const item of links) {
    const link = item.attr("href");
    const img = item.selectFirst("img");

const name = cleanAsuraText(
  img ? (img.attr("alt") || item.text) : item.text
);



    const imageUrl = img
      ? (img.attr("src") || img.attr("data-src") || "")
      : "";

    if (!link || !name || seen.has(link)) continue;

    seen.add(link);

    list.push({
      name: name,
      link: link,
      imageUrl: imageUrl.startsWith("/")
        ? "https://asurascans.com" + imageUrl
        : imageUrl
    });
  }

  return {
    list: list,
    hasNextPage: list.length > 0
  };
}


    /**
     * Returns the full details of one entry, including its list of chapters
     * (episodes, for anime).
     * @param {string} url the link you gave this entry in the listing or
     *     search results
     * @returns {Promise<Object>} an object with the fields below. Leave out
     *     any field the source does not provide.
     *     status: 0 ongoing, 1 completed, 2 on hiatus, 3 canceled,
     *     4 publishing finished. Any other value means unknown. Convert
     *     the website's wording to these numbers yourself.
     *     chapters: one object per chapter, or per episode for anime. name
     *     and url are required. dateUpload is optional: the upload time in
     *     milliseconds since 1970, written as a string. scanlator is
     *     optional: the group that released it. Anime episodes can also have
     *     thumbnailUrl, description, duration, downloadSize and isFiller.
     *     To get dateUpload from the website's date text, use
     *     parseDates(dates, format, locale): it takes an array of date texts,
     *     the format the website writes dates in and its language, and
     *     returns an array of strings in the form dateUpload expects. It
     *     also understands wording like "2 days ago". For example
     *     parseDates(["Jan 5, 2024", "2 days ago"], "MMM d, yyyy", "en").
     * @example
     * return {
     *     name: "Title",
     *     imageUrl: "https://example.com/cover.jpg",
     *     description: "A short summary.",
     *     author: "Author name",
     *     artist: "Artist name",
     *     status: 0,
     *     genre: ["Action", "Drama"],
     *     chapters: [
     *         { name: "Chapter 1", url: "/chapter-1", dateUpload: "1700000000000", scanlator: "Group name" }
     *     ]
     * };
     */
    

async getDetail(url) {
  const client = new Client();
  const fullUrl = url.startsWith("http")
    ? url
    : "https://asurascans.com" + url;

  const res = await client.get(
    fullUrl,
    this.getHeaders(fullUrl)
  );

  const doc = new Document(res.body);
  const title = doc.selectFirst("h1");

  return {
    name: title
  ? cleanAsuraText(title.text)
  : "Title not found",
    
imageUrl: (() => {
  const meta = doc.selectFirst('meta[property="og:image"]');
  let src = meta ? meta.attr("content") : "";

  if (!src) {
    const img = doc.selectFirst('img[src*="cover"]');
    src = img ? img.attr("src") : "";
  }

  if (src.startsWith("/")) {
    src = "https://asurascans.com" + src;
  }

  return src;
})(),

    
description: (() => {
  const meta = doc.selectFirst('meta[name="description"]');
  const text = meta ? meta.attr("content") : "";
  return text || "No description available";
})(),
    author: "",
    artist: "",
    status: 0,
    genre: [],
    chapters: doc.select('a[href*="/chapter/"]')
  .map(item => ({


name: (() => {
  const title = item.selectFirst("span");
  const name = title ? title.text.trim() : item.text.trim();


if (name.toLowerCase().includes("test")) {
  return "Chapter 0 - Test";
}

  if (name === "First Chapter") {
    return "Chapter 1";
  }

  
if (name.toLowerCase().includes("test chapter")) {
  return "Chapter 0 - Test";
}


  return name;
})(),



    
url: item.attr("href"),

dateUpload: (() => {
  const dateElement = item.selectFirst(
    "div.text-right span"
  );

  if (!dateElement) return 0;

  const dateText = dateElement.text.trim();
  
const lower = dateText.toLowerCase();
const now = Date.now();
let timestamp;

if (lower === "today") {
  timestamp = now;
} else if (lower === "yesterday") {
  timestamp = now - 86400000;
} else if (lower === "last week") {
  timestamp = now - 7 * 86400000;
} else {
  const match = lower.match(
    /(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/
  );

  if (match) {
    const units = {
      minute: 60000,
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000,
      year: 31536000000
    };

    timestamp = now - Number(match[1]) * units[match[2]];
  } else {
    timestamp = Date.parse(dateText);
  }
}


  
return Number.isFinite(timestamp)
  ? String(Math.floor(timestamp))
  : "0";

})()

  }))
  
.filter(item =>
  item.url &&
  item.name &&
  !item.name.toLowerCase().includes("test") &&
  (
    /^Chapter\s+\d+(?:\.\d+)?\b/i.test(item.name) ||
    /^(Prologue|Epilogue|Side Story|Special)\b/i.test(item.name)
  )
)

  };
}



    // For novel html content
    /**
     * Returns the text of one novel chapter as an HTML string.
     * @param {string} name the chapter's name
     * @param {string} url the chapter's url from getDetail
     * @returns {Promise<string>}
     */
    async getHtmlContent(name, url) {
        throw new Error("getHtmlContent not implemented");
    }

    // Clean html up for reader
    /**
     * Takes the HTML returned by getHtmlContent and returns it as a cleaned
     * up HTML string, ready to be shown in the reader.
     * @param {string} html
     * @returns {Promise<string>}
     */
    async cleanHtmlContent(html) {
        throw new Error("cleanHtmlContent not implemented");
    }

    // For anime episode video list
    /**
     * Returns the available videos of one episode, for example one per
     * quality or server.
     * @param {string} url the episode's url from getDetail
     * @returns {Promise<Object[]>} one object per video. url (the direct
     *     video link), quality (a label shown to the user, for example
     *     "1080p" or "Server 1") and originalUrl (the video's original URL,
     *     often the same as url) are needed; a video missing url or
     *     originalUrl is skipped. headers (needed to play the video),
     *     subtitles and audios are optional.
     *     For common video hosts there are ready-made helpers that take the
     *     host's page URL and return the array of videos for you, so you
     *     can return it as it is. Some take extra values, such as a label
     *     prefix or a quality: streamWishExtractor, filemoonExtractor,
     *     streamTapeExtractor, doodExtractor, voeExtractor, okruExtractor,
     *     sibnetExtractor, mp4UploadExtractor, gogoCdnExtractor,
     *     myTvExtractor, vidBomExtractor, streamlareExtractor,
     *     sendVidExtractor and yourUploadExtractor. For example
     *     return await streamWishExtractor(url, "StreamWish - ").
     * @example
     * return [
     *     {
     *         url: "https://example.com/video.m3u8",
     *         quality: "1080p",
     *         originalUrl: "https://example.com/video.m3u8",
     *         headers: { "Referer": "https://example.com" },
     *         subtitles: [{ file: "https://example.com/en.vtt", label: "English" }],
     *         audios: []
     *     }
     * ];
     */
    async getVideoList(url) {
        throw new Error("getVideoList not implemented");
    }

    // For manga chapter pages
    /**
     * Returns the pages of one chapter, in reading order.
     * @param {string} url the chapter's url from getDetail
     * @returns {Promise<Array<string | {url: string, headers: Object<string, string>}>>}
     *     one item per page: either the image URL as a string, or an object
     *     with the image url and the headers needed to load it.
     * @example
     * return ["https://example.com/1.jpg", "https://example.com/2.jpg"];
     */
    
async getPageList(url) {
  const client = new Client();

  const fullUrl = url.startsWith("http")
    ? url
    : "https://asurascans.com" + url;

  const res = await client.get(
    fullUrl,
    this.getHeaders(fullUrl)
  );

  const doc = new Document(res.body);
  const images = doc.select("img");
  const pages = [];

  for (const img of images) {
    let src = img.attr("data-src") ||
              img.attr("src") ||
              "";

    if (!src) continue;

    if (src.startsWith("/")) {
      src = "https://asurascans.com" + src;
    }

    if (!src.startsWith("http")) continue;

    pages.push(src);
  }

  return pages;
}


    /**
     * Optional. Returns the filters shown on the search screen, for example
     * a genre or status selector. Return [] for no filters.
     * @returns {Object[]} filter objects. Each has a type_name that is one
     *     of "SelectFilter" (a dropdown), "CheckBox" (a checkbox), "TriState"
     *     (ignore, include or exclude), "TextFilter" (a text field),
     *     "SortFilter" (sort options with a direction), "GroupFilter" (a
     *     group of other filters), "HeaderFilter" (a label) or
     *     "SeparatorFilter" (a divider). Other values are ignored.
     * @example
     * return [
     *     {
     *         type_name: "SelectFilter", type: "sort", name: "Order by", state: 0,
     *         values: [
     *             { type_name: "SelectOption", name: "Popular", value: "popular" },
     *             { type_name: "SelectOption", name: "Newest", value: "newest" }
     *         ]
     *     },
     *     { type_name: "CheckBox", type: "completed", name: "Completed only", value: "completed", state: false },
     *     { type_name: "TriState", type: "genre", name: "Action", value: "action", state: 0 },
     *     { type_name: "TextFilter", type: "author", name: "Author", state: "" },
     *     { type_name: "GroupFilter", type: "genres", name: "Genres", state: [
     *         { type_name: "TriState", type: "genre", name: "Drama", value: "drama", state: 0 }
     *     ] },
     *     { type_name: "HeaderFilter", type: "", name: "Section title" },
     *     { type_name: "SeparatorFilter", type: "" }
     * ];
     */
    getFilterList() {
        throw new Error("getFilterList not implemented");
    }

    /**
     * Optional. Returns the settings the user can change for this source.
     * Return [] for no settings.
     * @returns {Object[]} one object per setting, with a unique key (so its
     *     value can be saved and read back) and one of checkBoxPreference,
     *     switchPreferenceCompat, listPreference, multiSelectListPreference
     *     or editTextPreference. To read a setting back, for example in
     *     getPopular, use new SharedPreferences().get("show_extra"). It
     *     returns, depending on the type: for checkBoxPreference and
     *     switchPreferenceCompat a boolean, for editTextPreference the text,
     *     for listPreference the chosen entry's value, and for
     *     multiSelectListPreference the array of chosen values.
     * @example
     * return [{
     *     key: "show_extra",
     *     switchPreferenceCompat: {
     *         title: "Show extra content",
     *         summary: "A short explanation.",
     *         value: false
     *     }
     * }];
     */
    getSourcePreferences() {
        throw new Error("getSourcePreferences not implemented");
    }
}
