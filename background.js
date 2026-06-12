/**
 * Grammar Sensei - Background Service Worker
 *
 * Owns grammar analysis, settings, history, and the selection context menu.
 * The analyser is still local/offline, but it now supports variants and
 * regular-expression patterns instead of only exact string matching.
 */

const EXTENSION_MENU_ID = "grammar-sensei-analyze-selection";
const HISTORY_LIMIT = 50;

const DEFAULT_SETTINGS = {
  enabled: true,
  floatingButton: true,
  autoAnalyze: false,
  saveHistory: true,
  compactMode: false,
  showMatchList: true
};

const GRAMMAR_DATABASE = [
  {
    id: "te-iru",
    pattern: "ている",
    variants: ["ている", "でいる", "ています", "でいます", "ていた", "でいた", "ていました", "でいました", "てる", "でる"],
    regex: "(?:て|で)(?:い(?:る|ます|た|ました)|る|ます|た|ました)",
    meaning: "Ongoing action or resulting state.",
    structure: "Verb て-form + いる",
    example: "彼は本を読んでいる。 (He is reading a book.)",
    jlpt_level: "N5",
    nuance: "Often marks either an action in progress or a state that remains after an action.",
    tags: ["aspect", "state"],
    priority: 85
  },
  {
    id: "te-shimau",
    pattern: "てしまう",
    variants: ["てしまう", "でしまう", "てしまいます", "でしまいます", "てしまった", "でしまった", "ちゃう", "じゃう", "ちゃった", "じゃった"],
    regex: "(?:て|で)(?:しま(?:う|います|った|いました)|ちゃ(?:う|った|います)?|じゃ(?:う|った|います)?)",
    meaning: "Completion, often with regret, accident, or an unwanted result.",
    structure: "Verb て-form + しまう",
    example: "ケーキを全部食べてしまった。 (I ended up eating all the cake.)",
    jlpt_level: "N4",
    nuance: "Casual contractions are ちゃう and じゃう.",
    tags: ["completion", "regret"],
    priority: 92
  },
  {
    id: "nakereba-naranai",
    pattern: "なければならない",
    variants: ["なければならない", "なければなりません", "なくてはならない", "なくてはいけない", "なきゃ", "ないといけない"],
    regex: "(?:なければ|なくては)(?:ならない|なりません|いけない|いけません)|なきゃ(?:ならない|いけない)?|ないと(?:いけない|だめ)?",
    meaning: "Must do; obligation.",
    structure: "Verb ない-form without ない + なければならない",
    example: "宿題をしなければならない。 (I have to do my homework.)",
    jlpt_level: "N4",
    nuance: "なきゃ and ないと are common casual forms.",
    tags: ["obligation"],
    priority: 95
  },
  {
    id: "tara",
    pattern: "たら",
    variants: ["たら", "だったら"],
    regex: "(?:たら|だったら)",
    meaning: "If or when; conditional.",
    structure: "Verb た-form / い-adjective past / noun + だったら",
    example: "雨が降ったら、家にいます。 (If it rains, I'll stay home.)",
    jlpt_level: "N4",
    nuance: "Can mean either a condition or the timing after something happens.",
    tags: ["conditional"],
    priority: 52
  },
  {
    id: "koto-ga-dekiru",
    pattern: "ことができる",
    variants: ["ことができる", "ことができます", "ことができた", "ことができました", "ことができない", "ことができません"],
    regex: "ことができ(?:る|ます|た|ました|ない|ません)",
    meaning: "Can do; ability.",
    structure: "Verb dictionary form + ことができる",
    example: "日本語を話すことができる。 (I can speak Japanese.)",
    jlpt_level: "N4",
    nuance: "More explicit and often more formal than the potential verb form.",
    tags: ["ability"],
    priority: 90
  },
  {
    id: "temo-ii",
    pattern: "てもいい",
    variants: ["てもいい", "でもいい", "てもよい", "でもよい", "ても大丈夫", "でも大丈夫"],
    regex: "(?:て|で)も(?:いい|よい|大丈夫)",
    meaning: "It is okay to; permission.",
    structure: "Verb て-form + もいい",
    example: "ここに座ってもいいですか。 (May I sit here?)",
    jlpt_level: "N5",
    nuance: "With a question, it asks for permission.",
    tags: ["permission"],
    priority: 86
  },
  {
    id: "te-wa-ikenai",
    pattern: "てはいけない",
    variants: ["てはいけない", "ではいけない", "てはいけません", "ではいけません", "ちゃいけない", "じゃいけない", "ちゃだめ", "じゃだめ"],
    regex: "(?:て|で)は(?:いけない|いけません|だめ|ダメ)|(?:ちゃ|じゃ)(?:いけない|だめ|ダメ)",
    meaning: "Must not; prohibition.",
    structure: "Verb て-form + はいけない",
    example: "ここで写真を撮ってはいけない。 (You must not take photos here.)",
    jlpt_level: "N5",
    nuance: "ちゃだめ is a casual spoken form.",
    tags: ["prohibition"],
    priority: 90
  },
  {
    id: "ta-koto-ga-aru",
    pattern: "たことがある",
    variants: ["たことがある", "たことがあります", "たことがない", "たことがありません"],
    regex: "たことが(?:ある|あります|ない|ありません)",
    meaning: "Have experienced doing something.",
    structure: "Verb た-form + ことがある",
    example: "日本に行ったことがある。 (I have been to Japan.)",
    jlpt_level: "N4",
    nuance: "Use たことがない for no prior experience.",
    tags: ["experience"],
    priority: 90
  },
  {
    id: "you-ni-suru",
    pattern: "ようにする",
    variants: ["ようにする", "ようにします", "ようにしている", "ようにしています"],
    regex: "ように(?:する|します|している|しています)",
    meaning: "Try to; make sure to.",
    structure: "Verb dictionary / ない-form + ようにする",
    example: "毎日運動するようにしている。 (I try to exercise every day.)",
    jlpt_level: "N3",
    nuance: "Often describes a habit or deliberate effort.",
    tags: ["habit", "effort"],
    priority: 88
  },
  {
    id: "you-ni-naru",
    pattern: "ようになる",
    variants: ["ようになる", "ようになります", "ようになった", "ようになりました"],
    regex: "ように(?:なる|なります|なった|なりました)",
    meaning: "Become able to; reach a point where.",
    structure: "Verb dictionary / potential / ない-form + ようになる",
    example: "漢字が読めるようになった。 (I became able to read kanji.)",
    jlpt_level: "N3",
    nuance: "Useful for changes in ability, habit, or state.",
    tags: ["change", "ability"],
    priority: 88
  },
  {
    id: "bakari",
    pattern: "ばかり",
    variants: ["ばかり", "ばっかり"],
    regex: "ばっ?かり",
    meaning: "Only, nothing but, or just did something.",
    structure: "Verb た-form + ばかり / Noun + ばかり",
    example: "さっき食べたばかりです。 (I just ate a moment ago.)",
    jlpt_level: "N3",
    nuance: "Meaning depends heavily on whether it follows a noun or past-tense verb.",
    tags: ["limitation", "time"],
    priority: 72
  },
  {
    id: "ni-oite",
    pattern: "において",
    variants: ["において", "における"],
    regex: "にお(?:いて|ける)",
    meaning: "In, at, or regarding; formal context/location.",
    structure: "Noun + において / における + Noun",
    example: "この分野において彼は専門家です。 (He is an expert in this field.)",
    jlpt_level: "N2",
    nuance: "Formal equivalent of で or に in many contexts.",
    tags: ["formal", "context"],
    priority: 84
  },
  {
    id: "ni-taishite",
    pattern: "に対して",
    variants: ["に対して", "に対する", "に対し"],
    regex: "に対(?:して|する|し)",
    meaning: "Toward, against, or in contrast to.",
    structure: "Noun + に対して / に対する + Noun",
    example: "彼の意見に対して反論した。 (I argued against his opinion.)",
    jlpt_level: "N2",
    nuance: "Marks the target of an action, attitude, or contrast.",
    tags: ["target", "formal"],
    priority: 86
  },
  {
    id: "nimo-kakawarazu",
    pattern: "にもかかわらず",
    variants: ["にもかかわらず", "にかかわらず", "にも関わらず", "に関わらず"],
    regex: "にも?かかわらず|にも?関わらず",
    meaning: "Despite; in spite of.",
    structure: "Noun / plain form + にもかかわらず",
    example: "雨にもかかわらず、試合は行われた。 (Despite the rain, the match was held.)",
    jlpt_level: "N2",
    nuance: "Formal and often used in writing.",
    tags: ["contrast", "formal"],
    priority: 92
  },
  {
    id: "zaru-wo-enai",
    pattern: "ざるを得ない",
    variants: ["ざるを得ない", "ざるをえない"],
    regex: "ざるを(?:得ない|えない)",
    meaning: "Cannot help but; have no choice but to.",
    structure: "Verb ない-stem + ざるを得ない",
    example: "認めざるを得ない。 (I have no choice but to admit it.)",
    jlpt_level: "N1",
    nuance: "する becomes せざるを得ない.",
    tags: ["necessity", "formal"],
    priority: 96
  },
  {
    id: "wo-motte",
    pattern: "をもって",
    variants: ["をもって", "を以て"],
    regex: "を(?:もって|以て)",
    meaning: "With, by means of, or as of; formal.",
    structure: "Noun + をもって",
    example: "本日をもって閉店いたします。 (As of today, we will close the store.)",
    jlpt_level: "N1",
    nuance: "Common in announcements and formal written Japanese.",
    tags: ["formal", "means"],
    priority: 88
  },
  {
    id: "dewa-nai-ka",
    pattern: "ではないか",
    variants: ["ではないか", "じゃないか", "ではありませんか"],
    regex: "(?:ではないか|じゃないか|ではありませんか)",
    meaning: "Isn't it?; seeking agreement or stating an opinion.",
    structure: "Plain form + ではないか / じゃないか",
    example: "これは間違いではないか。 (Isn't this a mistake?)",
    jlpt_level: "N3",
    nuance: "Can sound rhetorical, surprised, or assertive depending on tone.",
    tags: ["rhetorical", "opinion"],
    priority: 80
  },
  {
    id: "tai",
    pattern: "たい",
    variants: ["たい", "たいです", "たくない", "たかった"],
    regex: "(?:たい(?:です)?|たくない|たかった)",
    meaning: "Want to do something.",
    structure: "Verb ます-stem + たい",
    example: "日本に行きたい。 (I want to go to Japan.)",
    jlpt_level: "N5",
    nuance: "Conjugates like an い-adjective.",
    tags: ["desire"],
    priority: 46
  },
  {
    id: "naide-kudasai",
    pattern: "ないでください",
    variants: ["ないでください", "ないで下さい", "ないでくれ", "ないでほしい"],
    regex: "ないで(?:ください|下さい|くれ|ほしい)",
    meaning: "Please do not do; negative request.",
    structure: "Verb ない-form + でください",
    example: "ここで走らないでください。 (Please don't run here.)",
    jlpt_level: "N5",
    nuance: "ないでほしい expresses what the speaker wants someone not to do.",
    tags: ["request", "negative"],
    priority: 88
  },
  {
    id: "sou-da",
    pattern: "そうだ",
    variants: ["そうだ", "そうです", "そうだった", "そうに", "そうな"],
    regex: "そう(?:だ|です|だった|に|な)",
    meaning: "Looks like; seems like; I heard that.",
    structure: "Verb stem + そうだ / Plain form + そうだ",
    example: "雨が降りそうだ。 (It looks like it's going to rain.)",
    jlpt_level: "N4",
    nuance: "Appearance and hearsay use different forms before そうだ.",
    tags: ["appearance", "hearsay"],
    priority: 58
  },
  {
    id: "rashii",
    pattern: "らしい",
    variants: ["らしい", "らしく", "らしかった"],
    regex: "らし(?:い|く|かった)",
    meaning: "Seems like; apparently; typical of.",
    structure: "Noun / plain form + らしい",
    example: "彼は日本に行くらしい。 (Apparently he is going to Japan.)",
    jlpt_level: "N4",
    nuance: "Can report information or mean something is characteristic.",
    tags: ["hearsay", "appearance"],
    priority: 56
  },
  {
    id: "mitai",
    pattern: "みたい",
    variants: ["みたい", "みたいだ", "みたいです", "みたいな", "みたいに"],
    regex: "みたい(?:だ|です|な|に)?",
    meaning: "Looks like; seems like; similar to.",
    structure: "Noun / plain form + みたい",
    example: "このケーキは宝石みたいだ。 (This cake looks like a jewel.)",
    jlpt_level: "N4",
    nuance: "Casual and conversational compared with ようだ.",
    tags: ["similarity", "appearance"],
    priority: 55
  },
  {
    id: "node",
    pattern: "ので",
    variants: ["ので"],
    regex: "ので",
    meaning: "Because; reason or cause.",
    structure: "Plain form + ので",
    example: "雨が降っているので、出かけません。 (Because it is raining, I won't go out.)",
    jlpt_level: "N5",
    nuance: "Often sounds softer or more explanatory than から.",
    tags: ["reason"],
    priority: 44
  },
  {
    id: "noni",
    pattern: "のに",
    variants: ["のに"],
    regex: "のに",
    meaning: "Although; despite; even though.",
    structure: "Plain form + のに",
    example: "勉強したのに、忘れてしまった。 (Although I studied, I forgot.)",
    jlpt_level: "N4",
    nuance: "Often carries surprise, frustration, or disappointment.",
    tags: ["contrast"],
    priority: 64
  },
  {
    id: "nagara",
    pattern: "ながら",
    variants: ["ながら"],
    regex: "ながら",
    meaning: "While doing; although.",
    structure: "Verb ます-stem + ながら",
    example: "音楽を聞きながら勉強します。 (I study while listening to music.)",
    jlpt_level: "N4",
    nuance: "The same subject usually performs both actions.",
    tags: ["simultaneous"],
    priority: 62
  },
  {
    id: "mae-ni",
    pattern: "前に",
    variants: ["前に", "まえに"],
    regex: "(?:前|まえ)に",
    meaning: "Before doing something.",
    structure: "Verb dictionary form / Noun + の + 前に",
    example: "寝る前に歯を磨きます。 (I brush my teeth before sleeping.)",
    jlpt_level: "N5",
    nuance: "Use dictionary form before 前に, not past tense.",
    tags: ["time"],
    priority: 60
  },
  {
    id: "ato-de",
    pattern: "後で",
    variants: ["後で", "あとで"],
    regex: "(?:後|あと)で",
    meaning: "After doing something; later.",
    structure: "Verb た-form / Noun + の + 後で",
    example: "仕事が終わった後で、電話します。 (I will call after work ends.)",
    jlpt_level: "N5",
    nuance: "Use た-form before 後で.",
    tags: ["time"],
    priority: 60
  },
  {
    id: "tsumori",
    pattern: "つもり",
    variants: ["つもり", "つもりです", "つもりだ", "つもりはない"],
    regex: "つもり(?:です|だ|はない)?",
    meaning: "Plan or intention.",
    structure: "Verb dictionary / ない-form + つもり",
    example: "来年日本へ行くつもりです。 (I plan to go to Japan next year.)",
    jlpt_level: "N4",
    nuance: "つもりはない means there is no intention to do it.",
    tags: ["intention"],
    priority: 68
  },
  {
    id: "hou-ga-ii",
    pattern: "ほうがいい",
    variants: ["ほうがいい", "方がいい", "ほうがよい", "方がよい"],
    regex: "(?:ほう|方)が(?:いい|よい)",
    meaning: "Had better; should.",
    structure: "Verb た-form / ない-form + ほうがいい",
    example: "早く寝たほうがいい。 (You should sleep early.)",
    jlpt_level: "N4",
    nuance: "Often gives advice based on the speaker's judgment.",
    tags: ["advice"],
    priority: 78
  },
  {
    id: "kamo-shirenai",
    pattern: "かもしれない",
    variants: ["かもしれない", "かもしれません", "かも"],
    regex: "かも(?:しれない|しれません)?",
    meaning: "Might; maybe.",
    structure: "Plain form + かもしれない",
    example: "明日は雨かもしれない。 (It might rain tomorrow.)",
    jlpt_level: "N4",
    nuance: "かも is the casual shortened form.",
    tags: ["possibility"],
    priority: 82
  },
  {
    id: "hazu",
    pattern: "はず",
    variants: ["はず", "はずだ", "はずです", "はずがない"],
    regex: "はず(?:だ|です|がない)?",
    meaning: "Should be; expected to.",
    structure: "Plain form + はず",
    example: "彼はもう着いたはずです。 (He should have arrived already.)",
    jlpt_level: "N4",
    nuance: "はずがない means something should not be possible.",
    tags: ["expectation"],
    priority: 66
  },
  {
    id: "wake",
    pattern: "わけ",
    variants: ["わけだ", "わけです", "わけではない", "わけがない", "わけにはいかない"],
    regex: "わけ(?:だ|です|ではない|がない|にはいかない)",
    meaning: "It means that; no wonder; cannot reasonably do.",
    structure: "Plain form + わけだ / わけではない / わけにはいかない",
    example: "高いわけだ。 (No wonder it's expensive.)",
    jlpt_level: "N3",
    nuance: "Several わけ patterns have different meanings, so read the surrounding sentence.",
    tags: ["explanation", "constraint"],
    priority: 74
  },
  {
    id: "tame-ni",
    pattern: "ために",
    variants: ["ために", "為に"],
    regex: "(?:ため|為)に",
    meaning: "For the purpose of; for the sake of.",
    structure: "Verb dictionary form / Noun + の + ために",
    example: "留学するために貯金しています。 (I am saving money to study abroad.)",
    jlpt_level: "N4",
    nuance: "Can express purpose or benefit depending on context.",
    tags: ["purpose"],
    priority: 65
  },
  {
    id: "you-da",
    pattern: "ようだ",
    variants: ["ようだ", "ようです", "ような", "ように"],
    regex: "よう(?:だ|です|な|に)",
    meaning: "Seems like; similar to; in order to.",
    structure: "Plain form / Noun + の + ようだ",
    example: "夢のようです。 (It is like a dream.)",
    jlpt_level: "N4",
    nuance: "Meaning changes by form: ようだ, ような, ように.",
    tags: ["appearance", "similarity"],
    priority: 54
  },
  {
    id: "nasai",
    pattern: "なさい",
    variants: ["なさい"],
    regex: "なさい",
    meaning: "Do; command or instruction.",
    structure: "Verb ます-stem + なさい",
    example: "早く寝なさい。 (Go to bed early.)",
    jlpt_level: "N4",
    nuance: "Often used by parents, teachers, or written instructions.",
    tags: ["command"],
    priority: 62
  },
  {
    id: "sae",
    pattern: "さえ",
    variants: ["さえ", "でさえ"],
    regex: "(?:で)?さえ",
    meaning: "Even; as long as.",
    structure: "Noun + さえ / Verb て-form + さえ",
    example: "水さえ飲めれば大丈夫です。 (As long as I can drink water, I'll be okay.)",
    jlpt_level: "N3",
    nuance: "Can emphasize an extreme example or minimum condition.",
    tags: ["emphasis", "condition"],
    priority: 58
  },
  {
    id: "beki",
    pattern: "べき",
    variants: ["べき", "べきだ", "べきです", "べきではない"],
    regex: "べき(?:だ|です|ではない)?",
    meaning: "Should; ought to.",
    structure: "Verb dictionary form + べき",
    example: "約束は守るべきです。 (You should keep promises.)",
    jlpt_level: "N3",
    nuance: "Stronger and more principle-based than ほうがいい.",
    tags: ["advice", "duty"],
    priority: 70
  },
  {
    id: "to-iu",
    pattern: "という",
    variants: ["という", "っていう", "と言う"],
    regex: "(?:という|っていう|と言う)",
    meaning: "Called; that; quotation or explanation.",
    structure: "Phrase + という + Noun",
    example: "田中さんという人を知っていますか。 (Do you know a person called Tanaka?)",
    jlpt_level: "N5",
    nuance: "Very common for names, definitions, and quoted ideas.",
    tags: ["quotation", "definition"],
    priority: 50
  }
];

function containsJapanese(text) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(text);
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .trim();
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function findEntryMatch(entry, text) {
  const hits = [];

  for (const variant of entry.variants || [entry.pattern]) {
    const index = text.indexOf(variant);
    if (index >= 0) {
      hits.push({ text: variant, index, exact: variant === entry.pattern });
    }
  }

  if (entry.regex) {
    try {
      const regex = new RegExp(entry.regex, "u");
      const match = text.match(regex);
      if (match && typeof match.index === "number") {
        hits.push({ text: match[0], index: match.index, exact: match[0] === entry.pattern });
      }
    } catch (error) {
      console.warn("Grammar Sensei: invalid pattern", entry.id, error);
    }
  }

  if (!hits.length) return null;

  return hits.sort((a, b) => {
    if (b.text.length !== a.text.length) return b.text.length - a.text.length;
    if (a.index !== b.index) return a.index - b.index;
    return Number(b.exact) - Number(a.exact);
  })[0];
}

function scoreMatch(entry, hit) {
  const base = entry.priority || 50;
  const lengthScore = Math.min(hit.text.length * 2, 18);
  const exactBonus = hit.exact ? 8 : 0;
  const earlyBonus = Math.max(0, 8 - Math.floor(hit.index / 8));
  return base + lengthScore + exactBonus + earlyBonus;
}

function buildFallback(selectedText, reason) {
  const hasJapanese = containsJapanese(selectedText);
  const message = hasJapanese
    ? "No known grammar pattern was detected. Try selecting a longer phrase that includes the verb ending or surrounding particles."
    : "No Japanese text was detected. Highlight a Japanese phrase first.";

  return {
    input: selectedText,
    detected_japanese: hasJapanese,
    grammar: "Not detected",
    meaning: reason || message,
    structure: "-",
    example: "-",
    jlpt_level: "-",
    confidence: 0,
    primary: null,
    matches: [],
    all_matches: [],
    suggestions: [
      "Select the full phrase, not only one kanji or word.",
      "Include the ending such as ている, たことがある, or かもしれない.",
      "Use the toolbar popup to inspect recent analyses."
    ]
  };
}

function analyzeJapaneseGrammar(text) {
  const selectedText = String(text || "").trim();
  const normalized = normalizeText(selectedText);

  if (!normalized) {
    return buildFallback("", "Nothing was selected.");
  }

  if (!containsJapanese(normalized)) {
    return buildFallback(selectedText);
  }

  const matches = GRAMMAR_DATABASE
    .map((entry) => {
      const hit = findEntryMatch(entry, normalized);
      if (!hit) return null;

      const score = scoreMatch(entry, hit);
      return {
        id: entry.id,
        grammar: entry.pattern,
        detected: hit.text,
        meaning: entry.meaning,
        structure: entry.structure,
        example: entry.example,
        jlpt_level: entry.jlpt_level,
        nuance: entry.nuance,
        tags: entry.tags || [],
        confidence: Math.min(99, Math.round(score)),
        index: hit.index,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.index !== b.index) return a.index - b.index;
      return b.detected.length - a.detected.length;
    });

  if (!matches.length) {
    return buildFallback(selectedText);
  }

  const primary = matches[0];

  return {
    input: selectedText,
    normalized_input: normalized,
    detected_japanese: true,
    grammar: primary.grammar,
    meaning: primary.meaning,
    structure: primary.structure,
    example: primary.example,
    jlpt_level: primary.jlpt_level,
    confidence: primary.confidence,
    primary,
    matches,
    all_matches: matches.map((match) => match.grammar),
    tags: uniqueValues(matches.flatMap((match) => match.tags)),
    suggestions: matches.length > 1
      ? ["Multiple grammar patterns were found. Review the match list for nested structures."]
      : []
  };
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
      resolve({ ...DEFAULT_SETTINGS, ...items });
    });
  });
}

function updateSettings(partial) {
  return new Promise((resolve) => {
    const next = {};
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (Object.prototype.hasOwnProperty.call(partial, key)) {
        next[key] = Boolean(partial[key]);
      }
    }

    chrome.storage.sync.set(next, async () => {
      resolve(await getSettings());
    });
  });
}

function getHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get({ history: [] }, ({ history }) => {
      resolve(Array.isArray(history) ? history : []);
    });
  });
}

function setHistory(history) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ history }, () => resolve(history));
  });
}

async function saveHistoryEntry(text, analysis, source = "selection") {
  const settings = await getSettings();
  if (!settings.saveHistory || !analysis || !analysis.primary) return null;

  const history = await getHistory();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: String(text || "").trim().slice(0, 600),
    grammar: analysis.primary.grammar,
    detected: analysis.primary.detected,
    meaning: analysis.primary.meaning,
    jlpt_level: analysis.primary.jlpt_level,
    matchCount: analysis.matches.length,
    source,
    createdAt: new Date().toISOString()
  };

  const deduped = history.filter((item) => {
    return !(item.text === entry.text && item.grammar === entry.grammar);
  });

  await setHistory([entry, ...deduped].slice(0, HISTORY_LIMIT));
  return entry;
}

function clearHistory() {
  return setHistory([]);
}

function getGrammarSummary() {
  const byLevel = GRAMMAR_DATABASE.reduce((acc, entry) => {
    acc[entry.jlpt_level] = (acc[entry.jlpt_level] || 0) + 1;
    return acc;
  }, {});

  const tags = uniqueValues(GRAMMAR_DATABASE.flatMap((entry) => entry.tags || [])).sort();

  return {
    total: GRAMMAR_DATABASE.length,
    byLevel,
    tags,
    patterns: GRAMMAR_DATABASE.map((entry) => ({
      id: entry.id,
      pattern: entry.pattern,
      jlpt_level: entry.jlpt_level,
      meaning: entry.meaning,
      tags: entry.tags || []
    }))
  };
}

function setupContextMenu() {
  if (!chrome.contextMenus) return;

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: EXTENSION_MENU_ID,
      title: "Analyze Japanese grammar",
      contexts: ["selection"]
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
    chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...items });
  });
  setupContextMenu();
});

chrome.runtime.onStartup.addListener(setupContextMenu);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== EXTENSION_MENU_ID || !info.selectionText || !tab?.id) {
    return;
  }

  const settings = await getSettings();
  if (!settings.enabled) return;

  const analysis = analyzeJapaneseGrammar(info.selectionText);
  await saveHistoryEntry(info.selectionText, analysis, "context-menu");

  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "SHOW_GRAMMAR_ANALYSIS",
      text: info.selectionText,
      data: analysis,
      source: "context-menu"
    },
    () => {
      if (chrome.runtime.lastError) {
        console.warn("Grammar Sensei:", chrome.runtime.lastError.message);
      }
    }
  );
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  (async () => {
    switch (request?.type) {
      case "ANALYZE_GRAMMAR": {
        const analysis = analyzeJapaneseGrammar(request.text);
        if (request.saveHistory !== false) {
          await saveHistoryEntry(request.text, analysis, request.source || "selection");
        }
        return { data: analysis };
      }

      case "GET_SETTINGS":
        return { data: await getSettings() };

      case "UPDATE_SETTINGS":
        return { data: await updateSettings(request.settings || {}) };

      case "GET_HISTORY":
        return { data: await getHistory() };

      case "CLEAR_HISTORY":
        return { data: await clearHistory() };

      case "GET_GRAMMAR_SUMMARY":
        return { data: getGrammarSummary() };

      default:
        throw new Error(`Unknown message type: ${request?.type || "empty"}`);
    }
  })()
    .then((payload) => sendResponse({ success: true, ...payload }))
    .catch((error) => {
      console.error("Grammar Sensei:", error);
      sendResponse({ success: false, error: error.message });
    });

  return true;
});
