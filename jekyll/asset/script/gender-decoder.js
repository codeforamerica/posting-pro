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
    explanation = "This job ad uses more words that are stereotypically feminine " +
            "than words that are stereotypically masculine. Fortunately, the research " +
            "suggests this will have only a slight effect on how appealing the job is " +
            "to men, and will encourage women applicants.";
  } else if (result.includes("masculine")) {
    explanation = "This job ad uses more words that are stereotypically masculine " +
            "than words that are stereotypically feminine. It risks putting women off " +
            "applying, but will probably encourage men to apply.";
  } else if (!masculineWords.length && !feminineWords.length) {
    explanation = "This job ad doesn't use any words that are stereotypically " +
            "masculine and stereotypically feminine. It probably won't be off-putting " +
            "to men or women applicants.";
  } else {
    explanation = "This job ad uses an equal number of words that are " +
            "stereotypically masculine and stereotypically feminine. It probably won't " +
            "be off-putting to men or women applicants.";
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