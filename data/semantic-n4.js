/* Grammar Sensei - JLPT N4 Vietnamese/English semantic intent map.
 * Maps VI/EN keywords to a N4 grammarId. Every grammarId must exist in
 * the grammar DB or the entry is silently skipped at match time. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  const entries = [
    { grammarId: "ta-koto-ga-aru", viKeywords: ["đã từng", "từng", "có lần", "trải nghiệm", "trước đây đã"], enKeywords: ["have been", "have done", "ever", "before", "experienced"], intent: "past_experience", confidence: 78 },
    { grammarId: "ta-koto-ga-nai", viKeywords: ["chưa từng", "chưa bao giờ", "không từng"], enKeywords: ["have never", "never done", "never been"], intent: "no_experience", confidence: 80 },
    { grammarId: "hou-ga-ii", viKeywords: ["nên", "tốt hơn là", "khuyên", "nên làm"], enKeywords: ["should", "had better", "it is better to"], intent: "advice", confidence: 74 },
    { grammarId: "koto-ga-dekiru", viKeywords: ["có thể", "biết cách", "có khả năng", "làm được"], enKeywords: ["can", "be able to", "able to"], intent: "ability", confidence: 74 },
    { grammarId: "nakereba-naranai", viKeywords: ["phải", "bắt buộc", "cần phải", "không thể không"], enKeywords: ["must", "have to", "need to"], intent: "obligation", confidence: 73 },
    { grammarId: "nakutemo-ii", viKeywords: ["không cần", "khỏi cần", "không phải làm", "không bắt buộc"], enKeywords: ["do not have to", "don't need to", "need not"], intent: "no_obligation", confidence: 76 },
    { grammarId: "te-shimau", viKeywords: ["lỡ", "mất rồi", "trót", "làm xong hết", "đã mất"], enKeywords: ["ended up", "accidentally", "unfortunately", "completely did"], intent: "regret_completion", confidence: 74 },
    { grammarId: "kamo-shirenai", viKeywords: ["có lẽ", "có thể là", "biết đâu", "chắc có thể"], enKeywords: ["might", "maybe", "may be", "perhaps"], intent: "possibility", confidence: 72 },
    { grammarId: "tsumori", viKeywords: ["dự định", "định", "có kế hoạch"], enKeywords: ["plan to", "intend to", "going to"], intent: "intention", confidence: 72 },
    { grammarId: "te-hoshii", viKeywords: ["muốn ai đó", "mong ai đó", "muốn người khác"], enKeywords: ["want someone to", "want you to", "wish someone would"], intent: "want_other_action", confidence: 72 },
    { grammarId: "te-ageru", viKeywords: ["làm cho ai", "làm giúp ai", "giúp ai đó"], enKeywords: ["do for someone", "do a favor for"], intent: "do_for_other", confidence: 68 },
    { grammarId: "te-morau", viKeywords: ["được ai làm cho", "nhờ ai làm"], enKeywords: ["have someone do", "get someone to do"], intent: "receive_favor", confidence: 70 },
    { grammarId: "te-kara", viKeywords: ["sau khi làm xong", "làm xong rồi mới"], enKeywords: ["after doing", "once done then"], intent: "after_action", confidence: 70 },
    { grammarId: "nagara", viKeywords: ["vừa làm vừa", "vừa ... vừa", "đồng thời"], enKeywords: ["while doing", "at the same time as"], intent: "simultaneous", confidence: 74 },
    { grammarId: "noni", viKeywords: ["mặc dù mà", "vậy mà", "thế mà lại"], enKeywords: ["even though", "despite the fact that"], intent: "unexpected_contrast", confidence: 70 },
    { grammarId: "yasui", viKeywords: ["dễ làm", "dễ dàng để", "dễ mà"], enKeywords: ["easy to do", "easy to"], intent: "easy_to", confidence: 70 },
    { grammarId: "nikui", viKeywords: ["khó làm", "khó mà", "khó để"], enKeywords: ["hard to do", "difficult to"], intent: "hard_to", confidence: 70 },
    { grammarId: "shika-nai", viKeywords: ["chỉ ... thôi", "không gì ngoài", "chẳng còn gì khác"], enKeywords: ["nothing but", "only have"], intent: "only_negative", confidence: 70 },
    { grammarId: "hodo", viKeywords: ["đến mức", "tới mức mà"], enKeywords: ["to the extent that", "so much that"], intent: "extent", confidence: 70 },
    { grammarId: "kurai-gurai", viKeywords: ["khoảng", "tầm", "cỡ chừng"], enKeywords: ["approximately", "about", "around"], intent: "approx", confidence: 64 },
    { grammarId: "aida-ni", viKeywords: ["trong khoảng thời gian", "suốt trong lúc"], enKeywords: ["during the time", "while"], intent: "during_period", confidence: 70 },
    { grammarId: "you-ni-purpose", viKeywords: ["để mà", "sao cho", "để có thể"], enKeywords: ["so that", "in order to be able to"], intent: "purpose_potential", confidence: 70 },
    { grammarId: "sou-da", viKeywords: ["nghe nói", "nghe đồn", "người ta nói rằng"], enKeywords: ["I heard that", "they say", "reportedly"], intent: "hearsay", confidence: 70 },
    { grammarId: "rashii", viKeywords: ["hình như", "nghe chừng", "có vẻ như là"], enKeywords: ["apparently", "it seems that"], intent: "apparent_hearsay", confidence: 68 },
    { grammarId: "you-da", viKeywords: ["dường như", "trông như là", "có lẽ là"], enKeywords: ["it seems", "it appears", "looks as if"], intent: "seeming", confidence: 68 },
    { grammarId: "mitai", viKeywords: ["giống như", "trông giống", "kiểu như"], enKeywords: ["looks like", "similar to", "just like"], intent: "resemblance", confidence: 66 },
    { grammarId: "tara", viKeywords: ["nếu", "nếu như", "khi nào thì", "sau khi thì"], enKeywords: ["if", "when", "after that"], intent: "condition_general", confidence: 74 },
    { grammarId: "nara", viKeywords: ["nếu là", "nói về", "còn về", "về chuyện"], enKeywords: ["if it is", "as for", "speaking of"], intent: "topic_condition", confidence: 74 },
    { grammarId: "ka-dou-ka", viKeywords: ["có hay không", "liệu có", "hay không"], enKeywords: ["whether", "whether or not"], intent: "whether_or_not", confidence: 78 },
    { grammarId: "darou", viKeywords: ["chắc là", "có lẽ", "chắc sẽ", "dự đoán"], enKeywords: ["probably", "I suppose", "likely"], intent: "soft_prediction", confidence: 70 },
    { grammarId: "te-kureru-kudasai", viKeywords: ["giúp tôi được không", "làm giúp tôi", "có thể làm giúp"], enKeywords: ["could you do for me", "can you help me"], intent: "casual_request", confidence: 74 },
    { grammarId: "ta-bakari", viKeywords: ["vừa mới", "mới vừa", "vừa làm xong"], enKeywords: ["just did", "have just"], intent: "recent_completion", confidence: 76 }
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(entries);
})(globalThis);
