import { extractScope } from "@/lib/ai/scope/extract";

const SOW = `
STATEMENT OF WORK — NORTHSTAR FITNESS WEBSITE

1. Project Overview

The agency will design and develop a modern, responsive website for Northstar Fitness, a fitness studio.

2. Deliverables

The project includes a responsive website with approximately 6 primary pages:
- Homepage
- About
- Classes
- Trainers
- Pricing
- Contact

The website will include a header and footer across all pages.

3. Features

The homepage will include a hero section, studio introduction, featured classes, trainer highlights, testimonials, and a contact section.

The Classes page will display class listings, descriptions, schedules, and class details.

The Trainers page will contain individual trainer profiles.

The Contact page will include a contact form, email delivery, and an embedded Google Map.

The agency will configure SEO metadata and Google Analytics.

The website will be deployed to the client's hosting environment.

A CMS will allow the client to update class and trainer information.

4. Client Responsibilities

The client will provide the logo, brand colors, photography, trainer information, and written website content.

The client is responsible for providing hosting and domain access.

The client must provide timely feedback and approvals.

5. Revisions

The project includes 2 rounds of design revisions and 1 round of minor content corrections.

6. Exclusions

The following are not included:
- User accounts or login
- Online booking
- Payments or subscriptions
- E-commerce functionality
- Mobile applications
- Workout tracking
- Member dashboards
- CRM integration
- Marketing automation
- Newsletter management
- Social media management
- Copywriting
- Professional photography or video production
- Custom analytics dashboards
- Multilingual functionality

7. Timeline

The project will be completed within 5 weeks after project kickoff, provided that the client supplies all required content and assets and approves designs on time.

8. Assumptions

The project assumes approximately 6 primary pages.

The CMS structure must be approved before implementation.

No custom backend development is required beyond the CMS and contact form.

The client will provide final content before implementation.

Standard responsive behavior and standard third-party functionality are assumed.

The website will use the client's existing hosting environment.

9. Commercial Terms

The total project fee is $6,000.

Payment will be made in two equal installments: 50% at project commencement and 50% upon completion.
`;

async function main() {
  console.log("Running SOW extraction...");

  const result = await extractScope(SOW);

  console.log(
    JSON.stringify(result, null, 2),
  );
}

main().catch((error) => {
  console.error("Extraction failed:", error);
  process.exit(1);
});