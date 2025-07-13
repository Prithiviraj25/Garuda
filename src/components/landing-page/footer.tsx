import Logo from "@/components/global/logo";
import { landingPageConfig } from "../../../config";
import { Github, Twitter } from "lucide-react";
import Link from "next/link";
import React from "react";
import Balancer from "react-wrap-balancer";
import { Button } from "@/components/ui/button";

const LandingPageFooter = () => {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="flex flex-col gap-4 col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <span className="font-bold text-lg">{landingPageConfig.title}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              <Balancer>{landingPageConfig.description}</Balancer>
            </p>
          </div>
          {landingPageConfig.footerLinks.map((section) => (
            <div key={section.title} className="flex flex-col gap-4">
              <h4 className="font-bold text-sm tracking-tight">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.title}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {landingPageConfig.title}.
          </p>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild variant="ghost" size="icon">
                <Link href={landingPageConfig.socialLinks.github} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                </Link>
            </Button>
            <Button asChild variant="ghost" size="icon">
                <Link href={landingPageConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4" />
                </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingPageFooter;