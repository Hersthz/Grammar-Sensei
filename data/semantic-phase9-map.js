/* Grammar Sensei - Phase 9/10 semantic intent map for N2/N1 grammar.
 * Every grammarId here must exist in the N2 (phase9) or N1 (phase10) pack. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  function m(grammarId, viKeywords, enKeywords, intent, confidence) {
    return { grammarId, viKeywords, enKeywords, intent, confidence };
  }

  const phase9SemanticMap = [
    // --- N2 ---
    m("ageku", ["sau bao lần", "cuối cùng thì", "rốt cuộc lại", "kết cục"], ["after all", "in the end", "after much"], "bad_outcome_after", 78),
    m("sue-ni", ["sau cùng", "rốt cuộc sau khi", "cuối cùng sau"], ["after", "as a result of", "in the end"], "outcome_after_effort", 76),
    m("kagiri", ["chừng nào còn", "trong phạm vi", "theo những gì", "hết mức"], ["as long as", "as far as", "to the limit"], "limit_scope", 74),
    m("gatai", ["khó mà", "khó lòng", "khó tin"], ["hard to", "difficult to"], "psychologically_hard", 74),
    m("kirenai", ["không xuể", "không hết", "nhiều quá không"], ["too many to", "cannot finish"], "cannot_finish", 74),
    m("kiru", ["làm hết", "đến cùng", "trọn vẹn"], ["do completely", "finish entirely"], "do_completely", 70),
    m("koso", ["chính là", "mới đúng là", "nhất định lần này"], ["precisely", "for sure"], "emphasis_this", 70),
    m("kara-koso", ["chính vì nên", "chính bởi vì"], ["precisely because"], "emphatic_reason", 78),
    m("koto-ka", ["biết bao", "xiết bao", "biết là bao"], ["how much", "how very"], "exclamation_degree", 74),
    m("sei-ka", ["có lẽ do", "không biết có phải vì", "chắc tại"], ["perhaps because", "maybe due to"], "uncertain_cause", 76),
    m("dake-atte", ["đúng là", "xứng với", "quả không hổ danh"], ["as expected of", "fitting that"], "as_expected_praise", 78),
    m("dake-ni", ["chính vì nên càng", "vì là nên"], ["all the more because", "precisely because"], "reason_intensified", 76),
    m("ta-tokoro-de", ["dù có cũng", "có làm cũng vô ích", "cho dù"], ["even if", "no matter how"], "futile_concession", 76),
    m("tsuide-ni", ["tiện thể", "nhân tiện", "tiện luôn"], ["while at it", "on the occasion"], "while_doing", 74),
    m("kkonai", ["không đời nào", "chẳng thể nào", "làm sao mà"], ["no way", "definitely not"], "strong_impossibility", 74),
    m("tsutsu-aru", ["đang dần", "đang trong quá trình"], ["in the process of", "gradually"], "ongoing_change", 76),
    m("te-irai", ["kể từ khi", "từ khi", "từ lúc"], ["since", "ever since"], "since_event", 78),
    m("te-tamaranai", ["đến không chịu được", "vô cùng", "không chịu nổi"], ["unbearably", "cannot bear"], "unbearable_feeling", 78),
    m("te-naranai", ["vô cùng", "không sao kìm được", "rất là"], ["extremely", "can't help feeling"], "overwhelming_feeling", 76),
    m("dokoro-ka", ["đừng nói", "ngược lại còn", "không những không mà còn"], ["far from", "on the contrary"], "contrary_to_expectation", 78),
    m("totan", ["ngay khi", "vừa thì", "vừa mới đã"], ["the moment", "just as"], "instant_after", 78),
    m("nai-koto-niwa", ["nếu không thì không", "không thì chẳng"], ["unless", "without doing"], "prerequisite", 76),
    m("nagara-mo", ["tuy nhưng vẫn", "mặc dù nhưng"], ["even though", "while still"], "concession_state", 74),
    m("bakari-ni", ["chỉ vì mà", "chỉ tại"], ["simply because", "just because"], "sole_bad_reason", 76),
    m("mono-ka", ["không đời nào", "quyết không", "đời nào mà"], ["absolutely not", "as if"], "emotional_refusal", 76),
    m("mono-dakara", ["tại vì", "chỉ tại", "là vì"], ["because", "the reason is"], "excuse_reason", 74),
    m("wo-kikkake-ni", ["nhân dịp", "lấy làm cơ hội", "từ đó mà"], ["taking the opportunity of", "triggered by"], "trigger_event", 78),
    // --- N1 ---
    m("atte-no", ["có được là nhờ", "nhờ có mới có"], ["thanks to", "only because of"], "exists_thanks_to", 80),
    m("ikan-da", ["tùy thuộc vào", "tùy vào", "phụ thuộc"], ["depends on"], "depends_on", 80),
    m("ikan-ni-kakawarazu", ["bất kể", "dù thế nào", "không phụ thuộc"], ["regardless of"], "regardless_formal", 80),
    m("ga-hayai-ka", ["vừa mới thì lập tức", "vừa là ngay"], ["as soon as", "no sooner than"], "immediate_sequence", 80),
    m("ya-inaya", ["vừa thì lập tức", "ngay khi là"], ["the instant", "as soon as"], "immediate_sequence_formal", 80),
    m("nari", ["ngay khi", "vừa liền"], ["as soon as", "the moment"], "immediate_after_action", 76),
    m("soba-kara", ["vừa đã lại", "làm xong là quên"], ["as soon as repeatedly"], "repeated_undoing", 78),
    m("kirai-ga-aru", ["có xu hướng xấu", "hay có tật"], ["tend to negatively"], "negative_tendency_formal", 78),
    m("zukume", ["toàn là", "đầy những"], ["entirely", "full of"], "entirely_made_of", 76),
    m("mamire", ["lấm lem", "dính đầy", "bê bết"], ["covered with", "smeared with"], "covered_in_dirt", 76),
    m("zu-niwa-okanai", ["nhất định sẽ", "không thể không khiến"], ["will surely", "cannot help but cause"], "inevitable_effect", 78),
    m("naide-wa-irarenai", ["không thể không", "không nhịn được"], ["cannot help but"], "cannot_resist", 78),
    m("sura", ["ngay cả", "đến cả", "thậm chí"], ["even"], "even_extreme", 76),
    m("taritomo", ["dù chỉ cũng không", "dù một cũng"], ["not even one"], "not_even_one", 78),
    m("te-yamanai", ["mãi không thôi", "hết mực", "luôn luôn"], ["constantly", "from the heart"], "lasting_feeling", 76),
    m("to-iedomo", ["dẫu rằng", "cho dù là", "dù có là"], ["even though", "even as"], "concession_formal", 78),
    m("to-kitara", ["nói đến thì", "cái thì"], ["when it comes to"], "topic_complaint", 74),
    m("naradewa", ["chỉ riêng mới có", "đặc trưng của", "đậm chất"], ["unique to", "only possible for"], "uniquely_characteristic", 78),
    m("nakushite", ["nếu không có thì không", "thiếu thì không"], ["without", "if not for"], "essential_condition", 78),
    m("ni-katakunai", ["không khó để", "dễ dàng tưởng tượng"], ["not hard to imagine"], "easy_to_infer", 76),
    m("ni-taru", ["đáng để", "xứng đáng", "đủ để"], ["worthy of", "enough to"], "worthy_of", 76),
    m("ni-hikikae", ["trái lại", "ngược hẳn với", "khác hẳn"], ["in contrast to"], "sharp_contrast", 78),
    m("ni-mo-mashite", ["hơn cả", "hơn bao giờ hết", "còn hơn"], ["more than", "even more than"], "more_than_ever", 78),
    m("wa-oroka", ["đừng nói mà ngay cả", "chưa nói đến"], ["let alone", "not to mention"], "let_alone", 78),
    m("wo-oite", ["ngoài ra thì không", "ngoài ai khác"], ["other than", "except for"], "no_one_but", 78),
    m("wo-kinjienai", ["không kìm được", "không nén được"], ["cannot suppress", "can't help feeling"], "cannot_suppress_emotion", 80),
    m("wo-mono-tomo-sezu", ["bất chấp", "coi thường khó khăn", "không nao núng"], ["in defiance of", "undaunted by"], "defy_hardship", 80),
    m("wo-yoginaku-sareru", ["buộc phải", "bị buộc phải", "không còn cách nào phải"], ["be forced to", "have no choice but"], "forced_to_by_circumstance", 80),
    m("wo-fumaete", ["dựa trên", "căn cứ vào", "trên cơ sở"], ["based on", "in light of"], "based_on", 78),
    m("n-ga-tame", ["để mà", "nhằm", "với mục đích"], ["in order to", "for the sake of"], "strong_purpose", 76),
    m("yue-ni", ["vì vậy", "do đó", "bởi vì nên"], ["because", "therefore"], "formal_reason", 74)
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(phase9SemanticMap);
})(globalThis);
