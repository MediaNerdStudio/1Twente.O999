// GLOBAL SETTINGS
let globalSettings = require("./1Twente.O999.Config");

// Terminal Colors
let term = require("terminal-kit").terminal;

// Node File System
let fs = require("fs");

// MOMENT
let moment = require("moment");
moment.locale("nl");

// TimerThingy
let timexe = require("timexe");

let io = require("socket.io-client");
const osc = require("osc");

const { CasparCG } = require("casparcg-connection");

let CasparCG_Connections = {
  ccg_01: null,
};

let savedData = {
  nowplaying: null,
  clip_overlay: {
    displayed: false,
    active: false,
    offset_start: 15000,
    offset_end: 30000,
  },
  clip_horizontal: {
    displayed: false,
    active: false,
    offset_start: 4000,
    offset_end: 10000,
  },
  clip_vertical: {
    displayed: false,
    active: false,
    offset_start: 4000,
    offset_end: 10000,
  },

  teksttv: {
    displayed: false,
    active: false,
    offset_start: 4000,
    offset_end: 10000,
  },
  clipTime: [0, 0],
  opacity: [1, 1, 1],
};

let socketIO_Connector;

init();

function init() {
  ccgConnector(1, function (err, res) {
    if (!err) {
      console.log(
        `${moment().format(
          "YYYY-MM-DD HH:mm:ss.SSS"
        )}\t\t CASPARCG \tCONNECT ESTABLISHED:\t\tSERVER: 1`
      );
      // ccg_test();
      // ccg_resetAll();
    }
  });
  socketIOConnector();
  timexe(`* * * * * * /40`, () => {
    cron_checkvideo();
  });

  // TIMER || 1 second
  timexe(`* * * * * *`, () => {
    cron_checkVideoEnd();
  });

  initOSC();
}

function cron_checkVideoEnd() {
  getOpacity(
    globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
    globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    (theOpacity) => {
      savedData.opacity[0] = theOpacity;
    }
  );

  getOpacity(
    globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    (theOpacity) => {
      savedData.opacity[1] = theOpacity;
    }
  );

  getOpacity(
    globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    (theOpacity) => {
      savedData.opacity[2] = theOpacity;
    }
  );

  if (savedData.clipTime[1] != 0) {
    if (
      savedData.clipTime[0] > savedData.clipTime[1] - 3 &&
      (savedData.opacity[0] === 1 ||
        savedData.opacity[1] === 1 ||
        savedData.opacity[2] === 1)
    ) {
      console.log("FIX HET");
      console.log(savedData.clipTime, savedData.opacity);
      if (savedData.opacity[0]) {
        savedData.clip_overlay.active = false;
        savedData.clip_overlay.displayed = true;
        ccg_Animation("out", "overlay", "clips");
      }

      if (savedData.opacity[1]) {
        savedData.clip_horizontal.active = false;
        savedData.clip_horizontal.displayed = true;
        ccg_Animation("out", "horizontal", "clips");
      }

      if (savedData.opacity[2]) {
        savedData.clip_vertical.active = false;
        savedData.clip_vertical.displayed = true;
        ccg_Animation("out", "vertical", "clips");
      }
    }
  }
}

async function getOpacity(channel, layer, callback) {
  const { error, request } = await CasparCG_Connections.ccg_01.mixerOpacity({
    channel: channel,
    layer: layer,
  });
  if (error) {
    // console.log("Error when sending", error);
  } else {
    const response = await request;
    callback(Number(response.data[0]));
  }
}

async function setOpacity(channel, layer, opacity) {
  const { error, request } = await CasparCG_Connections.ccg_01.mixerOpacity({
    channel: channel,
    layer: layer,
    value: opacity,
  });
  if (error) {
    console.log("Error when sending", error);
  } else {
    const response = await request;
    getOpacity(4, 20, (theOpacity) => {
      savedData.opacity = theOpacity;
    });

    // callback(Number(response.data[0]));
  }
}

function cron_checkvideo() {
  // STOP PREMATURE!!!!
  ccg_stopClips_Premature("overlay");
  ccg_stopClips_Premature("horizontal");
  ccg_stopClips_Premature("vertical");

  // STARTT
  if (
    savedData.nowplaying &&
    savedData.nowplaying.enrichment &&
    savedData.nowplaying.enrichment.metadata &&
    savedData.nowplaying.enrichment.metadata.filename &&
    savedData.nowplaying.enrichment.metadata.filename != null &&
    savedData.nowplaying.enrichment.metadata.filename != ""
  ) {
    // START OVERLAY
    if (
      savedData.clip_overlay.active === false &&
      savedData.clip_overlay.displayed === false &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          savedData.clip_overlay.offset_start
    ) {
      savedData.clip_overlay.active = true;
      savedData.clip_overlay.displayed = true;
      ccg_Animation("in", "overlay", "clips");
    }

    //  START HORIZONTAL
    if (
      savedData.clip_horizontal.active === false &&
      savedData.clip_horizontal.displayed === false &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          savedData.clip_horizontal.offset_start
    ) {
      savedData.clip_horizontal.active = true;
      savedData.clip_horizontal.displayed = true;
      ccg_Animation("in", "horizontal", "clips");
    }

    // START VERICAL
    if (
      savedData.clip_vertical.active === false &&
      savedData.clip_vertical.displayed === false &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          savedData.clip_vertical.offset_start
    ) {
      savedData.clip_vertical.active = true;
      savedData.clip_vertical.displayed = true;
      ccg_Animation("in", "vertical", "clips");
    }

    // ================================ STOP CLIPS =========================================
    // STOP | OVERLAY
    if (
      savedData.clip_overlay.active === true &&
      savedData.clip_overlay.displayed === true &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          (savedData.nowplaying.details.current.mix.duration -
            savedData.clip_overlay.offset_end)
    ) {
      savedData.clip_overlay.active = false;
      savedData.clip_overlay.displayed = true;
      ccg_Animation("out", "overlay", "clips");
    }

    // STOP | HORIZONTAL
    if (
      savedData.clip_horizontal.active === true &&
      savedData.clip_horizontal.displayed === true &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          (savedData.nowplaying.details.current.mix.duration -
            savedData.clip_horizontal.offset_end)
    ) {
      savedData.clip_horizontal.active = false;
      savedData.clip_horizontal.displayed = true;
      ccg_Animation("out", "horizontal", "clips");
    }

    // STOP | VERTICAL
    if (
      savedData.clip_vertical.active === true &&
      savedData.clip_vertical.displayed === true &&
      Number(moment().add(-1, "h").format("x")) >
        Number(
          moment(
            savedData.nowplaying.details.current.startTime,
            "YYYY-MM-DD HH:mm:ss.SSS"
          ).format("x")
        ) +
          (savedData.nowplaying.details.current.mix.duration -
            savedData.clip_vertical.offset_end)
    ) {
      savedData.clip_vertical.active = false;
      savedData.clip_vertical.displayed = true;
      ccg_Animation("out", "vertical", "clips");
    }
  }
}

function ccg_stopClips_Premature(type) {
  if (type === "horizontal") {
    if (
      savedData.nowplaying &&
      savedData.nowplaying.details.current.startTime === null &&
      savedData.clip_horizontal.active === true &&
      savedData.clip_horizontal.displayed === true
    ) {
      ccg_Animation("out", "horizontal", "clips");
      savedData.clip_horizontal.active = false;
      savedData.clip_horizontal.displayed = false;
    }
  }

  if (type === "vertical") {
    if (
      savedData.nowplaying &&
      savedData.nowplaying.details.current.startTime === null &&
      savedData.clip_vertical.active === true &&
      savedData.clip_vertical.displayed === true
    ) {
      ccg_Animation("out", "vertical", "clips");
      savedData.clip_vertical.active = false;
      savedData.clip_vertical.displayed = false;
    }
  }

  if (type === "overlay") {
    if (
      savedData.nowplaying &&
      savedData.nowplaying.details.current.startTime === null &&
      savedData.clip_overlay.active === true &&
      savedData.clip_overlay.displayed === true
    ) {
      ccg_Animation("out", "overlay", "clips");
      savedData.clip_overlay.active = false;
      savedData.clip_overlay.displayed = false;
    }
  }
}

function ccg_resetAll() {
  // DIMMING /////////////////////////////////////////////

  ccgCommand(CasparCG_Connections.ccg_01, "custom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_horizontal}-50 "#ff000000" CUT 1 Linear RIGHT`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "sendCustom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_vertical}-50 "#ff000000" CUT 1 Linear RIGHT`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    layer: 50,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: 50,
    value: 0,
    duration: 1,
  });

  // MASKING /////////////////////////////////////////////

  ccgCommand(CasparCG_Connections.ccg_01, "play", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_mask,
    clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_general}1Twente.Onmeunige999.Ver.Key.06`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerKeyer", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_mask,
    keyer: 1,
  });

  // OPACITY /////////////////////////////////////////////
  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    value: 0,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_videoBG,
    value: 0,
    duration: 1,
  });

  // START OVERLAYS /////////////////////////////////////////////

  ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
    url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.Overlay.html?edition=TFM`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
    url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.Overlay.html?edition=TFM&video`,
  });

  // START BG'S /////////////////////////////////////////////

  // TEXT TV (HEAVY ON RESOURCES SO NDI FOR NOW)
  // CasparCG_Connections.ccg_01.playHtml({
  //   channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
  //   layer: globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV,
  //   url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.TekstTV.html`,
  // });

  ccgCommand(CasparCG_Connections.ccg_01, "sendCustom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_overlay}-${globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV} ndi://${globalSettings.NDI.tekstTV}`,
  });

  // ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
  //   channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
  //   layer: globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV,
  //   url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.TekstTV.html`,
  // });

  ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_bg,
    url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.BG.html?edition=TFM`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_bg,
    url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.BG.html?vertical&cw&edition=TFM`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "playHtml", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_videoBG,
    url: `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}/templates/1Twente.O999.BG.html?vertical&cw&video-1&edition=TFM`,
  });

  // ROUTE CLIPS /////////////////////////////////////////////
  ccgCommand(CasparCG_Connections.ccg_01, "sendCustom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_overlay}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips} route://${globalSettings.CasparCG.ccg_01.ccgChannel_clips}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips}`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "sendCustom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_horizontal}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips} route://${globalSettings.CasparCG.ccg_01.ccgChannel_clips}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips}`,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "sendCustom", {
    command: `PLAY ${globalSettings.CasparCG.ccg_01.ccgChannel_vertical}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips} route://${globalSettings.CasparCG.ccg_01.ccgChannel_clips}-${globalSettings.CasparCG.ccg_01.ccgLayer_clips}`,
  });

  // POSITION VERTICAL /////////////////////////////////////////////
  ccgCommand(CasparCG_Connections.ccg_01, "mixerRotation", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    value: 90,
    duration: 1,
  });

  ccgCommand(CasparCG_Connections.ccg_01, "mixerFill", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    x: 0.652604,
    y: 0.0138889,
    xScale: 0.548437,
    yScale: 0.548148,
  });
}

function ccg_test() {
  ccgCommand(CasparCG_Connections.ccg_01, "play", {
    channel: globalSettings.CasparCG.ccg_01.ccgChannel_clips,
    layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
    clip: `COLDPLAY`,
    loop: true,
  });

  // setTimeout(() => {
  //   ccg_Animation("in", "horizontal", "clips");
  //   ccg_Animation("in", "vertical", "clips");
  //   // ccg_Animation("in", "overlay", "clips");
  //   // ccg_Animation("in", "overlay", "teksttv");
  // }, 5000);
  // setTimeout(() => {
  //   ccg_Animation("out", "horizontal", "clips");
  //   ccg_Animation("out", "vertical", "clips");
  //   // ccg_Animation("out", "overlay", "clips");
  //   // ccg_Animation("out", "overlay", "teksttv");
  // }, 10000);
}

function ccg_Animation(direction, kind, type) {
  let theChannel = 0;
  if (kind === "overlay" && type === "clips") {
    // ccg_PlayTransition("clips", "overlay");
    theChannel = globalSettings.CasparCG.ccg_01.ccgChannel_overlay;
  } else if (kind === "overlay" && type === "teksttv") {
    ccg_PlayTransition("overlay", "overlay");
    theChannel = globalSettings.CasparCG.ccg_01.ccgChannel_overlay;
  } else if (kind === "horizontal") {
    ccg_PlayTransition("clips", "horizontal");
    theChannel = globalSettings.CasparCG.ccg_01.ccgChannel_horizontal;
  } else if (kind === "vertical") {
    ccg_PlayTransition("clips", "vertical");
    theChannel = globalSettings.CasparCG.ccg_01.ccgChannel_vertical;
  }

  if (direction === "in") {
    setTimeout(() => {
      if (type === "clips") {
        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
          value: 1,
          duration: 1,
        });

        if (kind === "horizontal") {
          ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
            channel: theChannel,
            layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
            value: 1,
            duration: 1,
          });
        }

        if (kind === "vertical") {
          ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
            channel: theChannel,
            layer: globalSettings.CasparCG.ccg_01.ccgLayer_videoBG,
            value: 1,
            duration: 1,
          });
        }
      }

      if (type === "teksttv") {
        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV,
          value: 1,
          duration: 1,
        });

        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
          value: 0,
          duration: 1,
        });
      }
    }, 800);
  }

  if (direction === "out") {
    setTimeout(() => {
      if (type === "clips") {
        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
          value: 0,
          duration: 1,
        });

        if (kind === "horizontal") {
          ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
            channel: theChannel,
            layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
            value: 0,
            duration: 1,
          });
        }

        if (kind === "vertical") {
          ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
            channel: theChannel,
            layer: globalSettings.CasparCG.ccg_01.ccgLayer_videoBG,
            value: 0,
            duration: 1,
          });
        }
      }
      if (type === "teksttv") {
        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_tekstTV,
          value: 0,
          duration: 1,
        });

        ccgCommand(CasparCG_Connections.ccg_01, "mixerOpacity", {
          channel: theChannel,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay,
          value: 1,
          duration: 1,
        });
      }
    }, 1000);
  }
}

function ccg_clearChannels(channels) {
  if (channels) {
    channels.forEach((channel) => {
      if (channel === "overlay") {
        ccgCommand(CasparCG_Connections.ccg_01, "clear", {
          channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
        });
      } else if (channel === "horizontal") {
        ccgCommand(CasparCG_Connections.ccg_01, "clear", {
          channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
        });
      } else if (channel === "vertical") {
        ccgCommand(CasparCG_Connections.ccg_01, "clear", {
          channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
        });
      } else if (channel === "clips") {
        ccgCommand(CasparCG_Connections.ccg_01, "clear", {
          channel: globalSettings.CasparCG.ccg_01.ccgChannel_clips,
        });
      }
    });
  } else {
    ccgCommand(CasparCG_Connections.ccg_01, "clear", {
      channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
    });
    ccgCommand(CasparCG_Connections.ccg_01, "clear", {
      channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
    });
    ccgCommand(CasparCG_Connections.ccg_01, "clear", {
      channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
    });
    ccgCommand(CasparCG_Connections.ccg_01, "clear", {
      channel: globalSettings.CasparCG.ccg_01.ccgChannel_clips,
    });
  }
}

function ccg_PlayTransition(type, kind) {
  if (type === "clips") {
    if (kind === "overlay") {
      ccgCommand(CasparCG_Connections.ccg_01, "play", {
        channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
        layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips_transition,
        clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_general}1T.O999.TRANS.HOR`,
      });
    }

    if (kind === "horizontal") {
      ccgCommand(CasparCG_Connections.ccg_01, "play", {
        channel: globalSettings.CasparCG.ccg_01.ccgChannel_horizontal,
        layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay_transition,
        clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_general}1T.O999.TRANS.HOR`,
      });
    }

    if (kind === "vertical") {
      ccgCommand(CasparCG_Connections.ccg_01, "play", {
        channel: globalSettings.CasparCG.ccg_01.ccgChannel_vertical,
        layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips_transition,
        clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_general}1T.O999.TRANS.VER`,
      });
    }
  }

  if (type === "overlay") {
    if (kind === "overlay") {
      ccgCommand(CasparCG_Connections.ccg_01, "play", {
        channel: globalSettings.CasparCG.ccg_01.ccgChannel_overlay,
        layer: globalSettings.CasparCG.ccg_01.ccgLayer_overlay_transition,
        clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_general}1T.O999.TRANS.HOR`,
      });
    }
  }
}

// CCG CONNECTOR !checken - SocketIO!
function ccgConnector(server, callback) {
  // CASPARCG SETUP NEW CONNECTION
  if (server === 1) {
    if (CasparCG_Connections.ccg_01 == null) {
      CasparCG_Connections.ccg_01 = new CasparCG({
        host: globalSettings.CasparCG.ccg_01.server,
        port: globalSettings.CasparCG.ccg_01.port_AMCP,
        autoConnect: true,
        autoReconnect: true,
        autoReconnectInterval: 1000,
        autoReconnectAttempts: Infinity,
      });
      // CASPARCG SETUP CONNECT
      CasparCG_Connections.ccg_01.connect();

      CasparCG_Connections.ccg_01.on("connect", function (connection) {
        callback(undefined, 200);
      });

      CasparCG_Connections.ccg_01.on("error", function (error) {
        console.log(error);
      });
    }
  }
}

async function ccgCommand(ccgConnection, command, options) {
  if (command === "play") {
    const { error, request } = await ccgConnection.play(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "sendCustom") {
    const { error, request } = await ccgConnection.sendCustom(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "mixerOpacity") {
    const { error, request } = await ccgConnection.mixerOpacity(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "mixerKeyer") {
    const { error, request } = await ccgConnection.mixerKeyer(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "mixerRotation") {
    const { error, request } = await ccgConnection.mixerRotation(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "mixerFill") {
    const { error, request } = await ccgConnection.mixerFill(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "playHtml") {
    const { error, request } = await ccgConnection.playHtml(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }

  if (command === "clear") {
    const { error, request } = await ccgConnection.clear(options);
    if (error) {
      console.log("Error when sending", error);
    } else {
      const response = await request;
      // console.log(response);
    }
  }
}

function initOSC() {
  const udpPort = new osc.UDPPort({
    localAddress: globalSettings.CasparCG.ccg_01.server,
    localPort: globalSettings.CasparCG.ccg_01.port_OSC,
  });

  udpPort.on("message", (oscMsg) => {
    if (
      oscMsg.address.startsWith(
        `/channel/${globalSettings.CasparCG.ccg_01.ccgChannel_clips}/stage/layer/${globalSettings.CasparCG.ccg_01.ccgLayer_clips}/foreground/file/time`
      )
    ) {
      // console.log((savedData.clipTime = oscMsg.args));
    }
    // console.log("Received OSC message:", oscMsg.address);
    // Handle your OSC messages here
    // oscMsg will have address and args properties
  });

  udpPort.on("error", (err) => {
    console.error("OSC error:", err);
  });

  udpPort.open();
  console.log(
    `Listening for OSC messages on port ${globalSettings.CasparCG.ccg_01.port_OSC}`
  );
}

function socketIOConnector() {
  let socketIO_Connection = io.connect(
    `http://${globalSettings.appserver.host}:${globalSettings.appserver.ui}`,
    {
      reconnection: true,
      reconnectionDelay: 10000,
      query: {
        room: "CasparCG",
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

  // DATA | EPG
  socketIO_Connection.on("nowplaying", (nowplaying_Received) => {
    console.log("=== NOWPLAYING RECEIVED!!!");
    console.log(nowplaying_Received);

    if (
      !savedData.nowplaying ||
      (nowplaying_Received &&
        nowplaying_Received.method === "WatHoordeIk.Omni" &&
        savedData.nowplaying.details.current.startTime !=
          nowplaying_Received.details.current.startTime)
    ) {
      savedData.nowplaying = nowplaying_Received;
      savedData.clip_overlay.active = false;
      savedData.clip_overlay.displayed = false;
      savedData.clip_horizontal.active = false;
      savedData.clip_horizontal.displayed = false;
      savedData.clip_vertical.active = false;
      savedData.clip_vertical.displayed = false;

      if (
        savedData.nowplaying &&
        savedData.nowplaying.enrichment &&
        savedData.nowplaying.enrichment.metadata &&
        savedData.nowplaying.enrichment.metadata.filename &&
        savedData.nowplaying.enrichment.metadata.filename != null &&
        savedData.nowplaying.enrichment.metadata.filename != ""
      ) {
        ccgCommand(CasparCG_Connections.ccg_01, "play", {
          channel: globalSettings.CasparCG.ccg_01.ccgChannel_clips,
          layer: globalSettings.CasparCG.ccg_01.ccgLayer_clips,
          clip: `${globalSettings.CasparCG.ccg_01.mediaFolder_musicVideos}${savedData.nowplaying.enrichment.metadata.filename}`,
          seek: 225,
        });
      }
    }
  });

  // API
  socketIO_Connection.on("api", (apiData) => {
    if (apiData.component === "ccg" && apiData.action === "reset") {
      if (apiData.variable === "all") {
        ccg_resetAll();
      }
    }

    if (apiData.component === "ccg" && apiData.action === "clear") {
      if (
        !apiData.variable ||
        apiData.variable === "" ||
        apiData.variable === "all"
      ) {
        ccg_clearChannels();
      } else if (apiData.variable === "overlay") {
        ccg_clearChannels(["overlay"]);
      } else if (apiData.variable === "horizontal") {
        ccg_clearChannels(["horizontal"]);
      } else if (apiData.variable === "vertical") {
        ccg_clearChannels(["vertical"]);
      } else if (apiData.variable === "screens") {
        ccg_clearChannels(["vertical", "horizontal"]);
      } else if (apiData.variable === "clips") {
        ccg_clearChannels(["clips"]);
      }
    }

    if (apiData.component === "ccg" && apiData.action === "test") {
      ccg_test();
    }
  });

  socketIO_Connection.on("usersettings", (usersettings) => {
    savedData.clip_overlay.offset_start =
      usersettings.animation.offsets.clips_overlay.start;
    savedData.clip_overlay.offset_end =
      usersettings.animation.offsets.clips_overlay.end;

    savedData.clip_horizontal.offset_start =
      usersettings.animation.offsets.clips_horizontal.start;
    savedData.clip_horizontal.offset_end =
      usersettings.animation.offsets.clips_horizontal.end;

    savedData.clip_vertical.offset_start =
      usersettings.animation.offsets.clips_vertical.start;
    savedData.clip_vertical.offset_end =
      usersettings.animation.offsets.clips_vertical.end;
  });
}
////////////////////////////////////////////////////////////////////////////////////
// OTHER FUNCTIONS /////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////
