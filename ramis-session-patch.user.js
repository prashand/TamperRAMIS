// ==UserScript==
// @name         RAMIS Session Patch
// @namespace    https://github.com/prashand/TamperRAMIS
// @version      1.0.3
// @description  Auto-patch RAMIS sessionWarning to ping server once, hide dialog, and avoid keeping user logged in forever
// @match        https://eservices.ird.gov.lk/*
// @grant        none
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/prashand/TamperRAMIS/main/ramis-session-patch.user.js
// @downloadURL  https://raw.githubusercontent.com/prashand/TamperRAMIS/main/ramis-session-patch.user.js
// ==/UserScript==

/**
 * 
 * window.sessionTimeout = 30;                  // 30 minutes until session expires
 * window.sessionTimeoutWarning = 20;           // 20 minutes until warning dialog shows
 * window.sessionTimeoutWarningTimer;           // the timer that triggers the warning dialog
 * window.keepSessionAlive = "/path/to/ping";   // the URL to ping to keep the session alive
 * 
 * window.utility = {
 *      sessionWarning: function()          // shows the session expiry dialog
 *      resetSessionTimer: function()       // resets the sessionTimeoutWarningTimer
 * }
 * 
 * document.ajaxComplete: function()        // calls window.utility.resetSessionTimer
 * 
 */

(function() {
    'use strict';

    console.log("[RAMIS Monkey] Initializing...");

    let extended = false;

    (function patchSessionWarning() {

        if (!window.utility) {
            // Check if the utility object is available and retry if not
            console.log("[RAMIS Monkey] utility not found yet, retrying...");
            setTimeout(patchSessionWarning, 1000);
            return;
        }

        // They set this var to 20, meaning trigger the session expiry dialog after 20 minutes of inactivity
        // We set it to undefined so that window.resetSessionTimer doesn't set a new sessionTimeoutWarningTimer
        // on ajaxComplete
        // if (!window.sessionTimeoutWarning) {
        //     console.log("[RAMIS Monkey] sessionTimeoutWarning not found yet, retrying...");
        //     setTimeout(patchSessionWarning, 1000);
        //     return;
        // }
        // window.sessionTimeoutWarning = undefined;
        
        // Cancel the initial timeout set by RAMIS with the unpatched sessionWarning function
        if (!window.sessionTimeoutWarningTimer) {
            setTimeout(patchSessionWarning, 1000);
            console.log("[RAMIS Monkey] sessionTimeoutWarningTimer not found yet, retrying...");
            return;
        }
        clearTimeout(window.sessionTimeoutWarningTimer);
        console.log("[RAMIS Monkey] Cleared initial sessionTimeoutWarningTimer");

        // Patch the sessionWarning function to auto-ping the server once and suppress its default behavior
        // (which is to show a dialog asking the user to extend their session). utility.sessionWarning is 
        // called by the timeout set in sessionTimeoutWarningTimer
        window.utility.sessionWarning = function() {
            if (!extended) {
                console.log("[RAMIS Monkey] Auto-pinging server to extend session (~1 hour max)...");
                $.get(window.keepSessionAlive);
                extended = true;
            } else {
                console.log("[RAMIS Monkey] Session already extended once — ignoring further expirations");
            }
            // Do NOT call the original dialog
        };

        console.log("[RAMIS Monkey] sessionWarning patched successfully");
    })();
})();