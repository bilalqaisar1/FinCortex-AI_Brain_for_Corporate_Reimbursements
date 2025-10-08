import Link from "next/link";
import { Mail, Phone, MapPin, Twitter, Linkedin, Github } from "lucide-react";

const Footer = () => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = href;
    }
  };

  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "How It Works", href: "#works" },
    ],
    Company: [
      { name: "About Us", href: "#about" },
      { name: "Contact Us", href: "#contact" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
    ],
  };

  return (
    <footer className="bg-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="text-2xl font-bold text-primary">FinCortex</span>
            </Link>
            
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              AI-powered reimbursement management for modern businesses.
            </p>

            {/* Social Links */}
            <div className="flex space-x-3">
              <a href="#" className="w-10 h-10 bg-card/20 border border-subtle rounded-full flex items-center justify-center hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 group">
                <Twitter className="w-5 h-5 text-muted group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-card/20 border border-subtle rounded-full flex items-center justify-center hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 group">
                <Linkedin className="w-5 h-5 text-muted group-hover:text-white" />
              </a>
              <a href="#" className="w-10 h-10 bg-card/20 border border-subtle rounded-full flex items-center justify-center hover:bg-purple-600 hover:border-purple-500 transition-all duration-300 group">
                <Github className="w-5 h-5 text-muted group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="text-muted hover:text-primary transition-colors text-sm cursor-pointer block"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-subtle mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <p className="text-muted text-sm">
              © 2024 FinCortex. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-muted">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
