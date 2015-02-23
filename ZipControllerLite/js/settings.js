(function () {
    "use strict";

    var appData = Windows.Storage.ApplicationData.current.roamingSettings;

    WinJS.UI.Pages.define("/settings.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var settingsusername = document.getElementById("settings-username"),
                settingspassword = document.getElementById("settings-password"),
                settingsserial = document.getElementById("settings-serial"),
                settingsupdate = document.getElementById("settings-update");

            // Set settings to existing values
            if (appData.values.size > 0) {
                if (appData.values["settings-username"]) {
                    settingsusername.value = appData.values["settings-username"];
                }
                if (appData.values["settings-password"]) {
                    settingspassword.value = decryptString(appData.values["settings-password"]);
                }
                if (appData.values["settings-serial"]) {
                    settingsserial.value = appData.values["settings-serial"];
                }
                if (appData.values["settings-update"]) {
                    settingsupdate.value = appData.values["settings-update"];
                }
            }

            // Wire up on change events for settings controls
            settingsusername.onchange = function () {
                appData.values["settings-username"] = settingsusername.value;
            };
            settingspassword.onchange = function () {
                appData.values["settings-password"] = encryptString(settingspassword.value);
                //$("log").append("savepwd="+values["settings-password"]);
            };
            settingsserial.onchange = function () {
                appData.values["settings-serial"] = settingsserial.value;
            };
            settingsupdate.onchange = function () {
                appData.values["settings-update"] = settingsupdate.value;
            };
        },

        unload: function () {
            // Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            // Respond to changes in viewState.
        }
    });

})();