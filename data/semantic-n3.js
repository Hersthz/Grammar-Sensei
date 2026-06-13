/* Grammar Sensei - JLPT N3 Vietnamese/English semantic intent map.
 * Maps VI/EN keywords to a N3 grammarId. Every grammarId must exist in
 * the grammar DB or the entry is silently skipped at match time. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  const entries = [
    { grammarId: "beki", viKeywords: ["phải nên", "nên theo lẽ", "đúng ra nên", "cần phải"], enKeywords: ["ought to", "should as a duty", "must as a principle"], intent: "principled_advice", confidence: 70 },
    { grammarId: "hazu", viKeywords: ["chắc là", "đáng lẽ", "theo lý thì", "hẳn là"], enKeywords: ["should be", "expected to", "must have"], intent: "expectation", confidence: 72 },
    { grammarId: "you-ni-suru", viKeywords: ["cố gắng", "tập thói quen", "đảm bảo là", "cố để"], enKeywords: ["try to", "make sure to", "make a habit of"], intent: "effort_habit", confidence: 74 },
    { grammarId: "you-ni-naru", viKeywords: ["trở nên", "dần có thể", "bắt đầu có thể", "đã có thể"], enKeywords: ["became able to", "come to", "started to be able"], intent: "change_ability", confidence: 75 },
    { grammarId: "tame-ni", viKeywords: ["để", "nhằm", "vì mục đích", "cho mục đích"], enKeywords: ["in order to", "for the purpose of", "for"], intent: "purpose", confidence: 68 },
    { grammarId: "te-miru", viKeywords: ["thử", "thử làm", "làm thử"], enKeywords: ["try doing", "give it a try", "attempt to"], intent: "try_action", confidence: 72 },
    { grammarId: "te-oku", viKeywords: ["làm trước", "chuẩn bị sẵn", "để sẵn"], enKeywords: ["do in advance", "do beforehand", "prepare ahead"], intent: "do_in_advance", confidence: 74 },
    { grammarId: "ni-tsuite", viKeywords: ["về việc", "liên quan tới", "nói về chuyện"], enKeywords: ["about", "concerning", "regarding"], intent: "about_topic", confidence: 70 },
    { grammarId: "ni-yotte", viKeywords: ["bằng cách", "nhờ vào", "tùy vào"], enKeywords: ["by means of", "depending on", "by"], intent: "by_means", confidence: 70 },
    { grammarId: "uchi-ni", viKeywords: ["nhân lúc", "trong lúc còn", "trước khi mất"], enKeywords: ["while still", "before it changes"], intent: "while_still", confidence: 72 },
    { grammarId: "you-to-suru", viKeywords: ["định làm", "toan làm", "sắp sửa"], enKeywords: ["about to", "try to do"], intent: "about_to", confidence: 70 },
    { grammarId: "koto-ni-suru", viKeywords: ["quyết định làm", "đã quyết định"], enKeywords: ["decide to", "have decided to"], intent: "decision", confidence: 72 },
    { grammarId: "koto-ni-naru", viKeywords: ["được quyết định", "hóa ra sẽ", "rốt cuộc thành"], enKeywords: ["it has been decided", "it turns out that"], intent: "decided_outcome", confidence: 70 },
    { grammarId: "sae-ba", viKeywords: ["chỉ cần", "miễn là", "chỉ cần là"], enKeywords: ["as long as", "if only", "provided that"], intent: "minimal_condition", confidence: 76 },
    { grammarId: "darou-ka", viKeywords: ["không biết có", "liệu có không", "tự hỏi liệu"], enKeywords: ["I wonder whether", "I wonder if"], intent: "wondering", confidence: 74 },
    { grammarId: "ni-chigainai", viKeywords: ["chắc chắn là", "hẳn là", "không sai là"], enKeywords: ["must be", "no doubt", "surely"], intent: "strong_certainty", confidence: 78 },
    { grammarId: "ni-kimatteiru", viKeywords: ["chắc chắn", "đương nhiên là", "nhất định là"], enKeywords: ["certainly", "it is obvious", "surely"], intent: "speaker_certainty", confidence: 76 },
    { grammarId: "hazu-ga-nai", viKeywords: ["không thể nào", "không có chuyện", "chắc chắn không"], enKeywords: ["there is no way", "cannot be", "impossible that"], intent: "strong_negative_expectation", confidence: 78 },
    { grammarId: "wake-ga-nai", viKeywords: ["không đời nào", "không có lý nào", "làm gì có chuyện"], enKeywords: ["there is no way", "no reason that"], intent: "strong_denial", confidence: 78 },
    { grammarId: "koto-wa-nai", viKeywords: ["không cần phải", "không việc gì phải", "không đến mức phải"], enKeywords: ["no need to", "do not have to"], intent: "no_need", confidence: 76 },
    { grammarId: "te-itadakemasen-ka", viKeywords: ["xin vui lòng", "có thể giúp tôi", "làm ơn giúp"], enKeywords: ["could you kindly", "would you please"], intent: "polite_request", confidence: 78 },
    { grammarId: "te-bakari-iru", viKeywords: ["cứ toàn", "toàn là làm", "suốt ngày chỉ"], enKeywords: ["keep doing only", "do nothing but"], intent: "repeated_only_action", confidence: 76 },
    { grammarId: "gachi", viKeywords: ["hay bị", "có xu hướng", "thường dễ"], enKeywords: ["tend to", "prone to"], intent: "negative_tendency", confidence: 72 },
    { grammarId: "ppoi", viKeywords: ["có vẻ", "kiểu như", "hơi giống", "mang tính"], enKeywords: ["-ish", "looks like", "seems"], intent: "ish_quality", confidence: 70 },
    { grammarId: "darake", viKeywords: ["đầy", "toàn là", "dính đầy"], enKeywords: ["full of", "covered with"], intent: "covered_with", confidence: 74 },
    { grammarId: "ni-totte", viKeywords: ["đối với", "với tôi thì", "theo góc nhìn của"], enKeywords: ["for", "from the standpoint of"], intent: "viewpoint_personal", confidence: 76 },
    { grammarId: "ni-kanshite", viKeywords: ["liên quan đến", "về chủ đề", "về vấn đề"], enKeywords: ["regarding", "concerning", "about"], intent: "topic_formal", confidence: 76 },
    { grammarId: "ni-kurabete", viKeywords: ["so với", "nếu so sánh với"], enKeywords: ["compared with", "in comparison to"], intent: "comparison", confidence: 76 },
    { grammarId: "ni-tsurete", viKeywords: ["càng ngày càng", "cùng với sự thay đổi", "càng"], enKeywords: ["as", "in proportion to", "as time goes"], intent: "parallel_change", confidence: 76 },
    { grammarId: "ni-shitagatte", viKeywords: ["theo", "tuân theo", "dựa theo hướng dẫn"], enKeywords: ["according to", "following"], intent: "follow_basis", confidence: 76 },
    { grammarId: "ni-yoru-to", viKeywords: ["theo như", "theo lời", "theo nguồn"], enKeywords: ["according to", "based on what"], intent: "information_source", confidence: 76 },
    { grammarId: "kara-ni-wa", viKeywords: ["một khi đã", "đã làm thì", "vì đã quyết định"], enKeywords: ["now that", "since one has"], intent: "commitment_reason", confidence: 76 },
    { grammarId: "dake-de-naku", viKeywords: ["không chỉ mà còn", "không những mà còn", "không chỉ", "không những"], enKeywords: ["not only but also", "not only"], intent: "not_only_but_also", confidence: 78 },
    { grammarId: "zu-ni", viKeywords: ["mà không", "không làm mà", "không cần làm"], enKeywords: ["without doing"], intent: "without_doing", confidence: 74 },
    { grammarId: "tabi-ni", viKeywords: ["mỗi lần", "cứ mỗi khi", "hễ mỗi lần"], enKeywords: ["every time", "whenever"], intent: "whenever", confidence: 76 },
    { grammarId: "muke", viKeywords: ["dành cho", "nhắm tới", "cho đối tượng"], enKeywords: ["intended for", "aimed at"], intent: "target_audience", confidence: 74 },
    { grammarId: "muki", viKeywords: ["phù hợp với", "hợp cho", "thích hợp với"], enKeywords: ["suitable for", "fit for"], intent: "suitable_audience", confidence: 72 }
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(entries);
})(globalThis);
