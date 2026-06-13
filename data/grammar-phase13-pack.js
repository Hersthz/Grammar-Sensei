/* Grammar Sensei - Phase 13 content pack: high-frequency N5/N4 fundamentals.
 *
 * These are core, very common points that earlier passes missed (とき, まだ,
 * てくる/ていく, くなる...). Conjugated 可能形 (読める/食べられる) and appearance
 * そう are deliberately NOT added as regex: their surface overlaps ordinary
 * verbs / hearsay そうだ and would mislabel. できる (potential of する) is added
 * because it is unambiguous and extremely common. */
(function (global) {
  "use strict";

  const Data = global.GrammarSenseiData = global.GrammarSenseiData || {};

  function g({
    id, pattern, display, jlpt, meaning_vi, meaning_en, structure,
    ja, romaji, vi, en, variants, regex, negativeRegex, nuance_vi, nuance_en,
    confusions, related, tags, priority
  }) {
    return {
      id,
      pattern,
      display: display || pattern.replace(/^〜/, ""),
      jlpt_level: jlpt,
      meaning_vi,
      meaning_en,
      structure,
      structures: [structure],
      examples: [{ ja, romaji, vi, en }],
      variants: variants || [display || pattern.replace(/^〜/, "")],
      regex,
      negativeRegex: negativeRegex || [],
      nuance_vi,
      nuance_en: nuance_en || meaning_en,
      confusions: confusions || [],
      related: related || [],
      tags: tags || [],
      priority
    };
  }

  const pack = [
    // ---- N5 ----
    g({ id: "toki", pattern: "〜とき", display: "とき / 〜時", jlpt: "N5", meaning_vi: "khi / lúc", meaning_en: "when; at the time of", structure: "V辞書形/Vた/Aい/Naな/Nの + とき", ja: "子供のとき、よく川で泳いだ。", romaji: "Kodomo no toki, yoku kawa de oyoida.", vi: "Khi còn nhỏ, tôi hay bơi ở sông.", en: "When I was a child, I often swam in the river.", variants: ["とき", "時", "ときに", "時に", "ときは", "時は"], regex: "とき(?:に|は|の)?|(?:た|る|い|な|の)時(?:に|は|の)?", nuance_vi: "Mệnh đề thời gian; thì của vế trước とき quyết định hành động xảy ra trước hay sau.", confusions: ["sai-ni", "saichuu-ni", "ba-ai-wa"], related: ["sai-ni"], tags: ["time", "clause"], priority: 84 }),
    g({ id: "mada", pattern: "〜まだ", display: "まだ", jlpt: "N5", meaning_vi: "vẫn / vẫn chưa", meaning_en: "still; not yet", structure: "まだ + V / まだ + Vていない", ja: "宿題はまだ終わっていない。", romaji: "Shukudai wa mada owatte inai.", vi: "Bài tập vẫn chưa xong.", en: "I haven't finished my homework yet.", variants: ["まだ", "未だ"], regex: "(?:まだ|未だ)", nuance_vi: "Trạng thái còn tiếp diễn ('vẫn') hoặc chưa hoàn tất ('chưa'); trái với もう.", confusions: ["mou", "sudeni"], related: ["mou"], tags: ["time", "aspect"], priority: 80 }),
    g({ id: "mashou", pattern: "〜ましょう", display: "ましょう", jlpt: "N5", meaning_vi: "hãy cùng / nào ta", meaning_en: "let's", structure: "Vます-stem + ましょう", ja: "一緒に昼ご飯を食べましょう。", romaji: "Issho ni hirugohan o tabemashou.", vi: "Cùng ăn trưa nào.", en: "Let's have lunch together.", variants: ["ましょう"], regex: "ましょう", nuance_vi: "Rủ rê/đề nghị cùng làm; ましょうか thêm sắc thái hỏi ý ('nhé?').", confusions: ["mashou-ka", "masen-ka", "ikou-kei"], related: ["mashou-ka"], tags: ["invitation", "volitional"], priority: 60 }),
    g({ id: "deshou", pattern: "〜でしょう", display: "でしょう", jlpt: "N5", meaning_vi: "có lẽ / phải không", meaning_en: "probably; right?", structure: "Plain form / N + でしょう", ja: "明日は晴れるでしょう。", romaji: "Ashita wa hareru deshou.", vi: "Ngày mai chắc trời nắng.", en: "It will probably be sunny tomorrow.", variants: ["でしょう", "でしょうか", "でしょうね"], regex: "でしょう(?:か|ね)?", nuance_vi: "Suy đoán lịch sự ('có lẽ') hoặc xác nhận/đồng tình ('phải không'); dạng lịch sự của だろう.", confusions: ["darou", "kamoshirenai"], related: ["darou"], tags: ["probability", "confirmation"], priority: 58 }),
    g({ id: "ichiban", pattern: "〜一番", display: "一番", jlpt: "N5", meaning_vi: "nhất / hơn cả", meaning_en: "the most; the -est", structure: "(N の中で) 一番 + A", ja: "クラスで一番背が高い。", romaji: "Kurasu de ichiban se ga takai.", vi: "Cao nhất lớp.", en: "The tallest in the class.", variants: ["一番", "いちばん"], regex: "(?:一番|いちばん)", nuance_vi: "So sánh nhất; thường đi với 〜の中で để nêu phạm vi.", confusions: ["yori", "hou-ga"], related: ["yori"], tags: ["comparison", "superlative"], priority: 78 }),

    // ---- N4 ----
    g({ id: "te-kuru", pattern: "〜てくる", display: "てくる", jlpt: "N4", meaning_vi: "...đến / dần (đến hiện tại) / đi rồi về", meaning_en: "come to; start to; go and come back", structure: "Vて + くる", ja: "雨が降ってきた。", romaji: "Ame ga futte kita.", vi: "Trời bắt đầu đổ mưa.", en: "It has started to rain.", variants: ["てくる", "てきた", "てきて", "てきます", "でくる", "できた"], regex: "(?:て|で)(?:くる|きた|きて|きます|こない)", nuance_vi: "Hướng về phía người nói, biến đổi tiến đến hiện tại, hoặc đi làm gì rồi quay lại.", confusions: ["te-iku", "te-iru"], related: ["te-iku"], tags: ["aspect", "direction"], priority: 70 }),
    g({ id: "te-iku", pattern: "〜ていく", display: "ていく", jlpt: "N4", meaning_vi: "...đi / dần (về sau) / làm rồi đi", meaning_en: "go on doing; go and do", structure: "Vて + いく", ja: "これから寒くなっていくだろう。", romaji: "Kore kara samuku natte iku darou.", vi: "Từ giờ trời sẽ lạnh dần.", en: "It will get colder from now on.", variants: ["ていく", "ていった", "ていって", "ていきます", "でいく"], regex: "(?:て|で)(?:いく|いった|いって|いきます|ゆく)", nuance_vi: "Rời xa người nói, biến đổi tiếp diễn về tương lai, hoặc làm xong rồi đi.", confusions: ["te-kuru", "te-iru"], related: ["te-kuru"], tags: ["aspect", "direction"], priority: 70 }),
    g({ id: "ku-naru", pattern: "〜くなる", display: "くなる / くする", jlpt: "N4", meaning_vi: "trở nên / làm cho (tính từ)", meaning_en: "become / make (with adjectives)", structure: "Aい→く + なる/する", ja: "外が暗くなった。", romaji: "Soto ga kuraku natta.", vi: "Bên ngoài đã tối.", en: "It has gotten dark outside.", variants: ["くなる", "くなった", "くなって", "くなります", "くする", "くした", "くして"], regex: "く(?:なる|なった|なって|なります|なり|する|した|して|します)", nuance_vi: "Biến đổi trạng thái với tính từ-い; なる = tự nhiên trở nên, する = chủ động làm cho. Danh từ/tính từ-な dùng になる/にする.", confusions: ["ni-naru", "ni-suru", "you-ni-naru"], related: ["ni-naru"], tags: ["change", "adjective"], priority: 64 }),
    g({ id: "dekiru", pattern: "〜できる", display: "できる", jlpt: "N4", meaning_vi: "có thể / làm được", meaning_en: "can; be able to", structure: "N が + できる / Vことができる", ja: "彼は日本語ができる。", romaji: "Kare wa nihongo ga dekiru.", vi: "Anh ấy biết tiếng Nhật.", en: "He can speak Japanese.", variants: ["できる", "できます", "できた", "できない", "できません", "出来る"], regex: "(?:できる|できます|できた|できない|できません|出来る)", nuance_vi: "Khả năng/năng lực (thể khả năng của する); với động từ khác dùng ことができる hoặc thể khả năng.", confusions: ["koto-ga-dekiru", "rareru"], related: ["koto-ga-dekiru"], tags: ["potential", "ability"], priority: 64 }),
    g({ id: "tagaru", pattern: "〜たがる", display: "たがる", jlpt: "N4", meaning_vi: "(người khác) muốn / tỏ ra muốn", meaning_en: "(third person) wants to", structure: "Vます-stem + たがる", ja: "弟は外で遊びたがる。", romaji: "Otouto wa soto de asobitagaru.", vi: "Em trai cứ đòi ra ngoài chơi.", en: "My little brother wants to play outside.", variants: ["たがる", "たがっている", "たがった", "たがって", "たがります"], regex: "たが(?:る|っている|った|って|ります)", nuance_vi: "Mong muốn của người thứ ba biểu hiện ra ngoài; ngôi thứ nhất dùng たい.", confusions: ["tai", "garu"], related: ["garu"], tags: ["desire", "third-person"], priority: 66 }),

    // ---- N3 ----
    g({ id: "ba-hodo", pattern: "〜ば〜ほど", display: "ば〜ほど", jlpt: "N3", meaning_vi: "càng... càng...", meaning_en: "the more... the more...", structure: "Vば + 同V辞書形 + ほど", ja: "考えれば考えるほど分からなくなる。", romaji: "Kangaereba kangaeru hodo wakaranaku naru.", vi: "Càng nghĩ càng không hiểu.", en: "The more I think, the less I understand.", variants: ["ばほど", "ければほど", "なら〜ほど"], regex: "ば[^。、]{1,8}ほど", nuance_vi: "Mức độ vế sau tăng/giảm tỉ lệ với vế trước; lặp lại cùng động từ.", confusions: ["hodo", "nitsurete"], related: ["hodo", "nitsurete"], tags: ["proportion", "degree"], priority: 78 }),
    g({ id: "tara-ii", pattern: "〜たらいい", display: "たらいい / といい", jlpt: "N3", meaning_vi: "nên / mong là / ước gì", meaning_en: "should; I hope; it'd be good if", structure: "Vたら / V辞書形と + いい", ja: "早く元気になるといいね。", romaji: "Hayaku genki ni naru to ii ne.", vi: "Mong là cậu sớm khỏe lại.", en: "I hope you get well soon.", variants: ["たらいい", "といい", "たらいいですか", "といいなあ", "といいのに"], regex: "(?:たら|と)いい(?:ね|な|なあ|のに|ですか|でしょうか)?", nuance_vi: "Lời khuyên ('nên'), mong ước ('mong là'), hoặc nuối tiếc (といいのに). Khác ばいい đôi chút sắc thái.", confusions: ["ba-ii", "hou-ga-ii", "to-ii-naa"], related: ["ba-ii"], tags: ["advice", "wish"], priority: 70 }),

    // ---- N2 ----
    g({ id: "no-amari", pattern: "〜のあまり", display: "のあまり", jlpt: "N2", meaning_vi: "vì quá... (mà)", meaning_en: "out of too much; so... that", structure: "Nの / V辞書形 + あまり", ja: "うれしさのあまり、涙が出た。", romaji: "Ureshisa no amari, namida ga deta.", vi: "Vì quá vui mà bật khóc.", en: "Out of sheer joy, tears came out.", variants: ["のあまり", "あまりに", "あまりの"], regex: "(?:のあまり|あまりに|あまりの)", nuance_vi: "Cảm xúc/mức độ quá lớn dẫn đến kết quả; khác あまり〜ない ('không...lắm').", confusions: ["amari-nai", "sugiru"], related: ["amari-nai", "sugiru"], tags: ["cause", "degree", "emotion"], priority: 76 })
  ];

  Data.GRAMMAR_DATABASE = (Data.GRAMMAR_DATABASE || []).concat(pack);
  Data.DB_VERSION = `${Data.DB_VERSION || "base"}.phase13`;
})(globalThis);
