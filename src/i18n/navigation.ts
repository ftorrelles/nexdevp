import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation helpers — use these instead of next/navigation
// throughout the app to preserve locale context on all links.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
