// CAROUSEL | INBOX
function carousel_Inbox(message) {
  let returnString = `<div class="item inbox">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.Message.svg" width="72" /></div><div class="title">Berichten</div></div>`;
  returnString += `<div class="body"><h1>${message["Naam"]} (${message["Leeftijd"]}), ${message["Woonplaats"]} | ${message["Song"]}</h1><h2>${message["Bericht"]}</h2></div>`;
  returnString += `</div>`;

  // let returnString = `<div class="item inbox">`;
  // returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.Message.svg" width="72" /></div><div class="title">Berichten</div></div>`;
  // returnString += `<div class="body"><h1>hej ook wat te nöaln of te drammn?</h1><h2>stuur een berichtje naar de studio via de 1twente-app</h2></div>`;
  // returnString += `</div>`;
  return returnString;
}

// CAROUSEL | NEWS
function carousel_News(newsItem) {
  let returnString = `<div class="item news">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.News.svg" width="55" /></div><div class="title">1twente.nl</div></div>`;
  returnString += `<div class="image" style="background-image: url('${newsItem.image.url}');"></div>`;
  returnString += `<div class="body"><h1>${newsItem.locations[0].title}</h1><h2>${newsItem.title}</h2></div>`;
  //   returnString += `<div class="qr"><img src="./img/1T.QR.Test.png" width="108" height="108" /></div>`;
  returnString += `</div>`;
  return returnString;
}

// CAROUSEL | STATS
function carousel_Stats(stats) {
  let returnString = `<div class="item stats">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.Stats.svg" width="72" /></div><div class="title">statistieken</div></div>`;
  returnString += `<div class="body"><h1>wist je dat…</h1><h2>${stats}</h2></div>`;
  returnString += `</div>`;
  return returnString;
}

// CAROUSEL | VOTERINFO
function carousel_Voterinfo() {
  let returnString = `<div class="item voterinfo">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.Person.svg" height="72" /></div><div class="title">motivatie</div></div>`;
  returnString += `<div class="body"><h1>naam stemmer</h1><h2>Hier komt de motivatie met hopelijk een mooi verhaal bij deze track door één van de stemmer van de lijst</h2></div>`;
  returnString += `</div>`;
  return returnString;
}

// CAROUSEL | TRACKINFO
function carousel_Trackinfo(nowPlayingData) {
  let returnString = `<div class="item trackinfo">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.O999.svg" height="72" /></div><div class="title">nummerinfo</div></div>`;
  returnString += `<div class="body"><h1>${nowPlayingData.title}</h1><h2>Hier komt een korte stukje achtergrondinfo over de track uit de database en/of Wikipedia (kijk maar even) in max. 2 regels, wanneer langer: deze 2 regels scrollen.</h2></div>`;
  returnString += `</div>`;
  return returnString;
}

function carousel_Upcoming_Single(kind) {
  let returnString = `<div class="singleSong"><div class="mark">`;
  if (kind === "now") {
    returnString += `<img src="./img/1T.Icon.Now.svg" height="21" />`;
  }
  if (kind === "next") {
    returnString += `<img src="./img/1T.Icon.Next.svg" height="21" />`;
  }
  returnString += `</div><div class="position">#998</div><h1>Madonna</h1><h2>Like A virgin</h2></div>`;

  return returnString;
}

// CAROUSEL | UPCOMING
function carousel_Upcoming(total) {
  let returnString = `<div class="item upcoming">`;
  returnString += `<div class="header"><div class="icon"><img src="./img/1T.Icon.O999.svg" height="72" /></div><div class="title">Straks</div></div>`;
  returnString += `<div class="body"><div class="highlight"></div><div class="songs">`;

  for (i = 0; i < total; i++) {
    if (i === total - 3) {
      returnString += carousel_Upcoming_Single("now");
    } else if (i === total - 2) {
      returnString += carousel_Upcoming_Single("next");
    } else {
      returnString += carousel_Upcoming_Single("");
    }
  }

  returnString += `</div><div class="gradient"></div></div></div>`;

  return returnString;
}

function tekstTV_NewsItem(newsItem) {
  let returnString = `<div class="item">`;
  returnString += `<div class="content">`;
  returnString += `<div class="infobox">`;
  returnString += `<div class="image"><img src="${newsItem.image.url}" width="100%" /><div class="gradient"></div></div>`;
  returnString += `<div class="shadow"></div>`;
  returnString += `<div class="location"><p><i class="fa-solid fa-location-dot"></i>${newsItem.locations[0].title}</p></div>`;
  returnString += `<div class="date"><p><i class="fa-duotone fa-solid fa-calendar-days"></i>${moment(
    newsItem.postedAt
  ).format("ddd D MMM H:mm")}</p></div>`;
  returnString += `<div class="author"><p>`;
  if (newsItem.author.photo != null) {
    returnString += `<div class="avatar"><img src="${newsItem.author.photo}" /></div>`;
  }
  returnString += `<i class="fa-solid fa-pen-nib"></i>${newsItem.author.fullName}</p></div>`;
  returnString += `</div>`;

  returnString += `<div class="message">`;
  newsItem.locations.forEach((location) => {
    returnString += `<h3 class="location">${location.title}</h3>`;
  });
  newsItem.themes.forEach((theme) => {
    returnString += `<h3 class="theme">${theme.title}</h3>`;
  });
  returnString += `<h1>${newsItem.title}</h1>${newsItem.intro}`;
  ///////////////// USE BLOCKS ///////////////////////////////
  let blocks = 0;
  let blockcounter = 0;
  newsItem.blocks.forEach((singleBlock) => {
    if (singleBlock.type === "text" && blockcounter < blocks) {
      returnString += singleBlock.text;
      blockcounter++;
    }
  });
  returnString += `</div>`;
  returnString += `</div></div>`;
  return returnString;
}

function tekstTV_NowPlayingCurrent(songInfo, watHoordeIk, index) {
  let returnString = ``;

  if (songInfo.enrichment) {
    let positie = songInfo.enrichment.positie.toString().padStart(3, "0");

    returnString += `<div class="position">`;
    returnString += `<h1>${positie[0]}</h1>`;
    returnString += `<h1>${positie[1]}</h1>`;
    returnString += `<h1>${positie[2]}</h1>`;
    returnString += `</div>`;
  }
  returnString += `<div class="artwork">`;

  if (songInfo.previewImage && songInfo.previewImage != null) {
    returnString += `<img src="${songInfo.previewImage}" />`;
  } else {
    if (
      watHoordeIk &&
      watHoordeIk[index] &&
      watHoordeIk[index].enrichment &&
      watHoordeIk[index].enrichment.spotify
    ) {
      returnString += `<img src="${watHoordeIk[index].enrichment.spotify.image_l}" />`;
    } else {
      returnString += `<img src="./img/1Twente.NoAlbumArt.png" />`;
    }
  }
  returnString += `</div>`;
  returnString += `<div class="metadata">`;
  returnString += `<h1>${songInfo.artist}</h1>`;
  returnString += `<h2>${songInfo.title}</h2>`;
  returnString += `</div>`;
  return returnString;
}

function tekstTV_NowPlayingPrevious(songInfo, watHoordeIk, index) {
  let returnString = `<div class="song">`;
  returnString += `<div class="artwork">`;
  if (songInfo.previewImage && songInfo.previewImage != null) {
    returnString += `<img src="${songInfo.previewImage}" />`;
  } else {
    if (
      watHoordeIk &&
      watHoordeIk[index] &&
      watHoordeIk[index].enrichment &&
      watHoordeIk[index].enrichment.spotify
    ) {
      returnString += `<img src="${watHoordeIk[index].enrichment.spotify.image_l}" />`;
    } else {
      returnString += `<img src="./img/1Twente.NoAlbumArt.png" />`;
    }
  }
  returnString += `</div>`;

  if (songInfo.enrichment) {
    let positie = songInfo.enrichment.positie.toString().padStart(3, "0");

    returnString += `<div class="position"><div class="content">#${positie}</div></div>`;
  }
  returnString += `<div class="metadata">`;
  returnString += `<h3>${moment(songInfo.startTime).format("HH:mm")}</h3>`;
  returnString += `<h1>${songInfo.artist}</h1>`;
  returnString += `<h2>${songInfo.title}</h2>`;
  returnString += `</div>`;

  returnString += `</div>`;

  return returnString;
}
