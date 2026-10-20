import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

/**
 * Normalizes LLM math output to ensure KaTeX renders correctly.
 * Handles: \( \) → $ $, \[ \] → $$ $$, double-escaped backslashes,
 * ensures block math is surrounded by blank lines.
 * Does NOT touch content inside fenced code blocks.
 */
export function normalizeMath(content) {
  if (!content || typeof content !== 'string') return '';

  // Match fenced code blocks and skip them
  const codeBlocks = [];
  let processed = content.replace(/```[\s\S]*?```|`[^`]*`/g, (m) => {
    codeBlocks.push(m);
    return `\x00CODEBLOCK${codeBlocks.length - 1}\x00`;
  });

  // Fix literal double backslashes safely with a replacer function (never use string replacement with $)
  processed = processed.replace(/\\\\([a-zA-Z{([\\])/g, (_, char) => '\\' + char);

  // Convert \( ... \) → $ ... $
  processed = processed.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, inner) => `$${inner.trim()}$`);

  // Convert \[ ... \] → $$ ... $$
  processed = processed.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, inner) => `\n\n$$\n${inner.trim()}\n$$\n\n`);

  // Restore code blocks
  processed = processed.replace(/\x00CODEBLOCK(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)]);

  return processed;
}

const MARKDOWN_COMPONENTS = {
  h1: ({ node, ...props }) => (
    <h1 className="text-base font-black text-gray-950 border-b border-gray-200 pb-2 mb-3 mt-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-sm font-extrabold text-indigo-900 mt-5 mb-2" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xs font-bold text-gray-900 mt-3 mb-1.5 uppercase tracking-wide" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="text-xs sm:text-sm leading-relaxed text-gray-800 my-1.5" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-5 space-y-1 text-gray-700 my-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal pl-5 space-y-1 text-gray-700 my-2" {...props} />
  ),
  li: ({ node, ...props }) => (
    <li className="text-xs sm:text-sm leading-relaxed" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong className="font-extrabold text-gray-950" {...props} />
  ),
  em: ({ node, ...props }) => (
    <em className="italic text-indigo-700" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-amber-400 bg-amber-50/60 pl-3 py-2 my-3 rounded-r text-xs font-medium text-amber-950" {...props} />
  ),
  code: ({ node, className, children, ...props }) => {
    // In react-markdown v10, block code is wrapped in <pre> by the pre component.
    // Inline code does NOT have a className starting with 'language-'.
    const isBlock = Boolean(className?.startsWith('language-'));
    return isBlock ? (
      <code className={`text-xs font-mono text-gray-900 ${className || ''}`} {...props}>
        {children}
      </code>
    ) : (
      <code className="bg-gray-100 text-indigo-800 px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ node, children, ...props }) => (
    <pre className="bg-[#F8F9FD] border border-gray-100 p-3 rounded-xl overflow-x-auto my-3" {...props}>
      {children}
    </pre>
  ),
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-left text-xs" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="bg-indigo-50/60 px-3 py-2 font-bold text-gray-900 border-r border-gray-200 last:border-r-0" {...props} />
  ),
  td: ({ node, ...props }) => (
    <td className="px-3 py-2 border-t border-gray-100 border-r last:border-r-0 text-gray-700" {...props} />
  ),
};

/**
 * MarkdownRenderer — renders markdown with full math support (KaTeX).
 * Use this everywhere AI-generated content is shown.
 *
 * Props:
 *   content: string — markdown string (may contain $ ... $ or $$ ... $$ math)
 *   className: string — optional extra wrapper class
 *   components: object — optional component overrides (merged with defaults)
 */
export default function MarkdownRenderer({ content, className = '', components = {} }) {
  const normalized = normalizeMath(content || '');

  return (
    <div className={`prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={{ ...MARKDOWN_COMPONENTS, ...components }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
