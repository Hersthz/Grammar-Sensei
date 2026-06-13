/* Grammar Sensei - JLPT N2 Vietnamese/English semantic intent map.
 * Maps VI/EN keywords to a N2 grammarId. Every grammarId must exist in
 * the grammar DB or the entry is silently skipped at match time. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  const entries = [
    { grammarId: "nimo-kakawarazu", viKeywords: ["mặc dù", "bất chấp", "dù vậy", "cho dù"], enKeywords: ["despite", "in spite of", "although"], intent: "despite", confidence: 72 },
    { grammarId: "ni-motozuite", viKeywords: ["dựa trên", "căn cứ vào", "theo cơ sở"], enKeywords: ["based on", "on the basis of"], intent: "evidence_basis", confidence: 78 },
    { grammarId: "wo-moto-ni", viKeywords: ["dựa trên", "lấy làm nền", "lấy cảm hứng từ"], enKeywords: ["based on", "using as a basis"], intent: "creative_basis", confidence: 76 },
    { grammarId: "ni-oujite", viKeywords: ["tùy theo", "ứng với", "phù hợp với mức"], enKeywords: ["depending on", "according to"], intent: "adaptive_condition", confidence: 76 },
    { grammarId: "wo-tsuujite", viKeywords: ["thông qua", "qua việc", "trong suốt"], enKeywords: ["through", "throughout"], intent: "through_medium", confidence: 76 },
    { grammarId: "wo-komete", viKeywords: ["bằng cả", "gửi gắm", "đặt vào"], enKeywords: ["with all", "filled with", "put into"], intent: "emotion_put_into", confidence: 76 },
    { grammarId: "wo-megutte", viKeywords: ["xoay quanh", "tranh luận về", "liên quan đến tranh cãi"], enKeywords: ["over", "surrounding", "concerning dispute"], intent: "dispute_topic", confidence: 76 },
    { grammarId: "wo-to-wazu", viKeywords: ["bất kể", "không phân biệt", "dù là"], enKeywords: ["regardless of", "irrespective of"], intent: "regardless", confidence: 78 },
    { grammarId: "ni-kakawarazu", viKeywords: ["bất kể", "không phụ thuộc vào", "dù"], enKeywords: ["regardless of", "regardless whether"], intent: "regardless_condition", confidence: 78 },
    { grammarId: "kara-to-itte", viKeywords: ["không phải cứ", "chỉ vì không có nghĩa là", "dù là vì"], enKeywords: ["just because does not mean", "even if"], intent: "reject_simple_reasoning", confidence: 78 },
    { grammarId: "bakari-ka", viKeywords: ["không chỉ mà còn", "thậm chí còn"], enKeywords: ["not only but also", "on top of that"], intent: "not_only_stronger", confidence: 76 },
    { grammarId: "ni-suginai", viKeywords: ["chỉ là", "không hơn", "đơn thuần là"], enKeywords: ["merely", "nothing more than"], intent: "mere_limitation", confidence: 76 },
    { grammarId: "hoka-nai", viKeywords: ["không còn cách nào ngoài", "chỉ còn cách", "đành phải"], enKeywords: ["have no choice but", "nothing but"], intent: "no_choice", confidence: 78 },
    { grammarId: "kaneru", viKeywords: ["khó có thể", "không thể làm được", "xin phép không thể"], enKeywords: ["cannot", "be unable to"], intent: "formal_inability", confidence: 74 },
    { grammarId: "kanenai", viKeywords: ["có nguy cơ", "có thể xảy ra điều xấu", "rất có thể sẽ"], enKeywords: ["could happen", "might result in"], intent: "bad_possibility", confidence: 76 },
    { grammarId: "osore-ga-aru", viKeywords: ["có nguy cơ", "có khả năng xấu", "e rằng"], enKeywords: ["there is a risk", "there is a danger"], intent: "risk_warning", confidence: 78 },
    { grammarId: "ageku", viKeywords: ["sau bao lần", "cuối cùng thì", "rốt cuộc lại", "kết cục"], enKeywords: ["after all", "in the end", "after much"], intent: "bad_outcome_after", confidence: 78 },
    { grammarId: "sue-ni", viKeywords: ["sau cùng", "rốt cuộc sau khi", "cuối cùng sau"], enKeywords: ["after", "as a result of", "in the end"], intent: "outcome_after_effort", confidence: 76 },
    { grammarId: "kagiri", viKeywords: ["chừng nào còn", "trong phạm vi", "theo những gì", "hết mức"], enKeywords: ["as long as", "as far as", "to the limit"], intent: "limit_scope", confidence: 74 },
    { grammarId: "gatai", viKeywords: ["khó mà", "khó lòng", "khó tin"], enKeywords: ["hard to", "difficult to"], intent: "psychologically_hard", confidence: 74 },
    { grammarId: "kirenai", viKeywords: ["không xuể", "không hết", "nhiều quá không"], enKeywords: ["too many to", "cannot finish"], intent: "cannot_finish", confidence: 74 },
    { grammarId: "kiru", viKeywords: ["làm hết", "đến cùng", "trọn vẹn"], enKeywords: ["do completely", "finish entirely"], intent: "do_completely", confidence: 70 },
    { grammarId: "koso", viKeywords: ["chính là", "mới đúng là", "nhất định lần này"], enKeywords: ["precisely", "for sure"], intent: "emphasis_this", confidence: 70 },
    { grammarId: "kara-koso", viKeywords: ["chính vì nên", "chính bởi vì"], enKeywords: ["precisely because"], intent: "emphatic_reason", confidence: 78 },
    { grammarId: "koto-ka", viKeywords: ["biết bao", "xiết bao", "biết là bao"], enKeywords: ["how much", "how very"], intent: "exclamation_degree", confidence: 74 },
    { grammarId: "sei-ka", viKeywords: ["có lẽ do", "không biết có phải vì", "chắc tại"], enKeywords: ["perhaps because", "maybe due to"], intent: "uncertain_cause", confidence: 76 },
    { grammarId: "dake-atte", viKeywords: ["đúng là", "xứng với", "quả không hổ danh"], enKeywords: ["as expected of", "fitting that"], intent: "as_expected_praise", confidence: 78 },
    { grammarId: "dake-ni", viKeywords: ["chính vì nên càng", "vì là nên"], enKeywords: ["all the more because", "precisely because"], intent: "reason_intensified", confidence: 76 },
    { grammarId: "ta-tokoro-de", viKeywords: ["dù có cũng", "có làm cũng vô ích", "cho dù"], enKeywords: ["even if", "no matter how"], intent: "futile_concession", confidence: 76 },
    { grammarId: "tsuide-ni", viKeywords: ["tiện thể", "nhân tiện", "tiện luôn"], enKeywords: ["while at it", "on the occasion"], intent: "while_doing", confidence: 74 },
    { grammarId: "kkonai", viKeywords: ["không đời nào", "chẳng thể nào", "làm sao mà"], enKeywords: ["no way", "definitely not"], intent: "strong_impossibility", confidence: 74 },
    { grammarId: "tsutsu-aru", viKeywords: ["đang dần", "đang trong quá trình"], enKeywords: ["in the process of", "gradually"], intent: "ongoing_change", confidence: 76 },
    { grammarId: "te-irai", viKeywords: ["kể từ khi", "từ khi", "từ lúc"], enKeywords: ["since", "ever since"], intent: "since_event", confidence: 78 },
    { grammarId: "te-tamaranai", viKeywords: ["đến không chịu được", "vô cùng", "không chịu nổi"], enKeywords: ["unbearably", "cannot bear"], intent: "unbearable_feeling", confidence: 78 },
    { grammarId: "te-naranai", viKeywords: ["vô cùng", "không sao kìm được", "rất là"], enKeywords: ["extremely", "can't help feeling"], intent: "overwhelming_feeling", confidence: 76 },
    { grammarId: "dokoro-ka", viKeywords: ["đừng nói", "ngược lại còn", "không những không mà còn"], enKeywords: ["far from", "on the contrary"], intent: "contrary_to_expectation", confidence: 78 },
    { grammarId: "totan", viKeywords: ["ngay khi", "vừa thì", "vừa mới đã"], enKeywords: ["the moment", "just as"], intent: "instant_after", confidence: 78 },
    { grammarId: "nai-koto-niwa", viKeywords: ["nếu không thì không", "không thì chẳng"], enKeywords: ["unless", "without doing"], intent: "prerequisite", confidence: 76 },
    { grammarId: "nagara-mo", viKeywords: ["tuy nhưng vẫn", "mặc dù nhưng"], enKeywords: ["even though", "while still"], intent: "concession_state", confidence: 74 },
    { grammarId: "bakari-ni", viKeywords: ["chỉ vì mà", "chỉ tại"], enKeywords: ["simply because", "just because"], intent: "sole_bad_reason", confidence: 76 },
    { grammarId: "mono-ka", viKeywords: ["không đời nào", "quyết không", "đời nào mà"], enKeywords: ["absolutely not", "as if"], intent: "emotional_refusal", confidence: 76 },
    { grammarId: "mono-dakara", viKeywords: ["tại vì", "chỉ tại", "là vì"], enKeywords: ["because", "the reason is"], intent: "excuse_reason", confidence: 74 },
    { grammarId: "wo-kikkake-ni", viKeywords: ["nhân dịp", "lấy làm cơ hội", "từ đó mà"], enKeywords: ["taking the opportunity of", "triggered by"], intent: "trigger_event", confidence: 78 }
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(entries);
})(globalThis);
