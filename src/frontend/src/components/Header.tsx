import { Button } from "@/components/ui/button";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/", anchor: "" },
  { label: "ROI Calculator", href: "/#roi", anchor: "roi" },
  { label: "Careers", href: "/careers", anchor: "" },
  { label: "Services", href: "/#services", anchor: "services" },
  { label: "Why Us", href: "/#why-us", anchor: "why-us" },
  { label: "FAQ", href: "/#faq", anchor: "faq" },
  { label: "Contact", href: "/#contact", anchor: "contact" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const navigate = useNavigate();

  const isActive = (link: (typeof navLinks)[0]) => {
    if (link.href === "/" && !link.anchor) return pathname === "/";
    if (link.href === "/careers") return pathname === "/careers";
    return false;
  };

  const handleAnchorClick = (anchor: string) => {
    setMobileOpen(false);
    if (!anchor) return;
    if (pathname === "/") {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } else {
      // Navigate to home first, then scroll after page loads
      navigate({ to: "/" }).then(() => {
        setTimeout(() => {
          document
            .getElementById(anchor)
            ?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      });
    }
  };

  const NavLink = ({ link }: { link: (typeof navLinks)[0] }) => {
    const active = isActive(link);
    const cls = `px-3 py-1.5 text-sm font-medium rounded-md transition-colors relative ${
      active ? "text-accent" : "text-muted-foreground hover:text-foreground"
    }`;

    if (link.anchor) {
      return (
        <button
          type="button"
          onClick={() => handleAnchorClick(link.anchor)}
          className={cls}
          data-ocid={`header.${link.label.toLowerCase().replace(/ /g, "-")}.link`}
        >
          {link.label}
        </button>
      );
    }

    return (
      <Link
        to={link.href as "/" | "/careers" | "/admin"}
        className={cls}
        data-ocid={`header.${link.label.toLowerCase().replace(/ /g, "-")}.link`}
      >
        {link.label}
        {active && (
          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <img
            src="/assets/uploads/154-removebg-preview-019d343e-3b74-77fa-8c99-6fa4ec112249-1.png"
            alt="SysTrans Technologies"
            className="h-10 w-auto object-contain"
          />
          <span className="font-bold text-lg text-foreground">
            SysTrans <span className="text-accent">Technologies</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hidden lg:flex items-center gap-1"
          data-ocid="header.nav"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:block">
          <Button
            className="btn-gradient text-white font-semibold shadow-teal-glow-sm hover:shadow-teal-glow transition-all"
            onClick={() => handleAnchorClick("contact")}
            data-ocid="header.get_quote.button"
          >
            Get a Quote
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className="lg:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          data-ocid="header.mobile_menu.toggle"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-b border-border px-6 pb-4">
          {navLinks.map((link) =>
            link.anchor ? (
              <button
                type="button"
                key={link.href}
                onClick={() => handleAnchorClick(link.anchor)}
                className="block w-full text-left py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.href}
                to={link.href as "/" | "/careers" | "/admin"}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ),
          )}
          <Button
            className="btn-gradient text-white w-full mt-3"
            onClick={() => {
              handleAnchorClick("contact");
              setMobileOpen(false);
            }}
          >
            Get a Quote
          </Button>
        </div>
      )}
    </header>
  );
}
