import "dotenv/config";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function seed() {
  console.log("Seeding dummy ads...");

  // Get parish IDs for targeting
  const parishes = await sql`SELECT id, name FROM parishes ORDER BY name`;
  const parishMap = Object.fromEntries(parishes.map((p) => [p.name, p.id]));

  const kingstonId = parishMap["Kingston"] || null;
  const stAndrewId = parishMap["St. Andrew"] || null;
  const stJamesId = parishMap["St. James"] || null;
  const stCatherineId = parishMap["St. Catherine"] || null;
  const manchesterId = parishMap["Manchester"] || null;

  const now = new Date();
  const oneMonthLater = new Date(now);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  const dummyAds = [
    // LOCAL ADS
    {
      title: "Island Hardware - Building Supplies",
      content: `<div style="background:linear-gradient(135deg,#1a5c2e,#2d8a4e);padding:20px;color:#fff;text-align:center;font-family:system-ui;border-radius:8px"><div style="font-size:22px;font-weight:700;margin-bottom:6px">Island Hardware Ltd.</div><div style="font-size:14px;opacity:.9;margin-bottom:10px">Jamaica's Trusted Building Supply Partner</div><div style="background:#fff;color:#1a5c2e;display:inline-block;padding:8px 20px;border-radius:6px;font-weight:700;font-size:13px">Shop Building Materials →</div><div style="font-size:11px;margin-top:8px;opacity:.7">Free delivery on orders over $50,000</div></div>`,
      ad_type: "local",
      target_url: "https://islandhardware.example.com",
      target_pages: ["blog", "estimate_results"],
      sponsor_parish_ids: kingstonId && stAndrewId ? [kingstonId, stAndrewId] : [],
      sponsor_name: "Island Hardware Ltd.",
      start_date: now,
      end_date: threeMonthsLater,
      is_active: true,
    },
    {
      title: "BuildRight Contractors - General Contractor",
      content: `<div style="background:#1a1a2e;padding:20px;color:#fff;text-align:center;font-family:system-ui;border-radius:8px"><div style="font-size:20px;font-weight:700;margin-bottom:4px">BuildRight Contractors</div><div style="color:#cfab45;font-size:13px;font-weight:600;margin-bottom:8px">Licensed & Insured General Contractors</div><div style="font-size:13px;opacity:.8;margin-bottom:10px">Residential & Commercial • 15+ Years Experience</div><div style="background:#cfab45;color:#1a1a2e;display:inline-block;padding:8px 18px;border-radius:6px;font-weight:700;font-size:13px">Get a Free Quote →</div></div>`,
      ad_type: "local",
      target_url: "https://buildright.example.com",
      target_pages: ["estimate_results"],
      sponsor_parish_ids: stCatherineId && kingstonId ? [stCatherineId, kingstonId] : [],
      sponsor_name: "BuildRight Contractors",
      start_date: now,
      end_date: threeMonthsLater,
      is_active: true,
    },
    {
      title: "PipeMaster Plumbing - 24/7 Service",
      content: `<div style="background:linear-gradient(135deg,#0e4d92,#1a73c7);padding:20px;color:#fff;text-align:center;font-family:system-ui;border-radius:8px"><div style="font-size:20px;font-weight:700;margin-bottom:4px">PipeMaster Plumbing</div><div style="font-size:13px;opacity:.9;margin-bottom:8px">24/7 Emergency Service • Licensed Plumbers</div><div style="font-size:15px;font-weight:700;margin-bottom:10px">📞 876-555-PIPE</div><div style="background:#fff;color:#0e4d92;display:inline-block;padding:8px 18px;border-radius:6px;font-weight:700;font-size:13px">Book a Plumber →</div></div>`,
      ad_type: "local",
      target_url: "https://pipemaster.example.com",
      target_pages: ["blog", "estimate_results"],
      sponsor_parish_ids: stJamesId ? [stJamesId] : [],
      sponsor_name: "PipeMaster Plumbing",
      start_date: now,
      end_date: oneMonthLater,
      is_active: true,
    },
    {
      title: "SparkPro Electrical - Certified Electricians",
      content: `<div style="background:linear-gradient(135deg,#c2850c,#e8a611);padding:20px;color:#fff;text-align:center;font-family:system-ui;border-radius:8px"><div style="font-size:20px;font-weight:700;margin-bottom:4px;text-shadow:0 1px 2px rgba(0,0,0,.3)">SparkPro Electrical</div><div style="font-size:13px;margin-bottom:8px;text-shadow:0 1px 2px rgba(0,0,0,.2)">Certified Electricians • Residential & Commercial</div><div style="font-size:12px;margin-bottom:10px;opacity:.9">Wiring • Panel Upgrades • Solar Installation</div><div style="background:#1a1a2e;color:#e8a611;display:inline-block;padding:8px 18px;border-radius:6px;font-weight:700;font-size:13px">Request Estimate →</div></div>`,
      ad_type: "local",
      target_url: "https://sparkpro.example.com",
      target_pages: ["estimate_results"],
      sponsor_parish_ids: manchesterId && stCatherineId && kingstonId ? [manchesterId, stCatherineId, kingstonId] : [],
      sponsor_name: "SparkPro Electrical",
      start_date: now,
      end_date: threeMonthsLater,
      is_active: true,
    },
    // GOOGLE / EXTERNAL ADS
    {
      title: "Google Ad Slot - Blog Sidebar",
      content: `<div style="background:#f8f9fa;border:1px solid #dadce0;padding:16px;text-align:center;font-family:system-ui;border-radius:8px;min-height:90px;display:flex;align-items:center;justify-content:center;flex-direction:column"><div style="font-size:11px;color:#70757a;margin-bottom:4px">Advertisement</div><div style="color:#5f6368;font-size:13px">Google Ad Unit</div><div style="font-size:10px;color:#70757a;margin-top:4px">Ads by Google</div></div>`,
      ad_type: "google",
      target_url: null,
      target_pages: ["blog"],
      sponsor_parish_ids: [],
      sponsor_name: null,
      start_date: now,
      end_date: null,
      is_active: true,
    },
    {
      title: "Google Ad Slot - Estimate Results",
      content: `<div style="background:#f8f9fa;border:1px solid #dadce0;padding:20px;text-align:center;font-family:system-ui;border-radius:8px;min-height:250px;display:flex;align-items:center;justify-content:center;flex-direction:column"><div style="font-size:11px;color:#70757a;margin-bottom:4px">Advertisement</div><div style="color:#5f6368;font-size:14px;font-weight:500">Google Display Ad</div><div style="font-size:10px;color:#70757a;margin-top:6px">Ads by Google</div></div>`,
      ad_type: "google",
      target_url: null,
      target_pages: ["estimate_results"],
      sponsor_parish_ids: [],
      sponsor_name: null,
      start_date: now,
      end_date: null,
      is_active: true,
    },
  ];

  for (const ad of dummyAds) {
    await sql`
      INSERT INTO ads (title, content, ad_type, target_url, target_pages, sponsor_parish_ids, sponsor_name, start_date, end_date, is_active)
      VALUES (${ad.title}, ${ad.content}, ${ad.ad_type}, ${ad.target_url}, ${ad.target_pages}, ${ad.sponsor_parish_ids}, ${ad.sponsor_name}, ${ad.start_date}, ${ad.end_date}, ${ad.is_active})
    `;
    console.log(`  Created: ${ad.title} (${ad.ad_type})`);
  }

  console.log(`\nSeeded ${dummyAds.length} dummy ads!`);
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
