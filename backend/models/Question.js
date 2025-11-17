import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (options) {
          return options.length === 4;
        },
        message: "Question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      validate: {
        validator: function (value) {
          return this.options.includes(value);
        },
        message: "Correct answer must be one of the options",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "General",
        "Science",
        "History",
        "Sports",
        "Geography",
        "Entertainment",
        "Technology",
        "Mathematics",
      ],
      default: "General",
    },
    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    points: {
      type: Number,
      default: 100,
      min: 50,
      max: 200,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
    reviewNotes: {
      type: String,
    },
    votes: {
      up: { type: Number, default: 0 },
      down: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Question = mongoose.model("Question", questionSchema);

export default Question;

