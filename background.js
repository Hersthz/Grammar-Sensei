/**
 * Grammar Sensei – Background Service Worker
 *
 * Handles messages from the content script, runs grammar analysis,
 * and returns structured results. Currently uses a mock analyser;
 * swap `analyzeJapaneseGrammar` for a real API call when ready.
 */

/* ───────────────────────────────────────────
 * Mock Grammar Database
 * ─────────────────────────────────────────── */

const GRAMMAR_DATABASE = [
  {
    pattern: "ている",
    meaning: "Ongoing action or resulting state (progressive / stative)",
    structure: "Verb て-form + いる",
    example: "彼は本を読んでいる。(He is reading a book.)",
    jlpt_level: "N5"
  },
  {
    pattern: "てしまう",
    meaning: "Expresses completion of an action, often with regret or that something happened unintentionally",
    structure: "Verb て-form + しまう (casual: ちゃう / じゃう)",
    example: "ケーキを全部食べてしまった。(I ended up eating all the cake.)",
    jlpt_level: "N4"
  },
  {
    pattern: "なければならない",
    meaning: "Must do / have to do something (obligation)",
    structure: "Verb ない-form (drop ない) + なければならない",
    example: "宿題をしなければならない。(I have to do my homework.)",
    jlpt_level: "N4"
  },
  {
    pattern: "たら",
    meaning: "If / when (conditional)",
    structure: "Verb た-form + ら",
    example: "雨が降ったら、家にいます。(If it rains, I'll stay home.)",
    jlpt_level: "N4"
  },
  {
    pattern: "ことができる",
    meaning: "To be able to / can do something (ability)",
    structure: "Verb dictionary form + ことができる",
    example: "日本語を話すことができる。(I can speak Japanese.)",
    jlpt_level: "N4"
  },
  {
    pattern: "てもいい",
    meaning: "It's okay to / may do something (permission)",
    structure: "Verb て-form + もいい",
    example: "ここに座ってもいいですか。(May I sit here?)",
    jlpt_level: "N5"
  },
  {
    pattern: "てはいけない",
    meaning: "Must not / not allowed to (prohibition)",
    structure: "Verb て-form + はいけない",
    example: "ここで写真を撮ってはいけない。(You must not take photos here.)",
    jlpt_level: "N5"
  },
  {
    pattern: "たことがある",
    meaning: "Have experienced / have done before (experience)",
    structure: "Verb た-form + ことがある",
    example: "日本に行ったことがある。(I have been to Japan.)",
    jlpt_level: "N4"
  },
  {
    pattern: "ようにする",
    meaning: "To make an effort to / to try to make sure",
    structure: "Verb dictionary form + ようにする",
    example: "毎日運動するようにしている。(I try to exercise every day.)",
    jlpt_level: "N3"
  },
  {
    pattern: "ようになる",
    meaning: "To become able to / to reach the point where",
    structure: "Verb dictionary form + ようになる",
    example: "漢字が読めるようになった。(I became able to read kanji.)",
    jlpt_level: "N3"
  },
  {
    pattern: "ばかり",
    meaning: "Nothing but / only / just did something",
    structure: "Verb た-form + ばかり (just did) ・ Noun + ばかり (nothing but)",
    example: "さっき食べたばかりです。(I just ate a moment ago.)",
    jlpt_level: "N3"
  },
  {
    pattern: "において",
    meaning: "In / at / regarding (formal location or context)",
    structure: "Noun + において / における + Noun",
    example: "この分野において彼は専門家です。(He is an expert in this field.)",
    jlpt_level: "N2"
  },
  {
    pattern: "に対して",
    meaning: "Towards / against / in contrast to",
    structure: "Noun + に対して",
    example: "彼の意見に対して反論した。(I argued against his opinion.)",
    jlpt_level: "N2"
  },
  {
    pattern: "にもかかわらず",
    meaning: "Despite / in spite of / regardless of",
    structure: "Noun / Verb plain form + にもかかわらず",
    example: "雨にもかかわらず、試合は行われた。(Despite the rain, the match was held.)",
    jlpt_level: "N2"
  },
  {
    pattern: "ざるを得ない",
    meaning: "Cannot help but / have no choice but to",
    structure: "Verb ない-form (drop ない) + ざるを得ない (する → せざるを得ない)",
    example: "認めざるを得ない。(I have no choice but to admit it.)",
    jlpt_level: "N1"
  },
  {
    pattern: "をもって",
    meaning: "With / by means of / as of (formal)",
    structure: "Noun + をもって",
    example: "本日をもって閉店いたします。(As of today, we will close the store.)",
    jlpt_level: "N1"
  },
  {
    pattern: "ではないか",
    meaning: "Isn't it? / I think… (seeking agreement or expressing opinion)",
    structure: "Plain form + ではないか / じゃないか",
    example: "これは間違いではないか。(Isn't this a mistake?)",
    jlpt_level: "N3"
  },
  {
    pattern: "たい",
    meaning: "Want to do something (desire)",
    structure: "Verb ます-stem + たい",
    example: "日本に行きたい。(I want to go to Japan.)",
    jlpt_level: "N5"
  },
  {
    pattern: "ないでください",
    meaning: "Please don't do (polite negative request)",
    structure: "Verb ない-form + でください",
    example: "ここで走らないでください。(Please don't run here.)",
    jlpt_level: "N5"
  },
  {
    pattern: "そうだ",
    meaning: "It looks like / seems like (appearance) or I heard that (hearsay)",
    structure: "Verb stem + そうだ (appearance) ・ Plain form + そうだ (hearsay)",
    example: "雨が降りそうだ。(It looks like it's going to rain.)",
    jlpt_level: "N4"
  }
];

/* ───────────────────────────────────────────
 * Grammar Analyser (mock – replace with API)
 * ─────────────────────────────────────────── */

/**
 * Analyse Japanese text and return matching grammar patterns.
 *
 * @param  {string} text – Selected Japanese text
 * @returns {Object}       Structured grammar analysis result
 *
 * To integrate a real API later, replace the body of this function
 * with a fetch() call and return the same JSON shape.
 */
function analyzeJapaneseGrammar(text) {
  /* 1. Find all grammar patterns that appear in the text */
  const matches = GRAMMAR_DATABASE.filter((entry) =>
    text.includes(entry.pattern)
  );

  /* 2. If we found matches, return the first (most relevant) */
  if (matches.length > 0) {
    const best = matches[0];
    return {
      grammar: best.pattern,
      meaning: best.meaning,
      structure: best.structure,
      example: best.example,
      jlpt_level: best.jlpt_level,
      all_matches: matches.map((m) => m.pattern)
    };
  }

  /* 3. Fallback — generic response for unrecognised patterns */
  return {
    grammar: "（検出されませんでした）",
    meaning: "No known grammar pattern was detected in the selected text. Try selecting a longer phrase that includes a verb conjugation or grammar structure.",
    structure: "—",
    example: "—",
    jlpt_level: "—",
    all_matches: []
  };
}

/* ───────────────────────────────────────────
 * Message Listener
 * ─────────────────────────────────────────── */

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "ANALYZE_GRAMMAR") {
    const result = analyzeJapaneseGrammar(request.text);
    sendResponse({ success: true, data: result });
  }
  /* Return true to indicate we will send a response asynchronously */
  return true;
});
