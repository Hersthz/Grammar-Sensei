/* Grammar Sensei - JLPT N5 Vietnamese/English semantic intent map.
 * Maps VI/EN keywords to a N5 grammarId. Every grammarId must exist in
 * the grammar DB or the entry is silently skipped at match time. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  const entries = [
    { grammarId: "temo-ii", viKeywords: ["được phép", "có được không", "làm được không", "có thể được không"], enKeywords: ["may i", "is it okay to", "can i", "allowed to"], intent: "permission", confidence: 72 },
    { grammarId: "tewa-ikenai", viKeywords: ["không được", "cấm", "không cho phép", "không nên làm"], enKeywords: ["must not", "not allowed", "forbidden", "cannot do"], intent: "prohibition", confidence: 74 },
    { grammarId: "tai", viKeywords: ["muốn", "muốn làm", "mong muốn"], enKeywords: ["want to", "would like to"], intent: "desire", confidence: 70 },
    { grammarId: "te-iru", viKeywords: ["đang", "đang làm", "vẫn đang", "ở trạng thái"], enKeywords: ["am doing", "is doing", "are doing", "currently", "in the state of"], intent: "progressive_or_state", confidence: 68 },
    { grammarId: "to-omou", viKeywords: ["tôi nghĩ", "nghĩ rằng", "cho rằng"], enKeywords: ["i think", "think that", "believe that"], intent: "opinion", confidence: 70 },
    { grammarId: "mae-ni", viKeywords: ["trước khi"], enKeywords: ["before doing", "prior to"], intent: "before_action", confidence: 72 },
    { grammarId: "ato-de", viKeywords: ["sau đó", "lát nữa", "để sau"], enKeywords: ["afterwards", "later on"], intent: "later", confidence: 66 },
    { grammarId: "kara", viKeywords: ["vì", "bởi vì", "tại vì"], enKeywords: ["because", "since"], intent: "reason_casual", confidence: 64 },
    { grammarId: "node", viKeywords: ["do là", "bởi lẽ", "chính vì"], enKeywords: ["due to the fact", "owing to"], intent: "reason_polite", confidence: 64 },
    { grammarId: "keredo", viKeywords: ["nhưng", "tuy nhiên", "thế nhưng"], enKeywords: ["but", "however", "though"], intent: "contrast", confidence: 64 },
    { grammarId: "sugiru", viKeywords: ["quá mức", "quá đỗi", "quá nhiều"], enKeywords: ["too much", "excessively", "overly"], intent: "excessive", confidence: 70 },
    { grammarId: "hoshii", viKeywords: ["muốn có", "thèm", "muốn một"], enKeywords: ["want something", "would like a"], intent: "want_object", confidence: 68 },
    { grammarId: "no-ga-jouzu", viKeywords: ["giỏi", "khéo", "thành thạo"], enKeywords: ["good at", "skilled at"], intent: "good_at", confidence: 70 },
    { grammarId: "no-ga-heta", viKeywords: ["dở", "kém ở", "vụng về"], enKeywords: ["bad at", "poor at"], intent: "bad_at", confidence: 70 },
    { grammarId: "no-ga-suki", viKeywords: ["thích làm", "ưa thích việc"], enKeywords: ["like doing", "enjoy doing"], intent: "like_doing", confidence: 68 },
    { grammarId: "dake", viKeywords: ["chỉ có", "duy nhất", "chỉ mỗi"], enKeywords: ["only", "just", "merely"], intent: "only_limit", confidence: 66 },
    { grammarId: "to-iu", viKeywords: ["gọi là", "được gọi là", "tên là"], enKeywords: ["called", "named", "known as"], intent: "naming", confidence: 64 },
    { grammarId: "mashou-ka", viKeywords: ["để tôi làm nhé", "tôi giúp nhé", "chúng ta làm nhé"], enKeywords: ["shall I", "shall we", "let me"], intent: "offer", confidence: 74 }
  ];

  Data.SEMANTIC_GRAMMAR_MAP = (Data.SEMANTIC_GRAMMAR_MAP || []).concat(entries);
})(globalThis);
