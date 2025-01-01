// GLOBAL SETTINGS
let globalSettings = require("./1Twente.O999.Config");
let userSettings;

// Terminal Colors
let term = require("terminal-kit").terminal;

// Node File System
let fs = require("fs");

// MOMENT
let moment = require("moment");
moment.locale("nl");

// Appserver / Init
let webExpress = require("express");
let webApp = webExpress();

// Node File System
let csv = require("fast-csv");

// Appserver / Body Parser
var webBodyParser = require("body-parser");
webApp.use(
  webBodyParser.urlencoded({
    extended: false,
  })
);
webApp.use(webBodyParser.json());

webApp.use("/", webExpress.static(`${__dirname}/assets/`));

//STATIC | TEMPLATES
webApp.use("/templates/", webExpress.static(`${__dirname}/templates/`));
webApp.use("/uploads/", webExpress.static(`${__dirname}/uploads/`));
webApp.use("/templates/uploads/", webExpress.static(`${__dirname}/uploads/`));
webApp.use("/templates/lyrics/", webExpress.static(`${__dirname}/lyrics/`));
webApp.get("/templates/1Twente.O999.Config.json", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", 0);
  res.json(globalSettings);
});

webApp.use(
  "/templates/plugins/jquery/",
  webExpress.static(`${__dirname}/node_modules/jquery/dist/`)
);
webApp.use(
  "/templates/plugins/socket.io-client/",
  webExpress.static(`${__dirname}/node_modules/socket.io-client/dist/`)
);
webApp.use(
  "/templates/plugins/moment/",
  webExpress.static(`${__dirname}/node_modules/moment/min/`)
);
webApp.use(
  "/templates/plugins/moment-timezone/",
  webExpress.static(`${__dirname}/node_modules/moment-timezone/builds/`)
);
webApp.use(
  "/templates/plugins/gsap/",
  webExpress.static(`${__dirname}/node_modules/gsap/dist/`)
);
webApp.use(
  "/templates/plugins/timexe/",
  webExpress.static(`${__dirname}/node_modules/timexe/`)
);
webApp.use(
  "/templates/plugins/lrc-file-parser/",
  webExpress.static(`${__dirname}/node_modules/lrc-file-parser/dist/`)
);
webApp.use(
  "/templates/plugins/less/",
  webExpress.static(`${__dirname}/node_modules/less/dist/`)
);

// STATIC | UI | PLUGINS
webApp.use(
  "/assets/plugins/jquery/",
  webExpress.static(`${__dirname}/node_modules/jquery/dist/`)
);
webApp.use(
  "/assets/plugins/jquery-ui/",
  webExpress.static(`${__dirname}/node_modules/jquery-ui/dist/`)
);
webApp.use(
  "/assets/plugins/bootstrap/",
  webExpress.static(`${__dirname}/node_modules/bootstrap/dist/`)
);
webApp.use(
  "/assets/plugins/socket.io-client/",
  webExpress.static(`${__dirname}/node_modules/socket.io-client/dist/`)
);
webApp.use(
  "/assets/plugins/moment/",
  webExpress.static(`${__dirname}/node_modules/moment/min/`)
);
webApp.use(
  "/assets/plugins/moment-timezone/",
  webExpress.static(`${__dirname}/node_modules/moment-timezone/builds/`)
);

// Appserver / Attach / Attach Socketio
let socketio = require("socket.io");
let httpServer = require("http").createServer(webApp);

// SOCKET.IO
const socketIO_Connector = socketio(httpServer, {
  cors: {
    origin: "*",
  },
});

// WEB API
webApp.get("/api/:component/:action/:variable", (req, res) => {
  // http://192.168.88.51:${globalSettings.appserver.ui}/api/fullscreen/toggle
  // http://192.168.88.51:${globalSettings.appserver.ui}/api/countdown/toggle

  // [CCG IP]:8080/api/ccg/reset/all

  // [CCG IP]:8080/api/ccg/clear/all
  // [CCG IP]:8080/api/ccg/clear/overlay
  // [CCG IP]:8080/api/ccg/clear/horizontal
  // [CCG IP]:8080/api/ccg/clear/vertical
  // [CCG IP]:8080/api/ccg/clear/screens
  // [CCG IP]:8080/api/ccg/clear/clips

  // [CCG IP]:8080/api/ccg/test/clips

  // [CCG IP]:8080/api/settings/animation/overlay/start/10000
  // [CCG IP]:8080/api/settings/animation/horizontal/start/4000
  // [CCG IP]:8080/api/settings/animation/vertical/start/4000

  // [CCG IP]:8080/api/settings/animation/overlay/end/2000
  // [CCG IP]:8080/api/settings/animation/horizontal/end/10000
  // [CCG IP]:8080/api/settings/animation/vertical/end/10000

  let apiData = req.params;
  HandleAPICalls(apiData);
  res.sendStatus(200);
});

// WEB API
webApp.get("/api/:component/:kind/:option/:variable/:value", (req, res) => {
  let apiData = req.params;
  HandleAPICalls(apiData);
  res.sendStatus(200);
});

// SAVED CONNECTIONS
let socketIO_Connection = socketIO_Connector;
socketIOConnector();
loadUserSettings();

// Server laten luisteren
httpServer.listen(globalSettings.appserver.ui, () => {
  term(
    `${getTime.nowDateTime()}\t^#^c^W APPSERVER ^ \tUI Appserver running on port: ${
      globalSettings.appserver.ui
    }\n`
  );
});

let savedData = {
  newsItemsFull: [],
  EPG: {
    OnAir: null,
    Upcoming: null,
    Today: null,
    Tomorrow: null,
  },
  nowplaying: null,
  nowplaying_cleaned: null,
  enrichment: {
    metadata: [],
  },
  socialMessages: null,
};

getEnrichments("./uploads/1T.O999.2024.Linked.tsv");

// HANDLE API CALLS
function HandleAPICalls(apiData) {
  if (apiData.value) {
    apiData.value = Number(apiData.value);
  }

  if (apiData.component === "settings" && apiData.kind === "animation") {
    let settingsChanged = false;

    if (ANIMATION_TYPES[apiData.option]) {
      const offsetPath = ANIMATION_TYPES[apiData.option];
      const isValidVariable = ["start", "end"].includes(apiData.variable);

      if (isValidVariable) {
        userSettings.animation.offsets[offsetPath][apiData.variable] =
          apiData.value;
        settingsChanged = true;
      }
    }

    if (settingsChanged) {
      saveUserSettings();
      socketIO_Connection.to("CasparCG").emit("usersettings", userSettings);
    }
  } else {
    socketIO_Connection
      .to("templates")
      .to("web")
      .to("DataCollector")
      .to("CasparCG")
      .emit("api", apiData);
  }
}

// SOCKETIO CONNECTOR ########################################
function socketIOConnector() {
  // SOCKET IO OPEN
  socketIO_Connection.on("connection", (socket) => {
    let roomName = socket.handshake.query.room;
    socket.join(roomName);

    if (roomName === "templates") {
      socket.emit("data|news", savedData.newsItemsFull);
      socket.emit("data|epg", savedData.EPG);
      socket.emit("nowplaying", savedData.nowplaying);
      socket.emit("nowplaying_cleaned", savedData.nowplaying_cleaned);
      socket.emit("globalsettings", globalSettings);
      socket.emit("socialMessages", savedData.socialMessages);
    }

    if (roomName === "CasparCG") {
      socket.emit("usersettings", userSettings);
    }

    // Disconnect
    socket.on("disconnect", () => {
      if (roomName == "web") {
        term(
          "\n" +
            getTime.nowDateTime() +
            "\t^#^r^W SOCKET.IO ^ \tClient Disconnected:\t[Web]\t\tID: " +
            socket.id
        );
      }

      if (roomName == "templates") {
        term(
          "\n" +
            getTime.nowDateTime() +
            "\t^#^r^W SOCKET.IO ^ \tClient Disconnected:\t[Template]\t\tID: " +
            socket.id
        );
      }
    });

    // DATA | NEWS
    socket.on("data|news", (dataNews_Received) => {
      savedData.newsItemsFull = dataNews_Received;
      socketIO_Connection
        .to("templates")
        .emit("data|news", savedData.newsItemsFull);
    });

    // DATA | NEWS
    socket.on("nowplaying", (nowplaying_Received) => {
      savedData.nowplaying = nowplaying_Received;
      socketIO_Connection
        .to("templates")
        .emit("nowplaying", savedData.nowplaying);
      socketIO_Connection
        .to("CasparCG")
        .emit("nowplaying", savedData.nowplaying);
    });

    socket.on("nowplaying_cleaned", (nowplaying_Received) => {
      savedData.nowplaying_cleaned = checkEnrichments(nowplaying_Received);
      socketIO_Connection
        .to("templates")
        .emit("nowplaying_cleaned", savedData.nowplaying_cleaned);
    });

    socket.on("socialMessages", (socialMessages) => {
      savedData.socialMessages = socialMessages;
      socketIO_Connection
        .to("templates")
        .emit("socialMessages", savedData.socialMessages);
    });

    // DATA | EPG
    socket.on("data|epg", (dataEPG_Received) => {
      savedData.EPG = dataEPG_Received;
      socketIO_Connection.to("templates").emit("data|epg", savedData.EPG);
    });
  });
}

function checkEnrichments(nowplaying) {
  if (nowplaying) {
    nowplaying.forEach((singleNP, index) => {
      nowplaying[index].enrichment = null;
      savedData.enrichment.metadata.forEach((metaData) => {
        if (metaData.omni_item_code === singleNP.itemCode) {
          nowplaying[index].enrichment = metaData;
        }
      });
    });
  }

  return nowplaying;
}

////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////

function loadUserSettings() {
  try {
    userSettings = JSON.parse(fs.readFileSync("./usersettings.json", "utf8"));
  } catch (error) {
    console.error("Error loading usersettings.json:", error.message);
    userSettings = {}; // Fallback to empty object if file doesn't exist or is invalid
  }
}

function saveUserSettings() {
  try {
    fs.writeFileSync(
      "./usersettings.json",
      JSON.stringify(userSettings, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving usersettings.json:", error.message);
  }
}

// Get Time Function
let getTime = {
  // DATE TIME NOW - TIMECODE
  currentTimecode: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    let frames = Math.floor(MyDate.getMilliseconds() / 40);
    MyDateString =
      (" 0" + MyDate.getHours()).slice(-2) +
      ":" +
      (" 0" + MyDate.getMinutes()).slice(-2) +
      ":" +
      (" 0" + MyDate.getSeconds()).slice(-2) +
      "." +
      (" 0" + frames).slice(-2);
    return MyDateString;
  },

  // DATE TIME NOW
  nowDateTime: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    MyDateString =
      MyDate.getFullYear() +
      "-" +
      ("0" + (MyDate.getMonth() + 1)).slice(-2) +
      "-" +
      (" 0" + MyDate.getDate()).slice(-2) +
      " " +
      (" 0" + MyDate.getHours()).slice(-2) +
      ":" +
      (" 0" + MyDate.getMinutes()).slice(-2) +
      ":" +
      (" 0" + MyDate.getSeconds()).slice(-2);
    return MyDateString;
  },

  nowDate: () => {
    let MyDate = new Date();
    let MyDateString;
    MyDate.setDate(MyDate.getDate());
    MyDateString =
      MyDate.getFullYear() +
      "-" +
      ("0" + (MyDate.getMonth() + 1)).slice(-2) +
      "-" +
      (" 0" + MyDate.getDate()).slice(-2);
    return MyDateString;
  },

  // FIX TIMEZONE ISSUE
  fixTimezone: (date) => {
    let offsetDate = new Date();
    let tzDifference = offsetDate.getTimezoneOffset() * 60 * 1000;

    let fixedTime = new Date(date.getTime() + tzDifference);

    return fixedTime;
  },
};

// Last in Array
if (!Array.prototype.lastElementInArray) {
  Array.prototype.lastElementInArray = () => {
    return this[this.length - 1];
  };
}

function getFileStats(path) {
  const stats = fs.statSync(path);
  return stats;
}

const ANIMATION_TYPES = {
  overlay: "clips_overlay",
  horizontal: "clips_horizontal",
  vertical: "clips_vertical",
};

function getEnrichments(theFile) {
  let tsvData = [];
  var stream = fs.createReadStream(theFile);
  csv
    .parseStream(stream, { headers: true, delimiter: "\t" })
    .on("data", function (data) {
      // console.log("DATA");
      data.positie = Number(data.positie);
      data.stem_2024 = Number(data.stem_2024);
      data.delta = Number(data.delta);
      data.pos_2023 = Number(data.pos_2023);
      data.uur = Number(data.uur);
      data.jaar = Number(data.jaar);
      data.handmatig_toegevoegd = Boolean(
        data.handmatig_toegevoegd.toLowerCase()
      );
      data.videoLinked = Boolean(data.videoLinked.toLowerCase());
      tsvData.push(data);
    })
    .on("end", function () {
      savedData.enrichment.metadata = tsvData;
    });
}
