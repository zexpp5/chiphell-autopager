// ==UserScript==
// @name         Chiphell自动加载前5页（UTF-8编码支持）
// @namespace    https://www.chiphell.com/
// @version      1.0
// @description  自动加载Chiphell论坛帖子前5页内容
// @author       GPT-4
// @match        https://www.chiphell.com/thread-*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let lastThreadUrl = null;

    async function autoloadPages() {
        // 检查是否在帖子页面（URL包含thread-）
        if (!location.pathname.includes('/thread-')) return;
        
        if (lastThreadUrl === location.href) {
            console.log('[Chiphell-Autoload] Already loaded this thread, skip.');
            return;
        }
        lastThreadUrl = location.href;
        console.log('[Chiphell-Autoload] 进入帖子页:', location.href);

        let retry = 30;
        let postList;
        while (retry-- > 0) {
            postList = document.querySelector('#postlist');
            if (postList && postList.querySelector('[id^="post_"]')) break;
            await new Promise(r => setTimeout(r, 200));
        }
        if (!postList) {
            console.log('[Chiphell-Autoload] 没有找到主内容区 #postlist');
            return;
        }
        console.log('[Chiphell-Autoload] 找到主内容区，开始处理分页...');

        function getPageUrls() {
            let pageNav = document.querySelector('.pg');
            if (!pageNav) {
                console.log('[Chiphell-Autoload] 没有分页导航。');
                return [location.href];
            }
            
            let urls = [];
            urls.push(location.href);
            
            // 获取分页链接
            let links = Array.from(pageNav.querySelectorAll('a[href*="thread-"]'));
            for (let i = 0; i < links.length; i++) {
                let url = new URL(links[i].href, location.origin).href;
                if (!urls.includes(url) && urls.length < 5) {
                    urls.push(url);
                }
            }
            
            console.log('[Chiphell-Autoload] 分页URL:', urls);
            return urls.slice(0, 5);
        }

        function isAlreadyLoaded(url) {
            return !!document.querySelector('[data-autoloaded-page="' + url + '"]');
        }

        async function fetchAndAppend(url, afterNode) {
            if (isAlreadyLoaded(url)) {
                console.log(`[Chiphell-Autoload] 已加载: ${url}`);
                return;
            }
            console.log(`[Chiphell-Autoload] 拉取: ${url}`);
            try {
                let resp = await fetch(url, { credentials: 'include' });
                if (!resp.ok) throw new Error('Failed to load page: ' + url);
                
                let text = await resp.text();
                console.log(`[Chiphell-Autoload] 使用 UTF-8 编码解码成功: ${url}`);
                
                let doc = new DOMParser().parseFromString(text, 'text/html');
                let posts = doc.querySelectorAll('#postlist [id^="post_"]');
                console.log(`[Chiphell-Autoload] ${url} 有 ${posts.length} 个帖子`);
                
                posts.forEach(post => {
                    post.setAttribute('data-autoloaded-page', url);
                    post.style.borderTop = '3px solid #ff6b6b';
                    post.style.marginTop = '20px';
                    post.style.paddingTop = '15px';
                    
                    // 添加页面标记
                    let pageMarker = document.createElement('div');
                    pageMarker.style.cssText = 'background: #ff6b6b; color: white; padding: 5px 10px; margin-bottom: 10px; border-radius: 3px; font-size: 12px;';
                    pageMarker.textContent = `来自: ${url}`;
                    post.insertBefore(pageMarker, post.firstChild);
                    
                    afterNode.parentNode.insertBefore(post, afterNode.nextSibling);
                    afterNode = post;
                });
            } catch (e) {
                console.error(`[Chiphell-Autoload] 拉取失败 ${url}:`, e);
            }
        }

        let indicator = document.createElement('div');
        indicator.textContent = '正在自动加载前5页……';
        indicator.style.cssText = 'padding:12px; background:#f0f8ff; color:#333; text-align:center; font-size:16px; border:2px dashed #4a90e2; margin:20px 0; border-radius:5px;';
        postList.appendChild(indicator);

        let allPosts = postList.querySelectorAll('[id^="post_"]');
        let lastPost = Array.from(allPosts).pop();
        if (!lastPost) {
            console.log('[Chiphell-Autoload] 当前页面没有找到帖子！');
            return;
        }

        let urls = getPageUrls();
        for (let i = 1; i < urls.length; i++) {
            console.log(`[Chiphell-Autoload] 开始加载第${i+1}页: ${urls[i]}`);
            await fetchAndAppend(urls[i], lastPost);
            let newPosts = postList.querySelectorAll('[id^="post_"]');
            lastPost = Array.from(newPosts).pop();
            
            // 添加延时，避免请求过快
            await new Promise(r => setTimeout(r, 500));
        }

        indicator.textContent = '前5页已加载完毕';
        indicator.style.background = '#d4edda';
        indicator.style.borderColor = '#28a745';
        indicator.style.color = '#155724';
        setTimeout(() => indicator.remove(), 3000);
        console.log('[Chiphell-Autoload] 所有页面加载完毕。');
    }

    // 页面加载完成后自动执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoloadPages);
    } else {
        autoloadPages();
    }

})();
