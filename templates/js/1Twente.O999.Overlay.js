// http://192.168.88.7:8080/templates/1Twente.O999.Overlay.html?vertical
// http://192.168.88.7:8080/templates/1Twente.O999.Overlay.html?vertical&cw
// http://192.168.88.7:8080/templates/1Twente.O999.Overlay.html?vertical&ccw

"use strict;";

moment.locale("nl");
moment.updateLocale("nl", {
  weekdaysShort: "Zon_Maa_Din_Woe_Don_Vrij_Zat".split("_"),
  weekdays: [
    "Zondag",
    "Maandag",
    "Dinsdag",
    "Woensdag",
    "Donderdag",
    "Vrijdag",
    "Zaterdag",
  ],
});
moment.tz.setDefault("Europe/Amsterdam");

let globalSettings = null;

let localSettings = {
  clockTime: null,
  clockDate_01: null,
  clockDate_02: null,
  widths: {
    dateEPG_date: $(".rowTimeDateEPG .dateEPG .date .content").width() + 32,
    dateEPG_EPG: $(".rowTimeDateEPG .dateEPG .EPG .content").width() + 32,
  },
  nowPlayingData: null,
  nowPlayingData_WatHoordeIk: null,
  omniData: null,
  carousel: [
    // "carousel_Voterinfo",
    "carousel_News",
    "carousel_Stats",
    "carousel_Inbox",
    "carousel_News",
    "carousel_News",
    "carousel_Stats",
    // "carousel_Stats",
    // "carousel_News",
    "carousel_Inbox",
    // "carousel_Voterinfo",
    // "carousel_News",
    // "carousel_News",
    // "carousel_Stats",
    // "carousel_Upcoming",

    // "carousel_Voterinfo",
    // "carousel_News",
    // "carousel_Trackinfo",
    // "carousel_Inbox",
    // "carousel_News",
    // "carousel_News",
    // "carousel_Voterinfo",
    // "carousel_News",
    // "carousel_News",
    // "carousel_Stats",
    // "carousel_Upcoming",
  ],
  carousel_count: 0,
  carousel_news_count: 0,
  newsItemsFull: [],
  EPG: null,
  edition: false,
  socialMessages: null,
};

init();

const pageURL = window.location.search;
const urlParams = new URLSearchParams(pageURL);
if (urlParams.get("dev") != undefined) {
  $(".canvas").css("background-color", "rgba(0, 0, 0, 0.2)");
  play();
}

if (urlParams.get("video") != undefined) {
  console.log("VIDEO");

  $(".canvas").addClass("video");
}

if (urlParams.get("vertical") != undefined) {
  $(".canvas").addClass("vertical");
  gsap.to(".canvas.vertical .rowTimeDateEPG, .canvas.vertical .rowNPCarousel", {
    duration: 0,
    transformOrigin: "0 0",
    scale: 0.8,
    x: -40,
  });

  gsap.to(".canvas.vertical .rowNPCarousel", {
    duration: 0,
    y: 30,
  });
}

if (urlParams.get("cw") != undefined) {
  gsap.to(".canvas", {
    x: 1920,
    rotation: 90,
    duration: 0,
    transformOrigin: "0 0",
  });
}

if (urlParams.get("ccw") != undefined) {
  gsap.to(".canvas", {
    y: 1080,
    rotation: -90,
    duration: 0,
    transformOrigin: "0 0",
  });
}

if (urlParams.get("edition") != undefined) {
  if (urlParams.get("edition") === "ALL") {
    localSettings.edition = false;
  } else if (urlParams.get("edition") === "ENS") {
    localSettings.edition = "ENS";
  } else if (urlParams.get("edition") === "HEN") {
    localSettings.edition = "HEN";
  } else if (urlParams.get("edition") === "TFM") {
    localSettings.edition = "TFM";
  }
}

function play() {}

function stop() {}

function update(updateData) {
  let incomingData = JSON.parse(updateData);
}

function init() {
  // INIT SOCKETIO CONNECTION
  socketIOConnector();

  // START CLOCK / DATE UPDATER
  updateClock();

  // START DATE EPG ANIMATION
  animation_dateEPG(20000);

  //   START SOCIAL ANIMATION
  setTimeout(() => {
    animation_carousel("first");
  }, 1000);

  // TIMER || 100MS
  timexe(`* * * * * * /100`, () => {
    updateClock();
  });

  // TIMER || 4S
  timexe(`* * * * * /9`, () => {
    animation_carousel();
  });

  animate_NowPlaying_Position_reset();

  // TEST DINGEN
  // animate_NowPlaying_Position_in();
  // setTimeout(() => {
  //   animate_NowPlaying_Position_out();
  // }, 3000);
}

// CAROUSELDATA | SWITCHER
function carouselData(type) {
  if (type === "carousel_Inbox") {
    return carousel_Inbox(random_item(localSettings.socialMessages));
  } else if (type === "carousel_News") {
    let returnData = carousel_News(
      localSettings.newsItemsFull[localSettings.carousel_news_count]
    );
    if (localSettings.carousel_news_count < 9) {
      localSettings.carousel_news_count++;
    } else {
      localSettings.carousel_news_count = 0;
    }
    return returnData;
  } else if (type === "carousel_Stats") {
    if (
      !localSettings.omniData ||
      !localSettings.omniData.enrichment ||
      !localSettings.omniData.enrichment.metadata ||
      !localSettings.omniData.enrichment.metadata.stats
    ) {
      return carousel_Inbox(random_item(localSettings.socialMessages));
    } else {
      return carousel_Stats(localSettings.omniData.enrichment.metadata.stats);
    }
  } else if (type === "carousel_Voterinfo") {
    return carousel_Voterinfo();
  } else if (type === "carousel_Trackinfo") {
    return carousel_Trackinfo(localSettings.nowPlayingData[0]);
  } else if (type === "carousel_Upcoming") {
    return carousel_Upcoming(11);
  }
}

function random_item(items) {
  return items[Math.floor(Math.random() * items.length)];
}

////////////////// ANIMATIONS //////////////////////////

function animation_dateEPG(duration) {
  setTimeout(() => {
    localSettings.widths.dateEPG_date =
      $(".rowTimeDateEPG .dateEPG .date .content").width() + 32;
    localSettings.widths.dateEPG_EPG =
      $(".rowTimeDateEPG .dateEPG .EPG .content").width() + 32;

    gsap.to(".rowTimeDateEPG .dateEPG .bg", {
      width: `${localSettings.widths.dateEPG_date}px`,
      duration: 0.3,
    });
  }, 100);

  setTimeout(() => {
    animation_dateEPG_ALL();

    setInterval(() => {
      animation_dateEPG_ALL();
    }, duration);
  }, duration / 2);

  function animation_dateEPG_ALL() {
    animation_dateEPG_EPG();

    setTimeout(() => {
      animation_dateEPG_DATE();
    }, duration / 2);
  }

  function animation_dateEPG_EPG() {
    localSettings.widths.dateEPG_date =
      $(".rowTimeDateEPG .dateEPG .date .content").width() + 32;
    localSettings.widths.dateEPG_EPG =
      $(".rowTimeDateEPG .dateEPG .EPG .content").width() + 32;

    let dateEPG_TL = gsap.timeline({ repeat: 0 });
    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .date", { y: 0, duration: 0 });
    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .EPG", { y: 62, duration: 0 });
    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .date", {
      y: -62,
      duration: 0.5,
    });
    dateEPG_TL.to(
      ".rowTimeDateEPG .dateEPG .bg",
      {
        width: `${localSettings.widths.dateEPG_EPG}px`,
        duration: 0.5,
        ease: "power4.inOut",
      },
      "-=0.4"
    );
    dateEPG_TL.to(
      ".rowTimeDateEPG .dateEPG .EPG",
      {
        y: -62,
        duration: 0.5,
      },
      "-=0.4"
    );
  }

  function animation_dateEPG_DATE() {
    localSettings.widths.dateEPG_date =
      $(".rowTimeDateEPG .dateEPG .date .content").width() + 32;
    localSettings.widths.dateEPG_EPG =
      $(".rowTimeDateEPG .dateEPG .EPG .content").width() + 32;

    let dateEPG_TL = gsap.timeline({ repeat: 0 });
    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .date", { y: 62, duration: 0 });
    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .EPG", { y: -62, duration: 0 });

    dateEPG_TL.to(".rowTimeDateEPG .dateEPG .EPG", {
      y: -124,
      duration: 0.5,
    });

    dateEPG_TL.to(
      ".rowTimeDateEPG .dateEPG .bg",
      {
        width: `${localSettings.widths.dateEPG_date}px`,
        duration: 0.5,
        ease: "power4.inOut",
      },
      "-=0.4"
    );

    dateEPG_TL.to(
      ".rowTimeDateEPG .dateEPG .date",
      {
        y: -0,
        duration: 0.5,
      },
      "-=0.4"
    );
  }
}

function animation_songsUpcoming() {
  gsap.fromTo(
    ".carousel .item.upcoming .body .songs",
    {
      y: 0,
    },
    {
      y: -388,
      duration: 2,
    }
  );
}

function animate_NowPlaying_Position_reset() {
  gsap.to(".rowNPCarousel .nowplaying .position .content", {
    y: 100,
    duration: 0,
  });
  gsap.to(".rowNPCarousel .nowplaying .position", {
    width: 0,
    duration: 0,
  });
}

function animate_NowPlaying_Position_in() {
  let NP_Position_TL = gsap.timeline({ repeat: 0 });

  NP_Position_TL.to(".rowNPCarousel .nowplaying .position", {
    width: 130,
    duration: 1.2,
    ease: "power4.inOut",
  });
  NP_Position_TL.to(".rowNPCarousel .nowplaying .position .content", {
    y: 0,
    duration: 1,
    ease: "power4.out",
    delay: -0.1,
  });
}

function animate_NowPlaying_Position_out() {
  let NP_Position_TL = gsap.timeline({ repeat: 0 });

  NP_Position_TL.to(".rowNPCarousel .nowplaying .position .content", {
    y: -100,
    duration: 1,
    ease: "power4.in",
  });
  NP_Position_TL.to(".rowNPCarousel .nowplaying .position", {
    width: 0,
    duration: 1.2,
    ease: "power4.inOut",
    delay: -0.3,
  });
}

function animation_carousel(action) {
  if (action === "first") {
    let social_TL = gsap.timeline({ repeat: 0 });
    social_TL.to(".carousel .content", { y: 150, duration: 0 });
    $(".carousel .content").append(
      carouselData(localSettings.carousel[localSettings.carousel_count])
    );

    gsap.to(".carousel .content", { y: 0, duration: 2, ease: "power4.inOut" });
  } else {
    $(".carousel .content").append(
      carouselData(localSettings.carousel[localSettings.carousel_count])
    );
    if (
      localSettings.carousel[localSettings.carousel_count] ===
      "carousel_Upcoming"
    ) {
      setTimeout(() => {
        animation_songsUpcoming();
      }, 1000);
    }
    let social_TL = gsap.timeline({ repeat: 0 });
    social_TL.to(".carousel .content", {
      y: -150,
      duration: 2,
      ease: "power4.inOut",
    });
    social_TL.add(() => {
      $(".carousel .content .item:nth-child(1)").remove();
      social_TL.to(".carousel .content", { y: 0, duration: 0 });
    });
  }

  if (!localSettings.carousel[localSettings.carousel_count + 1]) {
    localSettings.carousel_count = 0;
  } else {
    localSettings.carousel_count++;
  }
}

////////////////// OTHER FUNCTIONS //////////////////////////
function updateClock() {
  if (localSettings.clockTime != moment().format("HH:mm:ss")) {
    localSettings.clockTime = moment().format("HH:mm:ss");
    $(".rowTimeDateEPG .clock").html(moment().format("HH:mm:ss"));
  }

  if (localSettings.clockDate_01 != moment().format("dddd")) {
    localSettings.clockDate_01 = moment().format("dddd");
    localSettings.clockDate_02 = moment().format("D MMMM");
    $(".rowTimeDateEPG .dateEPG .date h2").html(localSettings.clockDate_01);
    $(".rowTimeDateEPG .dateEPG .date h1").html(localSettings.clockDate_02);
  }
}

function updateNowPlaying() {
  if (localSettings.nowPlayingData) {
    $(`.rowNPCarousel .nowplaying .info .artist .text`).html(
      localSettings.nowPlayingData[0].artist
    );
    $(`.rowNPCarousel .nowplaying .info .title .text`).html(
      localSettings.nowPlayingData[0].title
    );
    if (
      localSettings.nowPlayingData[0].previewImage &&
      localSettings.nowPlayingData[0].previewImage != null
    ) {
      $(`.rowNPCarousel .nowplaying .albumart .art img`).attr(
        "src",
        localSettings.nowPlayingData[0].previewImage
      );
    } else {
      if (
        localSettings.nowPlayingData_WatHoordeIk &&
        localSettings.nowPlayingData_WatHoordeIk[0] &&
        localSettings.nowPlayingData_WatHoordeIk[0].enrichment &&
        localSettings.nowPlayingData_WatHoordeIk[0].enrichment.spotify
      ) {
        $(`.rowNPCarousel .nowplaying .albumart .art img`).attr(
          "src",
          localSettings.nowPlayingData_WatHoordeIk[0].enrichment.spotify.image_l
        );
      } else {
        $(`.rowNPCarousel .nowplaying .albumart .art img`).attr(
          "src",
          "./img/1Twente.NoAlbumArt.png"
        );
      }
    }

    if (
      localSettings.nowPlayingData[0].enrichment &&
      localSettings.nowPlayingData[0].enrichment.positie
    ) {
      let positie = localSettings.nowPlayingData[0].enrichment.positie
        .toString()
        .padStart(3, "0");
      $(`.rowNPCarousel .nowplaying .info .position .content`).html(
        `#${positie}`
      );
      animate_NowPlaying_Position_in();
    } else {
      animate_NowPlaying_Position_out();
    }
  }

  // WATHOORDE IK
  // if (localSettings.nowPlayingData) {
  //   $(`.rowNPCarousel .nowplaying .info .artist .text`).html(
  //     localSettings.nowPlayingData[0].artist
  //   );
  //   $(`.rowNPCarousel .nowplaying .info .title .text`).html(
  //     localSettings.nowPlayingData[0].title
  //   );
  //   if (
  //     localSettings.nowPlayingData[0].enrichment &&
  //     localSettings.nowPlayingData[0].enrichment.spotify
  //   ) {
  //     $(`.rowNPCarousel .nowplaying .albumart .art img`).attr(
  //       "src",
  //       localSettings.nowPlayingData[0].enrichment.spotify.image_l
  //     );
  //   } else {
  //     $(`.rowNPCarousel .nowplaying .albumart .art img`).attr(
  //       "src",
  //       "./img/1Twente.NoAlbumArt.png"
  //     );
  //   }
  //   if (
  //     localSettings.omniData &&
  //     localSettings.omniData.enrichment &&
  //     localSettings.omniData.enrichment.metadata &&
  //     localSettings.omniData.enrichment.metadata.positie &&
  //     localSettings.omniData.enrichment.metadata.positie != 0 &&
  //     localSettings.omniData.enrichment.metadata.positie != null
  //   ) {
  //     let positie = localSettings.omniData.enrichment.metadata.positie
  //       .toString()
  //       .padStart(3, "0");
  //     $(`.rowNPCarousel .nowplaying .info .position .content`).html(
  //       `#${positie}`
  //     );
  //     animate_NowPlaying_Position_in();
  //   } else {
  //     animate_NowPlaying_Position_out();
  //   }
  // }
}

function updateNowPlaying_OMNI() {
  if (
    localSettings.omniData &&
    localSettings.omniData.enrichment &&
    localSettings.omniData.enrichment.metadata &&
    localSettings.omniData.enrichment.metadata.positie &&
    localSettings.omniData.enrichment.metadata.positie != 0 &&
    localSettings.omniData.enrichment.metadata.positie != null
  ) {
    let positie = localSettings.omniData.enrichment.metadata.positie
      .toString()
      .padStart(3, "0");
    $(`.rowNPCarousel .nowplaying .info .position .content`).html(
      `#${positie}`
    );
    animate_NowPlaying_Position_in();
  } else {
    animate_NowPlaying_Position_out();
  }
}

function handleEPGData() {
  let edition;
  if (localSettings.edition === false) {
    edition = "enschede";
  } else if (localSettings.edition === "ENS") {
    edition = "enschede";
  } else if (localSettings.edition === "HEN") {
    edition = "hengelo";
  } else if (localSettings.edition === "TFM") {
    edition = "twentefm";
  }

  let programData = localSettings.EPG[edition].OnAir;
  let epgData = {
    program: null,
    presenters: null,
  };
  if (programData != null) {
    epgData.program = programData.title;
    if (programData.programLink != null) {
      if (programData.programLink.presenters != null) {
        let presenters = [];

        programData.programLink.presenters.forEach((presenter) => {
          presenters.push(presenter.fullName);
        });
        epgData.presenters = presenters.join(" & ");
      } else {
        epgData.presenters = programData.programLink.presenter;
      }
    }
  }

  if (epgData.presenters != null) {
    $(".rowTimeDateEPG .dateEPG .EPG .content").html(
      `<h1>${epgData.program}</h1><h2>${epgData.presenters}</h2>`
    );
  } else {
    $(".rowTimeDateEPG .dateEPG .EPG .content").html(
      `<h1>${epgData.program}</h1>`
    );
  }
}

TimelineLite.prototype.wait = function (position) {
  return this.set({}, {}, position);
};

// SOCKETIO CONNECTOR ########################################
function socketIOConnector() {
  // // SOCKETIO | INIT
  let socketIO = io.connect(window.location.origin, {
    reconnection: true,
    reconnectionDelay: 10000,
    query: {
      room: "templates",
    },
  });
  // SOCKETIO | MESSAGE | CONNECT
  socketIO.on("connect", function (data) {
    console.log(
      `${moment().format(
        "YYYY-MM-DD, HH:mm:ss.SSS"
      )}\tSocketIO\tConnected To UI Server`
    );
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|epg`, (epgDataReceived) => {
    localSettings.EPG = epgDataReceived;
    handleEPGData();
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|news`, (newsDataReceived) => {
    localSettings.newsItemsFull = newsDataReceived;
  });

  socketIO.on(`nowplaying`, (nowPlayingDataReceived) => {
    localSettings.omniData = nowPlayingDataReceived;
    // updateNowPlaying_OMNI();
  });

  socketIO.on(`nowplaying_cleaned`, (nowPlayingDataReceived) => {
    localSettings.nowPlayingData = nowPlayingDataReceived;

    updateNowPlaying();
  });

  socketIO.on(`globalsettings`, (globalsettingsReceived) => {
    globalSettings = globalsettingsReceived;
    socketIOConnector_WatHoordeIk();
  });

  socketIO.on(`socialMessages`, (socialMessages) => {
    localSettings.socialMessages = socialMessages;
  });
}

function socketIOConnector_WatHoordeIk() {
  // SOCKETIO | INIT
  let socketIO_WatHoordeIk = io.connect(globalSettings.API.nowplaying, {
    reconnection: true,
    reconnectionDelay: 10000,
    query: {
      component: "NowPlaying",
      module: "Overview",
      station: "All",
      target: undefined,
      songLimit: 10,
    },
  });

  // SOCKETIO | MESSAGE | CONNECT
  socketIO_WatHoordeIk.on("connect", function (data) {
    console.log(
      `${moment().format(
        "YYYY-MM-DD, HH:mm:ss.SSS"
      )}\tSocketIO\tConnected To NowPlaying Server`
    );
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO_WatHoordeIk.on(
    `NowPlaying.1Twente ENS.History`,
    (nowPlayingDataReceived) => {
      if (
        !localSettings.nowPlayingData_WatHoordeIk ||
        (nowPlayingDataReceived &&
          nowPlayingDataReceived != null &&
          localSettings.nowPlayingData_WatHoordeIk[0].startTime)
      ) {
        localSettings.nowPlayingData_WatHoordeIk = nowPlayingDataReceived;
        updateNowPlaying();
      }
    }
  );
}
