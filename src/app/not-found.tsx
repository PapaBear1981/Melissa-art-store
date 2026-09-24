import { SiteChrome } from "@/components/layout/SiteChrome";
import { NotFoundContent } from "@/components/layout/NotFoundContent";

/** Unknown URLs outside the (site) group still get the full site layout. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
