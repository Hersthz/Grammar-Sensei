/* Grammar Sensei - Phase 8 semantic intent expansion */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  function m(grammarId, viKeywords, enKeywords, intent, confidence) {
    return { grammarId, viKeywords, enKeywords, intent, confidence };
  }

  const phase8SemanticMap = [
    m("tara", ["nếu", "nếu như", "khi nào thì", "sau khi thì"], ["if", "when", "after that"], "condition_general", 74),
    m("nara", ["nếu là", "nói về", "còn về", "về chuyện"], ["if it is", "as for", "speaking of"], "topic_condition", 74),
    m("sae-ba", ["chỉ cần", "miễn là", "chỉ cần là"], ["as long as", "if only", "provided that"], "minimal_condition", 76),
    m("ka-dou-ka", ["có hay không", "liệu có", "hay không"], ["whether", "whether or not"], "whether_or_not", 78),
    m("darou", ["chắc là", "có lẽ", "chắc sẽ", "dự đoán"], ["probably", "I suppose", "likely"], "soft_prediction", 70),
    m("darou-ka", ["không biết có", "liệu có không", "tự hỏi liệu"], ["I wonder whether", "I wonder if"], "wondering", 74),
    m("ni-chigainai", ["chắc chắn là", "hẳn là", "không sai là"], ["must be", "no doubt", "surely"], "strong_certainty", 78),
    m("ni-kimatteiru", ["chắc chắn", "đương nhiên là", "nhất định là"], ["certainly", "it is obvious", "surely"], "speaker_certainty", 76),
    m("hazu-ga-nai", ["không thể nào", "không có chuyện", "chắc chắn không"], ["there is no way", "cannot be", "impossible that"], "strong_negative_expectation", 78),
    m("wake-ga-nai", ["không đời nào", "không có lý nào", "làm gì có chuyện"], ["there is no way", "no reason that"], "strong_denial", 78),
    m("koto-wa-nai", ["không cần phải", "không việc gì phải", "không đến mức phải"], ["no need to", "do not have to"], "no_need", 76),
    m("te-itadakemasen-ka", ["xin vui lòng", "có thể giúp tôi", "làm ơn giúp"], ["could you kindly", "would you please"], "polite_request", 78),
    m("te-kureru-kudasai", ["giúp tôi được không", "làm giúp tôi", "có thể làm giúp"], ["could you do for me", "can you help me"], "casual_request", 74),
    m("mashou-ka", ["để tôi làm nhé", "tôi giúp nhé", "chúng ta làm nhé"], ["shall I", "shall we", "let me"], "offer", 74),
    m("ta-bakari", ["vừa mới", "mới vừa", "vừa làm xong"], ["just did", "have just"], "recent_completion", 76),
    m("te-bakari-iru", ["cứ toàn", "toàn là làm", "suốt ngày chỉ"], ["keep doing only", "do nothing but"], "repeated_only_action", 76),
    m("gachi", ["hay bị", "có xu hướng", "thường dễ"], ["tend to", "prone to"], "negative_tendency", 72),
    m("ppoi", ["có vẻ", "kiểu như", "hơi giống", "mang tính"], ["-ish", "looks like", "seems"], "ish_quality", 70),
    m("darake", ["đầy", "toàn là", "dính đầy"], ["full of", "covered with"], "covered_with", 74),
    m("ni-totte", ["đối với", "với tôi thì", "theo góc nhìn của"], ["for", "from the standpoint of"], "viewpoint_personal", 76),
    m("ni-kanshite", ["liên quan đến", "về chủ đề", "về vấn đề"], ["regarding", "concerning", "about"], "topic_formal", 76),
    m("ni-kurabete", ["so với", "nếu so sánh với"], ["compared with", "in comparison to"], "comparison", 76),
    m("ni-tsurete", ["càng ngày càng", "cùng với sự thay đổi", "càng"], ["as", "in proportion to", "as time goes"], "parallel_change", 76),
    m("ni-shitagatte", ["theo", "tuân theo", "dựa theo hướng dẫn"], ["according to", "following"], "follow_basis", 76),
    m("ni-motozuite", ["dựa trên", "căn cứ vào", "theo cơ sở"], ["based on", "on the basis of"], "evidence_basis", 78),
    m("wo-moto-ni", ["dựa trên", "lấy làm nền", "lấy cảm hứng từ"], ["based on", "using as a basis"], "creative_basis", 76),
    m("ni-oujite", ["tùy theo", "ứng với", "phù hợp với mức"], ["depending on", "according to"], "adaptive_condition", 76),
    m("ni-yoru-to", ["theo như", "theo lời", "theo nguồn"], ["according to", "based on what"], "information_source", 76),
    m("wo-tsuujite", ["thông qua", "qua việc", "trong suốt"], ["through", "throughout"], "through_medium", 76),
    m("wo-komete", ["bằng cả", "gửi gắm", "đặt vào"], ["with all", "filled with", "put into"], "emotion_put_into", 76),
    m("wo-megutte", ["xoay quanh", "tranh luận về", "liên quan đến tranh cãi"], ["over", "surrounding", "concerning dispute"], "dispute_topic", 76),
    m("wo-to-wazu", ["bất kể", "không phân biệt", "dù là"], ["regardless of", "irrespective of"], "regardless", 78),
    m("ni-kakawarazu", ["bất kể", "không phụ thuộc vào", "dù"], ["regardless of", "regardless whether"], "regardless_condition", 78),
    m("kara-to-itte", ["không phải cứ", "chỉ vì không có nghĩa là", "dù là vì"], ["just because does not mean", "even if"], "reject_simple_reasoning", 78),
    m("kara-ni-wa", ["một khi đã", "đã làm thì", "vì đã quyết định"], ["now that", "since one has"], "commitment_reason", 76),
    m("dake-de-naku", ["không chỉ mà còn", "không những mà còn", "không chỉ", "không những"], ["not only but also", "not only"], "not_only_but_also", 78),
    m("bakari-ka", ["không chỉ mà còn", "thậm chí còn"], ["not only but also", "on top of that"], "not_only_stronger", 76),
    m("ni-suginai", ["chỉ là", "không hơn", "đơn thuần là"], ["merely", "nothing more than"], "mere_limitation", 76),
    m("hoka-nai", ["không còn cách nào ngoài", "chỉ còn cách", "đành phải"], ["have no choice but", "nothing but"], "no_choice", 78),
    m("kaneru", ["khó có thể", "không thể làm được", "xin phép không thể"], ["cannot", "be unable to"], "formal_inability", 74),
    m("kanenai", ["có nguy cơ", "có thể xảy ra điều xấu", "rất có thể sẽ"], ["could happen", "might result in"], "bad_possibility", 76),
    m("osore-ga-aru", ["có nguy cơ", "có khả năng xấu", "e rằng"], ["there is a risk", "there is a danger"], "risk_warning", 78),
    m("zu-ni", ["mà không", "không làm mà", "không cần làm"], ["without doing"], "without_doing", 74),
    m("tabi-ni", ["mỗi lần", "cứ mỗi khi", "hễ mỗi lần"], ["every time", "whenever"], "whenever", 76),
    m("muke", ["dành cho", "nhắm tới", "cho đối tượng"], ["intended for", "aimed at"], "target_audience", 74),
    m("muki", ["phù hợp với", "hợp cho", "thích hợp với"], ["suitable for", "fit for"], "suitable_audience", 72)
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(phase8SemanticMap);
})(globalThis);
