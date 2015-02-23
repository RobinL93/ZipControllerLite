var updating = false;
var timeoutelapse = 4000;
var refreshcounter = 0;
var refreshmax = 100;
var lastSync = null;
var rooms = null; // list of rooms
var headerText = "atom8ic";
var showroomtitles = true;
var showsroomless = false;
var showsensors = false;
var showroomless = false;
var appWidth = window.outerWidth;
var appHeight = window.outerHeight;
var appData = Windows.Storage.ApplicationData.current.roamingSettings;
var maxswitches = 8;
var goforrefreshnexttime = false;
var attributedata = null;


$.ajaxSetup({
    async: false
});

$(function () {

    $("#irContainer").hide();

    $("#colorWheel").on("click", function () {
        $("#irContainer").fadeToggle(600);
    });

    // $("#log").append("V: " + lol);


});


    $("#irContainer").on("click", ".cButton", function () {
        var id = this.id;
        value = getIrValue(id);
    });


function irControllerHTML() {
    var htmlCode = '<div id="redDiv"><a href="#" id="red1" class="cButton">R</a><a href="#" id="red2" class="cButton"></a><a href="#" id="red3" class="cButton"></a><a href="#" id="red4" class="cButton"></a><a href="#" id="red5" class="cButton"></a></div>';
    htmlCode += '<div id="greenDiv"><a href="#" id="green1" class="cButton">G</a><a href="#" id="green2" class="cButton"></a><a href="#" id="green3" class="cButton"></a><a href="#" id="green4" class="cButton"></a><a href="#" id="green5" class="cButton"></a></div>';
    htmlCode += '<div id="blueDiv"><a href="#" id="blue1" class="cButton">B</a><a href="#" id="blue2" class="cButton"></a><a href="#" id="blue3" class="cButton"></a><a href="#" id="blue4" class="cButton"></a><a href="#" id="blue5" class="cButton"></a></div>';
    htmlCode += '<div id="whiteDiv"><a href="#" id="white1" class="cButton">W</a><a href="#" id="white2" class="cButton">Flash</a><a href="#" id="white3" class="cButton">Strobe</a><a href="#" id="white4" class="cButton">Fade</a><a href="#" id="white5" class="cButton">Smooth</a></div>';
    return htmlCode;
}


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

function alert(smess) {
    var msg = new Windows.UI.Popups.MessageDialog(smess);
    msg.showAsync();
}

function loginToBox() {
    var url = "http://my.zipato.com:8080/zipato-web/json/Initialize";
    var sRes = "ERROR";

    // Get AppData object for settings
    var username = appData.values["settings-username"];
    var password = decryptString(appData.values["settings-password"]);
    var serial = appData.values["settings-serial"];
    if ((serial == undefined) || (serial == null)) {
        serial = "";
    }
    timeoutelapse = appData.values["settings-update"];
    timeoutelapse = parseInt(timeoutelapse) * 1000;

    //if (appData.values.size > 0) {
    //    if (appData.values["settings-header"]) {
    headerText = appData.values["settings-header"];
    //    }
    showroomtitles = appData.values["settings-showroomtitles"];
    showsensors = appData.values["settings-showsensors"];
    showsroomless = appData.values["settings-showroomless"];
    //}
    $("#headerText").text(headerText);

    //$("#log").append("username="+username+", headerText="+headerText)
    $.ajax({
        type: "GET",
        url: url,
        async: false,
        cache: false,
        success: function (data) {
            var jsessionid = data.jsessionid;//+"...");
            var nonce = data.nonce;
            var token = SHA1(nonce + SHA1(password));

            var loginURL = "https://my.zipato.com:443/zipato-web/v2/user/login?username=" + username + "&token=" + token

            if (!(serial === "")) {
                loginURL += "&serial=" + serial;
            }
            sRes = "unknownuser";
            try {
                $.ajax({
                    type: "GET",
                    url: loginURL,
                    async: false,
                    cache: false,
                    success: function (data2) {
                        if (data.success) {
                            sRes = "OK";
                        } else {
                            sRes = "unknownuser"
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        sRes = "unknownuser"
                    }

                });
            }
            catch (err) {
                sRes = "unknownuser";
            }
        }
    });
    return sRes;
}

function getRoomNameFromID(roomcode) {
    var sResult = "";
    $.each(rooms, function (i, room) {
        if (room.id === roomcode) {
            sResult = room.name;
        }
    })
    return sResult;
}


function getTempAdjusted(inTemp) {
    fTemp = parseFloat(inTemp);
    if (fTemp > 6000) {
        fTemp = 10 * fTemp - 65536;
        fTemp = fTemp / 10;
        inTemp = fTemp;
    }
    return inTemp;
}

function getTimeSinceLastRead() {
    if (lastSync == null) {
        return "";
    } else {
        var date = Date.now();
        return timeDifference(date, lastSync)
    }
}

function getReadingAgo(stringValue) {
    var dateStr = stringValue;
    var date = new Date(dateStr);
    var stime = date;
    return timeDifference(Date.now(), stime)
}


function addOrChangeControl(elementid, atag, sRoomTitle) {
    if (document.getElementById(elementid) == null) {
        return atag;
    } else {
        $("#" + elementid).replaceWith(atag);
        return "";
    }
}

function getRoomTitle(sRoomTitle) {
    var sResult = "";
    if (showroomtitles) {
        if (sRoomTitle !== "") {
            sResult = " (" + sRoomTitle + ")";
        }
    }
    return sResult;
}


function addIrController(uuid) {
    if ($("#" + uuid).length != 0) {
        return "";
    } else {
        var controlHtml = "<div id='" + uuid + "' class='ircolors'>" + irControllerHTML() + "</div><br/>";
        return controlHtml;
    }
}

function addOrChangeOnOffControl(uuid, title, value, sRoomTitle) {
    if ($("#" + uuid).length != 0) {
        // Update the value
        if (value == "true") {
            document.getElementById(uuid).winControl.checked = true;
        } else {
            document.getElementById(uuid).winControl.checked = false;
        }
        return "";
    } else {
        // Add the element
        var roomtitle = getRoomTitle(sRoomTitle);
        var controlHtml = "<div id='" + uuid + "' class='switchtoggle' data-win-control='WinJS.UI.ToggleSwitch' data-win-options='{title: \"" + title + roomtitle + " \", checked: " + value + "}'></div><br/>";
        return controlHtml;
    }
}
function addOrChangeDimmerControl(uuid, title, value, sRoomTitle) {
    var roomtitle = getRoomTitle(sRoomTitle);
    if ($("#" + uuid).length != 0) {
        // Update the value
        $("#" + uuid).val(value);
        return "";
    } else {
        // Add the element
        var controlHtml = "<label>" + title + roomtitle + "<br/><input style='width: 140px;' class='dimmer' id='" + uuid + "' type='range' value='" + value + "'/></label>";
        return controlHtml;
    }
}

function getTempColor(value) {
    var sRes = "white";
    var iValue = parseFloat(value);
    if (iValue >= -20) {
        sRes = "#6F95D3";
    }
    if (iValue >= -10) {
        sRes = "#B5C9E8";
    }
    if (iValue >= -5) {
        sRes = "#E8EEF8";
    }
    if (iValue >= 3) {
        sRes = "#C9F4C3";
    }
    if (iValue >= 10) {
        sRes = "73E265";
    }
    if (iValue >= 15) {
        sRes = "#CCE566";
    }
    if (iValue >= 22) {
        sRes = "#ABCD23";
    }
    if (iValue >= 27) {
        sRes = "#E6940F";
    }
    if (iValue >= 35) {
        sRes = "#EF0F06";
    }
    return sRes;
}


function isRoomToBeShown(roomcode) {
    var sValue = false;
    if ((roomcode === "0") || (roomcode == undefined)) {
        sValue = showsroomless;
    } else {
        //if (appData.values.size > 0) {
        //    if (appData.values["settings-room-" + roomcode]) {
        sValue = appData.values["settings-room-" + roomcode];
        //    }
        //}
    }
    return sValue;
}

function getRoomsList() {
    var sRes = false;
    var url = "https://my.zipato.com:443/zipato-web/v2/rooms/";
    try {
        $.ajax({
            type: "GET",
            url: url,
            cache: false,
            async: false,
            success: function (data) {
                // Valid JSON?
                try {
                    var s = JSON.stringify(data);
                    rooms = data;
                    sRes = true;
                } catch (e) {
                    // Nope
                    sRes = false;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                sRes = false;
            }

        });
    }
    catch (err) {
        sRes = false;
    }
    return sRes;
}


function getAttributeData() {
    var sRes = false;
    var url = "https://my.zipato.com:443/zipato-web/v2/attributes/full?network=true&device=true&endpoint=true&clusterEndpoint=true&definition=true&config=true&room=true&icons=true&value=true&parent=true&children=true&full=true&type=true";
    $.ajax({
        type: "GET",
        url: url,
        cache: false,
        async: false,
        success: function (data) {
            attributedata = data;
            sRes = true;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            sRes = false;
        }

    });
    lastSync = Date.now();
    return sRes;
}

var switchcolumnheight = maxswitches;

function calculatePanelLayout() {
    var data = attributedata;
    var iTempMeters = 0;
    var iLightMeters = 0;
    var iOnOffers = 0;
    var iDimmers = 0;
    $.each(data, function (i, obj) {
        sRes = true;
        try {
            sRoom = "";
            try {
                sRoom = obj.clusterEndpoint.room;
            } catch (err) {
                // This sensor has no room, let it live anyway to be managed by settings
                sRoom = "0";
            }

            if (isRoomToBeShown(sRoom)) {
                var sRoomName = getRoomNameFromID(sRoom);
                if ((obj.clusterEndpoint.name.toLowerCase().indexOf("off") != -1) || (obj.clusterEndpoint.name.toLowerCase().indexOf("switch") != -1)) {
                    iOnOffers++;
                }

                if (obj.clusterEndpoint.name.toLowerCase().indexOf("wall") != -1) {
                    iOnOffers++;
                }
                if (obj.clusterEndpoint.name.toLowerCase().indexOf("dimmer") != -1) {
                    iDimmers++;
                }
                if (obj.uiType.endpointType.toLowerCase().indexOf("temp") != -1) {
                    iTempMeters++;
                }
                if (showsensors && (obj.uiType.endpointType.toLowerCase().indexOf("light") != -1)) {
                    iLightMeters++;
                }
            }
        }
        catch (err) {
            //document.getElementById("demo").innerHTML = err.message;
        }
    });

    var numberofcolumns = Math.round(appWidth / 250);
    var my_maxswitches = Math.round((appHeight - 200) / 60) - 2;
   
    if (showsensors) {
        numberofcolumns--;
    }
    switchcolumnheight = Math.round(iOnOffers / numberofcolumns);
    while ((appHeight / switchcolumnheight) > 200) {
        numberofcolumns--;
        switchcolumnheight = Math.round(iOnOffers / numberofcolumns);
    }
}

function updatePanel() {
    var data = attributedata;
    var sTempMeters = "";
    var iTempMeters = 0;
    var sLightMeters = "";
    var iLightMeters = 0;
    var sOnOffers = "<table><tr><td class='section'>";
    var iOnOffers = 0;
    var sDimmers = "";
    var sIrColors = "";
    //if (goforrefreshnexttime) {
    $("#warning").empty();
    $("#warnings").hide();
    $("#temps").empty();
    $("#lums").empty();
    $("#onoffs").empty();
    goforrefreshnexttime = false;
    //}



    sRes = true;
    $.each(data, function (i, obj) {
        sRes = true;
        try {
            sRoom = "";
            try {
                sRoom = obj.clusterEndpoint.room;
            } catch (err) {
                // This sensor has no room, let it live anyway to be managed by settings
                sRoom = "0";
            }

            if (obj.clusterEndpoint.name.toLowerCase().indexOf("infra") != -1) {
                sIrColors += addIrController(obj.uuid);
            }

            if (isRoomToBeShown(sRoom)) {
                var sRoomName = getRoomNameFromID(sRoom);
                if ((obj.device.name.toLowerCase().indexOf("water") != -1) || (obj.device.name.toLowerCase().indexOf("flood") != -1)) {
                    //$("#log").append(obj.device.name.toLowerCase());
                    var sValue = obj.value.value;
                    var sAgo = getReadingAgo(obj.value.timestamp);
                    var sName = obj.endpoint.name;
                    var sGuide = obj.endpoint.description;
                    if (sGuide.indexOf("guide:") != -1) {
                        // There is indeed a guide!
                        sGuide = sGuide.replace("guide:", "")
                    } else {
                        sGuide = "";
                    }
                    var sHtml = "<p id='" + obj.uuid + "' class='leak'>" + sName + " " + sValue + " " + sAgo + "</p>";
                    if (showsensors) {
                        addOrChangeControl(obj.uuid, sHtml, sRoomName);
                    }
                    if ((obj.value.value == true) || (obj.value.value === "true")) {
                        //We have a leak, show it!
                        //$("#log").append("issue warning" + sName + " sValue=" + sValue+" ");
                        issueWarning(sName, sGuide);
                    }
                }
                if ((obj.clusterEndpoint.name.toLowerCase().indexOf("off") != -1) || (obj.clusterEndpoint.name.toLowerCase().indexOf("switch") != -1)) {
                    sOnOffers +=
                        addOrChangeOnOffControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName);
                    iOnOffers++;
                    if (iOnOffers >= switchcolumnheight) {
                        sOnOffers += "</td><td width=10px></td><td class='section'>";
                        iOnOffers = 0;
                    }

                }

                if (obj.clusterEndpoint.name.toLowerCase().indexOf("wall") != -1) {
                    sOnOffers +=
                        addOrChangeOnOffControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName);
                    iOnOffers++;
                    if (iOnOffers >= switchcolumnheight) {
                        sOnOffers += "</td><td class='section'>";
                        iOnOffers = 0;
                    }
                }
                if (obj.clusterEndpoint.name.toLowerCase().indexOf("dimmer") != -1) {
                    sDimmers +=
                        addOrChangeDimmerControl(obj.uuid, obj.endpoint.name, obj.value.value, sRoomName);
                }
                if (obj.uiType.endpointType.toLowerCase().indexOf("temp") != -1) {
                    var sValue = getTempAdjusted(obj.value.value);
                    var sAgo = getReadingAgo(obj.value.timestamp); 
                    var sUnit = obj.config.unit;
                    var sName = obj.endpoint.name;
                    var sHtml = "<div id='" + obj.uuid + "' class='tempholder'><div class='tempfigure'><font color='" + getTempColor(sValue) + "' size='40px'>" + sValue + " " + sUnit + "</font></div><div class='agotext'>" + sName + " " + sAgo + "</div></div>";
                    sTempMeters += 
                        addOrChangeControl(obj.uuid, sHtml, sRoomName);
                }
                if (showsensors && (obj.uiType.endpointType.toLowerCase().indexOf("light") != -1)) {
                    var sValue = getTempAdjusted(obj.value.value);
                    var sAgo = getReadingAgo(obj.value.timestamp);
                    var sUnit = obj.config.unit;
                    var sName = obj.endpoint.name;
                    var sHtml = "<p id='" + obj.uuid + "' class='light'>" + sName + " " + sValue + " " + sUnit + " " + sAgo + "</p>";
                    sLightMeters +=
                        addOrChangeControl(obj.uuid, sHtml, sRoomName);
                }

            } else {
                // Remove any elements no longer to be shown
                $("#" + obj.uuid).remove();
            }
        }
        catch (err) {
            //document.getElementById("demo").innerHTML = err.message;
        }
    });
    $("#temps").append(sTempMeters);
    $("#lums").append(sLightMeters);
    $("#onoffs").append(sOnOffers + "</td></tr></table>" + sDimmers);
    $("#irContainer").append(sIrColors);
    if (!showsensors) {
        $("#sensorscolumn").hide();
    } else {
        $("#sensorscolumn").show();
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
            calculatePanelLayout();
            updatePanel();
        } catch (e) {
            sRes = false;
        }
    }
    return sRes;
}


function setAttribValue(uuid, state) {
    clearTimeout(refreshTimer);
    showProgress();
    setTimeout("doSetAttribValue('" + uuid + "', " + state + ", false);", 300);
}

function doSetAttribValue(uuid, state, login) {
    var sRes = false;
    var sLoginResult = "OK";
    var doRefreshFlag = true;
    login = true;
    if (login) {
        sLoginResult = loginToBox();
    }
    if (!(sLoginResult === "OK")) {
        //$("#log").append("<br/>Login2"+sLoginResult);
        sLoginResult = loginToBox();
    }
    //$("#log").append("<br/>Logged in to box=" + sLoginResult);
    if (sLoginResult === "OK") {
        var url = "https://my.zipato.com:443/zipato-web/v2/attributes/" + uuid + "/value";
        $.ajax({
            type: "PUT",
            data: '{ "value": "' + state + '" }',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            //dataType: 'json',
            url: url,
            async: false,
            success: function (data) {
                sRes = true;
                //$("#log").append("<br/>Got data");
                hideProgress();
                WinJS.UI.processAll();
            },
            error: function (xhr, ajaxOptions, thrownError) {
                sRes = false;
                // OK, looks like we need to login first
                // Do this synchronosly
                doRefreshFlag = false;
                //$("#log").append("<br/>Error")
                //doSetAttribValue(uuid, state, true);
                //setTimeout("doSetAttribValue('" + uuid + "', " + state + ", true);", 300);
            }
        });
        //$("#log").append("<br/>Finished")
        hideProgress();
    }
    // Do a refresh to reflect changes in e.g. virtual endpoints
    if (doRefreshFlag) {
        //$("#log").append("<br/>Refreshing")
        //    doRefresh();
    }
    return sRes;
}

function applyJQueryBindings() {
    //var noOfSwitches = $("#onoffs").children().length;


    $("#irContainer").on("click", ".cButton", function () {

        // gets uuid of the whole thing
        var uuid = $(".ircolors").attr('id');

        // gets id of the clicked button (with a classname of cButton
        var id = this.id;
        // take that value and convert to to "ir value", for example red1 is = 1, green 2 = 7
        var value = getIrValue(id);
        setAttribValue(uuid, value);
        //$("#log").append(uuid + " " + value + " ");
    });

    $("#clock").click(function () {
        $("#buttonholder").show();
        setTimeout('$("#buttonholder").hide();', 5000);
    });



    $(".switchtoggle").click(function () {
        if (!updating) {
            var uuid = $(this).attr("id");
            var state = document.getElementById($(this).attr("id")).winControl.checked;
            setAttribValue(uuid, state);
        } else {
            var msg = new Windows.UI.Popups.MessageDialog("Sorry, the app is updating - please try in a bit ;)");
            msg.showAsync();

        }
    });

    var savedDevicesHTML = ""

    /*$(".guide").click(function () {
        if (!updating) {
            var guideURL = $(this).attr("href");
            window.location = guideURL;
            //var sHTML = "<iframe src='" + guideURL + "'></iframe>";
            //savedDevicesHtml = $("#content_area").html();
            //$("#content_area").html(sHTML);

        }
    });*/
    $(".dimmer").click(function () {
        if (!updating) {
            var state = $(this).val();
            var uuid = $(this).attr("id");
            setAttribValue(uuid, state);
        } else {
        }
    });
}

function handleResize(eventArgs) {
    appWidth = eventArgs.view.outerWidth;
    appHeight = eventArgs.view.outerHeight;
    maxswitches = Math.round((appHeight - 200) / 60);
    try {
        calculatePanelLayout();
        updatePanel();
    } catch (e) {
    }
}


$(document).ready(function () {
    applyJQueryBindings();
    window.addEventListener("resize", handleResize);
});

function actualRefresh() {
    var sRes = false;
    var sBoxRes = loginToBox();
    if (sBoxRes === "unknownuser") {
        // The user is not recognized, show hint to update settings    
        $("#hintcredentials").show();
        initiateRefresh();
    }
    if (sBoxRes === "ERROR") {
        // No luck - hint offline for a while
        $("#offline").show();
        showProgress();
        setTimeout("location.reload();", 30000);
    }
    if (!(sBoxRes === "OK")) {
        // Try logging in agan...
        sBoxRes = loginToBox();
    }
    if (sBoxRes === "OK") {
        // All is well, hide warnings    
        $("#offline").hide();
        $("#hintcredentials").hide();
        sRes = syncWithBox();
        if (!sRes) {
            // No luck syncing. Try logging in first
            sBoxRes = loginToBox();
            // Then sync again
            sRes = syncWithBox();
            $("#hintcredentials").show();
            //initiateRefresh();
        }
        if (sRes) {
            WinJS.UI.processAll();
            applyJQueryBindings();
            $("#endpointstable").show();
            initiateRefresh();
        }
    } else {
    }
    hideProgress();
}

var actualRefreshTimer = null;

function doRefresh() {
    clearTimeout(refreshTimer);
    clearTimeout(actualRefreshTimer);
    showProgress();
    refreshcounter++;
    if (refreshcounter >= refreshmax) {
        // Every X times, reload app instead. It will live for ever ;)
        location.reload();
    } else {
        actualRefreshTimer = setTimeout("actualRefresh();", 100);
    }
}

var refreshTimer = null;

function initiateRefresh() {
    var i_timeoutelapse = parseFloat(timeoutelapse);
    if (i_timeoutelapse <= 5000) {
        timeoutelapse = "5000";
    }
    refreshTimer = setTimeout("doRefresh();", timeoutelapse)
}

function issueWarning(deviceName, sGuide) {
    $("#warnings").show();
    $("#warning").append("<p>Sensor " + deviceName + " indicates an issue. <a class='guide' href='" + sGuide + "'>Tap here for a guide on how to resolve it.</a></p>");
    var audio = {};
    audio["walk"] = new Audio();
    audio["walk"].src = "sound/alarm.wav"
    audio["walk"].addEventListener('load', function () {
        audio["walk"].play();
    });
}

function showProgress() {
    $("#loading-ring").show();
    WinJS.UI.processAll();
}

function hideProgress() {
    $("#loading-ring").hide();
    WinJS.UI.processAll();
}

function showSettings() {
    WinJS.UI.SettingsFlyout.showSettings("settingsDiv", "settings.html");
}
function showRoomSettings() {
    WinJS.UI.SettingsFlyout.showSettings("roomsDiv", "rooms.html");
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function updateAgo() {
    $("#agolabel").text("Updated " + getTimeSinceLastRead());
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    // add a zero in front of numbers<10
    h = checkTime(h);
    m = checkTime(m);
    var clockString = h + ":" + m;
    $("#clock").html(clockString);
    setTimeout("updateAgo();", 1000)
}

function getIrValue(id) {
    var value;
    switch(id) {
        case "red1":
            value = 1;
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
        case "green2":
            value = 7;
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

    return value;
}