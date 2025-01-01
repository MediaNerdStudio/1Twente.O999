// GLOBAL SETTINGS
let globalSettings = require("./1Twente.O999.Config");

// Terminal Colors
let term = require("terminal-kit").terminal;

// Node File System
let fs = require("fs");
let csv = require("fast-csv");

// MOMENT
let moment = require("moment");
moment.locale("nl");

// TimerThingy
let timexe = require("timexe");

const axios = require("axios");

let io = require("socket.io-client");

// Appserver / Init
let webExpress = require("express");
let webApp = webExpress();

// Appserver / Body Parser
var webBodyParser = require("body-parser");
webApp.use(
  webBodyParser.urlencoded({
    extended: false,
  })
);
webApp.use(webBodyParser.json());
let httpServer = require("http").createServer(webApp);

let savedData = {
  newsItems: [],
  newsItemsFull: [],
  EPG: {
    enschede: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
    hengelo: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
    twentefm: {
      OnAir: null,
      Upcoming: null,
      Today: null,
      Tomorrow: null,
    },
  },
  enrichment: {
    metadata: [],
  },
  nowPlaying: undefined,
  nowPlaying_cleaned: undefined,
  socialMessages: undefined,
};

let socketIO_Connector;

init();

function init() {
  getEnrichments("./uploads/1T.O999.2024.Linked.tsv");
  getSocialMessages("./uploads/O999.Berichten.001.csv");
  apiServer();
  socketIOConnector();
  cron_getAllNews();
  cron_getAllEPG("enschede");
  cron_getAllEPG("hengelo");
  cron_getAllEPG("twentefm");

  // TIMER || 1Minute
  timexe(`* * * * *`, () => {
    cron_getAllEPG("enschede");
    cron_getAllEPG("hengelo");
    cron_getAllEPG("twentefm");
  });

  // TIMER || 5minutes
  timexe(`* * * * /5`, () => {
    cron_getAllNews();
  });

  // TIMER || 1 second
  timexe(`* * * * * *`, () => {
    cron_getNowplaying();
  });
}

httpServer.listen(globalSettings.appserver.jsonparser, () => {
  term(
    `${moment().format(
      "YYYY-MM-DD HH:mm:ss.SSS"
    )}\t\t^#^c^W APPSERVER ^ \tJSON PARSER running on port: ${
      globalSettings.appserver.jsonparser
    }\n`
  );
});

function apiServer() {
  webApp.post("/", function (req, res) {
    let postData = req.body;
    res.sendStatus(200);
    console.log("============ NEW NOW PLAYING OMNI =============");

    console.log(postData);

    ///////////// CHECK POST IS OMNI //////////////////////
    // POST | OMNI
    postData.enrichment = {
      metadata: undefined,
    };
    if (savedData.nowPlaying) {
      console.log(postData.details.current.startTime);
      console.log(savedData.nowPlaying.details.current.startTime);
      console.log(
        compareOmniStartTime(
          savedData.nowPlaying.details.current.startTime,
          postData.details.current.startTime
        )
      );
    }

    if (!savedData.nowPlaying) {
      savedData.nowPlaying = matchMetdaData(postData);
      socketIO_Connector.emit("nowplaying", postData);
      console.log("=== NOWPLAYING SEND!!!");
    } else if (
      savedData.nowPlaying &&
      savedData.nowPlaying.details.current &&
      savedData.nowPlaying.details.current.startTime &&
      postData.details.current &&
      postData.details.current.startTime &&
      compareOmniStartTime(
        savedData.nowPlaying.details.current.startTime,
        postData.details.current.startTime
      ) > 0
    ) {
      savedData.nowPlaying = matchMetdaData(postData);
      socketIO_Connector.emit("nowplaying", postData);
      console.log("=== NOWPLAYING SEND!!!");
    } else if (
      savedData.nowPlaying &&
      savedData.nowPlaying.details.current &&
      savedData.nowPlaying.details.current.startTime &&
      postData.details.current &&
      postData.details.current.startTime === null
    ) {
      savedData.nowPlaying = postData;
      socketIO_Connector.emit("nowplaying", postData);
      console.log("=== NOWPLAYING SEND!!!");
    } else if (
      savedData.nowPlaying &&
      savedData.nowPlaying.details.current &&
      savedData.nowPlaying.details.current.startTime === null &&
      postData.details.current &&
      postData.details.current.startTime != null
    ) {
      savedData.nowPlaying = matchMetdaData(postData);
      socketIO_Connector.emit("nowplaying", postData);
      console.log("=== NOWPLAYING SEND!!!");
    }

    // console.log("=============== CURRENT =============");
    //   console.log(savedData.nowPlaying);
    //   console.log(postData.details.current);

    //   console.log(
    //     compareOmniStartTime(
    //       savedData.nowPlaying.details.current.startTime,
    //       postData.details.current.startTime
    //     )
    //   );
  });
}

function matchMetdaData(postData) {
  savedData.enrichment.metadata.forEach((singleMetadata) => {
    if (singleMetadata.omni_item_code === postData.details.current.itemCode) {
      postData.enrichment.metadata = singleMetadata;
      postData.enrichment.metadata.stats = formatStats(singleMetadata);
    }
  });

  return postData;
}

function cron_getNowplaying() {
  getNowPlaying((err, nowplaying) => {
    if (
      !savedData.nowPlaying_cleaned ||
      (savedData.nowPlaying_cleaned &&
        nowplaying[0] &&
        nowplaying[0].createdAt != savedData.nowPlaying_cleaned[0].createdAt)
    ) {
      savedData.nowPlaying_cleaned = nowplaying;
      if (socketIO_Connector) {
        socketIO_Connector.emit("nowplaying_cleaned", nowplaying);
      }
    }
  });
}

function compareOmniStartTime(dateTimeA, dateTimeB) {
  var momentA = moment(dateTimeA, "YYYY-MM-DD HH:mm:ss.SSS");
  var momentB = moment(dateTimeB, "YYYY-MM-DD HH:mm:ss.SSS");
  if (momentA < momentB) return 1;
  else if (momentA > momentB) return -1;
  else return 0;
}

function cron_getAllEPG(edition) {
  let count = 0;
  let total = 4;

  getEPGNow(edition, (err, epgOnAir) => {
    if (!err) {
      savedData.EPG[edition].OnAir = epgOnAir;
      count++;
      check(count, total);
    }
  });

  getEPGUpcoming(edition, (err, epgUpcoming) => {
    if (!err) {
      savedData.EPG[edition].Upcoming = epgUpcoming;
      count++;
      check(count, total);
    }
  });

  getEPGToday(edition, (err, epgToday) => {
    if (!err) {
      savedData.EPG[edition].Today = epgToday;
      count++;
      check(count, total);
    }
  });

  getEPGTomorrow(edition, (err, EPGTomorrow) => {
    if (!err) {
      savedData.EPG[edition].Tomorrow = EPGTomorrow;
      count++;
      check(count, total);
    }
  });

  function check(count, total) {
    if (count === total) {
      socketIO_Connector.emit("data|epg", savedData.EPG);
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W EPG ^ \t| 1Twente API\t\t| Grabbed all EPG Data for: ${edition}\n`
      );
    }
  }
}

// CRON JOB GET ALL NEWS
function cron_getAllNews() {
  getNewsOverview((err, newsMessages) => {
    if (!err && newsMessages) {
      savedData.newsItems = newsMessages;

      let newsItemsFull = [];
      savedData.newsItems.forEach((singleItem) => {
        getNewsItem(singleItem.id, (err, newsItem) => {
          newsItemsFull.push(newsItem);
          if (newsItemsFull.length === savedData.newsItems.length) {
            savedData.newsItemsFull = newsItemsFull;
            socketIO_Connector.emit("data|news", savedData.newsItemsFull);
            term(
              `${moment().format(
                "YYYY-MM-DD HH:mm:ss.SSS"
              )}\t\t^#^c^W NEWS ^ \t| 1Twente API\t\t| Grabbed all full news items\n`
            );
          }
        });
      });
    } else if (!newsMessages) {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^r^W NEWS ^ \t| 1Twente API\t\t| There was a problem with the full news items\n`
      );
    }
  });
}

function formatStats(metaData) {
  let returnData = [];

  if (metaData.pos_2023 === 0) {
    returnData.push(
      `${metaData.media_titel} komt dit jaar nieuw binnen op #${metaData.positie} in de De Onmeunige 999.`
    );
    returnData.push(
      `${metaData.media_artiest} - ${metaData.media_titel} is uitgebracht in ${metaData.jaar}.`
    );
  } else {
    if (metaData.positie < metaData.pos_2023) {
      returnData.push(
        `${metaData.media_titel} staat dit jaar op #${metaData.positie}, vorig jaar was dat op #${metaData.pos_2023}.`
      );
      if (metaData.delta > 1) {
        returnData.push(
          `${metaData.media_titel} stijgt hierdoor met ${metaData.delta} plaatsen.`
        );
      } else {
        returnData.push(
          `${metaData.media_titel} stijgt hierdoor met ${metaData.delta} plek.`
        );
      }
    }
    if (metaData.positie > metaData.pos_2023) {
      returnData.push(
        `${metaData.media_titel} staat dit jaar op #${metaData.positie}, vorig jaar was dat nog #${metaData.pos_2023}.`
      );
      let delta = metaData.delta * -1;
      if (delta > 1) {
        returnData.push(
          `${metaData.media_titel} zakt hierdoor met ${delta} plaatsen.`
        );
      } else {
        returnData.push(
          `${metaData.media_titel} zakt hierdoor met ${delta} plek.`
        );
      }
    }

    returnData.push(
      `${metaData.media_artiest} - ${metaData.media_titel} is uitgebracht in ${metaData.jaar}.`
    );
  }
  return returnData.join(" ");
}

function getSocialMessages(theFile) {
  let csvData = [];
  var stream = fs.createReadStream(theFile);
  csv
    .parseStream(stream, { headers: true })
    .on("data", function (data) {
      data["Leeftijd"] = Number(data["Leeftijd"]);
      csvData.push(data);
    })
    .on("end", function () {
      savedData.socialMessages = csvData;
    });
}

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

// GET NOWPLAYING
function getNowPlaying(callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.nowplaying.enschede.last_10,
    ],
    (err, nowplaying) => {
      // term(
      //   `${moment().format(
      //     "YYYY-MM-DD HH:mm:ss.SSS"
      //   )}\t\t^#^c^W NOWPLAYING ^ \t| 1Twente API\t\t| Grabbed last 10 items\n`
      // );
      callback(undefined, nowplaying);
    }
  );
}

// GET ALL NEWS MESSAGES
function getNewsOverview(callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.newsOverview,
    ],
    (err, newsMessages) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W NEWS ^ \t| 1Twente API\t\t| Grabbed all news items\n`
      );
      callback(undefined, newsMessages);
    }
  );
}

// GET SINGLE NEWS MESSAGE
function getNewsItem(newsId, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.newsItem,
      newsId,
    ],
    (err, newsItem) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W NEWS ^ \t| 1Twente API\t\t| Grabbed single news item: ${newsId}\n`
      );
      callback(undefined, newsItem);
    }
  );
}

// GET EPG NOW
function getEPGNow(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].OnAir,
    ],
    (err, epgData) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W EPG ^ \t| 1Twente API\t\t| Grabbed EPG Now: ${edition}\n`
      );
      callback(undefined, epgData);
    }
  );
}

// GET EPG UPCOMING
function getEPGUpcoming(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Upcoming,
    ],
    (err, epgData) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W EPG ^ \t| 1Twente API\t\t| Grabbed EPG Upcoming: ${edition}\n`
      );
      callback(undefined, epgData);
    }
  );
}

// GET EPG TODAY
function getEPGToday(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Today,
    ],
    (err, epgData) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W EPG ^ \t| 1Twente API\t\t| Grabbed EPG Today: ${edition}\n`
      );
      callback(undefined, epgData);
    }
  );
}

// GET EPG TOMORROW
function getEPGTomorrow(edition, callback) {
  eenTwenteApi_GET(
    [
      globalSettings.API.EenTwente.baseURL,
      globalSettings.API.EenTwente.EPG[edition].Tomorrow,
      moment().add(1, "d").format("DD-MM-YYYY"),
    ],
    (err, epgData) => {
      term(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t^#^c^W EPG ^ \t| 1Twente API\t\t| Grabbed EPG Today: ${edition}\n`
      );
      callback(undefined, epgData);
    }
  );
}

function eenTwenteApi_GET(url, callback) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: url.join(""),
    headers: {},
  };
  axios
    .request(config)
    .then((response) => {
      callback(undefined, response.data);
    })
    .catch((error) => {
      callback(error, undefined);
    });
}

function socketIOConnector() {
  let socketIO_Connection = io.connect(
    `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}`,
    {
      reconnection: true,
      reconnectionDelay: 10000,
      query: {
        room: "DataCollector",
      },
    }
  );

  // SIO || CONNECT
  socketIO_Connection.on("connect", function () {
    term(
      `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\t\t^#^m^W SOCKETIO ^ \t\t\t| Connected:\tUI\n`
    );
    socketIO_Connector = socketIO_Connection;
    socketIO_Connector.emit("data|news", savedData.newsItemsFull);
    socketIO_Connector.emit("data|epg", savedData.EPG);
    socketIO_Connector.emit("socialMessages", savedData.socialMessages);
    socketIO_Connector.emit("nowplaying_cleaned", savedData.nowPlaying_cleaned);
  });

  // Handle disconnect event
  socketIO_Connection.on("disconnect", function () {
    term(
      `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\t^#^m^W SOCKETIO ^ \t\t\t| Disconnected:\tUI\n`
    );
  });

  // Handle connection error
  socketIO_Connection.on("connect_error", function (error) {
    term(
      `${moment().format(
        "YYYY-MM-DD HH:mm:ss.SSS"
      )}\t^#^m^W SOCKETIO ^ \t\t\t| Connection Error:\t${error}\n`
    );
  });
}

////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
