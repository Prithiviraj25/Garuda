import { Offside } from "next/font/google"

export const PROJECT_NAME = "Garuda"

export const logoFont = Offside({
    subsets: ['latin'],
    weight: ['400'],
})

export const landingPageConfig = {
    title: "ThreatIntel Pro",
    description: "Advanced threat intelligence platform with real-time monitoring and AI-powered analysis.",
    features: [
        {
            title: "Real-time Threat Monitoring",
            description: "Continuous monitoring of threat feeds from OTX, MISP, AbuseIPDB, and security blogs.",
            icon: "Shield",
            highlighted: true
        },
        {
            title: "AI-Powered Analysis",
            description: "Intelligent IOC extraction and threat correlation using advanced algorithms.",
            icon: "Database"
        },
        {
            title: "Interactive Visualizations",
            description: "D3.js powered dashboards with threat maps, trends, and analytics.",
            icon: "Component"
        }
    ],
    footerLinks: [
        {
            title: "Product",
            links: [
                { title: "Features", href: "#" },
                { title: "Pricing", href: "#" },
                { title: "Blog", href: "/blog" },
            ]
        },
        {
            title: "Company",
            links: [
                { title: "About", href: "#" },
                { title: "Contact", href: "#" },
            ]
        },
        {
            title: "Legal",
            links: [
                { title: "Privacy Policy", href: "/privacy-policy" },
                { title: "Terms of Service", href: "/terms-of-service" },
            ]
        }
    ],
    socialLinks: {
        github: "https://github.com/Saas-Starter-Kit/drizzle-better-auth-starter",
        twitter: "#"
    }
}