// startsWith() polyfill (startWith is only standard starting in May 2016)
if(!String.prototype.startsWith){
    String.prototype.startsWith = function (str) {
        return !this.indexOf(str);
    };
}

// includes() polyfill (ditto w/ above)
if(!Array.prototype.includes) {
    Array.prototype.includes = function (v) {
        return this.indexOf(v) > -1;
    };
}

function decodeGender (text) {
  text = text.replace(/\s+/g, " ")
             .replace(/[\.\t,:;\(\)?!]/g, "");

  var words = text.split(" ");
  
  var masculineWords = [];
  var feminineWords = [];

  words.forEach(function(word) {
    if (listContains(wordLists.feminineCodedWords, word)) {
      feminineWords.push(word);
    }

    if (listContains(wordLists.masculineCodedWords, word)) {
      masculineWords.push(word);
    }
  });

  var result = calculateResult(masculineWords.length, feminineWords.length);

  var explanation = "";

  if (result.includes("feminine")) {
    explanation = "This uses more words that are stereotypically feminine " +
            "than words that are stereotypically masculine.";
  } else if (result.includes("masculine")) {
    explanation = "This uses more words that are stereotypically masculine " +
            "than words that are stereotypically feminine.";
  } else if (!masculineWords.length && !feminineWords.length) {
    explanation = "This doesn't use any words that are stereotypically " +
            "masculine and stereotypically feminine.";
  } else {
    explanation = "This uses an equal number of words that are " +
            "stereotypically masculine and stereotypically feminine.";
  }

  return {result: result, 
          explanation: explanation,
          masculineCodedWords: masculineWords,
          feminineCodedWords: feminineWords};
}

function listContains(list, word) {

  var foundMatch = false;

  list.forEach(function(item) {
    if (word.startsWith(item)) {
      foundMatch = true;
    }
  });

  return foundMatch;
}

function calculateResult(masculineWordsCount, feminineWordsCount) {
  if (masculineWordsCount == feminineWordsCount) {
    return "neutral";
  } else if (masculineWordsCount && !feminineWordsCount) {
    return "strongly masculine-coded";
  } else if (feminineWordsCount && !masculineWordsCount) {
    return "strongly feminine-coded";
  } else {
    if ((feminineWordsCount / masculineWordsCount) >= 2 && feminineWordsCount > 5) {
      return "strongly feminine-coded";
    } else if ((masculineWordsCount / feminineWordsCount) >= 2 && masculineWordsCount > 5) {
      return "strongly masculine-coded";
    } else if (feminineWordsCount > masculineWordsCount) {
      return "feminine-coded";
    } else if (masculineWordsCount > feminineWordsCount) {
      return "masculine-coded";
    }
  }
}

var wordLists = {};

wordLists.feminineCodedWords = [
    "agree",
    "affectionate",
    "child",
    "cheer",
    "collab",
    "commit",
    "communal",
    "compassion",
    "connect",
    "considerate",
    "cooperat",
    "co-operat",
    "depend",
    "emotiona",
    "empath",
    "feel",
    "flatterable",
    "gentle",
    "honest",
    "interpersonal",
    "interdependen",
    "interpersona",
    "inter-personal",
    "inter-dependen",
    "inter-persona",
    "kind",
    "kinship",
    "loyal",
    "modesty",
    "nag",
    "nurtur",
    "pleasant",
    "polite",
    "quiet",
    "respon",
    "sensitiv",
    "submissive",
    "support",
    "sympath",
    "tender",
    "together",
    "trust",
    "understand",
    "warm",
    "whin",
    "enthusias",
    "inclusive",
    "yield",
    "shar"];

wordLists.masculineCodedWords = [
    "active",
    "adventurous",
    "aggress",
    "ambitio",
    "analy",
    "assert",
    "athlet",
    "autonom",
    "battle",
    "boast",
    "challeng",
    "champion",
    "compet",
    "confident",
    "courag",
    "decid",
    "decision",
    "decisive",
    "defend",
    "determin",
    "domina",
    "dominant",
    "driven",
    "fearless",
    "fight",
    "force",
    "greedy",
    "head-strong",
    "headstrong",
    "hierarch",
    "hostil",
    "implusive",
    "independen",
    "individual",
    "intellect",
    "lead",
    "logic",
    "objective",
    "opinion",
    "outspoken",
    "persist",
    "principle",
    "reckless",
    "self-confiden",
    "self-relian",
    "self-sufficien",
    "selfconfiden",
    "selfrelian",
    "selfsufficien",
    "stubborn",
    "superior",
    "unreasonab"];