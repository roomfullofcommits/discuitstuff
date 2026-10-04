// ==UserScript==
// @name         squabbles layout
// @namespace    http://tampermonkey.net/
// @version      0.4.0
// @updateURL    https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/squabbleslayout.user.js
// @downloadURL  https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/squabbleslayout.user.js
// @description  maybe
// @author       trying_to_be
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addElement
// @grant        GM_addStyle
// @grant        window.onurlchange
// @run-at       document-start
// ==/UserScript==

let posts = [];

(function() {
    'use strict';

    const originalFetch = window.fetch;
    const root = unsafeWindow || window;

    root.fetch = function(...args) {
        const url = args[0];
        const options = args[1] || {};

        //console.log('Intercepted fetch request:', url, options);

        return originalFetch.apply(this, args).then(async response => {

            if (!url.includes("api/posts?sort")) return response;
            if (!url.includes("&next=")) posts = [];

            const clonedResponse = response.clone()
            clonedResponse.json().then(async json => {
                //console.log('Fetch response JSON:', json.posts);
                let i = 0
                for (const post of json.posts) {
                    const commentResponse = await window.fetch("https://discuit.org/api/posts/" + post.publicId)
                    posts.push(await commentResponse.json());
                    constructCommentBox(null, i)
                    i++;
                }
                //console.log("posts: ", posts);
            });

            return response;
        });
    };
})();

const observerOptions = {
    childList: true,
    attributes: false,
    // Omit (or set to false) to observe only changes to the parent node
    subtree: true
}

async function setupObserver() {
    let targetNode = document.querySelector(".feed");

    while (!targetNode) {
        await new Promise(r => setTimeout(r, 200));
        targetNode = document.querySelector(".feed");
    }

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, observerOptions);
}
setupObserver();

window.addEventListener('urlchange', (info) => setupObserver());

const loadObserver = new MutationObserver(onLoad);
loadObserver.observe(document, {childList: true, subtree: true})

function onLoad() {
    if(!document.querySelector(".navbar")) return;

    loadObserver.disconnect();
    GM_addElement(document.querySelector(".navbar .wrap .left"), "a", { class: "button button-main", href: "/new", textContent: "+ Post", style: "color: var(--color-white"});
};

// TODO
// no infinite scroll
// user count on top
//
// check feed type --
// make api request https://discuit.org/api/posts?sort=hot --
// save "next" field from the request --
// when new posts are added, make request using that next field 	https://discuit.org/api/posts?sort=hot&next=397990212256.18da7ab8a00f2145e21018e8 --
// make a request for comments for every post --
// posts get unloaded when theyre out of view and loaded again without making a new request so comments have to be saved and loaded back in --
// save all comments in an array, can be matched to post index? --
// yeah feed-items dont get hidden so i can simply match to the feeds child index --
// POST ARRAY HAS TO BE CLEARED OUT --

// doesnt load comments when switching page. a request is happening and posts are being cached but it misses creation of post elements --
// somehow make sure stuff is rerun on url change? --

// for some reason when going back from a post the feed-item-item is added twice, so the listener that adds comments is also added twice --
// kind of fixed this by checking if comment box already exists but i dont like that --

// correct comment nesting --
// comment max height/expanding --
// correct comment hover date formatting & x minutes ago
// markdown
// slim layout
// comment interaction
// hidden and ghost deleted comments
// muted comments
// blocked comments
// collapse long comments
// community comments not assigned to correct posts. actually, comments desync after a bit. third post is always null? --
// comments still desync when scrolling quickly --
// a few comments dont show up when scrolling too quickly
// op, mod, admin markers
// supporter marker not working --
// set feed-item min-height when collapse button toggled (there was an issue where it would unload the comments and collapse them but i guess thats gone?) --
// now they dont stay expanded again? the only actual issue is when expanding comments to more than a posts length, scrolling down, then collapsing.
  // makes stuff jump around because min-height doesnt update. still it would be nice if comments stayed expanded
// community page layout
// user profile page
// base expand visibility not just on comment count, there could be one really long comment
// high depth comments get squeezed a lot and also overflow -> use mobile comment nesting but also fix overlflow
// comment collapsing

GM_addStyle(`
.sidebar-right {
  display: none;
}
comment-box {
  display: block;
  width: 40%;
  margin-left: var(--post-card-margin-left);
  overflow: unset;
  height: fit-content;
  input#post-expanded {
    bottom: 0;
    position: sticky;
    width: 100% !important;
    z-index: 200000;
    opacity: 0;
  }
  .post {
    display: block;
    overflow: hidden;
    margin: 10px;
    margin-top: 0;
    max-height: 300px;
  }
  label-expand, label-collapse {
    width: 100%;
    height: 21px;
    bottom: 0;
    margin-top: -21px;
    position: sticky;
    text-align: center;
    z-index: 150000;
    background: var(--color-card);
    border-top: var(--card-border-top);
  }
  label-collapse {
    display: none;
  }
  &:has(input#post-expanded:checked) {
    .post {max-height: unset};
    label-expand { display: none; }
    label-collapse { display: inline; }
  }
}
body {
  height: 100vh;
}
.posts, .comm-content {
  overflow: unset !important;
}
.post-card-card, .post-votes, comment-box {
  height: fit-content;
  top: calc(var(--navbar-height) + 20px);
  position: sticky;
}
.post-image img {
  max-width: 100%;
}
.post-card-embed iframe {
  max-width: 100%;
}
:root {
  --grid-home: minmax(var(--sidebar-left-width), max-content) 9fr 0fr !important;
}
@media screen and (max-width: 1170px) {
  .page-content.page-grid {
    grid-template-columns: 5fr !important;
  }
  .post-card {
    flex-direction: column;
  }
  comment-box {
    width: 100%;
  }
}
@media screen and (max-width: 768px) {
}
.page-content.page-grid {
  max-width: unset;
}
`);


function callback(mutationList, observer) {
    mutationList.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach(el => {
                if (el.nodeName === "DIV" && el.matches('.feed .feed-item')) {
                    const postObserver = new MutationObserver(postCallback);
                    postObserver.observe(el, observerOptions);

                    const postIndex = [].indexOf.call(el.parentNode.querySelectorAll(".feed-item"), el);
                    constructCommentBox(el, postIndex);
                }
            });
        }
    });
}

function postCallback(mutationList, observer) {
    mutationList.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
            mutation.addedNodes.forEach(el => {
                if (el.nodeName === "DIV" && el.matches('.feed-item-item')) {
                    const postIndex = [].indexOf.call(el.parentNode.parentNode.querySelectorAll(".feed-item"), el.parentNode);
                    constructCommentBox(el, postIndex);
                }
            });
        }
    });
}

window.addEventListener('urlchange', (info) => {
    document.querySelectorAll(".feed-item").forEach(post => {
        const postObserver = new MutationObserver(postCallback);
        postObserver.observe(post, observerOptions);

        const postIndex = [].indexOf.call(post.parentNode.querySelectorAll(".feed-item"), post);
        constructCommentBox(post, postIndex);
    });
});

function constructCommentBox(parent, postIndex) {
    if (!parent) parent = document.querySelectorAll(".feed-item")[postIndex]
    let commentBox = parent.querySelector("comment-box");
    if (!parent.querySelector(".post-card")) return;
    if (!parent.querySelector("comment-box")) {
        commentBox = GM_addElement(parent.querySelector(".post-card"), "comment-box", {class: "card"});
    }
    let post = posts[postIndex];
    if (!post) return;

    //check if post has the correct short id, should only happen when scrolling quickly
    //if not, find correct post in posts
    let href = parent.querySelector(".post-card-title-text a").getAttribute("href");
    if (!href.includes(post.publicId)) {
        console.log("posts got desynced, fixing");
        post = posts.find(el => href.includes(el.publicId));
    }

    commentBox.innerHTML = `
    <div class="post">
    <div class="post-comments-comments">
      ${post.comments.map(comment => `
      <div class="post-comment has-propics is-depth-${comment.depth}" style="z-index: 100000;" id="${comment.id}">
        <div class="post-comment-left">
          <div class="post-comment-collapse">
            <div class="post-comment-propic">
              <a href="/@${comment.username}" target="_self" rel="nofollow noreferrer">
                <div class="user-propic">
                  ${comment.author && comment.author.proPic ?
                          `<div class="profile-picture" style="background-color: rgb(120, 84, 49); background-image: url(&quot;${comment.author && comment.author.proPic ? comment.author.proPic.copies[0].url : ""}&quot;);">
                    <img alt="${comment.username}'s profile" src="${comment.author && comment.author.proPic ? comment.author.proPic.copies[0].url : ""}">
                  </div>`
                          :
                          `${comment.author ?
                          `<div class="profile-picture is-default" style="background-color: ${(() => {
        switch (comment.username.charCodeAt(0) % 8) {
            case 0:
                return "#e55454";
            case 1:
                return "#158686";
            case 2:
                return "#5454e5";
            case 3:
                return "#9d4040";
            case 4:
                return "#b854e5";
            case 5:
                return "#000000";
            case 6:
                return "#d0af4e";
            case 7:
                return "#3da5ce";
        }
    })()}">
                    <svg viewBox="-50 -50 100 100" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                      <text fill="currentColor" dy="0.35em" text-anchor="middle" font-size="40px">${comment.username[0].toUpperCase()}</text>
                    </svg>
                  </div>`
                          :
                          `<div class="profile-picture is-ghost" style="background-color: gray; opacity: 0.3;">
                    <svg viewBox="-50 -50 100 100" version="1.1" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg"></svg>
                  </div>`
                          }`
                          }
                </div>
              </a>
            </div>
            <div class="post-comment-line">
            </div>
          </div>
        </div>
        <div class="post-comment-body">
          <div class="post-comment-body-head">
            <a href="/@${comment.username}" class="user-link post-comment-username ${comment.author && comment.author.badges.length && comment.author.badges.some(el => el.type === "supporter") ? "is-supporter" : ""}">
              <div class="user-link-name ${comment.author && comment.author.badges.length && comment.author.badges.some(el => el.type === "supporter") ? "is-supporter" : ""}">${comment.username}</div>
            </a>
            <span title="${comment.createdAt}" class="post-comment-head-item">${comment.createdAt}</span>
            <div class="post-comment-head-item post-comment-collapse-minus">
            </div>
          </div>
          <div class="post-comment-text" style="opacity: 1; cursor: auto;">
            <div class="showmorebox">
              <div class="showmorebox-body" style="max-height: 500px;">
                <div class="markdown-body">
                  <p>${comment.body}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="post-comment-buttons" style="position: relative; z-index: 2000000;">
            <button class="button-text post-comment-buttons-vote is-up">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m19.707 9.293-7-7a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 5 11h3v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V11h3a1 1 0 0 0 .707-1.707z" fill="currentColor" data-name="Up"></path></svg>
            </button>
            <div class="post-comment-points">${comment.upvotes}</div>
            <button class="button-text post-comment-buttons-vote is-down">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="m19.707 9.293-7-7a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 5 11h3v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V11h3a1 1 0 0 0 .707-1.707z" fill="currentColor" data-name="Up"></path></svg>
            </button>
            <div class="post-comment-points is-grayed">${comment.downvotes}</div>
            <button class="button-text" title="">Reply</button>
            <div class="dropdown">
              <div role="button" tabindex="0" class="dropdown-target">
                <button class="button-text post-comment-button">Share</button>
              </div>
              <div style="left: 0px;" class="dropdown-menu">
                <div class="dropdown-list">
                  <div class="dropdown-item">Copy URL</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      `).join('')}
    </div>
    </div>
    ${post.comments.length == 0 ? "<p style='text-align: center; margin: 20px;'>No comments yet :<<br>It's free realestate!</p>" : ""}
    `;

    if (post.comments.length > 2 || commentBox.offsetHeight > 300) {
        let checkbox = GM_addElement(commentBox, "input", {type: "checkbox", id: "post-expanded"});
        let expand = GM_addElement(commentBox, "label-expand");
        expand.textContent = "Expand";
        let collapse = GM_addElement(commentBox, "label-collapse");
        collapse.textContent = "Collapse";
    }

    //go through comments by depth
    //select parent comment, insert
    let depth = 1;
    let comments = commentBox.querySelectorAll(".is-depth-1");
    while (comments.length) {
        comments.forEach(comment => {
            let parentID = post.comments.find(el => el.id == comment.getAttribute("id")).parentId;
            let parentComment = commentBox.querySelector(`[id="${parentID}"]`);
            parentComment.querySelector(".post-comment-body").append(comment);
        });
        depth++;
        comments = commentBox.querySelectorAll(`.is-depth-${depth}`);
    }
}

