// ==UserScript==
// @name         RAMIS Session Patch
// @namespace    https://github.com/prashand/TamperRAMIS
// @version      1.0.0
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

    // Patch the sessionWarning function
    function patchSessionWarning() {
        if (!window.sessionWarning) {
            console.log("[RAMIS Monkey] sessionWarning not found yet, retrying...");
            setTimeout(patchSessionWarning, 5000); // try again in 5s
            return;
        }

        const original = window.sessionWarning;

        window.sessionWarning = function() {
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