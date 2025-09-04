// ==UserScript==
// @name         RAMIS Session Patch
// @namespace    https://github.com/prashand/TamperRAMIS
// @version      1.0.2
// @description  Auto-patch RAMIS sessionWarning to ping server once, hide dialog, and avoid keeping user logged in forever
// @match        https://eservices.ird.gov.lk/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/prashand/TamperRAMIS/main/ramis-session-patch.user.js
// @downloadURL  https://raw.githubusercontent.com/prashand/TamperRAMIS/main/ramis-session-patch.user.js
// ==/UserScript==

(function() {
    'use strict';

    console.log("[RAMIS Monkey] Initializing...");

    let extended = false;

    function patchSessionWarning() {
        // Check if the object and function exist
        if (!window.utility || !window.utility.sessionWarning) {
            console.log("[RAMIS Monkey] sessionWarning not found yet, retrying...");
            setTimeout(patchSessionWarning, 500);
            return;
        }

        const original = window.utility.sessionWarning;

        window.utility.sessionWarning = function() {
            if (!extended) {
                console.log("[RAMIS Monkey] Auto-pinging server to extend session (~1 hour max)...");
                $.get(window.keepSessionAlive);
                extended = true;
            } else {
                console.log("[RAMIS Monkey] Session already extended once — ignoring further warnings");
            }
            // Do NOT call the original dialog
        };

        console.log("[RAMIS Monkey] sessionWarning patched successfully");
    }

    patchSessionWarning();
})();