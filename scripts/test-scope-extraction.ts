import { extractScope } from "@/lib/ai/scope/extract";

const SOW = `STATEMENT OF WORK — EXTRACTION QUALITY TEST

The agency will build a responsive website for the client. The website
will include a homepage, about page, classes page, trainers page,
pricing page, and contact page.

The website features will include a contact form, Google Maps,
Google Analytics, SEO metadata, and CMS editing for class and trainer
information.

The client will provide the logo, brand colors, photography, trainer
information, written content, hosting access, and timely feedback and
approvals.

The project excludes user accounts, online booking, payment processing,
e-commerce functionality, mobile applications, workout tracking,
member dashboards, CRM integration, and marketing automation.

The project includes two rounds of design revisions and one round of
minor content corrections.

The project will be completed within five weeks after kickoff, subject
to the client providing required content and assets and approving
designs on time.

The project assumes approximately six primary pages, approval of the
CMS structure before implementation, no custom backend beyond the CMS
and contact form, final content before implementation, and standard
third-party service behavior.
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