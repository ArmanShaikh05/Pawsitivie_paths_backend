import { Filter } from "bad-words";

// Custom bad words list

const customBadWords = [
    "bhosdi", "bhosdike", "bhosad", "bhosadike", "bhenchod", "bhen ke lode", "bhen ke laude",  
    "gandu", "gaand", "gaand mara", "gaand me le", "chutiya", "chut", "chutad", "chut ke dhakkan",  
    "laundiya", "launda", "maa chod", "madarchod", "mc", "ma ki chut", "ma ki gaand",  
     "suar ki aulad", "teri maa ki", "teri behen ki", "randi", "randi ki aulad",  
    "lund", "loda", "lodu", "lodu lund", "lulli", "sala", "saala", "harami", "haraamkhor",  
    "nalayak", "chakka", "kutta", "kutti", "kaminey", "kamini", "bitch", "fuck", "bastard"
  ];

// Initialize bad-words filter
const filter = new Filter();
filter.addWords(...customBadWords); // Add custom words

export const cleanMessage = (message) => {
  return message
    .split(" ")
    .map((word) => {
      if (filter.isProfane(word)) {
        return word[0] + "*".repeat(word.length - 2) + word[word.length - 1]; // a****** format
      }
      return word;
    })
    .join(" ");
};
