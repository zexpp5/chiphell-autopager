// ==UserScript==
// @name         Chiphell自动加载前5页（UTF-8编码支持）
// @namespace    https://www.chiphell.com/
// @version      1.0
// @description  自动加载Chiphell论坛帖子前5页内容
// @author       GPT-4
// @match        https://www.chiphell.com/thread-*
// @match        https://www.chiphell.com/forum.php?mod=viewthread*
// @grant        none
// ==/UserScript==

(function () {
              'use strict';

              let lastThreadUrl = null;

              async function autoloadPages() {
                  // 检查是否在帖子页面（URL包含thread-或forum.php?mod=viewthread）
                  const isThreadPage = location.pathname.includes('/thread-') ||
                                     (location.pathname.includes('/forum.php') && location.search.includes('mod=viewthread'));
                  if (!isThreadPage) return;

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

                          // 获取分页链接 - 支持两种URL格式
                          let links = Array.from(pageNav.querySelectorAll('a'));
                          for (let i = 0; i < links.length; i++) {
                              let href = links[i].href;
                              // 检查是否是thread-格式或forum.php格式的链接
                              if (href.includes('thread-') || (href.includes('forum.php') && href.includes('mod=viewthread'))) {
                                  let url = new URL(href, location.origin).href;
                                  if (!urls.includes(url) && urls.length < 5) {
                                      urls.push(url);
                                  }
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
                          return afterNode;
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

                          let currentAfterNode = afterNode;

                          posts.forEach((post, postIndex) => {
                              console.log(`[TR-Debug] ===== 开始处理第${postIndex}个post =====`);

                              // 找到post中的主table
                              let mainTable = post.querySelector('table[id^="pid"]');
                              if (!mainTable) {
                                  console.log(`[TR-Debug] 在post ${postIndex} 中没有找到主table`);
                                  return;
                              }

                              console.log(`[TR-Debug] 在post ${postIndex} 中找到主table:`, mainTable);

                              // 删除头像和勋章元素
                              post.querySelectorAll('.avtm').forEach(el => {
                                  console.log(`[TR-Debug] 删除头像元素:`, el);
                                  el.remove();
                              });

                              post.querySelectorAll('.md_ctrl').forEach(el => {
                                  console.log(`[TR-Debug] 删除勋章元素:`, el);
                                  el.remove();
                              });

                              post.querySelectorAll('.pil.cl').forEach(el => {
                                  console.log(`[TR-Debug] 删除用户详细信息:`, el);
                                  el.remove();
                              });

                              // 获取所有tr
                              let allTrs = mainTable.querySelectorAll('tr');
                              console.log(`[TR-Debug] 在主table中找到 ${allTrs.length} 个tr`);

                              // 遍历所有tr，查看内容并决定是否隐藏
                              allTrs.forEach((tr, trIndex) => {
                                  console.log(`[TR-Debug] ===== 检查第${trIndex}个tr =====`);
                                  console.log(`[TR-Debug] TR ${trIndex} 内容:`, tr.innerHTML.substring(0, 200) + '...');

                                  // 检查tr中是否包含帖子内容
                                  let hasPostContent = tr.querySelector('[id^="postmessage"]') || tr.querySelector('.t_f');
                                  if (hasPostContent) {
                                      console.log(`[TR-Debug] TR ${trIndex} 包含帖子内容，保留`);
                                      return; // 保留包含帖子内容的tr
                                  }

                                  // 检查是否是第一个tr（通常包含用户信息和帖子内容）
                                  if (trIndex === 0) {
                                      console.log(`[TR-Debug] TR ${trIndex} 是第一个tr，保留`);
                                      return;
                                  }

                                  // 隐藏其他tr
                                  console.log(`[TR-Debug] 隐藏TR ${trIndex}`);
                                  tr.style.display = 'none';
                              });
                              post.setAttribute('data-autoloaded-page', url);
                              post.style.borderTop = '3px solid #ff6b6b';
                              post.style.marginTop = '20px';
                              post.style.paddingTop = '15px';

                              // 添加页面标记
                              let pageMarker = document.createElement('div');
                              pageMarker.style.cssText = 'background: #ff6b6b; color: white; padding: 5px 10px; margin-bottom: 10px; border-radius: 3px; font-size: 12px;';
                              pageMarker.textContent = `来自: ${url}`;
                              post.insertBefore(pageMarker, post.firstChild);

                              // 插入到正确位置
                              currentAfterNode.parentNode.insertBefore(post, currentAfterNode.nextSibling);
                              currentAfterNode = post;
                          });

                          return currentAfterNode;
                      } catch (e) {
                          console.error(`[Chiphell-Autoload] 拉取失败 ${url}:`, e);
                          return afterNode;
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

                  // 对当前页面的帖子也应用相同的压缩处理
                  function compressCurrentPagePosts() {
                      let currentPosts = document.querySelectorAll('#postlist [id^="post_"]');
                                            currentPosts.forEach((post, postIndex) => {
                          console.log(`[TR-Debug-Current] ===== 开始处理当前页面第${postIndex}个post =====`);

                          // 找到post中的主table
                          let mainTable = post.querySelector('table[id^="pid"]');
                          if (!mainTable) {
                              console.log(`[TR-Debug-Current] 在post ${postIndex} 中没有找到主table`);
                              return;
                          }

                          console.log(`[TR-Debug-Current] 在post ${postIndex} 中找到主table:`, mainTable);

                          // 删除头像和勋章元素
                          post.querySelectorAll('.avtm').forEach(el => {
                              console.log(`[TR-Debug-Current] 删除头像元素:`, el);
                              el.remove();
                          });

                          post.querySelectorAll('.md_ctrl').forEach(el => {
                              console.log(`[TR-Debug-Current] 删除勋章元素:`, el);
                              el.remove();
                          });

                          post.querySelectorAll('.pil.cl').forEach(el => {
                              console.log(`[TR-Debug-Current] 删除用户详细信息:`, el);
                              el.remove();
                          });

                          // 获取所有tr
                          let allTrs = mainTable.querySelectorAll('tr');
                          console.log(`[TR-Debug-Current] 在主table中找到 ${allTrs.length} 个tr`);

                          // 遍历所有tr，查看内容并决定是否隐藏
                          allTrs.forEach((tr, trIndex) => {
                              console.log(`[TR-Debug-Current] ===== 检查第${trIndex}个tr =====`);
                              console.log(`[TR-Debug-Current] TR ${trIndex} 内容:`, tr.innerHTML.substring(0, 200) + '...');

                              // 检查tr中是否包含帖子内容
                              let hasPostContent = tr.querySelector('[id^="postmessage"]') || tr.querySelector('.t_f');
                              if (hasPostContent) {
                                  console.log(`[TR-Debug-Current] TR ${trIndex} 包含帖子内容，保留`);
                                  return; // 保留包含帖子内容的tr
                              }

                              // 检查是否是第一个tr（通常包含用户信息和帖子内容）
                              if (trIndex === 0) {
                                  console.log(`[TR-Debug-Current] TR ${trIndex} 是第一个tr，保留`);
                                  return;
                              }

                              // 隐藏其他tr
                              console.log(`[TR-Debug-Current] 隐藏TR ${trIndex}`);
                              tr.style.display = 'none';
                          });
                      });
                  }

                  // 压缩当前页面
                  compressCurrentPagePosts();

                  let urls = getPageUrls();
                  for (let i = 1; i < urls.length; i++) {
                      console.log(`[Chiphell-Autoload] 开始加载第${i+1}页: ${urls[i]}`);
                      lastPost = await fetchAndAppend(urls[i], lastPost);

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
