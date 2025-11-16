import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/Question.js";

dotenv.config();

const questions = [
  // General Knowledge
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    category: "General",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    category: "General",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean",
    category: "General",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
    category: "General",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correctAnswer: "2",
    category: "General",
    difficulty: "medium",
    points: 150,
  },

  // Science
  {
    question: "What is the chemical symbol for water?",
    options: ["H2O", "CO2", "O2", "NaCl"],
    correctAnswer: "H2O",
    category: "Science",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is the speed of light in vacuum?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
    correctAnswer: "300,000 km/s",
    category: "Science",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "Which gas makes up most of Earth's atmosphere?",
    options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
    correctAnswer: "Nitrogen",
    category: "Science",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What is the atomic number of carbon?",
    options: ["4", "6", "8", "12"],
    correctAnswer: "6",
    category: "Science",
    difficulty: "hard",
    points: 200,
  },
  {
    question: "What is the process by which plants make food?",
    options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
    correctAnswer: "Photosynthesis",
    category: "Science",
    difficulty: "easy",
    points: 100,
  },

  // History
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: "1945",
    category: "History",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "Who was the first President of the United States?",
    options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
    correctAnswer: "George Washington",
    category: "History",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "The Great Wall of China was built to protect against which group?",
    options: ["Mongols", "Romans", "Greeks", "Persians"],
    correctAnswer: "Mongols",
    category: "History",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "In which year did the Berlin Wall fall?",
    options: ["1987", "1989", "1991", "1993"],
    correctAnswer: "1989",
    category: "History",
    difficulty: "hard",
    points: 200,
  },
  {
    question: "Which ancient civilization built the pyramids?",
    options: ["Greeks", "Romans", "Egyptians", "Mayans"],
    correctAnswer: "Egyptians",
    category: "History",
    difficulty: "easy",
    points: 100,
  },

  // Sports
  {
    question: "How many players are on a basketball team on the court at once?",
    options: ["4", "5", "6", "7"],
    correctAnswer: "5",
    category: "Sports",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Which country won the FIFA World Cup in 2018?",
    options: ["Brazil", "Germany", "France", "Argentina"],
    correctAnswer: "France",
    category: "Sports",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "In which sport would you perform a slam dunk?",
    options: ["Football", "Basketball", "Tennis", "Volleyball"],
    correctAnswer: "Basketball",
    category: "Sports",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is the maximum score in a single frame of bowling?",
    options: ["20", "30", "40", "50"],
    correctAnswer: "30",
    category: "Sports",
    difficulty: "hard",
    points: 200,
  },
  {
    question: "Which sport is played at Wimbledon?",
    options: ["Golf", "Tennis", "Cricket", "Rugby"],
    correctAnswer: "Tennis",
    category: "Sports",
    difficulty: "easy",
    points: 100,
  },

  // Geography
  {
    question: "What is the longest river in the world?",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    correctAnswer: "Nile",
    category: "Geography",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "Which is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctAnswer: "Vatican City",
    category: "Geography",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What is the highest mountain in the world?",
    options: ["K2", "Mount Kilimanjaro", "Mount Everest", "Mount Fuji"],
    correctAnswer: "Mount Everest",
    category: "Geography",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Which desert is the largest in the world?",
    options: ["Gobi", "Sahara", "Antarctic", "Arabian"],
    correctAnswer: "Antarctic",
    category: "Geography",
    difficulty: "hard",
    points: 200,
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    category: "Geography",
    difficulty: "easy",
    points: 100,
  },

  // Entertainment
  {
    question: "Which movie won the Academy Award for Best Picture in 2020?",
    options: ["Joker", "Parasite", "1917", "Once Upon a Time in Hollywood"],
    correctAnswer: "Parasite",
    category: "Entertainment",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "Who directed the movie 'Inception'?",
    options: ["Steven Spielberg", "Christopher Nolan", "Martin Scorsese", "Quentin Tarantino"],
    correctAnswer: "Christopher Nolan",
    category: "Entertainment",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "Which band sang 'Bohemian Rhapsody'?",
    options: ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"],
    correctAnswer: "Queen",
    category: "Entertainment",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "In which year was the first iPhone released?",
    options: ["2005", "2006", "2007", "2008"],
    correctAnswer: "2007",
    category: "Entertainment",
    difficulty: "hard",
    points: 200,
  },
  {
    question: "What is the name of the fictional school in Harry Potter?",
    options: ["Hogwarts", "Beauxbatons", "Durmstrang", "Ilvermorny"],
    correctAnswer: "Hogwarts",
    category: "Entertainment",
    difficulty: "easy",
    points: 100,
  },

  // Technology
  {
    question: "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Central Program Utility",
      "Computer Processing Utility",
    ],
    correctAnswer: "Central Processing Unit",
    category: "Technology",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: "JavaScript",
    category: "Technology",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "High Tech Modern Language",
      "HyperText Modern Language",
      "High Tech Markup Language",
    ],
    correctAnswer: "HyperText Markup Language",
    category: "Technology",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "Which company developed the Android operating system?",
    options: ["Apple", "Microsoft", "Google", "Samsung"],
    correctAnswer: "Google",
    category: "Technology",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What is the name of the first computer virus?",
    options: ["ILOVEYOU", "Melissa", "Creeper", "Stuxnet"],
    correctAnswer: "Creeper",
    category: "Technology",
    difficulty: "hard",
    points: 200,
  },

  // Mathematics
  {
    question: "What is 15% of 200?",
    options: ["15", "30", "45", "60"],
    correctAnswer: "30",
    category: "Mathematics",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "12", "14", "16"],
    correctAnswer: "12",
    category: "Mathematics",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is the value of π (pi) to two decimal places?",
    options: ["3.12", "3.14", "3.16", "3.18"],
    correctAnswer: "3.14",
    category: "Mathematics",
    difficulty: "easy",
    points: 100,
  },
  {
    question: "What is 2 to the power of 8?",
    options: ["128", "256", "512", "1024"],
    correctAnswer: "256",
    category: "Mathematics",
    difficulty: "medium",
    points: 150,
  },
  {
    question: "What is the sum of angles in a triangle?",
    options: ["90 degrees", "180 degrees", "270 degrees", "360 degrees"],
    correctAnswer: "180 degrees",
    category: "Mathematics",
    difficulty: "medium",
    points: 150,
  },
];

const seedQuestions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/quiz-battle", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Clear existing questions
    await Question.deleteMany({});
    console.log("Cleared existing questions");

    // Insert new questions
    await Question.insertMany(questions);
    console.log(`Successfully seeded ${questions.length} questions`);

    // Show count by category
    const categories = await Question.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    console.log("\nQuestions by category:");
    categories.forEach((cat) => {
      console.log(`  ${cat._id}: ${cat.count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding questions:", error);
    process.exit(1);
  }
};

seedQuestions();

