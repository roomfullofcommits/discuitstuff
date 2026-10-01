// ==UserScript==
// @name         Smaller new Comment
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/smallernewcomment.user.js
// @downloadURL  https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/smallernewcomment.user.js
// @description  for less awkward screenshots
// @author       trying_to_be
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(".post-comments-title { display:none !important; }");
GM_addStyle(".post-comments-new { margin-top: 10px; &:not(:has(.post-comments-new-buttons)) textarea { height: 48px !important; min-height: 0; }}");
GM_addStyle(".button-with-icon span { align-self: end; } ");
GM_addStyle(".post-card-bottom.is-t { margin-bottom: -49px }");
GM_addStyle(".post-card-bottom.has-no-img .left { flex-flow: row-reverse; }");
GM_addStyle(".post-card-vote-percent { display: none; }");
