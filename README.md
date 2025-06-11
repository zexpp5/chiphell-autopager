# Chiphell Autopager

A Tampermonkey userscript designed for Chiphell forum that automatically loads the first 5 pages of thread content to enhance reading experience.

## Features

- **Automatic Pagination**: Automatically loads the first 5 pages of thread content without manual page navigation
- **Smart Detection**: Intelligently detects thread pages and pagination navigation elements
- **Visual Separation**: Adds distinctive borders and source markers for content from different pages
- **Asynchronous Loading**: Uses asynchronous requests to avoid blocking page interactions
- **Duplicate Prevention**: Prevents reloading of already fetched pages
- **Loading Indicators**: Displays loading progress and completion status
- **Error Handling**: Comprehensive error handling with detailed console logging

## Technical Requirements

- **Browser Extension**: [Tampermonkey](https://www.tampermonkey.net/) 
- **Target Domain**: `www.chiphell.com`
- **Page Pattern**: `/thread-*` URLs only
- **Encoding**: UTF-8 support

## Installation

1. Install Tampermonkey browser extension
2. Open Tampermonkey dashboard
3. Click "Create a new script"
4. Replace default content with code from [`chiphell-autopager.js`](./chiphell-autopager.js)
5. Save the script (`Ctrl+S` or `Cmd+S`)
6. Navigate to any Chiphell thread page to activate

## Architecture Overview

### Page Detection Logic
```javascript
// URL pattern matching for thread pages
if (!location.pathname.includes('/thread-')) return;

// DOM ready state checking with retry mechanism
let retry = 30;
while (retry-- > 0) {
    postList = document.querySelector('#postlist');
    if (postList && postList.querySelector('[id^="post_"]')) break;
    await new Promise(r => setTimeout(r, 200));
}
```

### Pagination URL Resolution
```javascript
// Extract pagination links from navigation
let pageNav = document.querySelector('.pg');
let links = Array.from(pageNav.querySelectorAll('a[href*="thread-"]'));

// Build absolute URLs and filter duplicates
for (let i = 0; i < links.length; i++) {
    let url = new URL(links[i].href, location.origin).href;
    if (!urls.includes(url) && urls.length < 5) {
        urls.push(url);
    }
}
```

### Content Injection Mechanism
```javascript
// Parse fetched HTML content
let doc = new DOMParser().parseFromString(text, 'text/html');
let posts = doc.querySelectorAll('#postlist [id^="post_"]');

// Inject with visual markers and positioning
posts.forEach(post => {
    post.setAttribute('data-autoloaded-page', url);
    post.style.borderTop = '3px solid #ff6b6b';
    post.style.marginTop = '20px';
    post.style.paddingTop = '15px';
    
    afterNode.parentNode.insertBefore(post, afterNode.nextSibling);
    afterNode = post;
});
```

## DOM Selectors Reference

| Element | Selector | Purpose |
|---------|----------|---------|
| Main Container | `#postlist` | Primary content container |
| Individual Posts | `[id^="post_"]` | Post identification |
| Pagination Navigation | `.pg` | Page link extraction |
| Thread Links | `a[href*="thread-"]` | Valid pagination URLs |

## Configuration Parameters

### Adjustable Constants
```javascript
// Maximum pages to load (default: 5)
const MAX_PAGES = 5;

// Request throttling interval (default: 500ms)
const REQUEST_DELAY = 500;

// DOM ready retry attempts (default: 30)
const MAX_RETRIES = 30;

// Retry interval (default: 200ms)
const RETRY_INTERVAL = 200;
```

### Styling Customization
```javascript
// Page separator styling
post.style.borderTop = '3px solid #ff6b6b';
post.style.marginTop = '20px';
post.style.paddingTop = '15px';

// Loading indicator styling
indicator.style.cssText = 'padding:12px; background:#f0f8ff; color:#333; text-align:center; font-size:16px; border:2px dashed #4a90e2; margin:20px 0; border-radius:5px;';
```

## API Documentation

### Core Functions

#### `autoloadPages()`
Main execution function that orchestrates the entire pagination process.

**Flow:**
1. URL validation for thread pages
2. DOM element discovery with retry mechanism
3. Pagination URL extraction and validation
4. Sequential content fetching and injection
5. Visual feedback and completion handling

#### `getPageUrls()`
Extracts and validates pagination URLs from the current page.

**Returns:** `Array<String>` - Array of absolute URLs (max 5)

#### `fetchAndAppend(url, afterNode)`
Fetches content from specified URL and injects it after the given node.

**Parameters:**
- `url`: String - Target URL to fetch
- `afterNode`: HTMLElement - DOM insertion point

#### `isAlreadyLoaded(url)`
Checks if content from the specified URL has already been loaded.

**Returns:** `Boolean` - True if already loaded

## Error Handling

### Common Error Scenarios
1. **Network Failures**: Fetch request timeouts or HTTP errors
2. **DOM Parsing Issues**: Invalid HTML structure in fetched content
3. **Element Not Found**: Missing required DOM elements
4. **Rate Limiting**: Server-side request throttling

### Debug Console Output
```
[Chiphell-Autoload] 进入帖子页: https://www.chiphell.com/thread-xxx
[Chiphell-Autoload] 找到主内容区，开始处理分页...
[Chiphell-Autoload] 分页URL: ["url1", "url2", "url3", "url4", "url5"]
[Chiphell-Autoload] 开始加载第2页: https://www.chiphell.com/thread-xxx-2
[Chiphell-Autoload] 使用 UTF-8 编码解码成功: https://www.chiphell.com/thread-xxx-2
[Chiphell-Autoload] https://www.chiphell.com/thread-xxx-2 有 20 个帖子
[Chiphell-Autoload] 所有页面加载完毕。
```

## Performance Considerations

- **Request Throttling**: 500ms delay between sequential requests to avoid overwhelming the server
- **DOM Caching**: Reuses DOM queries where possible to minimize layout thrashing
- **Memory Management**: Uses `data-autoloaded-page` attributes to track loaded content efficiently
- **Async/Await Pattern**: Non-blocking execution preserves page responsiveness

## Browser Compatibility

- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+

## Security Considerations

- **Same-Origin Policy**: All requests respect CORS limitations
- **Cookie Forwarding**: Maintains user session with `credentials: 'include'`
- **XSS Prevention**: Uses `DOMParser` for safe HTML parsing
- **CSP Compliance**: No inline script execution or eval usage

## Version History

- **v1.0**: Initial release with basic autopagination functionality
- **Target Site**: Chiphell Forum (www.chiphell.com)
- **Encoding Support**: UTF-8
- **Base**: Enhanced version of Newsmth autopager script

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -am 'Add enhancement'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Create Pull Request

### Code Standards
- ES6+ syntax preferred
- Async/await over Promise chains
- Comprehensive error handling required
- Console logging for debugging

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This userscript is specifically designed for Chiphell forum structure and may require modifications for other Discuz-based forums.