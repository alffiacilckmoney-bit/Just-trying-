export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { license_key } = req.body;

  if (!license_key) {
    return res.status(400).json({ success: false, message: 'Please enter your license key' });
  }

  const PAYHIP_PRODUCT_SECRET_KEY = "prod_sk_3P572_0146334527e427ec256891fa0235dd481beff1dc";

  try {
    // 1. التحقق من صحة المفتاح عبر Payhip API v2 (لاحظ الطريقة الصحيحة GET والهيدر المطلوب)
    const verifyRes = await fetch(`https://payhip.com/api/v2/license/verify?license_key=${encodeURIComponent(license_key)}`, {
      method: 'GET',
      headers: {
        'product-secret-key': PAYHIP_PRODUCT_SECRET_KEY,
        'Accept': 'application/json'
      }
    });

    const verifyData = await verifyRes.json();

    // إذا لم يرجع Payhip بيانات صالحة
    if (!verifyRes.ok || !verifyData || !verifyData.data) {
      return res.status(200).json({ 
        success: false, 
        message: 'Invalid license key' 
      });
    }

    const licenseInfo = verifyData.data;

    // التأكد من أن المفتاح مفعل (Enabled)
    if (licenseInfo.enabled === false) {
      return res.status(200).json({ 
        success: false, 
        message: 'This license key has been disabled or refunded.' 
      });
    }

    // 2. التحقق من حد الـ 3 أجهزة (عدد مرات الاستخدام uses)
    let currentUses = Number(licenseInfo.uses || 0);

    if (currentUses >= 3) {
      return res.status(200).json({ 
        success: false, 
        message: 'This license key has reached the maximum device limit (3 devices)' 
      });
    }

    // 3. إذا كان الجهاز جديداً ولم يسبق تسجيله بهذا المفتاح، نقوم بزيادة عداد الاستخدام في Payhip
    // (ملاحظة: يمكنك تخطي هذه الخطوة إذا كنت تريد تتبع الأجهزة محلياً، ولكن زيادتها تضمن العداد الرسمي)
    await fetch('https://payhip.com/api/v2/license/usage', {
      method: 'PUT',
      headers: {
        'product-secret-key': PAYHIP_PRODUCT_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `license_key=${encodeURIComponent(license_key)}`
    });

    return res.status(200).json({ success: true, uses: currentUses + 1 });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server verification error: ' + error.message 
    });
  }
}
