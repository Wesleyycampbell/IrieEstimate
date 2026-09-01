export function GET() {
  const content = `# IrieEstimate

> Free construction labour cost estimates for homeowners across Jamaica.

IrieEstimate helps Jamaicans plan home construction by providing transparent labour cost estimates. Users choose from four build tiers (Affordable, Standard, Premium, Luxury), customise finishes across 11 trade categories, and receive a detailed cost breakdown adjusted for their parish.

## Pages

- [Home](https://irieestimate.com/): Landing page with overview and sample estimate
- [Get Estimate](https://irieestimate.com/estimate): 6-step estimate flow — bedrooms, tier, finishes, contact, terms, results
- [Blog](https://irieestimate.com/blog): Construction tips, cost guides, and building advice for Jamaica
- [About](https://irieestimate.com/about): How estimates work, parish coverage, contractor network

## Key Features

- Labour cost estimates for all 14 Jamaica parishes
- 4 build tiers with customisable finishes (site work, block work, roofing, plumbing, electrical, wall finishes, flooring, doors/windows, kitchen/bathroom, painting, contingency)
- Parish-based cost multipliers reflecting local labour markets
- Shareable 24-hour estimate links
- PDF download of estimate breakdowns
- Verified contractor network for direct quotes
- Professional consultation booking for Quantity Surveyor site visits

## Coverage

Kingston, St. Andrew, St. Thomas, Portland, St. Mary, St. Ann, Trelawny, St. James, Hanover, Westmoreland, St. Elizabeth, Manchester, Clarendon, St. Catherine

## Contact

hello@irieestimate.com
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
