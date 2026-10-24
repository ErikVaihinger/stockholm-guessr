// ============================================================
//  Stockholm Guessr - the only file you need to edit
// ============================================================
//
//  For every round: put a photo in the photos/ folder and add
//  one entry below with the photo's path and the TRUE location.
//
//  Getting coordinates: open pick.html on the published site
//  (or right-click the spot in Google Maps and click the numbers
//  at the top of the menu to copy them).
//
//  The rounds are played in the order listed here.

window.QUIZ_CONFIG = {
  rounds: [
    { photo: "photos/1.jpg", lat: 59.32750, lng: 18.05430, answer: "Stockholm City Hall (Stadshuset)" },
    { photo: "photos/2.jpg", lat: 59.32500, lng: 18.07070, answer: "Stortorget, Gamla stan" },
    { photo: "photos/3.jpg", lat: 59.33260, lng: 18.06490, answer: "Sergels torg" },
    { photo: "photos/4.jpg", lat: 59.32800, lng: 18.09140, answer: "Vasa Museum" },
    { photo: "photos/5.jpg", lat: 59.29360, lng: 18.08310, answer: "Avicii Arena (Globen)" },
  ],

  // Seconds per round. The host can still reveal earlier or later.
  roundSeconds: 90,

  // Points by rank: closest team gets the first number, and so on.
  points: [3, 2, 1],

  // Where the map starts and how far out teams can zoom.
  mapStart: { lat: 59.3293, lng: 18.0686, zoom: 12 },
  minZoom: 9,
  maxZoom: 18,

  // Map style for teams. "nolabels" = no street names (default),
  // "satellite" = aerial photos without labels.
  mapStyle: "nolabels",

  // Live sync between laptops runs through the free ntfy.sh service.
  // Change the prefix to any random word if you like; it just keeps
  // your game separate from strangers'.
  ntfyServer: "https://ntfy.sh",
  topicPrefix: "sthlm-guessr-k7q2x9",
};
