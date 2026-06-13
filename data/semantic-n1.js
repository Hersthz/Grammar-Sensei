/* Grammar Sensei - JLPT N1 Vietnamese/English semantic intent map.
 * Maps VI/EN keywords to a N1 grammarId. Every grammarId must exist in
 * the grammar DB or the entry is silently skipped at match time. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  const entries = [
    { grammarId: "atte-no", viKeywords: ["có được là nhờ", "nhờ có mới có"], enKeywords: ["thanks to", "only because of"], intent: "exists_thanks_to", confidence: 80 },
    { grammarId: "ikan-da", viKeywords: ["tùy thuộc vào", "tùy vào", "phụ thuộc"], enKeywords: ["depends on"], intent: "depends_on", confidence: 80 },
    { grammarId: "ikan-ni-kakawarazu", viKeywords: ["bất kể", "dù thế nào", "không phụ thuộc"], enKeywords: ["regardless of"], intent: "regardless_formal", confidence: 80 },
    { grammarId: "ga-hayai-ka", viKeywords: ["vừa mới thì lập tức", "vừa là ngay"], enKeywords: ["as soon as", "no sooner than"], intent: "immediate_sequence", confidence: 80 },
    { grammarId: "ya-inaya", viKeywords: ["vừa thì lập tức", "ngay khi là"], enKeywords: ["the instant", "as soon as"], intent: "immediate_sequence_formal", confidence: 80 },
    { grammarId: "nari", viKeywords: ["ngay khi", "vừa liền"], enKeywords: ["as soon as", "the moment"], intent: "immediate_after_action", confidence: 76 },
    { grammarId: "soba-kara", viKeywords: ["vừa đã lại", "làm xong là quên"], enKeywords: ["as soon as repeatedly"], intent: "repeated_undoing", confidence: 78 },
    { grammarId: "kirai-ga-aru", viKeywords: ["có xu hướng xấu", "hay có tật"], enKeywords: ["tend to negatively"], intent: "negative_tendency_formal", confidence: 78 },
    { grammarId: "zukume", viKeywords: ["toàn là", "đầy những"], enKeywords: ["entirely", "full of"], intent: "entirely_made_of", confidence: 76 },
    { grammarId: "mamire", viKeywords: ["lấm lem", "dính đầy", "bê bết"], enKeywords: ["covered with", "smeared with"], intent: "covered_in_dirt", confidence: 76 },
    { grammarId: "zu-niwa-okanai", viKeywords: ["nhất định sẽ", "không thể không khiến"], enKeywords: ["will surely", "cannot help but cause"], intent: "inevitable_effect", confidence: 78 },
    { grammarId: "naide-wa-irarenai", viKeywords: ["không thể không", "không nhịn được"], enKeywords: ["cannot help but"], intent: "cannot_resist", confidence: 78 },
    { grammarId: "sura", viKeywords: ["ngay cả", "đến cả", "thậm chí"], enKeywords: ["even"], intent: "even_extreme", confidence: 76 },
    { grammarId: "taritomo", viKeywords: ["dù chỉ cũng không", "dù một cũng"], enKeywords: ["not even one"], intent: "not_even_one", confidence: 78 },
    { grammarId: "te-yamanai", viKeywords: ["mãi không thôi", "hết mực", "luôn luôn"], enKeywords: ["constantly", "from the heart"], intent: "lasting_feeling", confidence: 76 },
    { grammarId: "to-iedomo", viKeywords: ["dẫu rằng", "cho dù là", "dù có là"], enKeywords: ["even though", "even as"], intent: "concession_formal", confidence: 78 },
    { grammarId: "to-kitara", viKeywords: ["nói đến thì", "cái thì"], enKeywords: ["when it comes to"], intent: "topic_complaint", confidence: 74 },
    { grammarId: "naradewa", viKeywords: ["chỉ riêng mới có", "đặc trưng của", "đậm chất"], enKeywords: ["unique to", "only possible for"], intent: "uniquely_characteristic", confidence: 78 },
    { grammarId: "nakushite", viKeywords: ["nếu không có thì không", "thiếu thì không"], enKeywords: ["without", "if not for"], intent: "essential_condition", confidence: 78 },
    { grammarId: "ni-katakunai", viKeywords: ["không khó để", "dễ dàng tưởng tượng"], enKeywords: ["not hard to imagine"], intent: "easy_to_infer", confidence: 76 },
    { grammarId: "ni-taru", viKeywords: ["đáng để", "xứng đáng", "đủ để"], enKeywords: ["worthy of", "enough to"], intent: "worthy_of", confidence: 76 },
    { grammarId: "ni-hikikae", viKeywords: ["trái lại", "ngược hẳn với", "khác hẳn"], enKeywords: ["in contrast to"], intent: "sharp_contrast", confidence: 78 },
    { grammarId: "ni-mo-mashite", viKeywords: ["hơn cả", "hơn bao giờ hết", "còn hơn"], enKeywords: ["more than", "even more than"], intent: "more_than_ever", confidence: 78 },
    { grammarId: "wa-oroka", viKeywords: ["đừng nói mà ngay cả", "chưa nói đến"], enKeywords: ["let alone", "not to mention"], intent: "let_alone", confidence: 78 },
    { grammarId: "wo-oite", viKeywords: ["ngoài ra thì không", "ngoài ai khác"], enKeywords: ["other than", "except for"], intent: "no_one_but", confidence: 78 },
    { grammarId: "wo-kinjienai", viKeywords: ["không kìm được", "không nén được"], enKeywords: ["cannot suppress", "can't help feeling"], intent: "cannot_suppress_emotion", confidence: 80 },
    { grammarId: "wo-mono-tomo-sezu", viKeywords: ["bất chấp", "coi thường khó khăn", "không nao núng"], enKeywords: ["in defiance of", "undaunted by"], intent: "defy_hardship", confidence: 80 },
    { grammarId: "wo-yoginaku-sareru", viKeywords: ["buộc phải", "bị buộc phải", "không còn cách nào phải"], enKeywords: ["be forced to", "have no choice but"], intent: "forced_to_by_circumstance", confidence: 80 },
    { grammarId: "wo-fumaete", viKeywords: ["dựa trên", "căn cứ vào", "trên cơ sở"], enKeywords: ["based on", "in light of"], intent: "based_on", confidence: 78 },
    { grammarId: "n-ga-tame", viKeywords: ["để mà", "nhằm", "với mục đích"], enKeywords: ["in order to", "for the sake of"], intent: "strong_purpose", confidence: 76 },
    { grammarId: "yue-ni", viKeywords: ["vì vậy", "do đó", "bởi vì nên"], enKeywords: ["because", "therefore"], intent: "formal_reason", confidence: 74 }
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(entries);
})(globalThis);
