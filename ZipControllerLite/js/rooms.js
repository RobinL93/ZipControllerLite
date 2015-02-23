(function () {
    "use strict";

    WinJS.UI.Pages.define("/rooms.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {


            // Produce a list of rooms with checkboxes
            var sRooms = "";
            // Create html
            $.each(rooms, function (i, room) {
                sRooms += "<label>"
                sRooms += "<input type='checkbox' id='check" + room.id + "' />"
                sRooms += room.name + "</label>"
            })

            // Add it
            $("#checkboxarea").html(sRooms);

            // Connect handlers
            var sLog = "";
            $.each(rooms, function (i, room) {
                var htmlobject = document.getElementById("check"+room.id);

                // First set currently stored value
                var sValue = false;
                if (appData.values.size > 0) {
                    if (appData.values["settings-room-" + room.id]) {
                        sValue = appData.values["settings-room-" + room.id];
                    }
                }
                htmlobject.checked = sValue;

                // Then connect event for change
                htmlobject.onchange = function () {
                    appData.values["settings-room-" + room.id] = htmlobject.checked;
                    goforrefreshnexttime = true;
                };
            })

            // And the same for title value
            var settingsheader = document.getElementById("settings-header");
            if (appData.values.size > 0) {
                if (appData.values["settings-username"]) {
                    settingsheader.value = appData.values["settings-header"];
                }
            }
            // Connect handler
            settingsheader.onchange = function () {
                appData.values["settings-header"] = settingsheader.value;
            };

            // Show room titles checkbox
            var settingsroomtitles = document.getElementById("settings-showroomtitles");
            if (appData.values.size > 0) {
                var sValue = "";
                if (appData.values["settings-showroomtitles"]) {
                    sValue = appData.values["settings-showroomtitles"];
                }
                settingsroomtitles.checked = sValue;
            }
            // Connect handler
            settingsroomtitles.onchange = function () {
                appData.values["settings-showroomtitles"] = settingsroomtitles.checked;
                goforrefreshnexttime = true;
            };

            // Show sensors checkbox
            var settingssensors = document.getElementById("settings-showsensors");
            if (appData.values.size > 0) {
                var sValue = "";
                if (appData.values["settings-showsensors"]) {
                    sValue = appData.values["settings-showsensors"];
                }
                settingssensors.checked = sValue;
            }
            // Connect handler
            settingssensors.onchange = function () {
                appData.values["settings-showsensors"] = settingssensors.checked;
                goforrefreshnexttime = true;
            };

            // Show roomless checkbox
            var settingsroomless = document.getElementById("settings-showroomless");
            if (appData.values.size > 0) {
                var sValue = "";
                if (appData.values["settings-showroomless"]) {
                    sValue = appData.values["settings-showroomless"];
                }
                settingsroomless.checked = sValue;
            }
            // Connect handler
            settingsroomless.onchange = function () {
                appData.values["settings-showroomless"] = settingsroomless.checked;
                goforrefreshnexttime = true;
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