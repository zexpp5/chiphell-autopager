# Chiphell Autopager

A Tampermonkey userscript designed for Chiphell forum that automatically loads the first 5 pages of thread content with enhanced reading experience through UI optimization and content compression.

## Features

- **Automatic Pagination**: Automatically loads the first 5 pages of thread content without manual page navigation
- **Smart Detection**: Intelligently detects thread pages and pagination navigation elements  
- **Dual URL Support**: Compatible with both `/thread-*` and `/forum.php?mod=viewthread*` URL formats
- **Content Compression**: Automatically removes unnecessary visual elements (avatars, medals, user stats) to reduce page height
- **Clean UI**: Hides page headers, footers, and navigation elements for distraction-free reading
- **Visual Separation**: Adds distinctive red borders for clear content separation
- **Asynchronous Loading**: Uses asynchronous requests to avoid blocking page interactions
- **Duplicate Prevention**: Prevents reloading of already fetched pages
- **Loading Indicators**: Displays loading progress and completion status
- **Error Handling**: Comprehensive error handling with detailed console logging

## Technical Requirements

- **Browser Extension**: [Tampermonkey](https://www.tampermonkey.net/) 
- **Target Domain**: `www.chiphell.com`
- **Page Patterns**: 
  - `https://www.chiphell.com/thread-*`
  - `https://www.chiphell.com/forum.php?mod=viewthread*`
- **Encoding**: UTF-8 support

## Installation

1. Install Tampermonkey browser extension
2. Open Tampermonkey dashboard
3. Click "Create a new script"
4. Replace default content with code from [`chiphell-autopager.js`](./chiphell-autopager.js)
5. Save the script (`Ctrl+S` or `Cmd+S`)
6. Navigate to any Chiphell thread page to activate

## Architecture Overview

### UI Optimization Features

#### Header/Footer Removal
```javascript
// Automatically hide page header and footer elements
function hideHeaderFooter() {
    const style = document.createElement('style');
    style.textContent = `
        #hd { display: none !important; }
        #ft { display: none !important; }
        #toptb { display: none !important; }
        #tpst { display: none !important; }
    `;
    document.head.appendChild(style);
}
```

#### Content Compression
```javascript
// Remove unnecessary visual elements from posts
post.querySelectorAll('.avtm').forEach(el => el.remove());      // Avatars
post.querySelectorAll('.md_ctrl').forEach(el => el.remove());   // Medals
post.querySelectorAll('.pil.cl').forEach(el => el.remove());    // User stats

// Intelligent TR hiding based on content detection
allTrs.forEach((tr, trIndex) => {
    let hasPostContent = tr.querySelector('[id^="postmessage"]') || tr.querySelector('.t_f');
    if (!hasPostContent && trIndex !== 0) {
        tr.style.display = 'none';
    }
});
```

### Page Detection Logic
```javascript
// Enhanced URL pattern matching for both thread formats
const isThreadPage = location.pathname.includes('/thread-') ||
                   (location.pathname.includes('/forum.php') && location.search.includes('mod=viewthread'));

// DOM ready state checking with retry mechanism
let retry = 30;
while (retry-- > 0) {
    postList = document.querySelector('#postlist');
    if (postList && postList.querySelector('[id^="post_"]')) break;
    await new Promise(r => setTimeout(r, 200));
}
```

### Enhanced Pagination URL Resolution
```javascript
// Extract pagination links with support for both URL formats
let pageNav = document.querySelector('.pg');
let links = Array.from(pageNav.querySelectorAll('a'));
for (let i = 0; i < links.length; i++) {
    let href = links[i].href;
    // Check for both thread- and forum.php formats
    if (href.includes('thread-') || (href.includes('forum.php') && href.includes('mod=viewthread'))) {
        let url = new URL(href, location.origin).href;
        if (!urls.includes(url) && urls.length < 5) {
            urls.push(url);
        }
    }
}
```

### Improved Content Injection Mechanism
```javascript
// Parse fetched HTML content
let doc = new DOMParser().parseFromString(text, 'text/html');
let posts = doc.querySelectorAll('#postlist [id^="post_"]');

// Apply compression and styling to all posts (including current page)
posts.forEach(post => {
    // Content compression logic
    compressPost(post);
    
    // Unified styling for all posts
    post.style.borderTop = '3px solid #ff6b6b';
    post.style.marginTop = '20px';
    post.style.paddingTop = '15px';
    
    // Proper sequential insertion
    currentAfterNode.parentNode.insertBefore(post, currentAfterNode.nextSibling);
    currentAfterNode = post;
});
```

## DOM Selectors Reference

| Element | Selector | Purpose |
|---------|----------|---------|
| Main Container | `#postlist` | Primary content container |
| Individual Posts | `[id^="post_"]` | Post identification |
| Main Post Table | `table[id^="pid"]` | Post structure container |
| Post Content | `[id^="postmessage"], .t_f` | Essential post content |
| Pagination Navigation | `.pg` | Page link extraction |
| Avatar Elements | `.avtm` | Removed for compression |
| Medal Elements | `.md_ctrl` | Removed for compression |
| User Stats | `.pil.cl` | Removed for compression |
| Page Header | `#hd` | Hidden for clean UI |
| Page Footer | `#ft` | Hidden for clean UI |
| Top Toolbar | `#toptb` | Hidden for clean UI |

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
// Unified post styling (applied to all posts)
post.style.borderTop = '3px solid #ff6b6b';
post.style.marginTop = '20px';
post.style.paddingTop = '15px';

// Loading indicator styling
indicator.style.cssText = 'padding:12px; background:#f0f8ff; color:#333; text-align:center; font-size:16px; border:2px dashed #4a90e2; margin:20px 0; border-radius:5px;';

// Header/Footer hiding
const hideStyle = `
    #hd, #ft, #toptb, #tpst { display: none !important; }
`;
```

## API Documentation

### Core Functions

#### `autoloadPages()`
Main execution function that orchestrates the entire pagination and optimization process.

**Flow:**
1. URL validation for thread pages (both formats)
2. UI cleanup (hide headers/footers)
3. DOM element discovery with retry mechanism
4. Current page content compression
5. Pagination URL extraction and validation
6. Sequential content fetching and injection
7. Visual feedback and completion handling

#### `hideHeaderFooter()`
Removes page header, footer, and navigation elements for distraction-free reading.

#### `compressCurrentPagePosts()`
Applies content compression to posts on the current page.

#### `fetchAndAppend(url, afterNode)`
Fetches content from specified URL, applies compression, and injects it after the given node.

**Parameters:**
- `url`: String - Target URL to fetch
- `afterNode`: HTMLElement - DOM insertion point

**Returns:** HTMLElement - Last inserted post element

#### `getPageUrls()`
Extracts and validates pagination URLs from the current page (supports both URL formats).

**Returns:** `Array<String>` - Array of absolute URLs (max 5)

#### `isAlreadyLoaded(url)`
Checks if content from the specified URL has already been loaded.

**Returns:** `Boolean` - True if already loaded

## UI Optimization Details

### Content Compression
- **Avatars Removed**: `.avtm` elements hidden to save vertical space
- **Medals Removed**: `.md_ctrl` elements hidden to reduce clutter
- **User Stats Removed**: `.pil.cl` elements hidden for cleaner appearance
- **Smart TR Detection**: Only removes table rows that don't contain essential post content

### Page Cleanup
- **Header Hidden**: `#hd` element removed for distraction-free reading
- **Footer Hidden**: `#ft` element removed to focus on content
- **Toolbar Hidden**: `#toptb` navigation removed for cleaner interface
- **Top Post Hidden**: `#tpst` element removed for streamlined view

### Visual Consistency
- **Unified Borders**: All posts get consistent red top borders
- **Consistent Spacing**: Uniform margins and padding across all content
- **No Source Labels**: Removed "来自: URL" markers for cleaner appearance

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
- **Content Compression**: Reduces DOM complexity and page height for better performance
- **Sequential Insertion**: Proper afterNode tracking prevents DOM insertion conflicts

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
- **v1.1**: Added content compression and UI optimization features
- **v1.2**: Enhanced with dual URL format support and improved insertion logic
- **v1.3**: Added header/footer hiding and unified post styling
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