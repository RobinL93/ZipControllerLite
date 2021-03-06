﻿// When page has loaded / is ready
$(function () {

    applyJQueryBindings();
    window.addEventListener("resize", handleResize);


    // hide elements
    $("#buttonholder").hide();
    $("#endpointstable").hide();
    $("#hintcredentials").hide();
    $("#offline").hide();
    $("#warnings").hide();
    $("#irContainer").hide();


    // When we click  on colorwheel div, open the controller
    $("#colorWheelDiv").on("click", function () {
        $("#irContainer").slideToggle(800, "easeOutSine");
    });

    // call some functions when page has loaded
    hideProgress();
    updateAgo();
    doRefresh();

    // eventlisteners for #buttonholder
    $("#buttonholder").on("click", function (e) {
        var id = e.target.id;
        if (id === "refresh") {
            doRefresh();
        } else if (id === "hardRefresh") {
            location.reload(true);
        } else if (id === "settings") {
            showSettings();
        } else if (id === "roomSettings") {
            showRoomSettings();
        }

    });

    // toggle (hide/show) sectionheads
    $(".sectionhead").on("click", function () {
        $(this).next().fadeToggle(600);
    });

});

/* Global Variables */
var updating = false;
var timeoutlapse = 4000;
refreshCounter = 0;
var refreshMax = 100;
var lastSync = null;
var rooms = null;
var showRoomTitles = true;
var showSensors = false;
var showRoomLess = false;
var showAllBattery = false;
var showOnlineWallPlugs = false;
var appWidth = window.outerWidth;
var appHeight = window.outerHeight;
var appData = Windows.Storage.ApplicationData.current.roamingSettings;
var maxSwitches = 8;
var goforrefreshnexttime = false;
var attributeData = null;

// object for the alarm sound
var audio = {};
audio["alarm"] = new Audio();
audio["alarm"].src = "sound/alarm.wav";

$.ajaxSetup({
    async: false,
    cache: false
});


// Encrption from: http://www.javascriptsource.com/passwords/ascii-encryption-882331.html
function encryptString(uncoded) {
    var theText = uncoded;
    output = new String;
    Temp = new Array();
    Temp2 = new Array();
    TextSize = theText.length;
    for (i = 0; i < TextSize; i++) {
        rnd = Math.round(Math.random() * 122) + 68;
        Temp[i] = theText.charCodeAt(i) + rnd;
        Temp2[i] = rnd;
    }
    for (i = 0; i < TextSize; i++) {
        output += String.fromCharCode(Temp[i], Temp2[i]);
    }
    return output;
}

function decryptString(coded) {
    output = new String;
    try {
        var theText = coded;
        Temp = new Array();
        Temp2 = new Array();
        TextSize = theText.length;
        for (i = 0; i < TextSize; i++) {
            Temp[i] = theText.charCodeAt(i);
            Temp2[i] = theText.charCodeAt(i + 1);
        }
        for (i = 0; i < TextSize; i = i + 2) {
            output += String.fromCharCode(Temp[i] - Temp2[i]);
        }
    } catch (e) {
        output = "";
    }
    return output;
}

// Logging in to zipatobox
function loginToBox() {
    var url = "http://my.zipato.com:8080/zipato-web/json/Initialize";
    var sREs = "ERROR";

    // get settings from appData object
    var username = appData.values["settings-username"];
    var password = decryptString(appData.values["settings-password"]);
    var serial = appData.values["settings-serial"];
    if (serial == "undefined" || serial == null) {
        serial = "";
    }

    // Get the time from settings, that we will use to update atom8ic
    timeoutlapse = appData.values["settings-update"];
    timeoutlapse = parseInt(timeoutlapse) * 1000;

    headerText = appData.values["settings-header"];

    showRoomTitles = appData.values["settings-showroomtitles"];
    showSensors = appData.values["settings-showsensors"];
    showRoomLess = appData.values["settings-showroomless"];
    showAllBattery = appData.values["settings-showallbattery"];
    showOnlineWallPlugs = appData.values["settings-showWallPlugOnline"];

    $("#headerText").text(headerText);


    $.ajax({
        type: "GET",
        url: url,
        async: false,
        cache: false,

        // if request was successful:
        success: function (data) {
            var nonce = data.nonce;
            var token = SHA1(nonce + SHA1(password));

            var loginURL = "https://my.zipato.com:443/zipato-web/v2/user/login?username=" + username + "&token=" + token;
            // If a serial is entered, then add it to loginURL
            if (!(serial === "")) {
                loginURL += "&serial=" + serial;
            }

            sRes = "unknownuser";

            try {
                // Try to make a request on loginURL
                $.ajax({
                    type: "GET",
                    url: loginURL,
                    async: false,
                    cache: false,

                    success: function (data) {
                        if (data.success) {
                            sRes = "OK";        // Logged in, set sRes to "OK"
                        } else {
                            sRes = "unknownuser";
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        sRes = "unknownuser";   // Not success, set sRes to "unknownuser"
                    }


                });
            } catch (err) {
                sRes = "unknownuser";
            }

        }

    });

    return sRes;

} // end of loginToBox();


// Converting room id to the name of that room
function getRoomNameFromId(roomcode) {
    var sResult = "";
    // Loop trough each room and check if we found an id that is equals to param roomcode
    $.each(rooms, function (i, room) {
        if (room.id === roomcode) {
            sResult = room.name;       // Store the rooms name in sResult if we found its id that's equal to roomcode
        }
    });
    return sResult;
}

// html code for remote controller
function remoteControllerHtml() {
    var htmlCode = '<div id="redDiv"><a href="#" id="red1" class="cButton">R</a><a href="#" id="red2" class="cButton"></a><a href="#" id="red3" class="cButton"></a><a href="#" id="red4" class="cButton"></a><a href="#" id="red5" class="cButton"></a></div>';
    htmlCode += '<div id="greenDiv"><a href="#" id="green1" class="cButton">G</a><a href="#" id="green2" class="cButton"></a><a href="#" id="green3" class="cButton"></a><a href="#" id="green4" class="cButton"></a><a href="#" id="green5" class="cButton"></a></div>';
    htmlCode += '<div id="blueDiv"><a href="#" id="blue1" class="cButton">B</a><a href="#" id="blue2" class="cButton"></a><a href="#" id="blue3" class="cButton"></a><a href="#" id="blue4" class="cButton"></a><a href="#" id="blue5" class="cButton"></a></div>';
    htmlCode += '<div id="whiteDiv"><a href="#" id="white1" class="cButton">W</a><a href="#" id="white2" class="cButton">Flash</a><a href="#" id="white3" class="cButton">Strobe</a><a href="#" id="white4" class="cButton">Fade</a><a href="#" id="white5" class="cButton">Smooth</a></div>';
    return htmlCode;
}


function getTempAdjusted(inTemp) {
    var fTemp = parseFloat(inTemp);
    if (fTemp >= 6000) {
        fTemp = 10 * fTemp - 65536;
        fTemp = fTemp / 10;
        inTemp = fTemp;
    }

    return inTemp;
}

// getting the time between now and last sync
function getTimeSinceLastRead() {
    if (lastSync == null) {
        return "";
    } else {
        var date = Date.now();
        return timeDifference(date, lastSync);
    }
}

// Getting the time between now and given value
function getReadingAgo(stringValue) {
    var dateStr = stringValue;
    var sTime = new Date(dateStr);
    return timeDifference(Date.now(), sTime);
}

// Add control
function addOrChangeControl(elementid, htmlCode, sRoomTitle) {
    return htmlCode;
}

// get rooms title within parenthesis
function getRoomTitle(sRoomTitle) {
    var sResult = "";
    if (showRoomTitles) {
        if (sRoomTitle !== "") {
            sResult = " (" + sRoomTitle + ")";
        }
    }
    return sResult;
}

// Add On/Off controll
function addOrChangeOnOffControl(uuid, title, value, sRoomTitle, devUiid) {

    // $("#log").append("title: " + title + ", value: " + value + " <br/>");
    // Add the element        
    var roomtitle = getRoomTitle(sRoomTitle);

    var sConFalse = "<img class='connectorIcon' src='images/icons/con_false.png'/>";
    var sConTrue = "";
    if (showOnlineWallPlugs) {
        sConTrue = "<img class='connectorIcon' src='images/icons/con_true.png'/>";
    } else {
        sConTrue = "<img class='connectorIcon' src=''/>";
    }

    var dOffline = isDeviceOffline(devUiid);

    var controlHtml = "";

    if (dOffline == "OFFLINE") {
        controlHtml = sConFalse + "<div id='" + uuid + "' class='switchtoggle' data-win-control='WinJS.UI.ToggleSwitch' data-win-options='{title: \"" + title + roomtitle + " \", checked: " + value + "}'></div><br/>";
    } else {
        controlHtml = sConTrue + "<div id='" + uuid + "' class='switchtoggle' data-win-control='WinJS.UI.ToggleSwitch' data-win-options='{title: \"" + title + roomtitle + " \", checked: " + value + "}'></div><br/>";
    }



    return controlHtml;

}

// Add remote controller
function addRemoteController(uuid) {

    var controlHtml = "<div id='" + uuid + "' class='ircolors'>" + remoteControllerHtml() + "<div><br/>";
    return controlHtml;

}

// Add dimmer control
function addOrChangeDimmerControl(uuid, title, value, sRoomTitle) {
    var roomTitle = getRoomTitle(sRoomTitle);

    var controlHtml = "<label>" + title + roomTitle + "<br/><input style='width: 140px' class='.dimmer' id='" + uuid + "' type='range' value='" + value + "' /> </label>";
    return controlHtml;

}

// get the color for the temp value
function getTempColor(value) {
    var sRes = "white";
    var iValue = parseFloat(value);


    if (iValue >= 35) {
        sRes = "#EF0F06";
    } else if (iValue >= 27) {
        sRes = "#E6940F";
    } else if (iValue >= 22) {
        sRes = "#ABCD23";
    } else if (iValue >= 15) {
        sRes = "#CCE566";
    } else if (iValue >= 10) {
        sRes = "#73E265";
    } else if (iValue >= 3) {
        sRes = "#C9F4C3";
    } else if (iValue >= -5) {
        sRes = "#E8EEF8";
    } else if (iValue >= -10) {
        sRes = "#B5C9E8";
    } else if (iValue >= -20) {
        sRes = "#6F95D3";
    }

    return sRes;
}


// function to check if we showing the room with the devices/hiding the room with devices
// If a device don't have a room, then it gets value true/false(show/hide device) from var showRoomLess(that depends on if we checked the checkbox)
function isRoomToBeShown(roomcode) {
    var sValue = false;
    // If device don't have room, it's returning "0" or undefined
    if ((roomcode === "0") || (roomcode === undefined)) {
        // then we get the true / false value from showroomless devices
        sValue = showRoomLess;
    } else {
        // else, we check if that room is checkedor not
        sValue = appData.values["settings-room-" + roomcode];
    }

    return sValue;
}

// Checking if a device is offline
function isDeviceOffline(deviceuuid) {
    var url = "https://my.zipato.com:443/zipato-web/v2/devices/" + deviceuuid + "/status";
    var sOnlineState = "";
    $.ajax({
        type: "GET",
        url: url,
        async: false,
        cache: false,
        success: function (data) {
            sOnlineState = data.onlineState;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            sOnlineState = "Error";
        }
    });

    return sOnlineState;
}

// Get battery level
function getBatteryLevel(deviceuuid) {
    var url = "https://my.zipato.com:443/zipato-web/v2/devices/" + deviceuuid + "/status";
    var iBatteryLevel = 0;

    // Ajax request to get battery level
    $.ajax({
        type: "GET",
        url: url,
        async: false,
        cache: false,
        success: function (data) {
            iBatteryLevel = data.batteryLevel;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            iBatteryLevel = -1;
        }
    });

    return iBatteryLevel;
}

// Get the icon for the battery status
function getBatteryStatus(batteryLevel, name) {

    var sImg = "";
    if (batteryLevel >= 76) {
        if (showAllBattery) {
            sImg = "<img class='batteryIcon' src='images/icons/bat_100.png'/>";
        }
    } else if (batteryLevel >= 51) {
        if (showAllBattery) {
            sImg = "<img class='batteryIcon' src='images/icons/bat_75.png'/>";
        }
    } else if (batteryLevel >= 26) {
        if (showAllBattery) {
            sImg = "<img class='batteryIcon' src='images/icons/bat_50.png'/>";
        }
    } else if (batteryLevel >= 1) {
        if (showAllBattery) {
            sImg = "<img class='batteryIcon' src='images/icons/bat_25.png'/>";
        }
    } else {
        sImg = "<img id='warningId' class='batteryIcon blinking' src='images/icons/warning.png'/>";
        setInterval(function () {
            playAlarmSound();
        }, 300000);
    }

    return sImg;
}

// get rooms via api and store in rooms variable
function getRoomsList() {
    var url = "https://my.zipato.com:443/zipato-web/v2/rooms/";
    var sRes = false;

    try {
        $.ajax({
            type: "GET",
            url: url,
            async: false,
            cache: false,
            success: function (data) {
                try {
                    rooms = data;   // collect the data and store it in rooms
                    sRes = true;
                } catch (err) {
                    sRes = false;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                sRes = false;
            }
        });

    } catch (err) {
        sRes = false;
    }

    return sRes;
}

// get attributes data via API and store it in a variable so we can use it later
function getAttributeData() {
    var sRes = false;
    var url = "https://my.zipato.com:443/zipato-web/v2/attributes/full?network=true&device=true&endpoint=true&clusterEndpoint=true&definition=true&config=true&room=true&icons=true&value=true&parent=true&children=true&full=true&type=true";


    $.ajax({
        type: "GET",
        url: url,
        cache: false,
        async: false,
        success: function (data) {
            attributeData = data;   // Store the data from the request in attributeData variable
            sRes = true
        },
        error: function (xhr, ajaxOptions, thrownError) {
            sRes = false;
        }
    });

    lastSync = Date.now();
    return sRes;
}

var switchcolumnheight = maxSwitches;

function caclulatePanelLayout() {
    var data = attributeData;
    var iTempMeters = 0;
    var iLightMeters = 0;
    var iOnOffers = 0;
    var iDimmers = 0;

    $.each(data, function (i, obj) {
        try {
            sRoom = "";
            try {
                sRoom = obj.clusterEndpoint.room;
            } catch (err) {
                // Obj has no room, let it live anyway to be managed by settings
                sRoom = "0";
            }
            if (isRoomToBeShown(sRoom)) {
                var sRoomName = getRoomNameFromId(sRoom);

                if ((obj.clusterEndpoint.name.toLowerCase().indexOf("off")) != -1 || (obj.clusterEndpoint.name.toLowerCase().indexOf("switch") != -1)) {
                    iOnOffers++;
                } else if (obj.clusterEndpoint.name.toLowerCase().indexOf("wall") != -1) {
                    iOnOffers++;
                } else if (obj.clusterEndpoint.name.toLowerCase.indexOf("dimmer") != -1) {
                    iDimmers++;
                } else if (obj.uiType.endpointType.toLowerCase().indexOf("temp") != -1) {
                    iTempMeters++;
                } else if (showSensors && (obj.uiType.endpointType.toLowerCase().indexOf("light") != -1)) {
                    iLightMeters++;
                }

            }

        } catch (err) {

        }
    });

    // Set how many switchcolumns, depepnding on width
    /*
    var numberOfColumns = Math.round(appWidth / 250);
    var my_maxswitches = Math.round((appHeight - 200) / 60) - 2;

    if (showSensors) {
        numberOfColumns--;
    }

    switchcolumnheight = Math.round(iOnOffers / numberOfColumns);

    while (appHeight / switchcolumnheight > 200) {
        numberOfColumns--;
        switchcolumnheight = Math.round(iOnOffers / numberOfColumns);
    }
    */
}

// update the panel, adding controllers and things to the screen
function updatePanel() {
    // Variables
    var data = attributeData;
    var sTempMeters = "";
    var iTempMeters = 0;
    var sLightMeters = "";
    var iLightMeters = 0;
    var sOnOffers = "<div class='section'>";
    var iOnOffers = 0;
    var sDimmers = "";
    var sIrColors = "";
    var sColorController = "";
    var sDoorWindowSensor = "";
    $("#warning").empty();
    $("#warnings").hide();
    var goforrefreshnexttime = false;
    // empty all the content
    $("#temps").empty();
    $("#lums").empty();
    $("#onoffs").empty();
    $("#doorWindowSensor").empty();

    sRes = true;

    // Adding content
    $.each(data, function (i, obj) {

        sRes = true;
        try {
            sRoom = "";
            try {
                sRoom = obj.clusterEndpoint.room;
            } catch (err) {
                sRoom = 0;
            }

            if (isRoomToBeShown(sRoom)) {
                var sRoomName = getRoomNameFromId(sRoom);

                // Adding the ir sensor (remote controller)
                if (obj.clusterEndpoint.name.toLowerCase().indexOf("infra") != -1) {
                    sColorController += "<div id='colorWheel'></div>";
                    sIrColors += addRemoteController(obj.uuid);
                }

                else if ((obj.device.name.toLowerCase().indexOf("water") != -1) || (obj.device.name.toLowerCase().indexOf("flood") != -1)) {
                    var sValue = obj.value.value;
                    var sAgo = getReadingAgo(obj.value.timestamp);
                    var sName = obj.clusterEndpoint.name;
                    var sGuide = obj.clusterEndpoint.description;
                    if (sGuide.indexOf("guide:") != -1) {
                        // If there is a guide, show it.
                        sGuide = sGuide.replace("guide:", "");
                    } else {
                        sGuide = "";
                    }

                    var sHtml = "<p id='" + obj.uuid + "' class='leak'>" + sName + " " + sValue + " " + sAgo + "</p>";
                    if (showSensors) {
                        sLightMeters += addOrChangeControl(obj.uuid, sHtml, sRoomName);
                    }

                    if ((obj.value.value === true) || (obj.value.value) === "true") {
                        // There is leak, so show the warning
                        issueWarning(sName, sGuide);
                    }
                } else if ((obj.clusterEndpoint.name.toLowerCase().indexOf("off") != -1) || (obj.clusterEndpoint.name.toLowerCase().indexOf("switch") != -1)) {
                    sOnOffers += addOrChangeOnOffControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName, obj.device.uuid);
                    iOnOffers++;
                    if (iOnOffers >= switchcolumnheight) {
                        sOnOffers += "</div><div class='section'>";
                        iOnOffers = 0;
                    }
                } else if (obj.clusterEndpoint.name.toLowerCase().indexOf("wall") != -1) {
                    sOnOffers += addOrChangeOnOffControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName, obj.device.uuid);
                    iOnOffers++;

                    if (iOnOffers >= switchcolumnheight) {
                        sOnOffers += "</div><div class='section'>";
                        iOnOffers = 0;
                    }

                } else if (obj.clusterEndpoint.name.toLowerCase().indexOf("dimmer") != -1) {
                    sDimmers += addOrChangeDimmerControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName);
                } else if (obj.uiType.endpointType.toLowerCase().indexOf("temp") != -1) {
                    var sValue = getTempAdjusted(obj.value.value);
                    var sAgo = getReadingAgo(obj.value.timestamp);
                    var sUnit = obj.config.unit;
                    var sName = obj.endpoint.name;
                    var batteryLevel = getBatteryLevel(obj.device.uuid);

                    var sHtml = "<div id='" + obj.uuid + "' class='tempholder'><div class='batteryIconHolder'>" + getBatteryStatus(batteryLevel, sName) + "</div><div class='tempfigure'><font color='" + getTempColor(sValue) + "' size='40px'>" + sValue + " " + sUnit + "</font></div><div class='agotext'>" + sName + " " + sAgo + "</div></div>";

                    sTempMeters += addOrChangeControl(obj.uuid, sHtml, sRoomName, batteryLevel);


                } else if (showSensors && (obj.uiType.endpointType.toLowerCase().indexOf("light") != -1)) {
                    var sValue = getTempAdjusted(obj.value.value);
                    var sAgo = getReadingAgo(obj.value.timestamp);
                    var sUnit = obj.config.unit;
                    var sName = obj.endpoint.name;

                    var sHtml = "<p id='" + obj.uuid + "' class='light'>" + sName + " " + sValue + " " + sUnit + " " + sAgo + "</p>";
                    sLightMeters += addOrChangeControl(obj.uuid, sHtml, sRoomName);
                } else if (obj.clusterEndpoint.name.toLowerCase().indexOf("door") != -1) {

                    var sDoorSensorImage = "";
                    if (obj.value.value === "true") {
                        // It's true, so door/window is open. Add the door open image
                        sDoorSensorImage = "<img class='doorWindowImg' src='images/dooropen.png'/>";
                    } else {
                        // it's false, so it's closed. Add the door closed image.
                        sDoorSensorImage = "<img class='doorWindowImg' src='images/doorclosed.png'/>";
                    }


                    sHtml = "<div id=" + obj.uuid + " class='doorWindowDiv'><div>" + obj.endpoint.name + "</div>" + sDoorSensorImage + "</div>";
                    sDoorWindowSensor += addOrChangeControl(obj.uuid, sHtml, sRoomName);

                }

            } else {
                $("#" + obj.uuid).remove();
            }


        } catch (err) {

        }


    });

    // Appending controllers
    $("#temps").append(sTempMeters);
    $("#lums").append(sLightMeters);
    $("#onoffs").append(sOnOffers + "</div>" + sDimmers);
    $("#irContainer").append(sIrColors);
    $("#colorWheelDiv").append(sColorController);
    $("#doorWindowSensor").append(sDoorWindowSensor);
    if (!showSensors) {
        $("#sensorcolumn").hide();
    } else {
        $("#sensorcolumn").show();
    }


    updating = false;

    return sRes;
}


function syncWithBox() {
    var sRes = getRoomsList();
    if (sRes) {
        sRes = getAttributeData();
    }

    if (sRes) {
        try {
            caclulatePanelLayout();
            updatePanel();
        } catch (e) {
            sRes = false;
        }
    }


    return sRes;
}


// Set attribute value, call it when we want to change a value (ex: on to off)
function setAttribValue(uuid, state) {
    clearTimeout(refreshTimer);
    showProgress();
    // calling the doSetAttribValue that's doaing all the work
    setTimeout("doSetAttribValue ('" + uuid + "', " + state + ", false);", 300);
}

// Send ajax request to set the value
function doSetAttribValue(uuid, state, login) {
    var sRes = false;
    var sLoginResult = "OK";
    var doRefreshFlag = true;
    login = true;
    if (login) {
        sLoginResult = loginToBox();
    }

    if (!(sLoginResult === "OK")) {
        sLoginResult = loginToBox();
    }

    if (sLoginResult === "OK") {
        var url = "https://my.zipato.com:443/zipato-web/v2/attributes/" + uuid + "/value";

        $.ajax({
            type: "PUT",
            data: '{ "value": "' + state + '"}',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            url: url,
            async: false,
            cache: false,
            success: function (data) {
                sRes = true;
                hideProgress();
                WinJS.UI.processAll();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                sRes = false;
                doRefreshFlag = false;
            }
        });
        hideProgress();
    }


    return sRes;

}

// Waiting for events, calls setAttribValue() to set the value
function applyJQueryBindings() {

    $("#irContainer").on("click", ".cButton", function () {
        var uuid = $(".ircolors").attr('id');

        var id = this.id;
        var value = getIrValue(id);
        setAttribValue(uuid, value);
    });

    $("#clock").on("click", function () {
        $("#buttonholder").show();
        setTimeout('$("#buttonholder").hide();', 5000);
    });


    $(".switchtoggle").on("click", function () {
        if (!updating) {
            var uuid = $(this).attr("id");
            var state = document.getElementById($(this).attr("id")).winControl.checked;
            setAttribValue(uuid, state);
        } else {
            // code here
        }
    });

    $(".dimmer").on("click", function () {
        if (!updating) {
            var uuid = $(this).attr("id");
            var value = $(this).val();
            setAttribValue(uuid, value);
        } else {
            // code here
        }
    });

}


function handleResize(eventArgs) {
    appWidth = eventArgs.outerWidth;
    appHeight = eventArgs.outerHeight;
    maxSwitches = Math.round((appHeight - 200) / 60);
    try {
        caclulatePanelLayout();
        updatePanel();
        doRefresh();
    } catch (e) {

    }
}

function actualRefresh() {
    var sRes = false;
    var sBoxRes = loginToBox();
    if (sBoxRes === "unknownuser") {
        $("#hintcredentials").show();
        initiateRefresh();
    }
    if (sBoxRes === "ERROR") {
        $("#offline").show();
        showProgress();
        setTimeout("location.reload();", 30000);
    }
    if (!(sBoxRes === "OK")) {
        sBoxRes = loginToBox();
    }
    if (sBoxRes === "OK") {

        $("#offline").hide();
        $("#hintcredentials").hide();

        sRes = syncWithBox();
        if (!sRes) {
            sBoxRes = loginToBox();
            sRes = syncWithBox();
            $("#hintcredentials").show();
        }
        if (sRes) {
            WinJS.UI.processAll();
            applyJQueryBindings();
            $("#endpointstable").show();
            initiateRefresh();
        }

    }
    hideProgress();
}

var actualRefreshTimer = null;

function doRefresh() {
    clearTimeout(refreshTimer);
    clearTimeout(actualRefreshTimer);
    showProgress();
    refreshCounter++;
    updating = true;
    if (refreshCounter >= refreshMax) {
        location.reload();
    } else {
        actualRefreshTimer = setTimeout("actualRefresh();", 100);
    }
}

var refreshTimer = null;

function initiateRefresh() {
    var i_timeoutlapse = parseFloat(timeoutlapse);
    if (i_timeoutlapse <= 5000) {
        timeoutlapse = "5000";
    }
    refreshTimer = setTimeout("doRefresh();", timeoutlapse);

}

function issueWarning(deviceName, sGuide) {
    $("#warnings").show();
    $("#warning").append("<p>Sensor " + deviceName + " indicates an issue. <a class='guide' href='" + sGuide + "'> Tap here for a guide on how to resolve it.</a></p>");
    var audio = {};
    audio["walk"] = new Audio();
    audio["walk"].src = "sound/alarm.wav";
    audio["walk"].addEventListener('load', function () {
        audio["walk"].play();
    });
}

// showing the loading ring
function showProgress() {
    $("#loading-ring").show();
    WinJS.UI.processAll();
}

// hiding the loading ring
function hideProgress() {
    $("#loading-ring").hide();
    WinJS.UI.processAll();
}

// show settings in a flyout view
function showSettings() {
    WinJS.UI.SettingsFlyout.showSettings("settingsDiv", "settings.html");
}

// show room settings in a flyout view
function showRoomSettings() {
    WinJS.UI.SettingsFlyout.showSettings("roomsDiv", "rooms.html")
}

// If clock is less than 10, add a 0 infront of it. ex: 9:26 will be 09:26
function checkTime(i) {

    if (i < 10) {
        i = "0" + i;
    }

    return i;
}

// setting text to show ex: "Updated 10 seconds ago", also setting the clock. 
// When this function runs for the first time, it will call itself every 1 second.
function updateAgo() {
    $("#agolabel").text("Updated " + getTimeSinceLastRead());

    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    h = checkTime(h);
    m = checkTime(m);

    var clockString = h + ":" + m;
    $("#clock").html(clockString);
    setTimeout("updateAgo();", 1000);
}


function playAlarmSound() {
    audio["alarm"].play();
}

function stopPlayingAlarmSound() {
    audio["alarm"].stop();
}

function getIrValue(id) {
    var value;
    switch (id) {
        case "red1":				// id of the color button
            value = 1;				// the value in zipato
            break;
        case "red2":
            value = 2;
            break;
        case "red3":
            value = 3;
            break;
        case "red4":
            value = 4;
            break;
        case "red5":
            value = 5;
            break;
        case "green1":
            value = 6;
            break;
        case "green2":				// id of the color button
            value = 7;				// the value in zipato
            break;
        case "green3":
            value = 8;
            break;
        case "green4":
            value = 9;
            break;
        case "green5":
            value = 10;
            break;
        case "blue1":
            value = 11;
            break;
        case "blue2":
            value = 12;
            break;
        case "blue3":
            value = 13;
            break;
        case "blue4":
            value = 14;
            break;
        case "blue5":
            value = 15;
            break;
        case "white1":
            value = 16;
            break;
        case "white2":
            value = 17;
            break;
        case "white3":
            value = 18;
            break;
        case "white4":
            value = 19;
            break;
        case "white5":
            value = 20;
            break;

    }

    return value;				// return value
}


