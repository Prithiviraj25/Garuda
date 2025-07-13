"use client";
import React from "react";
import { LoginButton } from "@/components/auth/login-button";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { landingPageConfig } from "../../../config";
import { UserButton } from "../auth/user-button";
import { User } from "better-auth/*";
import { BookIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Balancer from "react-wrap-balancer";

type Props = {
  user: User | null;
};

const LandingPageHero = ({ user }: Props) => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            <Balancer>{landingPageConfig.title}</Balancer>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            <Balancer>{landingPageConfig.description}</Balancer>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center">
            {user ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" })
                  )}
                  href="/threat-intelligence"
                >
                  Go to Dashboard
                </Link>
                <Button asChild variant="outline" size="lg">
                  <Link href="/blog">
                    <BookIcon className="mr-2 h-4 w-4" />
                    Read the Blog
                  </Link>
                </Button>
                <UserButton user={user} variant="large" />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                {/* CHANGE THIS BUTTON TO GO TO THREAT INTELLIGENCE */}
                <Button asChild size="lg" className="bg-white">
                  <Link href="/threat-intelligence">
                    Go to Threat Intelligence
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/blog">
                    <BookIcon className="mr-2 h-4 w-4" />
                    Read the Blog
                  </Link>
                </Button>
              </div>
            )}
          </div>
          <div className="relative mt-16">
            <div className="absolute inset-0 bottom-1/3 bg-primary/10 rounded-3xl blur-3xl" />
            <Image
              src="/demo.png"
              alt="Product Demo"
              width={1200}
              height={800}
              className="rounded-2xl border-2 border-primary/10 shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingPageHero;