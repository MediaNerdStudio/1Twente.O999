require("dotenv").config();

// Main Settings
module.exports = {
  appserver: {
    host: "10.105.20.151",
    ui: process.env.PORT_WEBSERVER_MAIN,
    jsonparser: process.env.PORT_WEBSERVER_JSONPARSER,
    casparCG: process.env.PORT_WEBSERVER_CASPARCG,
  },
  API: {
    Spotify: {
      clientId: "474b3c05469b4ae9876628665f897da4",
      clientSecret: "7d13d11ca2b54ec48f9a09d8c6a4152f",
    },
    nowplaying: process.env.HOST_WATHOORDEIK,
    EenTwente: {
      // baseURL: "https://beta-v2-api.1twente.nl/api",
      baseURL: "https://prod-v2-api.1twente.nl/api",
      newsOverview: "/news/overview",
      newsItem: "/news/",
      nowplaying: {
        enschede: {
          last: "/radio/enschede/nowplaying/latest-1",
          last_5: "/radio/enschede/nowplaying/latest-5",
          last_10: "/radio/enschede/nowplaying/latest-10",
        },
      },
      EPG: {
        enschede: {
          OnAir: "/radio/enschede/epg/onair",
          Upcoming: "/radio/enschede/epg/upcoming",
          Today: "/radio/enschede/epg/today",
          Tomorrow: "/radio/enschede/epg/",
        },
        hengelo: {
          OnAir: "/radio/hengelo/epg/onair",
          Upcoming: "/radio/hengelo/epg/upcoming",
          Today: "/radio/hengelo/epg/today",
          Tomorrow: "/radio/hengelo/epg/",
        },
        twentefm: {
          OnAir: "/radio/twentefm/epg/onair",
          Upcoming: "/radio/twentefm/epg/upcoming",
          Today: "/radio/twentefm/epg/today",
          Tomorrow: "/radio/twentefm/epg/",
        },
      },
    },
  },

  CasparCG: {
    ccg_01: {
      server: process.env.CCG_01_IP,
      port_AMCP: process.env.CCG_01_AMCP,
      port_OSC: process.env.CCG_01_OSC,
      ccgChannel_overlay: 1,
      ccgChannel_horizontal: 2,
      ccgChannel_vertical: 3,
      ccgChannel_clips: 4,
      ccgLayer_clips: 20, // Transition Video Layer
      ccgLayer_mask: 19,
      ccgLayer_videoBG: 15,
      ccgLayer_tekstTV: 15,
      ccgLayer_overlay: 30,
      ccgLayer_bg: 1,
      ccgLayer_clips_transition: 25,
      ccgLayer_overlay_transition: 31,
      mediaFolder_general: process.env.CCG_01_MEDIAFOLDER_GENERAL,
      mediaFolder_musicVideos: process.env.CCG_01_MEDIAFOLDER_MUSICVIDEOS,
    },
  },
  NDI: {
    tekstTV: process.env.NDI_TEKSTTV,
  },
  uploadFolder: "./CCG/Upload/",
  mediaFolder: "./CCG/Media/",
  transitionsFolder: "./CCG/Media/Transitions/",
  templatesFlashFolder: "./CCG/Templates/",
  templatesHTMLFolder: "./CCG/Templates/HTML/",
};
