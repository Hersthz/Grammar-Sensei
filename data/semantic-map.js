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
    },
    {
      grammarId: "te-hoshii",
      viKeywords: ["muốn ai đó", "mong ai đó", "muốn người khác"],
      enKeywords: ["want someone to", "want you to", "wish someone would"],
      intent: "want_other_action",
      confidence: 72
    },
    {
      grammarId: "te-miru",
      viKeywords: ["thử", "thử làm", "làm thử"],
      enKeywords: ["try doing", "give it a try", "attempt to"],
      intent: "try_action",
      confidence: 72
    },
    {
      grammarId: "te-oku",
      viKeywords: ["làm trước", "chuẩn bị sẵn", "để sẵn"],
      enKeywords: ["do in advance", "do beforehand", "prepare ahead"],
      intent: "do_in_advance",
      confidence: 74
    },
    {
      grammarId: "te-ageru",
      viKeywords: ["làm cho ai", "làm giúp ai", "giúp ai đó"],
      enKeywords: ["do for someone", "do a favor for"],
      intent: "do_for_other",
      confidence: 68
    },
    {
      grammarId: "te-morau",
      viKeywords: ["được ai làm cho", "nhờ ai làm"],
      enKeywords: ["have someone do", "get someone to do"],
      intent: "receive_favor",
      confidence: 70
    },
    {
      grammarId: "te-kara",
      viKeywords: ["sau khi làm xong", "làm xong rồi mới"],
      enKeywords: ["after doing", "once done then"],
      intent: "after_action",
      confidence: 70
    },
    {
      grammarId: "mae-ni",
      viKeywords: ["trước khi"],
      enKeywords: ["before doing", "prior to"],
      intent: "before_action",
      confidence: 72
    },
    {
      grammarId: "ato-de",
      viKeywords: ["sau đó", "lát nữa", "để sau"],
      enKeywords: ["afterwards", "later on"],
      intent: "later",
      confidence: 66
    },
    {
      grammarId: "nagara",
      viKeywords: ["vừa làm vừa", "vừa ... vừa", "đồng thời"],
      enKeywords: ["while doing", "at the same time as"],
      intent: "simultaneous",
      confidence: 74
    },
    {
      grammarId: "kara",
      viKeywords: ["vì", "bởi vì", "tại vì"],
      enKeywords: ["because", "since"],
      intent: "reason_casual",
      confidence: 64
    },
    {
      grammarId: "node",
      viKeywords: ["do là", "bởi lẽ", "chính vì"],
      enKeywords: ["due to the fact", "owing to"],
      intent: "reason_polite",
      confidence: 64
    },
    {
      grammarId: "keredo",
      viKeywords: ["nhưng", "tuy nhiên", "thế nhưng"],
      enKeywords: ["but", "however", "though"],
      intent: "contrast",
      confidence: 64
    },
    {
      grammarId: "noni",
      viKeywords: ["mặc dù mà", "vậy mà", "thế mà lại"],
      enKeywords: ["even though", "despite the fact that"],
      intent: "unexpected_contrast",
      confidence: 70
    },
    {
      grammarId: "yasui",
      viKeywords: ["dễ làm", "dễ dàng để", "dễ mà"],
      enKeywords: ["easy to do", "easy to"],
      intent: "easy_to",
      confidence: 70
    },
    {
      grammarId: "nikui",
      viKeywords: ["khó làm", "khó mà", "khó để"],
      enKeywords: ["hard to do", "difficult to"],
      intent: "hard_to",
      confidence: 70
    },
    {
      grammarId: "sugiru",
      viKeywords: ["quá mức", "quá đỗi", "quá nhiều"],
      enKeywords: ["too much", "excessively", "overly"],
      intent: "excessive",
      confidence: 70
    },
    {
      grammarId: "hoshii",
      viKeywords: ["muốn có", "thèm", "muốn một"],
      enKeywords: ["want something", "would like a"],
      intent: "want_object",
      confidence: 68
    },
    {
      grammarId: "no-ga-jouzu",
      viKeywords: ["giỏi", "khéo", "thành thạo"],
      enKeywords: ["good at", "skilled at"],
      intent: "good_at",
      confidence: 70
    },
    {
      grammarId: "no-ga-heta",
      viKeywords: ["dở", "kém ở", "vụng về"],
      enKeywords: ["bad at", "poor at"],
      intent: "bad_at",
      confidence: 70
    },
    {
      grammarId: "no-ga-suki",
      viKeywords: ["thích làm", "ưa thích việc"],
      enKeywords: ["like doing", "enjoy doing"],
      intent: "like_doing",
      confidence: 68
    },
    {
      grammarId: "dake",
      viKeywords: ["chỉ có", "duy nhất", "chỉ mỗi"],
      enKeywords: ["only", "just", "merely"],
      intent: "only_limit",
      confidence: 66
    },
    {
      grammarId: "shika-nai",
      viKeywords: ["chỉ ... thôi", "không gì ngoài", "chẳng còn gì khác"],
      enKeywords: ["nothing but", "only have"],
      intent: "only_negative",
      confidence: 70
    },
    {
      grammarId: "ni-tsuite",
      viKeywords: ["về việc", "liên quan tới", "nói về chuyện"],
      enKeywords: ["about", "concerning", "regarding"],
      intent: "about_topic",
      confidence: 70
    },
    {
      grammarId: "ni-yotte",
      viKeywords: ["bằng cách", "nhờ vào", "tùy vào"],
      enKeywords: ["by means of", "depending on", "by"],
      intent: "by_means",
      confidence: 70
    },
    {
      grammarId: "hodo",
      viKeywords: ["đến mức", "tới mức mà"],
      enKeywords: ["to the extent that", "so much that"],
      intent: "extent",
      confidence: 70
    },
    {
      grammarId: "kurai-gurai",
      viKeywords: ["khoảng", "tầm", "cỡ chừng"],
      enKeywords: ["approximately", "about", "around"],
      intent: "approx",
      confidence: 64
    },
    {
      grammarId: "uchi-ni",
      viKeywords: ["nhân lúc", "trong lúc còn", "trước khi mất"],
      enKeywords: ["while still", "before it changes"],
      intent: "while_still",
      confidence: 72
    },
    {
      grammarId: "aida-ni",
      viKeywords: ["trong khoảng thời gian", "suốt trong lúc"],
      enKeywords: ["during the time", "while"],
      intent: "during_period",
      confidence: 70
    },
    {
      grammarId: "you-to-suru",
      viKeywords: ["định làm", "toan làm", "sắp sửa"],
      enKeywords: ["about to", "try to do"],
      intent: "about_to",
      confidence: 70
    },
    {
      grammarId: "you-ni-purpose",
      viKeywords: ["để mà", "sao cho", "để có thể"],
      enKeywords: ["so that", "in order to be able to"],
      intent: "purpose_potential",
      confidence: 70
    },
    {
      grammarId: "to-iu",
      viKeywords: ["gọi là", "được gọi là", "tên là"],
      enKeywords: ["called", "named", "known as"],
      intent: "naming",
      confidence: 64
    },
    {
      grammarId: "sou-da",
      viKeywords: ["nghe nói", "nghe đồn", "người ta nói rằng"],
      enKeywords: ["I heard that", "they say", "reportedly"],
      intent: "hearsay",
      confidence: 70
    },
    {
      grammarId: "rashii",
      viKeywords: ["hình như", "nghe chừng", "có vẻ như là"],
      enKeywords: ["apparently", "it seems that"],
      intent: "apparent_hearsay",
      confidence: 68
    },
    {
      grammarId: "you-da",
      viKeywords: ["dường như", "trông như là", "có lẽ là"],
      enKeywords: ["it seems", "it appears", "looks as if"],
      intent: "seeming",
      confidence: 68
    },
    {
      grammarId: "mitai",
      viKeywords: ["giống như", "trông giống", "kiểu như"],
      enKeywords: ["looks like", "similar to", "just like"],
      intent: "resemblance",
      confidence: 66
    },
    {
      grammarId: "koto-ni-suru",
      viKeywords: ["quyết định làm", "đã quyết định"],
      enKeywords: ["decide to", "have decided to"],
      intent: "decision",
      confidence: 72
    },
    {
      grammarId: "koto-ni-naru",
      viKeywords: ["được quyết định", "hóa ra sẽ", "rốt cuộc thành"],
      enKeywords: ["it has been decided", "it turns out that"],
      intent: "decided_outcome",
      confidence: 70
    }
  ];

  global.GrammarSenseiData = global.GrammarSenseiData || {};
  global.GrammarSenseiData.SEMANTIC_GRAMMAR_MAP = semanticMap;
})(globalThis);
