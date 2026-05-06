import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/application-form", () => ({
  ApplicationForm: () => <div data-testid="application-form" />,
}));

import ApplyPage from "@/app/apply/page";

describe("ApplyPage", () => {
  it("includes a direct link to the concept page", () => {
    const html = renderToStaticMarkup(<ApplyPage />);

    expect(html).toContain('href="/apply/thank-you"');
  });
});
