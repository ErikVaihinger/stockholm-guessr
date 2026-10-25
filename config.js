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
    { photo: "photos/1.JPG", lat: 59.26925, lng: 18.05517, answer: "Best WG in all of Stockholm" },
    { photo: "photos/2.JPG", lat: 59.31508, lng: 18.07281, answer: "Medborgarplatsen MAX" },
    { photo: "photos/3.JPG", lat: 59.36615, lng: 18.05485, answer: "Frescati Campus" },
    { photo: "photos/4.JPG", lat: 59.33191, lng: 18.06355, answer: "T-Centralen" },
    { photo: "photos/5.jpg", lat: 59.32023, lng: 18.05016, answer: "Södermalm Viewpoint" },
    { photo: "photos/6.JPG", lat: 59.32316, lng: 18.07280, answer: "Stockholm tightest alley" },
    { photo: "photos/7.JPG", lat: 59.32692, lng: 18.06516, answer: "Riksdagshuset" },
    { photo: "photos/8.JPG", lat: 59.32044, lng: 18.07289, answer: "Slussen" },
    { photo: "photos/9.JPG", lat: 59.35656, lng: 18.05544, answer: "Albano Bus Stop" },
    { photo: "photos/10.JPG", lat: 59.34282, lng: 18.05016, answer: "Odenplan" },
  ],

  // Seconds per round. The host can still reveal earlier or later.
  roundSeconds: 60,

  // Points by rank: closest team gets the first number, and so on.
  points: [3, 2, 1],

  // Where the map starts and how far out teams can zoom.
  mapStart: { lat: 59.3293, lng: 18.0686, zoom: 12 },
  minZoom: 9,
  maxZoom: 18,

  // Map style for teams. "nolabels" = street map without any names
  // (default), "satellite" = aerial photos without labels.
  mapStyle: "nolabels",

  // Live sync between laptops runs through the free ntfy.sh service.
  // Change the prefix to any random word if you like; it just keeps
  // your game separate from strangers'.
  ntfyServer: "https://ntfy.sh",
  topicPrefix: "sthlm-guessr-k7q2x9",
};
