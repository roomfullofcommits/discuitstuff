// ==UserScript==
// @name         squabbles layout
// @namespace    http://tampermonkey.net/
// @version      0.1.0
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
                console.log('Fetch response JSON:', json.posts);
                for (const post of json.posts) {
                    const commentResponse = await window.fetch("https://discuit.org/api/posts/" + post.publicId)
                    posts.push(await commentResponse.json());
                }
            });
            console.log("posts: ", posts);

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
    console.log("hallo");
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

// for some reason when going back from a post the feed-item-item is added twice, so the listener that adds comments is also added twice
// kind of fixed this by checking if comment box already exists but i dont like that

GM_addStyle(`
.sidebar-right {
  display: none;
}
comment-box {
  display: block;
  width: 40%;
  height: fit-content;
  outline: solid red;
}
.post-card-card {
  height: fit-content;
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

                    const postIndex = [].indexOf.call(el.parentNode.children, el);
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
                    const postIndex = [].indexOf.call(el.parentNode.parentNode.children, el.parentNode);
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

        const postIndex = [].indexOf.call(post.parentNode.children, post);
        constructCommentBox(post, postIndex);
    });
});

async function constructCommentBox(parent, postIndex) {
    if (parent.querySelector("comment-box")) {
        console.log("post " + postIndex + " already has comment box, skipping");
        return;
    }
    let commentBox = GM_addElement(parent.querySelector(".post-card"), "comment-box");

    let post = posts[postIndex];
    while (!post) {
        await new Promise(r => setTimeout(r, 50));
        post = posts[postIndex];
    }
    //console.log(posts[postIndex]);
    if (!commentBox) return;
    commentBox.textContent = "postIndex: " + postIndex + " | " + post.comments.length + " Comments | " + post.comments.map(comment => comment.author.username + " - " + comment.body + " == ");
}

