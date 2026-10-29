/**
 * Question bank for the trivia game.
 *
 * Each question uses this shape:
 *   id          - unique, stable identifier
 *   category    - one of CATEGORIES
 *   difficulty  - "Easy" | "Medium" | "Hard" (drives the base score)
 *   question    - the prompt shown to the player
 *   options     - exactly four answer choices
 *   answer      - index in `options` of the correct choice
 *   explanation - shown after the player answers
 *
 * Answer order is shuffled at runtime, so `answer` only refers to this file.
 */
export const QUESTION_BANK = [
  // Science
  {
    id: 'sci-01',
    category: 'Science',
    difficulty: 'Easy',
    question: 'What is the chemical symbol for gold?',
    options: ['Silver', 'Gold', 'Iron', 'Copper'],
    answer: 1,
    explanation:
      'Gold is Au, from the Latin word "aurum". Silver is Ag, iron is Fe, and copper is Cu.',
  },
  {
    id: 'sci-02',
    category: 'Science',
    difficulty: 'Easy',
    question: 'Which planet is the largest in our solar system?',
    options: ['Earth', 'Saturn', 'Jupiter', 'Neptune'],
    answer: 2,
    explanation:
      'Jupiter is the largest planet, with a mass more than twice that of all the other planets combined.',
  },
  {
    id: 'sci-03',
    category: 'Science',
    difficulty: 'Easy',
    question: 'Which gas do plants absorb from the atmosphere during photosynthesis?',
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
    answer: 2,
    explanation:
      'Plants take in carbon dioxide and release oxygen. Oxygen is what animals breathe in, not what plants absorb.',
  },
  {
    id: 'sci-04',
    category: 'Science',
    difficulty: 'Medium',
    question: 'What is the approximate speed of light in a vacuum?',
    options: ['300,000 km/s', '30,000 km/s', '3,000 km/s', '300 km/s'],
    answer: 0,
    explanation:
      'Light travels at about 299,792 kilometers per second, which is usually rounded to 300,000 km/s.',
  },
  {
    id: 'sci-05',
    category: 'Science',
    difficulty: 'Medium',
    question: 'Which is the hardest naturally occurring mineral?',
    options: ['Quartz', 'Diamond', 'Topaz', 'Corundum'],
    answer: 1,
    explanation:
      'Diamond sits at the top of the Mohs hardness scale with a rating of 10. Corundum (9) is next.',
  },
  {
    id: 'sci-06',
    category: 'Science',
    difficulty: 'Medium',
    question: 'What is the largest organ of the human body?',
    options: ['Heart', 'Liver', 'Skin', 'Lungs'],
    answer: 2,
    explanation:
      'Skin is the largest organ, covering roughly 1.5 to 2 square meters of surface area in adults.',
  },
  {
    id: 'sci-07',
    category: 'Science',
    difficulty: 'Medium',
    question: 'Which subatomic particle carries a negative charge?',
    options: ['Proton', 'Neutron', 'Electron', 'Photon'],
    answer: 2,
    explanation:
      'Electrons are negatively charged. Protons are positive, neutrons are neutral, and photons have no charge.',
  },
  {
    id: 'sci-08',
    category: 'Science',
    difficulty: 'Medium',
    question: "Which gas is most abundant in Earth's atmosphere?",
    options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'],
    answer: 1,
    explanation:
      'Nitrogen makes up about 78% of the atmosphere, while oxygen accounts for roughly 21%.',
  },
  {
    id: 'sci-09',
    category: 'Science',
    difficulty: 'Hard',
    question: 'What is the chemical symbol for sodium?',
    options: ['S', 'Na', 'So', 'N'],
    answer: 1,
    explanation:
      'Sodium is Na, from the Latin "natrium". S is sulfur, and N is nitrogen.',
  },

  // History
  {
    id: 'his-01',
    category: 'History',
    difficulty: 'Easy',
    question: 'In which year did World War II end?',
    options: ['1918', '1939', '1945', '1950'],
    answer: 2,
    explanation:
      'World War II ended in 1945. It began in 1939, and 1918 marked the end of World War I.',
  },
  {
    id: 'his-02',
    category: 'History',
    difficulty: 'Easy',
    question: 'Who was the first President of the United States?',
    options: ['Thomas Jefferson', 'George Washington', 'John Adams', 'Abraham Lincoln'],
    answer: 1,
    explanation:
      'George Washington served as the first U.S. president from 1789 to 1797. John Adams was second and Jefferson third.',
  },
  {
    id: 'his-03',
    category: 'History',
    difficulty: 'Medium',
    question: 'Which ancient civilization built the city of Machu Picchu?',
    options: ['Aztec', 'Maya', 'Inca', 'Olmec'],
    answer: 2,
    explanation:
      'The Inca built Machu Picchu in the 15th century high in the Andes mountains of present-day Peru.',
  },
  {
    id: 'his-04',
    category: 'History',
    difficulty: 'Medium',
    question: 'In which year did the Berlin Wall fall?',
    options: ['1987', '1989', '1991', '1993'],
    answer: 1,
    explanation:
      'The Berlin Wall fell in November 1989, helping pave the way for German reunification in 1990.',
  },
  {
    id: 'his-05',
    category: 'History',
    difficulty: 'Hard',
    question: 'In which year was the Magna Carta sealed?',
    options: ['1066', '1215', '1492', '1776'],
    answer: 1,
    explanation:
      'King John sealed the Magna Carta in 1215 at Runnymede, limiting the power of the English monarchy.',
  },
  {
    id: 'his-06',
    category: 'History',
    difficulty: 'Easy',
    question: 'Julius Caesar was a leader in which ancient civilization?',
    options: ['Greece', 'Rome', 'Egypt', 'Carthage'],
    answer: 1,
    explanation:
      'Caesar was a general and statesman of the Roman Republic before it became the Roman Empire.',
  },
  {
    id: 'his-07',
    category: 'History',
    difficulty: 'Easy',
    question: 'Who was the first person to walk on the Moon?',
    options: ['Buzz Aldrin', 'Yuri Gagarin', 'Neil Armstrong', 'Michael Collins'],
    answer: 2,
    explanation:
      'Neil Armstrong stepped onto the Moon on July 20, 1969, during the Apollo 11 mission.',
  },
  {
    id: 'his-08',
    category: 'History',
    difficulty: 'Medium',
    question: 'In which year did the Titanic sink?',
    options: ['1905', '1912', '1920', '1931'],
    answer: 1,
    explanation:
      'The Titanic struck an iceberg and sank on its maiden voyage in April 1912.',
  },

  // Geography
  {
    id: 'geo-01',
    category: 'Geography',
    difficulty: 'Easy',
    question: 'Which is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
    answer: 2,
    explanation:
      'The Pacific Ocean is the largest and deepest, covering about one third of the planet surface.',
  },
  {
    id: 'geo-02',
    category: 'Geography',
    difficulty: 'Medium',
    question: 'What is the capital of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    answer: 2,
    explanation:
      'Canberra is the capital. Sydney and Melbourne are larger, but Canberra was purpose-built as the capital in 1913.',
  },
  {
    id: 'geo-03',
    category: 'Geography',
    difficulty: 'Easy',
    question: 'Which is the longest river in Africa?',
    options: ['Congo', 'Nile', 'Niger', 'Zambezi'],
    answer: 1,
    explanation:
      'The Nile runs about 6,650 kilometers through northeastern Africa and is generally considered the longest river in Africa.',
  },
  {
    id: 'geo-04',
    category: 'Geography',
    difficulty: 'Medium',
    question: 'Mount Everest lies on the border between Nepal and which country?',
    options: ['India', 'China', 'Bhutan', 'Pakistan'],
    answer: 1,
    explanation:
      "Everest straddles Nepal and China's Tibet region. Its summit is 8,849 meters above sea level.",
  },
  {
    id: 'geo-05',
    category: 'Geography',
    difficulty: 'Medium',
    question: 'Which is the smallest country in the world by area?',
    options: ['Monaco', 'Nauru', 'San Marino', 'Vatican City'],
    answer: 3,
    explanation:
      'Vatican City covers only about 0.49 square kilometers, making it the smallest sovereign state.',
  },
  {
    id: 'geo-06',
    category: 'Geography',
    difficulty: 'Easy',
    question: 'On which continent is the Sahara Desert located?',
    options: ['Asia', 'Africa', 'Australia', 'South America'],
    answer: 1,
    explanation:
      'The Sahara is in North Africa and is the largest hot desert in the world.',
  },
  {
    id: 'geo-07',
    category: 'Geography',
    difficulty: 'Medium',
    question: 'What is the capital of Canada?',
    options: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa'],
    answer: 3,
    explanation:
      'Ottawa is the capital. Toronto is the largest city, but the capital was moved to Ottawa in 1857.',
  },

  // Arts & Literature
  {
    id: 'art-01',
    category: 'Arts & Literature',
    difficulty: 'Easy',
    question: 'Who wrote the play "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    answer: 1,
    explanation:
      'William Shakespeare wrote "Romeo and Juliet" around 1595. It is one of his most performed plays.',
  },
  {
    id: 'art-02',
    category: 'Arts & Literature',
    difficulty: 'Medium',
    question: 'Who wrote the novel "1984"?',
    options: ['Aldous Huxley', 'Ray Bradbury', 'George Orwell', 'H. G. Wells'],
    answer: 2,
    explanation:
      'George Orwell published "1984" in 1949. Huxley wrote "Brave New World", a different dystopian classic.',
  },
  {
    id: 'art-03',
    category: 'Arts & Literature',
    difficulty: 'Medium',
    question: 'Who wrote "Pride and Prejudice"?',
    options: ['Emily Brontë', 'Jane Austen', 'Virginia Woolf', 'Mary Shelley'],
    answer: 1,
    explanation:
      'Jane Austen published "Pride and Prejudice" in 1813. Emily Brontë wrote "Wuthering Heights".',
  },
  {
    id: 'art-04',
    category: 'Arts & Literature',
    difficulty: 'Medium',
    question: 'In "The Lord of the Rings", which hobbit carries the One Ring to Mordor?',
    options: ['Samwise Gamgee', 'Frodo Baggins', 'Bilbo Baggins', 'Aragorn'],
    answer: 1,
    explanation:
      'Frodo Baggins carries the Ring, accompanied by Samwise Gamgee. Bilbo is Frodo\u2019s older cousin.',
  },
  {
    id: 'art-05',
    category: 'Arts & Literature',
    difficulty: 'Easy',
    question: 'Who painted "The Starry Night"?',
    options: ['Claude Monet', 'Vincent van Gogh', 'Pablo Picasso', 'Salvador Dalí'],
    answer: 1,
    explanation:
      'Vincent van Gogh painted "The Starry Night" in 1889 while staying at an asylum in Saint-Rémy-de-Provence.',
  },
  {
    id: 'art-06',
    category: 'Arts & Literature',
    difficulty: 'Easy',
    question: 'Who painted the "Mona Lisa"?',
    options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Sandro Botticelli'],
    answer: 2,
    explanation:
      'Leonardo da Vinci painted the "Mona Lisa" in the early 1500s. It hangs in the Louvre in Paris.',
  },

  // Technology
  {
    id: 'tech-01',
    category: 'Technology',
    difficulty: 'Easy',
    question: 'What does CPU stand for?',
    options: [
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Program Utility',
      'Control Panel Unit',
    ],
    answer: 0,
    explanation:
      'The Central Processing Unit executes instructions and is often called the brain of the computer.',
  },
  {
    id: 'tech-02',
    category: 'Technology',
    difficulty: 'Medium',
    question: 'Who is credited with inventing the World Wide Web?',
    options: ['Bill Gates', 'Tim Berners-Lee', 'Steve Jobs', 'Vint Cerf'],
    answer: 1,
    explanation:
      'Tim Berners-Lee proposed the Web at CERN in 1989 and created the first web browser and server.',
  },
  {
    id: 'tech-03',
    category: 'Technology',
    difficulty: 'Medium',
    question: 'In which year was JavaScript created?',
    options: ['1989', '1993', '1995', '2000'],
    answer: 2,
    explanation:
      'Brendan Eich created JavaScript at Netscape in 1995. It was originally called Mocha, then LiveScript.',
  },
  {
    id: 'tech-04',
    category: 'Technology',
    difficulty: 'Easy',
    question: 'What does HTML stand for?',
    options: [
      'HyperText Markup Language',
      'High-Level Text Machine Language',
      'Hyperlink and Text Management Language',
      'Home Tool Markup Language',
    ],
    answer: 0,
    explanation:
      'HTML stands for HyperText Markup Language. It describes the structure of web pages.',
  },
  {
    id: 'tech-05',
    category: 'Technology',
    difficulty: 'Medium',
    question: 'Who created the Python programming language?',
    options: ['James Gosling', 'Guido van Rossum', 'Brendan Eich', 'Dennis Ritchie'],
    answer: 1,
    explanation:
      'Guido van Rossum created Python and released the first version in 1991. Java is James Gosling\u2019s work.',
  },
  {
    id: 'tech-06',
    category: 'Technology',
    difficulty: 'Hard',
    question: 'What is the binary number 1010 in decimal?',
    options: ['8', '10', '12', '16'],
    answer: 1,
    explanation:
      'From left to right the place values are 8, 4, 2, and 1, so 1010 = 8 + 0 + 2 + 0 = 10.',
  },

  // Sports
  {
    id: 'spo-01',
    category: 'Sports',
    difficulty: 'Easy',
    question: 'How many players from each team are on the field in a soccer match?',
    options: ['9', '10', '11', '12'],
    answer: 2,
    explanation:
      'Each soccer team fields 11 players, including the goalkeeper.',
  },
  {
    id: 'spo-02',
    category: 'Sports',
    difficulty: 'Medium',
    question: 'Which country won the 2018 FIFA World Cup?',
    options: ['Germany', 'Brazil', 'France', 'Croatia'],
    answer: 2,
    explanation:
      'France beat Croatia 4-2 in the 2018 final in Russia to win its second World Cup title.',
  },
  {
    id: 'spo-03',
    category: 'Sports',
    difficulty: 'Easy',
    question: 'In tennis, what is a score of zero called?',
    options: ['Nil', 'Love', 'Duck', 'Zero'],
    answer: 1,
    explanation:
      'Tennis uses "love" for zero, likely derived from the French "l\u2019oeuf" (the egg), which is shaped like a zero.',
  },
  {
    id: 'spo-04',
    category: 'Sports',
    difficulty: 'Easy',
    question: 'How many rings are on the Olympic flag?',
    options: ['3', '4', '5', '6'],
    answer: 2,
    explanation:
      'The five interlocking rings represent the five inhabited continents that take part in the Olympic Games.',
  },

  // Music
  {
    id: 'mus-01',
    category: 'Music',
    difficulty: 'Easy',
    question: 'How many strings does a standard acoustic guitar have?',
    options: ['4', '5', '6', '7'],
    answer: 2,
    explanation:
      'A standard guitar has six strings, typically tuned E-A-D-G-B-E from low to high.',
  },
  {
    id: 'mus-02',
    category: 'Music',
    difficulty: 'Medium',
    question: 'Which composer wrote "The Four Seasons"?',
    options: ['Johann Sebastian Bach', 'Wolfgang Amadeus Mozart', 'Antonio Vivaldi', 'Ludwig van Beethoven'],
    answer: 2,
    explanation:
      'Antonio Vivaldi composed "The Four Seasons", a set of four violin concertos, around 1723.',
  },
  {
    id: 'mus-03',
    category: 'Music',
    difficulty: 'Easy',
    question: 'Which instrument typically has 88 keys?',
    options: ['Guitar', 'Piano', 'Violin', 'Flute'],
    answer: 1,
    explanation:
      'A standard modern piano has 88 keys: 52 white keys and 36 black keys.',
  },
];

/** Category names derived from the bank, in the order they first appear. */
export const CATEGORIES = [...new Set(QUESTION_BANK.map((question) => question.category))];

/** Difficulty levels used for base scoring. */
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

/** Number of questions in each category (used by the category menu). */
export function countByCategory(bank = QUESTION_BANK) {
  return bank.reduce((counts, question) => {
    counts[question.category] = (counts[question.category] ?? 0) + 1;
    return counts;
  }, {});
}
