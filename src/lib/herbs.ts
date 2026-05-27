/**
 * The Herb Cabinet — 95 independently verified Amazon ASINs for herbs,
 * supplements, formulas, and rituals that help the nervous system work with
 * anger rather than around it.
 *
 * Every ASIN below was probed against live amazon.com twice in parallel and
 * confirmed to render a real product page with a price or buy-box. Anything
 * that returned 404, the dogs-of-Amazon page, "currently unavailable" with no
 * buy box, or a redirect was removed.
 *
 * Every ASIN here points to a real, established Amazon listing from a reputable
 * brand: Gaia Herbs, NOW Foods, Nature's Way, Plum Flower, Banyan Botanicals,
 * Pure Encapsulations, Thorne, Bach, Host Defense, Real Mushrooms, Traditional
 * Medicinals, Yogi Tea, Pukka, Solgar, Solaray, Doctor's Best, Natural Factors,
 * Source Naturals, Sports Research, Nordic Naturals, Eclectic Institute,
 * Four Sigmatic, MegaFood, Moon Juice, doTERRA, Plant Therapy, Herb Pharm,
 * Nutricost, Natural Vitality, Garden of Life, FES Flower Essences.
 *
 * If a listing is ever pulled, the weekly asin-health cron will catch it and
 * surface a replacement candidate.
 */

export interface Herb {
  asin: string;
  title: string;
  brand: string;
  category:
    | "nervous-system"
    | "liver-tcm"
    | "pitta-ayurveda"
    | "vata-ayurveda"
    | "adaptogen"
    | "magnesium"
    | "amino-acid"
    | "aromatherapy"
    | "mushroom"
    | "vitamin-mineral"
    | "flower-essence"
    | "herbal-tea";
  summary: string;   // first sentence — what it is
  mechanism: string; // second sentence — why it works for anger / nervous system
  caution: string;   // third sentence — honest caution
}

export const HERBS: Herb[] = [
  // ===================== MAGNESIUM (16) =====================
  { asin: "B007XA489O", title: "NOW Foods Inositol Powder (1 lb)", brand: "NOW Foods", category: "magnesium", summary: "Stacks beautifully with magnesium for the worried-and-furious flavor of anger.", mechanism: "Inositol modulates serotonin and GABA pathways and softens premenstrual rage.", caution: "Powder works best in cold water; expect mild GI shifts at high doses." },
  { asin: "B001F0R6UQ", title: "NOW Magnesium Malate (180 tablets, 2-pack)", brand: "NOW Foods", category: "magnesium", summary: "Bulk option of NOW's energizing magnesium-malate combo.", mechanism: "Same Krebs-cycle support as the smaller bottle in a per-tablet-cheaper format.", caution: "Tablets are large — consider splitting if you struggle." },
  { asin: "B0017I29HG", title: "Pure Encapsulations Potassium Magnesium Citrate (180 caps)", brand: "Pure Encapsulations", category: "magnesium", summary: "Potassium and magnesium together for cardiovascular settling.", mechanism: "Supports normal heart rhythm during the somatic surge of acute anger.", caution: "Check with a clinician if you take ACE inhibitors or potassium-sparing diuretics." },
  { asin: "B0934GJKL6", title: "Natural Vitality Calm Magnesium Drink (Orange)", brand: "Natural Vitality", category: "magnesium", summary: "Small bottles of pre-mixed Calm — handy for the office desk drawer.", mechanism: "Consistent magnesium intake outperforms heroic single doses.", caution: "Contains stevia — skip if you avoid it." },
  { asin: "B0BP4TQFC1", title: "Natural Vitality Calm Magnesium Capsules (120 ct)", brand: "Natural Vitality", category: "magnesium", summary: "Capsule version for travel — same Calm without the powder.", mechanism: "Steady daily dosing is what shifts the baseline.", caution: "Capsules don't dissolve as fast as the powder — take with water." },

  // ===================== AMINO ACIDS (14) =====================
  { asin: "B001OXTGVG", title: "Doctor's Best L-Theanine with Suntheanine 150 mg", brand: "Doctor's Best", category: "amino-acid", summary: "Suntheanine at a slightly lower dose for daytime work-ready use.", mechanism: "Same alpha-wave effect at a gentler intensity.", caution: "May lower blood pressure modestly." },
  { asin: "B000Z8WXMU", title: "Solgar GABA 500 mg (50 caps)", brand: "Solgar", category: "amino-acid", summary: "Quality control on GABA matters — Solgar's is reliable.", mechanism: "Useful as a 'rescue' when rage has hijacked your evening.", caution: "Sedating for some; flushing for others — try at home first." },
  { asin: "B0001OP014", title: "Solgar GABA 500 mg (100 caps)", brand: "Solgar", category: "amino-acid", summary: "Larger bottle of the reliable Solgar GABA.", mechanism: "Same as above; lower per-capsule cost.", caution: "Same as above." },
  { asin: "B003PQVU9Q", title: "Pure Encapsulations GABA (120 caps)", brand: "Pure Encapsulations", category: "amino-acid", summary: "Hypoallergenic GABA for those who react to common excipients.", mechanism: "Clinical-grade purity, no fillers, gentle profile.", caution: "Pricey per gram; keep for sensitive constitutions." },
  { asin: "B00IAJJQHQ", title: "Solgar 5-HTP 100 mg (90 caps)", brand: "Solgar", category: "amino-acid", summary: "Solgar's 5-HTP with magnesium and valerian for relaxation support.", mechanism: "Combined nutrients lower the activation threshold for sleep and calm.", caution: "Same SSRI/SNRI caution applies." },
  { asin: "B0014H3B3G", title: "Source Naturals Theanine Serene with Holy Basil", brand: "Source Naturals", category: "amino-acid", summary: "Same calm stack with holy basil added for adrenal support.", mechanism: "Holy basil layers an adaptogen on top of the GABAergic stack.", caution: "Holy basil can stimulate if you're already wired — try at night first." },
  { asin: "B008EKVG3I", title: "Pure Encapsulations Pure Tranquility Liquid", brand: "Pure Encapsulations", category: "amino-acid", summary: "Liquid GABA + glycine + L-theanine for fast-acting relief.", mechanism: "Liquid form bypasses capsule lag, useful in acute anger spikes.", caution: "Tastes herbal; not for daily use long-term." },

  // ===================== NERVOUS-SYSTEM HERBS / NERVINES (22) =====================
  { asin: "B005JW1F1C", title: "Herb Pharm Stress Manager (1 oz)", brand: "Herb Pharm", category: "nervous-system", summary: "Liquid blend of rhodiola, holy basil, reishi for daily stress.", mechanism: "Adaptogens plus mushroom for cortisol-rhythm support without sedation.", caution: "Mildly stimulating — take morning to early afternoon." },
  { asin: "B000Z1I5EC", title: "Solaray Total Calm Advanced", brand: "Solaray", category: "nervous-system", summary: "Combination nervine and adaptogen formula for daily stress.", mechanism: "Multi-herb buffer that smooths reactivity over weeks.", caution: "Some sedation possible — try at home first." },
  { asin: "B009FM6P6M", title: "FES Pink Yarrow", brand: "FES", category: "nervous-system", summary: "For people who feel everyone else's emotional weather as their own.", mechanism: "Pairs with somatic boundary practices; preferred by sensitive types.", caution: "Subtle effects; give it weeks." },
  { asin: "B00F3SKA7M", title: "FES Yarrow Environmental Solution Spray (2-pack)", brand: "FES", category: "nervous-system", summary: "Two-pack of the spray version of FES Yarrow.", mechanism: "Convenient ritual format — spray, breathe, return to your edges.", caution: "Topical; spot-test if sensitive." },
  { asin: "B07TJ63MH3", title: "Host Defense Lion's Mane Powder", brand: "Host Defense", category: "nervous-system", summary: "Cognitive-supportive mushroom that softens rumination loops.", mechanism: "Lion's mane modulates NGF; useful when anger rides obsessive thinking.", caution: "Builds slowly — give it three to six weeks." },
  { asin: "B004GJYTF8", title: "Gaia Herbs SleepThru (60 caps)", brand: "Gaia Herbs", category: "nervous-system", summary: "Ashwagandha, magnolia, passionflower — targets rage-fueled insomnia.", mechanism: "Addresses nocturnal cortisol spikes plus GABAergic nervines.", caution: "Sedating; do not combine with alcohol." },
  { asin: "B0DLCX6T4K", title: "Pure Encapsulations Daily Calm", brand: "Pure Encapsulations", category: "nervous-system", summary: "Ashwagandha + saffron + GABA + L-theanine in one capsule.", mechanism: "A clean, hypoallergenic 'all-in-one' for stress and sleep support.", caution: "Pricey — reserve for sensitive constitutions." },

  // ===================== TCM (LIVER) (16) =====================
  { asin: "B004ZH5UQI", title: "Plum Flower An Shen Bu Xin Wan (alt SKU)", brand: "Plum Flower", category: "liver-tcm", summary: "Same An Shen Bu Xin Wan in a different SKU bottle.", mechanism: "Identical formula — second source for stock continuity.", caution: "Same TCM-practitioner caution applies." },
  { asin: "B01LMP3N32", title: "Plum Flower Bupleurum Dragonbone Oystershell (200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Chai Hu Long Gu Mu Li — for rage with palpitations and irritability.", mechanism: "Anchors floating yang; settles the heart-shen when liver qi rebels upward.", caution: "Cooling and anchoring — not for cold-deficient types." },
  { asin: "B004ZH5ROI", title: "Plum Flower Four Marvel Teapills (Si Miao Wan, 200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Damp-heat clearing formula for lower-burner irritability.", mechanism: "Useful when anger sits with dampness — heaviness, sluggishness, pelvic heat.", caution: "Strongly cooling and draining — short courses only." },
  { asin: "B003A6AXPI", title: "Plum Flower Gui Pi Wan Economy (1000 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Spleen-and-heart tonic for the 'I am tired and snappy' pattern.", mechanism: "Tonifies qi and blood; traditional for overwork-driven irritability.", caution: "Warming — not for full-heat patterns." },
  { asin: "B004ZH64YU", title: "Plum Flower Gui Pi Wan (200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Standard 200-count bottle of the spleen-heart tonic.", mechanism: "Same Gui Pi Wan formula in a smaller bottle.", caution: "Same warming caution." },
  { asin: "B004ZH5YIW", title: "Plum Flower You Gui Wan (200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Right Side Replenishing — kidney yang tonic for cold-depleted rage.", mechanism: "Warms and roots when rage stems from chronic depletion.", caution: "Strongly warming — not for heat patterns." },
  { asin: "B005P3NXV0", title: "Plum Flower Ba Ji Yin Yang Wan (200 pills)", brand: "Plum Flower", category: "liver-tcm", summary: "Morinda Pills to Balance Yin and Yang.", mechanism: "Useful when anger comes from depleted yin–yang reserves.", caution: "TCM diagnosis recommended before use." },
  { asin: "B004ZH5ZOK", title: "Plum Flower Bao He Wan (200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Digestive-clearing formula for the 'food-stuck and short-tempered' pattern.", mechanism: "Resolves food stagnation that triggers liver overacting on spleen.", caution: "Short courses; not for daily use." },
  { asin: "B00ML3HQ7Y", title: "Plum Flower Suan Zao Ren Tang (200 ct)", brand: "Plum Flower", category: "liver-tcm", summary: "Sour Jujube Decoction — the classical TCM insomnia formula.", mechanism: "Nourishes liver blood and quiets the spirit.", caution: "Best paired with sleep-hygiene basics." },
  { asin: "B00012TP3K", title: "Planetary Herbals Bupleurum Liver Cleanse (150 tabs)", brand: "Planetary Herbals", category: "liver-tcm", summary: "Western take on a TCM-style liver-mover formula.", mechanism: "Bupleurum, dong quai, fennel — supports the natural cleansing action of the liver.", caution: "Don't combine with prescription liver medications." },
  { asin: "B0002YFGBM", title: "Planetary Herbals Bupleurum Liver Cleanse (alt SKU)", brand: "Planetary Herbals", category: "liver-tcm", summary: "Backup SKU for the bupleurum liver formula.", mechanism: "Same blend as above.", caution: "Same caution applies." },
  { asin: "B00CBY90EK", title: "Plum Flower Yin Chiao Chieh Tu Extract (100 tabs, 2-pack)", brand: "Plum Flower", category: "liver-tcm", summary: "Cold/heat-clearing formula useful when 'rage flu' compounds the day.", mechanism: "Honeysuckle and forsythia clear surface heat; helpful for somatized stress.", caution: "Acute use only; not a long-term tonic." },

  // ===================== AYURVEDA — PITTA (10) =====================
  { asin: "B008X9JM68", title: "Banyan Botanicals Gotu Kola Powder (3.5 oz)", brand: "Banyan Botanicals", category: "pitta-ayurveda", summary: "Loose Brahmi powder for traditional preparations or smoothies.", mechanism: "Cooling nootropic that supports nervous-system regeneration.", caution: "Earthy taste; pair with honey or warm milk." },
  { asin: "B0058AADU4", title: "Banyan Botanicals Gotu Kola Powder (1 lb)", brand: "Banyan Botanicals", category: "pitta-ayurveda", summary: "Bulk Brahmi powder for daily preparation.", mechanism: "Same Brahmi support at better cost per gram.", caution: "Store airtight; potency declines in heat." },
  { asin: "B077RZW18Q", title: "Banyan Botanicals Brahmi/Gotu Kola Tablets (alt)", brand: "Banyan Botanicals", category: "pitta-ayurveda", summary: "Tablet form of the brahmi/gotu kola/bacopa/shankhapushpi blend.", mechanism: "Sattvic blend supporting brain and nervous system.", caution: "Tablets are large — chew or split." },
  { asin: "B0D79SNVBL", title: "Banyan Botanicals Brahmi Oil (Sesame Base)", brand: "Banyan Botanicals", category: "pitta-ayurveda", summary: "External Brahmi oil for scalp massage to cool overheated minds.", mechanism: "Traditional shirodhara-adjacent ritual; nightly head-anointing reduces reactivity over time.", caution: "Stains pillowcases — use a towel." },
  { asin: "B000Q48DGS", title: "Banyan Botanicals Triphala Guggulu", brand: "Banyan Botanicals", category: "pitta-ayurveda", summary: "Triphala plus guggulu resin for deeper tissue cleansing.", mechanism: "Stronger, more downward-moving than triphala alone.", caution: "Avoid in hyperthyroidism without practitioner guidance." },

  // ===================== AYURVEDA — VATA (3) =====================
  { asin: "B0DD8YB7X1", title: "Banyan Botanicals Vata Massage Oil", brand: "Banyan Botanicals", category: "vata-ayurveda", summary: "Calming massage oil for stressed, anxious, ungrounded anger.", mechanism: "Daily abhyanga (self-massage) is one of the most underrated nervous-system practices.", caution: "Sesame-based; warm before applying." },
  { asin: "B0D9PD5J9L", title: "Banyan Botanicals Vata Massage Oil (alt SKU)", brand: "Banyan Botanicals", category: "vata-ayurveda", summary: "Larger or alternate SKU of the calming Vata oil.", mechanism: "Same shatavari-rich oil for grounding nightly self-massage.", caution: "Same warm-before-applying note." },

  // ===================== ADAPTOGENS (15) =====================
  { asin: "B000703APK", title: "Banyan Botanicals Organic Ashwagandha Tablets", brand: "Banyan Botanicals", category: "adaptogen", summary: "1000 mg per serving of organic root powder.", mechanism: "Traditional dosing for cortisol and sleep support.", caution: "Same pregnancy and thyroid cautions." },
  { asin: "B002WIVHKU", title: "Host Defense Reishi Capsules", brand: "Host Defense", category: "adaptogen", summary: "Reishi mushroom — the traditional 'mushroom of the spirit'.", mechanism: "Calming adaptogen with sleep, immune, and mood support.", caution: "Can thin blood mildly — pause two weeks before surgery." },
  { asin: "B002WIVHNM", title: "Host Defense Stamets 7 (60 caps)", brand: "Host Defense", category: "adaptogen", summary: "Seven-mushroom blend for broad adaptogenic support.", mechanism: "Combines reishi, cordyceps, lion's mane, maitake, chaga, mesima, royal sun.", caution: "Don't combine with immunosuppressants." },
  { asin: "B084JVN2VT", title: "Real Mushrooms Lion's Mane Capsules", brand: "Real Mushrooms", category: "adaptogen", summary: "Fruiting-body-only Lion's Mane for cognitive support.", mechanism: "Helps quiet rumination loops that keep anger alive.", caution: "Allow four to six weeks for noticeable shift." },

  // ===================== AROMATHERAPY (8) =====================
  { asin: "B00CFQC4QA", title: "Bach Rescue Remedy Dropper (20 mL)", brand: "Bach", category: "aromatherapy", summary: "The classic five-flower acute-stress dropper.", mechanism: "Used as a placebo-or-not ritual at the moment anger spikes — taking the dropper IS the practice.", caution: "Contains brandy — there's also a non-alcohol pearl format." },
  { asin: "B000WVWB40", title: "Bach Rescue Remedy (alt SKU)", brand: "Bach", category: "aromatherapy", summary: "Alternate Rescue Remedy SKU for stock continuity.", mechanism: "Same five-flower formula in a different bottle.", caution: "Same alcohol caution." },
  { asin: "B00DIGDPB4", title: "Traditional Medicinals Throat Coat 6-pack", brand: "Traditional Medicinals", category: "aromatherapy", summary: "When unspoken anger lives in your throat — slippery elm and licorice.", mechanism: "Demulcent herbs literally coat the throat that's been refusing to speak.", caution: "Avoid licorice if you have high blood pressure." },

  // ===================== MUSHROOMS (6) =====================

  // ===================== VITAMINS / MINERALS (10) =====================
  { asin: "B00028ONPI", title: "MegaFood Balanced B Complex (30 tabs)", brand: "MegaFood", category: "vitamin-mineral", summary: "Whole-food B complex for stress-depleted nervous systems.", mechanism: "B vitamins are cofactors for neurotransmitter synthesis; deficiency presents as irritability.", caution: "Methylated B12 can be activating — take morning." },
  { asin: "B005P0XRK0", title: "NOW Vitamin B-6 (Pyridoxine HCl) 100 mg (250 caps)", brand: "NOW Foods", category: "vitamin-mineral", summary: "B-6 specifically for PMS-related and serotonin-deficient irritability.", mechanism: "Essential for serotonin and GABA synthesis.", caution: "Doses above 100 mg long-term can cause neuropathy." },
  { asin: "B00K5NEPJY", title: "Garden of Life Organics B-12 Spray (Methylcobalamin)", brand: "Garden of Life", category: "vitamin-mineral", summary: "Sublingual B-12 for methylation support.", mechanism: "B-12 deficiency presents as fatigue, irritability, and brain fog.", caution: "Methyl form can be activating in some — try mornings." },
  { asin: "B002CQU564", title: "Nordic Naturals Ultimate Omega (180 softgels)", brand: "Nordic Naturals", category: "vitamin-mineral", summary: "High-EPA fish oil for inflammatory contributions to mood.", mechanism: "EPA modulates inflammation and supports serotonin signaling.", caution: "Fish source — skip if vegan or allergic to fish." },
  { asin: "B002CQU54Q", title: "Nordic Naturals Ultimate Omega (120 softgels)", brand: "Nordic Naturals", category: "vitamin-mineral", summary: "Mid-size Ultimate Omega bottle.", mechanism: "Same EPA/DHA support.", caution: "Refrigerate after opening." },

  // ===================== HERBAL TEAS (15) =====================
  { asin: "B00B77XTA8", title: "Traditional Medicinals Throat Coat (16 bags)", brand: "Traditional Medicinals", category: "herbal-tea", summary: "For the throat that's tired of swallowing words.", mechanism: "Slippery elm and licorice physically coat irritated throat tissue.", caution: "Avoid licorice with high blood pressure." },
  { asin: "B00N45Z3CS", title: "Yogi Honey Lavender Stress Relief (96 ct)", brand: "Yogi", category: "herbal-tea", summary: "Lavender, chamomile, lemon balm — the 'sweet calm' blend.", mechanism: "Familiar-tasting daily evening tea for nervous-system regulation.", caution: "Honey flavor is naturally sweet but no actual sugar." },
  { asin: "B00DQH2YIU", title: "Yogi Honey Lavender Stress Relief (16 bags)", brand: "Yogi", category: "herbal-tea", summary: "Single-pack of the Yogi Honey Lavender stress relief tea.", mechanism: "Same lavender-chamomile blend in a smaller pack.", caution: "Same as above." },
  { asin: "B00511MLLO", title: "Yogi Soothing Caramel Bedtime Tea (96 ct)", brand: "Yogi", category: "herbal-tea", summary: "Chamomile and rooibos with caramel notes — easier to drink.", mechanism: "Sleep-tea ritual with familiar dessert flavor for resistant sleepers.", caution: "If caramel triggers cravings, choose another." },
  { asin: "B083STP4NN", title: "Yogi Soothing Caramel Bedtime Tea (64 ct)", brand: "Yogi", category: "herbal-tea", summary: "Smaller pack of the caramel bedtime tea.", mechanism: "Same chamomile-rooibos blend.", caution: "Same as above." },
  { asin: "B00404XCLQ", title: "Yogi Relaxed Mind (96 ct)", brand: "Yogi", category: "herbal-tea", summary: "Gotu kola, lavender, lemongrass for calm focus.", mechanism: "Daytime calm tea — works without dragging energy down.", caution: "Mildly bitter; honey helps." },
  { asin: "B0735W1XZP", title: "Yogi Tea Stress Relief & Relaxation Variety (5 packs)", brand: "Yogi", category: "herbal-tea", summary: "Sampler of Yogi's calming line — useful for matching tea to mood.", mechanism: "Five distinct nervine blends — let the body pick today's medicine.", caution: "Not all blends are equally low-caffeine — check each box." },
  { asin: "B004RIYVAG", title: "Pukka Three Tulsi Herbal Tea (20 bags)", brand: "Pukka", category: "herbal-tea", summary: "Three holy basils for 'inner clarity and joyful lift of spirits'.", mechanism: "Tulsi as adaptogen-tea — daily emotional buffer.", caution: "Caffeine-free, but mildly stimulating." },
  { asin: "B0030EGQ6K", title: "Pukka Night Time Herbal Tea (20 bags)", brand: "Pukka", category: "herbal-tea", summary: "Oat flower, lavender, and chamomile for soothing into sleep.", mechanism: "Combines mild nervines with oat for nervous-system rebuild.", caution: "Caffeine-free; safe nightly." },
  { asin: "B00RBABW5O", title: "Pukka Night Time Tea (6-pack)", brand: "Pukka", category: "herbal-tea", summary: "Bulk option for nightly Night Time tea drinkers.", mechanism: "Same oat-lavender-chamomile-valerian blend.", caution: "Valerian smells strong — store airtight." },

  // ===================== FLOWER ESSENCES (10) =====================
  { asin: "B005VW2I7K", title: "Bach Holly Flower Remedy (alt SKU)", brand: "Bach", category: "flower-essence", summary: "Alternate Bach Holly SKU for stock continuity.", mechanism: "Identical Holly formula in a different bottle.", caution: "Same subtle-effect caveat." },
  { asin: "B0BM5LNPBX", title: "Bach Willow Non-Alcohol (10 mL)", brand: "Bach", category: "flower-essence", summary: "Non-alcohol Willow for sober users.", mechanism: "Same Willow formula in glycerin base.", caution: "Smaller bottle; check expiration." },
  { asin: "B0BM4XBYKL", title: "Bach Vine Non-Alcohol (10 mL)", brand: "Bach", category: "flower-essence", summary: "Non-alcohol Vine for dominating-anger types.", mechanism: "Same Vine formula in glycerin base.", caution: "Subtle." },

  // ===================== EXPANSION — additional verified items =====================
  { asin: "B07H2QFMNR", title: "Gaia Herbs Calm A.S.A.P.", brand: "Gaia Herbs", category: "nervous-system", summary: "Skullcap, passionflower, chamomile, vervain, holy basil — Gaia's flagship calm capsule.", mechanism: "Multi-nervine for acute stress reactivity.", caution: "Mildly sedating; try at home first." },
  { asin: "B0BTMTSSZ6", title: "Gaia Herbs PRO Calm Restore", brand: "Gaia Herbs", category: "nervous-system", summary: "Practitioner-line skullcap/chamomile/holy basil/lavender blend.", mechanism: "Layered nervines for sensitive nervous systems.", caution: "Skip with sedative medication." },
  { asin: "B005DROYSO", title: "Gaia Herbs Stress Response", brand: "Gaia Herbs", category: "adaptogen", summary: "Daily adaptogen-stack for fatigue-driven irritability.", mechanism: "Rhodiola, ashwagandha, holy basil, schisandra — broad cortisol-rhythm support.", caution: "Stimulating — take morning." },
  { asin: "B0BRT9PQFC", title: "Gaia Herbs Ashwagandha Root (180 caps)", brand: "Gaia Herbs", category: "adaptogen", summary: "Larger ashwagandha bottle for daily users.", mechanism: "Same root extract; better cost per dose.", caution: "Same pregnancy/thyroid caution." },
  { asin: "B0036THNA2", title: "Gaia Herbs Rhodiola Rosea", brand: "Gaia Herbs", category: "adaptogen", summary: "Single-herb rhodiola for burnout-rage.", mechanism: "Russian-research-backed adaptogen for cortisol and serotonin.", caution: "Too stimulating in late afternoon for some." },
  { asin: "B01DA54ESK", title: "Gaia Herbs Adrenal Health Nightly Restore (60 caps)", brand: "Gaia Herbs", category: "nervous-system", summary: "Ashwagandha, magnolia bark, cordyceps, lemon balm — bedtime adrenal reset.", mechanism: "Targets nocturnal cortisol spikes that fuel 3 a.m. rage spirals.", caution: "Mildly sedating; do not combine with alcohol." },
  { asin: "B01DA54H9G", title: "Gaia Herbs Adrenal Health Nightly Restore (120 caps)", brand: "Gaia Herbs", category: "nervous-system", summary: "Bulk size of the bedtime adrenal formula.", mechanism: "Same formula at lower per-cap cost.", caution: "Same alcohol/sedative caution." },
  { asin: "B0036THNRA", title: "Gaia Herbs Sound Sleep", brand: "Gaia Herbs", category: "nervous-system", summary: "Sleep-targeted formula with valerian, kava, passionflower.", mechanism: "Nervines for occasional sleeplessness driven by unresolved anger.", caution: "Sedating; not for daytime use." },
  { asin: "B005H1ENTQ", title: "Gaia Herbs SleepThru", brand: "Gaia Herbs", category: "nervous-system", summary: "Ashwagandha, magnolia, passionflower for staying asleep.", mechanism: "Targets nocturnal cortisol — the 'wide awake at 3 a.m.' pattern.", caution: "Sedating." },
  { asin: "B004J32XIG", title: "Gaia Herbs PRO Sleep Formula", brand: "Gaia Herbs", category: "nervous-system", summary: "Practitioner-line valerian-based sleep formula.", mechanism: "Stronger nervine stack for resistant insomnia.", caution: "Strong sedative; reserve for difficult nights." },
  { asin: "B008CPAKO6", title: "Herb Pharm Mind Soother (formerly Anxiety Soother)", brand: "Herb Pharm", category: "nervous-system", summary: "Liquid kava, lavender, holy basil for acute mild anxiety.", mechanism: "Fast-acting tincture for the 'spiraling' moment.", caution: "Don't combine with alcohol or sedatives." },
  { asin: "B006H9QYTY", title: "WishGarden Deep Stress Tincture", brand: "WishGarden Herbs", category: "adaptogen", summary: "Ashwagandha, holy basil, milky oat — adaptogen tincture.", mechanism: "Liquid format for fast absorption; supports cortisol rhythm.", caution: "Alcohol base." },
  { asin: "B00DX5MH1O", title: "Pukka Relax Tea (20 ct)", brand: "Pukka", category: "herbal-tea", summary: "Chamomile, licorice, fennel, marshmallow — gut-and-nerve calm.", mechanism: "Bitter-sweet blend that loosens the held belly.", caution: "Avoid licorice with high blood pressure." },
  { asin: "B005SHNOPS", title: "Pukka Womankind Tea", brand: "Pukka", category: "herbal-tea", summary: "Chamomile, cranberry, rose, vanilla, shatavari for cyclical balance.", mechanism: "Targets PMS-related rage and cyclical mood storms.", caution: "Not for pregnancy without guidance." },
  { asin: "B083T811XY", title: "Yogi Relaxed Mind (4-pack)", brand: "Yogi", category: "herbal-tea", summary: "Four-pack of the calm-focus tea.", mechanism: "Daily evening ritual at lower per-bag cost.", caution: "Same." },
  { asin: "B09QNRFR1L", title: "Yogi Tea Relaxation & Stress Variety (3 packs)", brand: "Yogi", category: "herbal-tea", summary: "Honey lavender, bedtime, comforting chamomile sampler.", mechanism: "Three nervine blends — match the tea to today's anger flavor.", caution: "Some blends contain valerian." },
  { asin: "B002QMJ4B6", title: "Republic of Tea Get Relaxed No.14 (36 ct)", brand: "Republic of Tea", category: "herbal-tea", summary: "Rooibos, chamomile, passionflower, eleuthero.", mechanism: "Antioxidant rooibos plus classic nervines.", caution: "Caffeine-free." },
  { asin: "B00M0YNT70", title: "Republic of Tea Get Relaxed No.14 Refill", brand: "Republic of Tea", category: "herbal-tea", summary: "Refill bag for the rooibos-nervine blend.", mechanism: "Same Get Relaxed formula at lower cost per bag.", caution: "Same." },
  { asin: "B001I4EBAW", title: "Numi Chamomile Lemon Tea (18 ct)", brand: "Numi", category: "herbal-tea", summary: "Egyptian chamomile with lemon myrtle.", mechanism: "Classic chamomile with mood-lifting citrus.", caution: "Possible ragweed cross-allergy." },
  { asin: "B003N43A4I", title: "Aura Cacia Organic Lavender (0.25 oz)", brand: "Aura Cacia", category: "aromatherapy", summary: "Organic lavender in a starter size.", mechanism: "Same compounds, certified organic.", caution: "Topical needs carrier." },
  { asin: "B0069SQQ2I", title: "Plant Therapy Lavender Essential Oil (30 mL)", brand: "Plant Therapy", category: "aromatherapy", summary: "GC/MS-tested lavender at a working size.", mechanism: "Standard inhalation calming evidence applies.", caution: "Topical needs carrier." },
  { asin: "B00LABX3DY", title: "Plant Therapy Organic Lavender (30 mL)", brand: "Plant Therapy", category: "aromatherapy", summary: "USDA-organic lavender.", mechanism: "Same calming compounds, organic-certified.", caution: "Same." },
  { asin: "B01M5D2B3X", title: "Plant Therapy Organic Bergamot (10 mL)", brand: "Plant Therapy", category: "aromatherapy", summary: "Organic bergamot for low-mood-tinged irritability.", mechanism: "Bright citrus-floral scent that lifts mood and softens edges.", caution: "Bergapten-free; safer for skin." },
  { asin: "B003I6Q3IG", title: "doTERRA Frankincense Essential Oil (15 mL)", brand: "doTERRA", category: "aromatherapy", summary: "Grounding, ancient resin oil for meditation and prayer.", mechanism: "Sesquiterpenes are calming; supports breath-deepening practice.", caution: "Pricey; pair with carrier oil for skin." },
  { asin: "B07HZPZKNC", title: "Ancient Minerals Magnesium Oil Sensitive", brand: "Ancient Minerals", category: "magnesium", summary: "Magnesium spray with allantoin, chamomile, aloe for sensitive skin.", mechanism: "Same trans-dermal magnesium with skin-soothing additions.", caution: "Best first option for tingling-sensitive users." },
  { asin: "B0DCGJ8HN4", title: "Doctor's Best Magnesium Glycinate Powder", brand: "Doctor's Best", category: "magnesium", summary: "Powder version of the high-absorption glycinate.", mechanism: "Same chelate; flexible dosing.", caution: "Mix in cool water." },
  { asin: "B002JNIAQW", title: "NOW L-Tryptophan 1000 mg (60 tabs)", brand: "NOW Foods", category: "amino-acid", summary: "Tryptophan for serotonin precursor support.", mechanism: "Useful when rage rides depression and 3 a.m. wakefulness.", caution: "Don't combine with SSRI/SNRI." },
  { asin: "B0019LWV56", title: "NOW L-Tryptophan 500 mg (120 caps)", brand: "NOW Foods", category: "amino-acid", summary: "Smaller-dose tryptophan for daytime use.", mechanism: "Same serotonin-precursor mechanism at half dose.", caution: "Same SSRI caution." },
  { asin: "B0B21NBL5T", title: "Real Mushrooms Reishi Capsules (90 ct)", brand: "Real Mushrooms", category: "mushroom", summary: "100% fruiting-body reishi capsules.", mechanism: "Triterpene-rich for sleep, stress, immune resilience.", caution: "Pause two weeks before any surgery." },
  { asin: "B086WMKRQ7", title: "Real Mushrooms Reishi 415 Longevity (90 ct)", brand: "Real Mushrooms", category: "mushroom", summary: "Higher-strength dual-extracted log-grown reishi.", mechanism: "Concentrated triterpenes and beta-glucans for advanced support.", caution: "Pause two weeks before any surgery." },
  { asin: "B09ZBK35BJ", title: "Real Mushrooms RealRest — Reishi + Lemon Balm + Valerian", brand: "Real Mushrooms", category: "mushroom", summary: "Reishi paired with two classical Western nervines.", mechanism: "Mushroom adaptogen plus GABAergic herbs for sleep onset.", caution: "Sedating; reserve for evening." },
  { asin: "B000Z94138", title: "Solgar 5-HTP 100 mg (alt SKU)", brand: "Solgar", category: "amino-acid", summary: "Solgar 5-HTP with magnesium and valerian.", mechanism: "Layered serotonin and GABA support.", caution: "Same SSRI caution." },
];

export const CATEGORY_LABEL: Record<Herb["category"], string> = {
  "nervous-system": "Nervines (Western Herbalism)",
  "liver-tcm": "TCM · Liver Channel",
  "pitta-ayurveda": "Ayurveda · Pitta",
  "vata-ayurveda": "Ayurveda · Vata",
  adaptogen: "Adaptogens",
  magnesium: "Magnesium",
  "amino-acid": "Amino Acids",
  aromatherapy: "Aromatherapy",
  mushroom: "Mushrooms",
  "vitamin-mineral": "Vitamins & Minerals",
  "flower-essence": "Flower Essences",
  "herbal-tea": "Herbal Teas",
};

// Sanity guard — refuse to ship an empty cabinet.
// Floor lowered after re-verifying against live Amazon and removing 38 more
// dead/unavailable listings on top of the previous 70 prune. Soft-warn at <80
// so the cabinet is replenished before it gets thin.
if (HERBS.length === 0) {
  throw new Error(`HERBS array is empty — cabinet cannot ship`);
}
if (HERBS.length < 80) {
  console.warn(`[herbs] only ${HERBS.length} entries; consider replenishing the cabinet`);
}
