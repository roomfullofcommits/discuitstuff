// ==UserScript==
// @name         Gallery Controls
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @updateURL    https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/gallerycontrols.user.js
// @downloadURL  https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/gallerycontrols.user.js
// @description  fuck off gallery controls!!
// @author       trying_to_be
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
.image-gallery-next-btn {
  right: calc(50% - 140px) !important;
  top: calc(100% - 30px) !important;
  padding: 30px 50px 0 30px !important;
  &.is-previous {
    left: calc(50% - 140px) !important;
    right: unset !important;
    padding: 30px 30px 0 50px !important;
  }
}`);
GM_addStyle(".image-gallery-images { padding-bottom: 35px; }");
