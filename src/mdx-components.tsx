import type { MDXComponents } from "mdx/types";
import CodeBlock from "./components/mdx/code-block";
import React, { isValidElement } from "react";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => (
      <h2
        className="mt-10 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="mt-8 text-2xl font-semibold tracking-tight"
        {...props}
      />
    ),
    p: (props) => (
      <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
    ),
    a: (props) => (
      <a
        className="font-medium text-primary underline underline-offset-4"
        {...props}
      />
    ),
    ul: (props) => (
      <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
    ),
    ol: (props) => (
      <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
    ),
    li: (props) => <li className="mt-2" {...props} />,
    blockquote: (props) => (
      <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
    ),
    pre: (props) => {
      const { children } = props;
      if (isValidElement(children) && children.props) {
        const { children: code, className } = children.props as {
          children: string;
          className?: string;
        };
        const language = className?.replace(/language-/, "") || "text";
        return <CodeBlock language={language} value={code.trim()} />;
      }
      return <pre {...props} />;
    },
    ...components,
  };
} 