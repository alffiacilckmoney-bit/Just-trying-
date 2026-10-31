// api/verify.js
import { createClient } from '@supabase/supabase-js';

// 1. مفاتيح الربط الخاصة بـ Supabase
const SUPABASE_URL = 'https://vyvbbafipmmekjomeooa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ghtz0f3Zp24yZ7b0NTlvFg_SDoOhQmA'; // المفتاح الخاص بك

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. إعدادات Payhip المستقبلية (جاهزة للتفعيل بوضع المفتاح هنا لاحقاً)
const PAYHIP_API_KEY = ''; // تضع هنا مفتاح Payhip API عندما تكون جاهزاً

// 3. قاعدة بيانات الأسئلة السريّة (محفوظة في السيرفر أوفلاين)
const QUESTIONS_DATABASE = {
  firstDew: [
    { id: "d1", mechanic: "NATURAL", text: "What’s the most dramatic change you’ve ever made to your appearance on impulse?" },
    { id: "d2", specialMechanic: "WHO SAID THAT", text: "What’s a secret ambition you had as a teenager that makes you cringe and laugh about it now?" },
    { id: "d3", mechanic: "NATURAL", text: "What’s an achievement or compliment you downplayed as 'no big deal' in public, but immediately ran home to celebrate or stare at in the mirror?" },
    { id: "d4", specialMechanic: "MOST LIKELY TO", text: "Who here seems like they’d have the most eclectic or unexpected playlist on their phone?" },
    { id: "d5", mechanic: "NATURAL", text: "What’s a skill you insisted was 'super easy' to do, and then humbled yourself instantly the moment you actually tried it?" },
    { id: "d6", mechanic: "NATURAL", text: "What’s one comfort food or drink that instantly makes any bad day better?" },
    { id: "d7", mechanic: "NATURAL", text: "What’s a simple pleasure in life that you think people don’t appreciate enough?" },
    { id: "d8", specialMechanic: "WHO SAID THAT", text: "What’s a passion or interest you have that usually surprises people when they find out?" },
    { id: "d9", mechanic: "NATURAL", text: "What’s something you swore you hated, ended up secretly loving, but kept pretending to hate just so your ego wouldn't have to admit defeat?" },
    { id: "d10", specialMechanic: "MOST LIKELY TO", text: "Who here is most likely to be trusted with picking everyone else's outfits for a whole day?" },
    { id: "d11", mechanic: "NATURAL", text: "What is a random talent or micro-skill you possess that will never look impressive on a resume, but you’re still oddly proud of?" },
    { id: "d12", specialMechanic: "WHO SAID THAT", text: "What’s an unwritten rule in your head that you judge people for breaking, even though you know you never told them the rule?" },
    { id: "d13", specialMechanic: "WHO SAID THAT", text: "What’s a little thing you’re surprisingly picky about?" },
    { id: "d14", specialMechanic: "PREDICT", text: "What assumption do you think people would make about this person based on their resting face or style — and get completely wrong?" },
    { id: "d15", mechanic: "NATURAL", text: "What is a completely harmless, childish thing you still do when nobody is around simply because it brings you joy?" },
    { id: "d16", mechanic: "NATURAL", text: "What’s an oddly specific scenario you run in your head while listening to music with headphones on?" },
    { id: "d17", mechanic: "NATURAL", text: "What’s a trend or aesthetic that everyone seems to love, but secretly gives you an immediate 'ick'?" },
    { id: "d18", mechanic: "NATURAL", text: "What’s the clearest sign that you’ve hit your social battery limit and are about to mentally check out?" },
    { id: "d19", specialMechanic: "PREDICT", text: "What do you think is this person’s absolute go-to excuse when they just want to cancel plans and stay home?" },
    { id: "d20", mechanic: "NATURAL", text: "In a social setting, what is a subtle sign that shows you’re having a genuinely good time, even if you’re being quiet?" }
  ],

  sunnyPaths: [
    { id: "s1", mechanic: "NATURAL", text: "What’s a small mistake you made that ended up leading to something unexpectedly good?" },
    { id: "s2", mechanic: "NATURAL", text: "What’s a time you pretended to be an expert on something you knew zero about, and then someone called your bluff in front of everyone?" },
    { id: "s3", mechanic: "NATURAL", text: "What’s the story behind a random scar, item, or photo you have that always makes you laugh when you tell it?" },
    { id: "s4", specialMechanic: "WHO SAID THAT", text: "What’s an unhinged phase or obsession you went through as a teenager that your friends should have roasted you much harder for?" },
    { id: "s5", mechanic: "NATURAL", text: "What’s a time you misjudged a situation or person at first, only to be proven wrong?" },
    { id: "s6", mechanic: "NATURAL", text: "What’s a time you completely misinterpreted a situation and showed up grossly overdressed, underdressed, or with totally the wrong vibe?" },
    { id: "s7", mechanic: "NATURAL", text: "What’s a time you tried to impress someone and failed in the most spectacular, unforgettable way?" },
    { id: "s8", mechanic: "NATURAL", text: "What’s a time you got in massive trouble at school for something that was entirely an accident or misunderstanding?" },
    { id: "s9", mechanic: "NATURAL", text: "What’s a family gathering or holiday that completely spiraled out of control because two relatives couldn't hold their tongue?" },
    { id: "s10", mechanic: "NATURAL", text: "What’s a terrible idea your group of friends agreed on that someone warned you about, but you did anyway with disastrous results?" },
    { id: "s11", mechanic: "NATURAL", text: "What’s a time you agreed to hang out or go somewhere purely out of politeness, and it actually turned out to be an amazing time?" },
    { id: "s12", mechanic: "NATURAL", text: "What is a dumb prank you played on a sibling or family member that went way too far and turned into an accidental crisis?" },
    { id: "s13", specialMechanic: "WHO SAID THAT", text: "What’s the dumbest physical challenge or dare you attempted completely alone that left you trapped, stuck, or mildly injured?" },
    { id: "s14", specialMechanic: "WHO SAID THAT", text: "What’s a risky text or message you sent and immediately regretted the second you hit send?" },
    { id: "s15", mechanic: "NATURAL", text: "What’s a time a friend stepped up for you without you having to ask, simply because they knew you were struggling?" },
    { id: "s16", mechanic: "NATURAL", text: "What’s a time you met someone’s friends or family and managed to make a completely chaotic first impression?" },
    { id: "s17", specialMechanic: "WHO SAID THAT", text: "What’s a time you tried to subtly sneak out of an awkward event or room, and made the loudest, most chaotic exit possible?" },
    { id: "s18", mechanic: "NATURAL", text: "What’s a time you covered for a sibling/friend or took the blame for them simply because you knew they couldn't handle the consequences?" },
    { id: "s19", mechanic: "NATURAL", text: "What’s a time you accidentally spoiled a surprise party, gift, or secret way before you were supposed to?" },
    { id: "s20", mechanic: "NATURAL", text: "What’s a time you dropped everything and showed up in the middle of the night just to comfort someone?" }
  ],

  gentleBreeze: [
    { id: "g1", mechanic: "NATURAL", text: "What’s a skill you admire in others that you wish came more naturally to you?" },
    { id: "g2", mechanic: "NATURAL", text: "What is a privilege or advantage you have in life that you constantly remind yourself never to take for granted?" },
    { id: "g3", mechanic: "NATURAL", text: "What’s a boundary or rule you set for yourself that significantly improved your peace of mind?" },
    { id: "g4", mechanic: "NATURAL", text: "What’s a social role you often find yourself falling into ( listener, peacemaker,...etc) even when you don't feel like it?" },
    { id: "g5", mechanic: "NATURAL", text: "When you look at who you are becoming, what is a trait you caught yourself inheriting from people around you that you are actively trying to prune away?" },
    { id: "g6", specialMechanic: "WHO SAID THAT", text: "What’s something you’re more sensitive to than people might expect?" },
    { id: "g7", mechanic: "NATURAL", text: "What is a boundary you hold that protects your peace, but cost you being labeled as 'difficult' or 'stubborn' by others?" },
    { id: "g8", mechanic: "NATURAL", text: "What is a tiny behavior that instantly earns your deepest respect?" },
    { id: "g9", mechanic: "NATURAL", text: "How do you usually handle growing apart from a close friend: do you address the distance directly, or let it fade quietly?" },
    { id: "g10", specialMechanic: "WHO SAID THAT", text: "What’s something people do with good intentions that actually makes you feel awkward or uncomfortable?" },
    { id: "g11", mechanic: "NATURAL", text: "If someone wanted to make you feel genuinely cared for after a long week, what tiny gesture would hit the hardest?" },
    { id: "g12", mechanic: "NATURAL", text: "Looking back at who you were a few years ago, what’s one mindset or habit you’re genuinely proud to have outgrown?" },
    { id: "g13", specialMechanic: "MOST LIKELY TO", text: "Who here seems like the best person to go to when you need to sort through confusing, messy feelings without being judged?" },
    { id: "g14", specialMechanic: "WHO SAID THAT", text: "What is something totally ordinary that people do in public that makes you quietly think, 'We cannot be friends'?" },
    { id: "g15", mechanic: "NATURAL", text: "What’s something you deeply value in a connection with someone, but rarely ask for out loud?" },
    { id: "g16", mechanic: "NATURAL", text: "What is a belief about love or loyalty that you formed from watching what not to do?" },
    { id: "g17", mechanic: "NATURAL", text: "What is a compliment someone gave you years ago about your character that quietly shaped how you see yourself today?" },
    { id: "g18", mechanic: "NATURAL", text: "What is a line you refused to cross to win an argument, because winning dirty felt worse than losing with integrity?" },
    { id: "g19", mechanic: "NATURAL", text: "If you could watch yourself through someone else’s eyes for one ordinary day, whose perspective would you choose?" },
    { id: "g20", mechanic: "NATURAL", text: "What is a painful criticism someone gave you that you hated hearing at the time, but now respect them forever for being honest enough to say?" }
  ],

  sproutingIdeas: [
    { id: "sp1", mechanic: "NATURAL", text: "If a strange library contained an infinite book with every decision you almost made and the parallel life that followed, which single crossroad would you be terrified, yet desperate to read about?" },
    { id: "sp2", mechanic: "NATURAL", text: "If you could give every person in the world one shared piece of understanding overnight, what would it be?" },
    { id: "sp3", mechanic: "NATURAL", text: "Who is a character from a book, movie, or story whose philosophy on life you quietly admire?" },
    { id: "sp4", specialMechanic: "PREDICT", text: "If this person’s conscience could sit beside them all day, what habit do you think it would constantly nag them about?" },
    { id: "sp5", specialMechanic: "PREDICT", text: "If you had to guess what takes up the biggest percentage of this person’s thoughts each day, what would you say?" },
    { id: "sp6", mechanic: "NATURAL", text: "What’s a concept or idea you’ve learned recently that totally shifted how you view daily interactions?" },
    { id: "sp7", specialMechanic: "PREDICT", text: "If this person were guaranteed absolute success at one completely wild or risky venture, what do you think they’d try tomorrow?" },
    { id: "sp8", specialMechanic: "WHO SAID THAT", text: "What’s something you became weirdly curious about once and ended up knowing far too much about?" },
    { id: "sp9", mechanic: "NATURAL", text: "If you could run one experiment on society just to see what would happen, what would you test?" },
    { id: "sp10", mechanic: "NATURAL", text: "What’s something about human behavior that you’ve always found a little strange or fascinating?" },
    { id: "sp11", mechanic: "NATURAL", text: "What is an illusion about adulthood that you watched everyone around you fall for, which you actively chose to opt out of?" },
    { id: "sp12", mechanic: "NATURAL", text: "What is a minor technological convenience we use every single day that you secretly suspect is quietly making human beings dumber or weaker?" },
    { id: "sp13", specialMechanic: "PREDICT", text: "What’s one topic or debate where you think they’d refuse to change their mind, no matter how good the counter-argument is?" },
    { id: "sp14", mechanic: "NATURAL", text: "What makes a conversation instantly interesting to you?" },
    { id: "sp15", mechanic: "NATURAL", text: "If you could spend one day seeing the honest, unfiltered reality of any industry or job, which one would you pick?" },
    { id: "sp16", mechanic: "NATURAL", text: "What’s a conspiracy theory or urban myth that you don't actually believe, but secretly wish was true because it's fun?" },
    { id: "sp17", mechanic: "NATURAL", text: "What’s a subtle sign you pick up on that immediately tells you someone is genuinely intelligent, beyond just having high grades or knowledge?" },
    { id: "sp18", specialMechanic: "MOST LIKELY TO", text: "Who here gives off the vibe that they have a secret, hyper-organized system on their laptop or phone?" },
    { id: "sp19", specialMechanic: "WHO SAID THAT", text: "What’s a debate or topic where you genuinely see both sides so clearly that you can never pick one?" },
    { id: "sp20", specialMechanic: "MOST LIKELY TO", text: "Who here seems like they have the most unconventional, outside-the-box perspective on everyday situations?" }
  ],

  fullBloom: [
    { id: "b1", mechanic: "NATURAL", text: "If you had to trade lives with someone in this room for a week, whose life would bring the most fun and surprises?" },
    { id: "b2", mechanic: "NATURAL", text: "What’s a time your gut feeling told you 'something is off here', and your crazy detective instinct turned out to be 100% spot on?" },
    { id: "b3", mechanic: "NATURAL", text: "What is a genuine compliment you secretly wanted to give someone in this circle tonight?" },
    { id: "b4", specialMechanic: "PREDICT", text: "If this person’s closest friends created a funny custom award for them, what do you think it would be for?" },
    { id: "b5", specialMechanic: "MOST LIKELY TO", text: "Who here do you think is most likely to make a bold, spontaneous decision on a random Tuesday?" },
    { id: "b6", mechanic: "NATURAL", text: "What’s the most ridiculous thing you could imagine becoming famous for?" },
    { id: "b7", specialMechanic: "PREDICT", text: "If someone wanted to bribe this person into doing them a favor, what non-monetary thing do you think would instantly seal the deal?" },
    { id: "b8", specialMechanic: "PREDICT", text: "If this person were forced to enter a reality TV competition, which specific show do you think they’d actually have a chance of winning?" },
    { id: "b9", specialMechanic: "PREDICT", text: "If this person’s personality came with a warning label, what do you think it would say?" },
    { id: "b10", mechanic: "NATURAL", text: "What is a small, quiet moment in your daily routine that you look forward to more than almost anything else?" },
    { id: "b11", mechanic: "NATURAL", text: "If you could add a subtle background sound effect to your life that plays whenever you walk into a room, what would it sound like?" },
    { id: "b12", mechanic: "NATURAL", text: "What’s a snack combination you love that you know for a fact everyone else would find completely unhinged?" },
    { id: "b13", mechanic: "NATURAL", text: "What is a physical place you visited once that felt weirdly like 'home' the second you stepped into it?" },
    { id: "b14", mechanic: "NATURAL", text: "What is a signature quirk or habit you picked up from a friend years ago that accidentally became part of your permanent personality?" },
    { id: "b15", specialMechanic: "MOST LIKELY TO", text: "Who here looks like they would accidentally become best friends with the villain in a movie just by listening to their side of the story?" },
    { id: "b16", mechanic: "NATURAL", text: "What’s something silly or childish that never fails to make you smile or laugh?" },
    { id: "b17", mechanic: "NATURAL", text: "What’s a completely unhinged rumor you could start about yourself that would somehow sound believable to people who know you?" },
    { id: "b18", mechanic: "NATURAL", text: "If you had a completely free Sunday with zero obligations and nowhere to be, what does your ideal schedule actually look like?" },
    { id: "b19", specialMechanic: "MOST LIKELY TO", text: "Who here looks like they could talk their way out of a speeding ticket with nothing but charm and chaotic energy?" },
    { id: "b20", specialMechanic: "MOST LIKELY TO", text: "Who here is most likely to disappear for a year and come back with a completely different life?" }
  ]
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'طلب غير مسموح' });
  }

  const { email, licenseKey } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'يرجى إدخال البريد الإلكتروني.' });
  }

  try {
    // 1. الفحص الأول: هل الإيميل مسجل ومفعل في Supabase؟ (الوصول المجاني الخاص بك)
    const { data: allowedUser } = await supabase
      .from('allowed_emails')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (allowedUser) {
      return res.status(200).json({
        success: true,
        message: 'تم التحقق بنجاح!',
        questions: QUESTIONS_DATABASE
      });
    }

    // 2. الفحص الثاني: جاهز لـ Payhip API في المستقل (إذا وضعنا المفتاح وأدخل العميل المفتاح)
    if (PAYHIP_API_KEY && licenseKey) {
      const payhipRes = await fetch(`https://payhip.com/api/v2/license/verify?license_key=${licenseKey}`, {
        headers: { 'payhip-api-key': PAYHIP_API_KEY }
      });
      const payhipData = await payhipRes.json();

      if (payhipData.success && payhipData.data.buyer_email.toLowerCase() === email.trim().toLowerCase()) {
        return res.status(200).json({
          success: true,
          message: 'تم التحقق من الشراء بنجاح عبر Payhip!',
          questions: QUESTIONS_DATABASE
        });
      }
    }

    // 3. إذا لم يمر من أي شرط، يرجع رابط الشراء الخاص بك
    return res.status(401).json({
      success: false,
      message: 'عذراً، هذا البريد غير مصرح له بالدخول.',
      buyUrl: 'https://payhip.com/b/r6sSo'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم.' });
  }
}
