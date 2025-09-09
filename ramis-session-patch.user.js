// ==UserScript==
// @name         RAMIS Session Patch
// @namespace    https://github.com/prashand/TamperRAMIS
// @version      1.0.7
// @description  Auto-patch RAMIS sessionWarning to ping server once, hide dialog, and avoid keeping user logged in forever
// @match        https://eservices.ird.gov.lk/*
// @match        https://www.eservices.ird.gov.lk/*
// @grant        none
// @run-at       document-idle
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
    *      sessionWarning: function()          // shows the session expiry dialog, patched by this script to auto-ping and suppress dialog
    *      resetSessionTimer: function()       // resets the sessionTimeoutWarningTimer (sets a new timer to call sessionWarning in sessionTimeoutWarning mins)
    * }
*
* document.ajaxComplete: function()        // calls window.utility.resetSessionTimer
*
*/
(function() {
    'use strict';

    const version = "1.0.7";

    const EXTEND_HRS = 6;
    const HEARTBEAT_METHOD = true; // set to true to try heartbeat method instead of patching sessionWarning

    let setUpHeartbeat = function() {
        /**
         * Use heartbeats to keep session alive
        */

        console.log("[RAMIS Monkey] Setting up heartbeat to keep session alive...");

        let heartbeat_interval = 10 * 60 * 1000; // 10 minutes
        let heartbeat_count = (EXTEND_HRS * 60) / 10; // Number of heartbeats in EXTEND_HRS hours

        let heartbeat = setInterval(() => {
            if (heartbeat_count > 0) {
                console.log(`[RAMIS Monkey] Heartbeat ping ${heartbeat_count} to keep session alive...`);
                $.get(window.keepSessionAlive);
                heartbeat_count--;
                } else {
                    console.log("[RAMIS Monkey] Maximum heartbeats reached. Stopping heartbeats.");
                    clearInterval(heartbeat);
                }
            }, heartbeat_interval);
    }

    let patchSessionWarning = function patchSessionWarning() {
        /**
         * Patch utility.sessionWarning() to auto-ping the server and suppress its default behavior (show session exp warning dialog)
         * to keep the session alive.
         * utility.sessionWarning() is called by the timer set in sessionTimeoutWarningTimer
        */

        console.log("[RAMIS Monkey] Patching up sessionWarning...");

        const PATCH_RETRY_LIMIT = 30;
        let patch_retry_count = 0;
        let extensions = 0;

        if (patch_retry_count >= PATCH_RETRY_LIMIT) {
            console.error("[RAMIS Monkey] Failed to find utility or timer after multiple attempts. Aborting patch.");
            return;
        }

        if (!window.utility) {
            // Check if the utility object is available and retry if not
            console.log("[RAMIS Monkey] Utility not found yet, retrying...");
            setTimeout(patchSessionWarning, 1000);
            patch_retry_count++;
            return;
        }

        // Cancel the initial timeout set by RAMIS with the unpatched sessionWarning function after sessionTimeoutWarning minutes
        if (!window.sessionTimeoutWarningTimer) {
            console.log("[RAMIS Monkey] sessionTimeoutWarningTimer not found yet, retrying...");
            setTimeout(patchSessionWarning, 1000);
            patch_retry_count++;
            return;
        }
        clearTimeout(window.sessionTimeoutWarningTimer);
        console.log("[RAMIS Monkey] Cleared initial sessionTimeoutWarningTimer");

        // Patch the sessionWarning function
        window.utility.sessionWarning = function() {
            if (extensions < (EXTEND_HRS-1)*3 + 2) { // 2 pings in the first hour, then 3 pings per hour for next (extend_hrs-1) hours
                console.log("[RAMIS Monkey] Auto-pinging server to extend session...");
                // Ping to keep alive: Ajax response handler calls resetSessionTimer, setting a new 20-min timer
                // No need to call resetSessionTimer() here
                let ping = $.get(window.keepSessionAlive);
                extensions++;
                if (ping == true) {
                    console.log(`Ping response: ${ping}`);
                } else {
                    console.warn(`Ping response: ${ping}`);
                }
                console.log("[RAMIS Monkey] Session extension count: " + (extensions));
            } else {
                console.log("[RAMIS Monkey] Maximum session extensions reached. Not pinging further.");
            }
        };

        // Start the first timer to call the patched sessionWarning function since the original timer was cleared
        window.utility.resetSessionTimer();

        console.log("[RAMIS Monkey] sessionWarning patched successfully");
    };

    console.log(`[RAMIS Monkey] ${version} Initializing...`);
    if (
        window.location.pathname == "/Authentication/LoginEntry"
        || window.location.pathname == "/Authentication/LoginPersonal"
        || window.location.pathname == "/Authentication/LoginForCompany"
        || window.location.pathname == "/Authentication/LoginForClient"
    ) {
        console.log("[RAMIS Monkey] Not logged in, not patching session management.");
        return;
    }

    if (HEARTBEAT_METHOD) {
        setUpHeartbeat();
    } else {
        patchSessionWarning();
    }

})();