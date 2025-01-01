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
  nowPlayingData: null,
  nowPlayingData_WatHoordeIk: null,
  omniData: null,
  // carousel: ["news"],
  // carousel: ["nowplaying", "news"],
  carousel: ["news", "epg now", "epg next", "news", "nowplaying"],
  carousel_current: null,
  carousel_count: 0,
  carousel_news_count: 0,
  newsItemsFull: [],
  EPG: {
    OnAir: null,
    Upcoming: null,
    Today: null,
    Tomorrow: null,
  },
};

init();
const pageURL = window.location.search;
const urlParams = new URLSearchParams(pageURL);
if (urlParams.get("dev") != undefined) {
  $(".canvas").css("background-color", "rgba(0, 0, 0, 0.2)");
  play();
}

function play() {}

function stop() {}

function update(updateData) {
  let incomingData = JSON.parse(updateData);
}

function init() {
  // INIT SOCKETIO CONNECTION
  socketIOConnector();
  animation_news_reset();
  animation_nowplaying_reset();
  animation_epg_now_reset();
  animation_epg_next_reset();

  setTimeout(() => {
    animation_carousel("first");
  }, 1000);

  // TIMER || 4S
  // timexe(`* * * * *`, () => {
  timexe(`* * * * * /10`, () => {
    animation_carousel();
  });
}

function animation_carousel(action) {
  if (action === "first") {
    console.log(
      `${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}\t | CAROUSEL > FIRST | ${
        localSettings.carousel[localSettings.carousel_count]
      }`
    );
    if (localSettings.carousel[localSettings.carousel_count] === "news") {
      news_fill_content(
        localSettings.newsItemsFull[localSettings.carousel_news_count]
      );
      animation_news_in();
    }
    if (localSettings.carousel[localSettings.carousel_count] === "nowplaying") {
      animation_nowplaying_in();
    }

    if (localSettings.carousel[localSettings.carousel_count] === "epg now") {
      animation_epg_now_in();
    }
    carousel_updateState();
  } else {
    console.log(
      `${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}\t | CAROUSEL > NEXT | ${
        localSettings.carousel_current
      } | ${localSettings.carousel[localSettings.carousel_count]}`
    );
    if (localSettings.carousel_current === "nowplaying") {
      animation_nowplaying_out();
    }

    if (localSettings.carousel_current === "epg now") {
      animation_epg_now_out();
    }

    if (localSettings.carousel_current === "epg next") {
      animation_epg_next_out();
    }

    if (
      localSettings.carousel_current === "news" &&
      localSettings.carousel[localSettings.carousel_count] != "news"
    ) {
      animation_news_out();
    }

    if (
      localSettings.carousel_current === "news" &&
      localSettings.carousel[localSettings.carousel_count] === "news"
    ) {
      animation_news_item_out();
    }

    setTimeout(() => {
      carousel_NextItem();
    }, 2000);
  }
}

function carousel_updateState() {
  localSettings.carousel_current =
    localSettings.carousel[localSettings.carousel_count];

  if (!localSettings.carousel[localSettings.carousel_count + 1]) {
    localSettings.carousel_count = 0;
  } else {
    localSettings.carousel_count++;
  }
}

function carousel_NextItem() {
  if (localSettings.carousel[localSettings.carousel_count] === "nowplaying") {
    animation_nowplaying_in();
  }

  if (localSettings.carousel[localSettings.carousel_count] === "epg now") {
    animation_epg_now_in();
  }

  if (localSettings.carousel[localSettings.carousel_count] === "epg next") {
    animation_epg_next_in();
  }

  if (
    localSettings.carousel_current != "news" &&
    localSettings.carousel[localSettings.carousel_count] === "news"
  ) {
    news_fill_content(
      localSettings.newsItemsFull[localSettings.carousel_news_count]
    );
    setTimeout(() => {
      animation_news_in();
    }, 500);
  }

  if (
    localSettings.carousel_current === "news" &&
    localSettings.carousel[localSettings.carousel_count] === "news"
  ) {
    news_fill_content(
      localSettings.newsItemsFull[localSettings.carousel_news_count]
    );
    setTimeout(() => {
      animation_news_item_in();
    }, 500);
  }

  carousel_updateState();
}

function animation_news_reset() {
  gsap.to(".news .pill", { x: 700, opacity: 1, duration: 0 });
  gsap.to(".news .items", { y: 1080, duration: 0 });
}

function animation_news_in() {
  animation_news_reset();
  gsap.fromTo(
    ".news .pill",
    { x: 700 },
    {
      x: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".news .items",
    { y: 1080 },
    {
      y: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
}

function animation_news_out() {
  gsap.fromTo(
    ".news .pill",
    { x: 0 },
    {
      x: 700,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".news .items",
    { y: 0 },
    {
      y: 1080,
      duration: 1,
      ease: "power4.in",
    }
  );
}

function animation_news_item_in() {
  gsap.fromTo(
    ".news .items",
    { y: 1080 },
    {
      y: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
}

function animation_news_item_out(callback) {
  gsap.fromTo(
    ".news .items",
    { y: 0 },
    {
      y: 1080,
      duration: 1,
      ease: "power4.in",
    }
  );
}

function news_fill_content(newsData) {
  $(".canvas .news .items").html(tekstTV_NewsItem(newsData));
  if (!localSettings.newsItemsFull[localSettings.carousel_news_count + 1]) {
    localSettings.carousel_news_count = 0;
  } else {
    localSettings.carousel_news_count++;
  }
}

// NOWPLAYING
function animation_nowplaying_reset() {
  gsap.to(".nowplaying .pill", { x: 400, opacity: 1, duration: 0 });
  gsap.to(".nowplaying .current, .nowplaying .previous", {
    y: 1080,
    duration: 0,
  });
}

function animation_nowplaying_in() {
  gsap.fromTo(
    ".nowplaying .pill",
    { x: 400 },
    {
      x: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
  setTimeout(() => {
    gsap.fromTo(
      ".nowplaying .current",
      { y: 1080 },
      {
        y: 0,
        duration: 1.5,
        ease: "power4.out",
      }
    );
  }, 500);
  setTimeout(() => {
    gsap.fromTo(
      ".nowplaying .previous",
      { y: 1080 },
      {
        y: 0,
        duration: 1.5,
        ease: "power4.out",
      }
    );
  }, 1000);
}

function animation_nowplaying_out() {
  gsap.fromTo(
    ".nowplaying .pill",
    { x: 0 },
    {
      x: 400,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".nowplaying .current",
    { opacity: 1, y: 0 },
    {
      opacity: 0,
      y: -100,
      duration: 0.6,
      ease: "power4.in",
    }
  );
  setTimeout(() => {
    gsap.fromTo(
      ".nowplaying .previous",
      { opacity: 1, y: 0 },
      {
        opacity: 0,
        y: -100,
        duration: 0.6,
        ease: "power4.in",
      }
    );
  }, 250);
}

// EPG NOW
function animation_epg_now_reset() {
  gsap.to(".epg.now .pill", { x: 400, opacity: 1, duration: 0 });
  gsap.to(".epg.now .details", {
    x: -1440,
    duration: 0,
  });

  gsap.to(".epg.now .bg_presenter", {
    "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
    duration: 0,
  });
}

function animation_epg_now_in() {
  gsap.fromTo(
    ".epg.now .pill",
    { x: 400 },
    {
      x: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.now .details",
    { x: -1440 },
    {
      x: 0,
      duration: 1.5,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.now .bg_presenter",
    { "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)" },
    {
      "clip-path": "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
      duration: 1.5,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.now .bg_presenter .image",
    { scale: 1 },
    {
      scale: 1.1,
      duration: 12,
    }
  );
}

function animation_epg_now_out() {
  gsap.fromTo(
    ".epg.now .pill",
    { x: 0 },
    {
      x: 400,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".epg.now .details",
    { x: 0 },
    {
      x: -1440,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".epg.now .bg_presenter",
    { "clip-path": "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)" },
    {
      "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
      duration: 1,
      ease: "power4.in",
    }
  );
}

// EPG NEXT
function animation_epg_next_reset() {
  gsap.to(".epg.next .pill", { x: 400, opacity: 1, duration: 0 });
  gsap.to(".epg.next .details", {
    x: -1440,
    duration: 0,
  });

  gsap.to(".epg.next .bg_presenter", {
    "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
    duration: 0,
  });
}

function animation_epg_next_in() {
  gsap.fromTo(
    ".epg.next .pill",
    { x: 400 },
    {
      x: 0,
      duration: 2,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.next .details",
    { x: -1440 },
    {
      x: 0,
      duration: 1.5,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.next .bg_presenter",
    { "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)" },
    {
      "clip-path": "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)",
      duration: 1.5,
      ease: "power4.out",
    }
  );
  gsap.fromTo(
    ".epg.next .bg_presenter .image",
    { scale: 1 },
    {
      scale: 1.1,
      duration: 12,
    }
  );
}

function animation_epg_next_out() {
  gsap.fromTo(
    ".epg.next .pill",
    { x: 0 },
    {
      x: 400,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".epg.next .details",
    { x: 0 },
    {
      x: -1440,
      duration: 1,
      ease: "power4.in",
    }
  );
  gsap.fromTo(
    ".epg.next .bg_presenter",
    { "clip-path": "polygon(13% 0%, 100% 0%, 87% 100%, 0% 100%)" },
    {
      "clip-path": "polygon(13% 0%, 13% 0%, 0% 100%, 0% 100%)",
      duration: 1,
      ease: "power4.in",
    }
  );
}

function updateNowPlaying() {
  let previous = [];

  if (localSettings.nowPlayingData) {
    localSettings.nowPlayingData.forEach((singleNowPlaying, index) => {
      if (index === 0) {
        $(`.nowplaying .current`).html(
          tekstTV_NowPlayingCurrent(
            singleNowPlaying,
            localSettings.nowPlayingData_WatHoordeIk,
            index
          )
        );
      } else if (index < 6) {
        previous.push(
          tekstTV_NowPlayingPrevious(
            singleNowPlaying,
            localSettings.nowPlayingData_WatHoordeIk,
            index
          )
        );
      }
    });
  }

  $(".nowplaying .previous .songs").html(previous.join(""));
}

function updateEPG(edition) {
  updateEPG_NOW(edition);
  updateEPG_NEXT(edition);
}

function updateEPG_NOW(edition) {
  $(".epg.now .details h1").html(localSettings.EPG[edition].OnAir.title);
  $(".epg.now .details h3").html(
    `tot ${moment(localSettings.EPG[edition].OnAir.endsAt)
      .add(-1, "h")
      .format("HH:mm")}`
  );

  if (localSettings.EPG[edition].OnAir.programLink != null) {
    let presenters = [];
    localSettings.EPG[edition].OnAir.programLink.presenters.forEach(
      (presenter) => {
        presenters.push(presenter.fullName);
      }
    );
    $(".epg.now .details h2").html(presenters.join(" & "));
    if (
      localSettings.EPG[edition].OnAir.programLink.presenters[0].pictureBigFill
    ) {
      $(".epg.now .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].OnAir.programLink.presenters[0].pictureBigFill})`
      );
    } else {
      $(".epg.now .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].OnAir.programLink.avatar.thumbnail})`
      );
    }
  } else {
    $(".epg.now .details h2").html("");
    $(".epg.now .bg_presenter .image").attr(
      "style",
      "background-image: url(img/1T.Studio.Placeholder.png)"
    );
  }
}

function updateEPG_NEXT(edition) {
  $(".epg.next .details h1").html(localSettings.EPG[edition].Upcoming.title);
  $(".epg.next .details h3").html(
    `${moment(localSettings.EPG[edition].Upcoming.startsAt)
      .add(-1, "h")
      .format("HH:mm")} - ${moment(localSettings.EPG[edition].Upcoming.endsAt)
      .add(-1, "h")
      .format("HH:mm")}`
  );

  if (localSettings.EPG[edition].Upcoming.programLink != null) {
    let presenters = [];
    localSettings.EPG[edition].Upcoming.programLink.presenters.forEach(
      (presenter) => {
        presenters.push(presenter.fullName);
      }
    );

    $(".epg.next .details h2").html(presenters.join(" & "));
    if (
      localSettings.EPG[edition].Upcoming.programLink.presenters[0]
        .pictureBigFill
    ) {
      $(".epg.next .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].Upcoming.programLink.presenters[0].pictureBigFill})`
      );
    } else {
      $(".epg.next .bg_presenter .image").attr(
        "style",
        `background-image: url(${localSettings.EPG[edition].Upcoming.programLink.avatar.thumbnail})`
      );
    }
  } else {
    $(".epg.next .details h2").html("");
    $(".epg.next .bg_presenter .image").attr(
      "style",
      "background-image: url(img/1T.DJ.02.png)"
    );
  }
}

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
    updateEPG("twentefm");
  });

  // SOCKETIO | MESSAGE | HISTORY
  socketIO.on(`data|news`, (newsDataReceived) => {
    if (localSettings.newsItemsFull.length === 0) {
      localSettings.newsItemsFull = newsDataReceived;
      localSettings.newsItemsFull.sort(dynamicSortMultiple("-postedAt"));
    } else {
      localSettings.newsItemsFull = newsDataReceived;
      localSettings.newsItemsFull.sort(dynamicSortMultiple("-postedAt"));
    }
  });

  // SOCKETIO | MESSAGE | HISTORY
  // socketIO.on(`nowplaying`, (nowPlayingDataReceived) => {
  //   localSettings.omniData = nowPlayingDataReceived;
  //   updateNowPlaying();
  // });

  socketIO.on(`nowplaying_cleaned`, (nowPlayingDataReceived) => {
    localSettings.nowPlayingData = nowPlayingDataReceived;
    updateNowPlaying();
  });

  socketIO.on(`globalsettings`, (globalsettingsReceived) => {
    globalSettings = globalsettingsReceived;
    socketIOConnector_WatHoordeIk();
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

function dynamicSort(property) {
  var sortOrder = 1;
  if (property[0] === "-") {
    sortOrder = -1;
    property = property.substr(1);
  }
  return function (a, b) {
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
    return result * sortOrder;
  };
}

function dynamicSortMultiple() {
  var props = arguments;
  return function (obj1, obj2) {
    var i = 0,
      result = 0,
      numberOfProperties = props.length;
    while (result === 0 && i < numberOfProperties) {
      result = dynamicSort(props[i])(obj1, obj2);
      i++;
    }
    return result;
  };
}
