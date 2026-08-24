"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Scale,
  Mic,
  History,
  Bell,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Spatial Map", icon: MapPin },
  { href: "/triage", label: "Governance Triage", icon: Scale },
  { href: "/intake", label: "Citizen Intake", icon: Mic },
  { href: "/history", label: "Decision History", icon: History },
];

export default function AppNav() {
  const pathname = usePathname();
  const { state } = useStore();

  const pendingCount = state.recommendations.filter(
    (r) => r.status === "PENDING REVIEW" || r.status === "UNDER REVIEW"
  ).length;

  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...segments.map((seg, i) => ({
      label:
        seg === "dashboard"
          ? "Dashboard"
          : seg === "map"
            ? "Spatial Hotspot Map"
            : seg === "triage"
              ? "Governance Triage"
              : seg === "intake"
                ? "Citizen Intake"
                : seg === "history"
                  ? "Decision History"
                  : seg === "recommendations"
                    ? "Recommendations"
                    : seg === "proposals"
                      ? "Proposals"
                      : seg.length > 20
                        ? `${seg.slice(0, 8)}…`
                        : seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + segments.slice(0, i + 1).join("/"),
    })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white" role="banner">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo / Platform title */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-label="NEXUS — go to dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-900 shadow">
            <Shield className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold tracking-tight text-slate-900">
                NEXUS
              </p>
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-200">
                DPI Platform
              </span>
            </div>
            <p className="text-[11px] text-slate-500">AI Sovereign Infrastructure Planning</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <nav aria-label="Main navigation">
            <ul className="flex items-center gap-1" role="list">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden md:inline">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Pending Reviews Notification */}
          <Link
            href="/dashboard"
            aria-label={`Notifications — ${pendingCount} pending review`}
            className="relative ml-2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {pendingCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white shadow"
                aria-hidden="true"
              >
                {pendingCount}
              </span>
            )}
          </Link>

          {/* User badge */}
          <div className="ml-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
              S
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-[11px] font-semibold leading-none text-slate-900">
                Sarvesh
              </p>
              <p className="text-[9px] leading-none text-slate-500">
                Policymaker (Gauteng)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      {segments.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="border-t border-slate-100 bg-slate-50 px-4 py-1 sm:px-6"
        >
          <ol className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500" role="list">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-slate-300" aria-hidden="true" />
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-slate-900" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-slate-900"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </header>
  );
}
