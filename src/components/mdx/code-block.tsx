"use client";

import { useState } from "react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Check, Clipboard, Terminal } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiReact,
  SiGnubash,
  SiJson,
  SiPostgresql,
  SiHtml5,
  SiCss3,
} from "react-icons/si";
import React from "react";

interface CodeBlockProps {
  language: string;
  value: string;
}

const languageIcons: { [key: string]: React.ReactNode } = {
  javascript: <SiJavascript className="h-4 w-4" />,
  typescript: <SiTypescript className="h-4 w-4" />,
  python: <SiPython className="h-4 w-4" />,
  jsx: <SiReact className="h-4 w-4" />,
  bash: <SiGnubash className="h-4 w-4" />,
  json: <SiJson className="h-4 w-4" />,
  sql: <SiPostgresql className="h-4 w-4" />,
  html: <SiHtml5 className="h-4 w-4" />,
  css: <SiCss3 className="h-4 w-4" />,
};

const CodeBlock: FC<CodeBlockProps> = ({ language, value }) => {
  const [hasCopied, setHasCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  const LangIcon = languageIcons[language] || <Terminal className="h-4 w-4" />;

  return (
    <div className="group relative my-4 bg-zinc-950 rounded-xl border text-sm">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          {LangIcon}
          <span className="text-xs font-medium">{language}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onCopy}
        >
          {hasCopied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Clipboard className="h-4 w-4" />
          )}
          <span className="sr-only">Copy code</span>
        </Button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={language}
          style={coldarkDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            backgroundColor: "transparent",
            fontSize: "0.875rem",
            lineHeight: "1.25rem",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock; 