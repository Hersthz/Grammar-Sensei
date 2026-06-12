/* Grammar Sensei - Vietnamese/English semantic intent map */
(function (global) {
  "use strict";

  const semanticMap = [
    {
      grammarId: "ta-koto-ga-aru",
      viKeywords: ["đã từng", "từng", "có lần", "trải nghiệm", "trước đây đã"],
      enKeywords: ["have been", "have done", "ever", "before", "experienced"],
      intent: "past_experience",
      confidence: 78
    },
    {
      grammarId: "ta-koto-ga-nai",
      viKeywords: ["chưa từng", "chưa bao giờ", "không từng"],
      enKeywords: ["have never", "never done", "never been"],
      intent: "no_experience",
      confidence: 80
    },
    {
      grammarId: "hou-ga-ii",
      viKeywords: ["nên", "tốt hơn là", "khuyên", "nên làm"],
      enKeywords: ["should", "had better", "it is better to"],
      intent: "advice",
      confidence: 74
    },
    {
      grammarId: "beki",
      viKeywords: ["phải nên", "nên theo lẽ", "đúng ra nên", "cần phải"],
      enKeywords: ["ought to", "should as a duty", "must as a principle"],
      intent: "principled_advice",
      confidence: 70
    },
    {
      grammarId: "koto-ga-dekiru",
      viKeywords: ["có thể", "biết cách", "có khả năng", "làm được"],
      enKeywords: ["can", "be able to", "able to"],
      intent: "ability",
      confidence: 74
    },
    {
      grammarId: "nakereba-naranai",
      viKeywords: ["phải", "bắt buộc", "cần phải", "không thể không"],
      enKeywords: ["must", "have to", "need to"],
      intent: "obligation",
      confidence: 73
    },
    {
      grammarId: "nakutemo-ii",
      viKeywords: ["không cần", "khỏi cần", "không phải làm", "không bắt buộc"],
      enKeywords: ["do not have to", "don't need to", "need not"],
      intent: "no_obligation",
      confidence: 76
    },
    {
      grammarId: "temo-ii",
      viKeywords: ["được phép", "có được không", "làm được không", "có thể được không"],
      enKeywords: ["may i", "is it okay to", "can i", "allowed to"],
      intent: "permission",
      confidence: 72
    },
    {
      grammarId: "tewa-ikenai",
      viKeywords: ["không được", "cấm", "không cho phép", "không nên làm"],
      enKeywords: ["must not", "not allowed", "forbidden", "cannot do"],
      intent: "prohibition",
      confidence: 74
    },
    {
      grammarId: "tai",
      viKeywords: ["muốn", "muốn làm", "mong muốn"],
      enKeywords: ["want to", "would like to"],
      intent: "desire",
      confidence: 70
    },
    {
      grammarId: "te-iru",
      viKeywords: ["đang", "đang làm", "vẫn đang", "ở trạng thái"],
      enKeywords: ["am doing", "is doing", "are doing", "currently", "in the state of"],
      intent: "progressive_or_state",
      confidence: 68
    },
    {
      grammarId: "te-shimau",
      viKeywords: ["lỡ", "mất rồi", "trót", "làm xong hết", "đã mất"],
      enKeywords: ["ended up", "accidentally", "unfortunately", "completely did"],
      intent: "regret_completion",
      confidence: 74
    },
    {
      grammarId: "kamo-shirenai",
      viKeywords: ["có lẽ", "có thể là", "biết đâu", "chắc có thể"],
      enKeywords: ["might", "maybe", "may be", "perhaps"],
      intent: "possibility",
      confidence: 72
    },
    {
      grammarId: "hazu",
      viKeywords: ["chắc là", "đáng lẽ", "theo lý thì", "hẳn là"],
      enKeywords: ["should be", "expected to", "must have"],
      intent: "expectation",
      confidence: 72
    },
    {
      grammarId: "you-ni-suru",
      viKeywords: ["cố gắng", "tập thói quen", "đảm bảo là", "cố để"],
      enKeywords: ["try to", "make sure to", "make a habit of"],
      intent: "effort_habit",
      confidence: 74
    },
    {
      grammarId: "you-ni-naru",
      viKeywords: ["trở nên", "dần có thể", "bắt đầu có thể", "đã có thể"],
      enKeywords: ["became able to", "come to", "started to be able"],
      intent: "change_ability",
      confidence: 75
    },
    {
      grammarId: "nimo-kakawarazu",
      viKeywords: ["mặc dù", "bất chấp", "dù vậy", "cho dù"],
      enKeywords: ["despite", "in spite of", "although"],
      intent: "despite",
      confidence: 72
    },
    {
      grammarId: "tame-ni",
      viKeywords: ["để", "nhằm", "vì mục đích", "cho mục đích"],
      enKeywords: ["in order to", "for the purpose of", "for"],
      intent: "purpose",
      confidence: 68
    },
    {
      grammarId: "to-omou",
      viKeywords: ["tôi nghĩ", "nghĩ rằng", "cho rằng"],
      enKeywords: ["i think", "think that", "believe that"],
      intent: "opinion",
      confidence: 70
    },
    {
      grammarId: "tsumori",
      viKeywords: ["dự định", "định", "có kế hoạch"],
      enKeywords: ["plan to", "intend to", "going to"],
      intent: "intention",
      confidence: 72
    }
  ];

  global.GrammarSenseiData = global.GrammarSenseiData || {};
  global.GrammarSenseiData.SEMANTIC_GRAMMAR_MAP = semanticMap;
})(globalThis);
