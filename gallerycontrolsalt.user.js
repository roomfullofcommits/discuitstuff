// ==UserScript==
// @name         Transparent Gallery Controls
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @updateURL    https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/gallerycontrolsalt.user.js
// @downloadURL  https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/gallerycontrolsalt.user.js
// @description  flip through gallaries by clicking the right and left 20% of the image
// @author       trying_to_be
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
.image-gallery-next-btn {
  height: 100%;
  width: 20%;
  padding: 0 !important;
  background: linear-gradient(to right, transparent, black);
  opacity: 50%;
  svg { display: none }
  &.is-previous {
    background: linear-gradient(to left, transparent, black);
  }
}
`);
