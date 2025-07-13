import { Button } from "@/components/ui/button";
import { landingPageConfig } from "../../../config";
import { Component, Database, Shield } from "lucide-react";
import Link from "next/link";
import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Balancer from "react-wrap-balancer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const icons: { [key: string]: React.ComponentType<any> } = {
  Shield,
  Database,
  Component,
};

const CTASection = () => {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            <Balancer>Everything you need to build</Balancer>
          </h2>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl">
            <Balancer>
              A fully-featured, customizable, and open-source starter kit for
              your next project.
            </Balancer>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {landingPageConfig.features.map((feature, index) => {
            const Icon = icons[feature.icon];
            return (
              <Card
                key={index}
                className="flex flex-col bg-muted/20 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="p-3 bg-primary/10 rounded-md w-min mb-4 border border-primary/20">
                    {Icon && <Icon className="w-6 h-6 text-primary" />}
                  </div>
                  <CardTitle className="tracking-tight">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>
                    <Balancer>{feature.description}</Balancer>
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-center mt-16">
          <Button asChild size="lg">
            <Link href="/dashboard">Get Started for Free</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;