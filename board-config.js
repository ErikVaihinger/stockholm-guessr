// ============================================================
//  Quiz board - questions and answers
// ============================================================
//
//  5 categories, 3 questions each (easy = 1 point, medium = 2,
//  hard = 3). Change any text below and commit.
//
//  Images: upload them into the board/ folder with exactly the
//  names used below. The ending can be .jpg, .jpeg, .png or .webp,
//  the page finds it on its own. Names are case-sensitive.

window.BOARD_CONFIG = {
  title: "Quiz Board",

  categories: [
    {
      name: "Sweden",
      questions: [
        {
          type: "choice",
          question: "Sweden has about 267,000 islands. How many have people living on them all year?",
          options: ["114", "984", "1,532", "3,051"],
          correct: 2, // 1 = first option, 2 = second, ...
          note: "Statistics Sweden, 2013: 984 of 267,570 islands",
        },
        {
          type: "choice",
          question: "On which day does Sweden celebrate Kanelbullens dag (Cinnamon Bun Day)?",
          options: ["4 October", "1 November", "13 December", "6 June"],
          correct: 1,
          note: "Celebrated since 1999",
        },
        {
          type: "choice",
          question: "What is “hospital” in Swedish?",
          options: ["sjukhus", "sjukhem", "vårdcentral", "apotek"],
          correct: 1,
          note: "sjukhem = nursing home · vårdcentral = health centre · apotek = pharmacy",
        },
      ],
    },
    {
      name: "Zoomed Logos",
      questions: [
        { type: "logo", zoomed: "board/logo-easy-zoom", full: "board/logo-easy-full", answer: "Nike" },
        { type: "logo", zoomed: "board/logo-medium-zoom", full: "board/logo-medium-full", answer: "Lidl" },
        { type: "logo", zoomed: "board/logo-hard-zoom", full: "board/logo-hard-full", answer: "Systembolaget" },
      ],
    },
    {
      name: "Whose Child?",
      questions: [
        { type: "child", image: "board/child-easy", answer: "Nadine & Toon" },
        { type: "child", image: "board/child-medium", answer: "Bia & Villads" },
        { type: "child", image: "board/child-hard", answer: "Julie & Mauritius" },
      ],
    },
    {
      name: "Emoji Countries",
      questions: [
        { type: "emoji", emoji: "🏛️🫒🥙🏖️", answer: "Greece" },
        { type: "emoji", emoji: "🦙🏔️🧶🐻", answer: "Peru", note: "The bear is Paddington, from “darkest Peru”" },
        { type: "emoji", emoji: "🌋♨️🐴🚙", answer: "Iceland" },
      ],
    },
    {
      name: "Which Is Oldest?",
      questions: [
        {
          type: "oldest",
          options: [
            { name: "The Colosseum", year: "80 AD" },
            { name: "The Eiffel Tower", year: "1889" },
            { name: "Big Ben", year: "1859" },
          ],
          correct: 1,
        },
        {
          type: "oldest",
          options: [
            { name: "Nintendo", year: "1889" },
            { name: "The sinking of the Titanic", year: "1912" },
            { name: "Coca-Cola", year: "1886" },
          ],
          correct: 3,
        },
        {
          type: "oldest",
          options: [
            { name: "The Aztec city Tenochtitlan", year: "1325" },
            { name: "Oxford University", year: "c. 1096" },
            { name: "Machu Picchu", year: "c. 1450" },
          ],
          correct: 2,
          note: "Oxford: first evidence of teaching in 1096",
        },
      ],
    },
  ],
};
