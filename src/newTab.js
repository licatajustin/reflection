/** Class representing the Reflection extension */
class Reflection {
  /**
   * Create the Reflection extension.
   */
  constructor() {
    this.truncateLength = 20;
    this.bibleVerseUrl = 'https://labs.bible.org/api/?type=json&passage=votd';
    this.cachedBibleVerse = JSON.parse(localStorage.getItem(this.cacheKey()));
  }

  /**
   * Call two primary functions.
   */
  init() {
    this.fetchVerse();
    this.fetchTopSites();
  }

  /**
   * Query and return a DOM element.
   *
   * @param {string} selector - the DOM selector.
   */
  $(selector) {
    return document.querySelector(selector);
  }

  /**
   * Creates a cache key for the Bible Verse.
   */
  cacheKey() {
    const d = new Date();
    const timestamp = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

    return `bibleVerse-${timestamp}`;
  }

  /**
   * Check if the Bible Verse is cached (via localStorage).
   */
  isCached() {
    return this.cachedBibleVerse != null;
  }

  /**
   * Cache the Bible Verse (via localStorage).
   * We set a timestamp on the cache key, so we always get a new Verse
   * of the Day, daily.
   *
   * @param {object} bibleVerse.
   */
  cache(bibleVerse) {
    localStorage.setItem(this.cacheKey(), JSON.stringify(bibleVerse));
  }

  /**
   * Either fetch the Verse of the Day from an API or skip ahead to
   * next step if the Verse is cached.
   */
  fetchVerse() {
    // we don't want to continue to `fetch` if the verse is cached.
    if (this.isCached()) return this.receiveVerse(this.cachedBibleVerse);

    fetch(this.bibleVerseUrl)
      .then(r => r.json())
      .then((data) => {
        const verse = data[0];

        this.receiveVerse(verse);
        this.cache(verse);
      })
      .catch(this.receiveBibleVerseFailure.bind(this))
  }

  /**
   * Render the Bible Verse onto the DOM.
   *
   * @param {object} bibleVerse.
   */
  receiveVerse(bibleVerse) {
    const verseEl = this.$('[data-el="bibleVerse"]');

    verseEl.innerHTML = this.bibleVerseHTML(bibleVerse);
  }

  /**
   * Build the HTML for the Bible Verse. I want React 😞.
   *
   * @param {object} bibleVerse.
   */
  bibleVerseHTML(bibleVerse) {
    const book = `${bibleVerse.bookname} ${bibleVerse.chapter}:${bibleVerse.verse}`
    const text = bibleVerse.text;

    return `
      <h2 class="verse">${book}</h2>
      <p class="verseText">${text}</p>
    `
  }

  /**
   * If the initial fetch fails, our failsafe is to render a pre-set
   * Bible Verse - my favorite one 😊.
   */
  receiveBibleVerseFailure() {
    const verseEl = this.$('[data-el="bibleVerse"]');
    const notFoundUrl = chrome.extension.getURL('/src/templates/notFound.html');

    fetch(notFoundUrl)
      .then(r => r.text())
      .then((data) => { verseEl.innerHTML = data; });
  }

  /**
   * Fetch the Top Sites from `chrome`.
   */
  fetchTopSites() {
    chrome.topSites.get(this.receiveTopSites.bind(this));
  }

  /**
   * Called after the Top Sites are loaded.
   * Build the HTML and render onto DOM.
   *
   * @param {array} topSites.
   */
  receiveTopSites(topSites) {
    const topSitesEl = this.$('[data-el="topSites"]');
    // we only want to keep the first 8.
    const recentSites = topSites.splice(0, 8);
    const siteElements = this.buildTopSitesHTML(recentSites);

    topSitesEl.innerHTML = siteElements;
  }

  /**
   * Build the HTML for the Top Sites.
   *
   * @param {array} topSites.
   */
  buildTopSitesHTML(topSites) {
    return topSites.map((site) => {
      const favicon = this.buildFaviconSrc(site.url);

      return `
        <a href="${site.url}" class="site grow">
          <div class="siteInner">
            <h6 class="siteName">
              ${this.truncate(site.title)}
            </h6>

            <img src="${favicon}" alt="${site.title}" />
          </div>
        </div>
      `;
    }).join(' ');
  }

  /**
   * Build the site's Favicon URL.
   *
   * @param {string} url - The url for the Favicon.
   */
  buildFaviconSrc(url) {
    return `chrome://favicon/${url}`;
  }

  /**
   * Helper function to truncate text.
   *
   * @param {string} text - The text value.
   */
  truncate(text) {
    // Let's not perform truncation if the length is OK.
    if (text.length <= this.truncateLength) return text;

    return text.substring(0, this.truncateLength) + '...';
  }
}

window.onload = function() {
  new Reflection().init();
}
