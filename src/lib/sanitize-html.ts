const ALLOWED_TAGS = new Set([
  "div", "span", "p", "br", "strong", "b", "em", "i", "u",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img",
  "table", "thead", "tbody", "tr", "th", "td",
  "blockquote", "pre", "code", "hr",
  "small", "sub", "sup",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "title"]),
  img: new Set(["src", "alt", "width", "height", "title"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  "*": new Set(["class", "style"]),
};

const DANGEROUS_STYLE_PATTERNS = /expression\s*\(|javascript\s*:|url\s*\(/i;

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("#")) {
    return true;
  }
  return false;
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s>][\s\S]*?<\/script\s*>/gi, "")
    .replace(/<iframe[\s>][\s\S]*?<\/iframe\s*>/gi, "")
    .replace(/<object[\s>][\s\S]*?<\/object\s*>/gi, "")
    .replace(/<embed[\s\S]*?\/?>/gi, "")
    .replace(/<form[\s>][\s\S]*?<\/form\s*>/gi, "")
    .replace(/<input[\s\S]*?\/?>/gi, "")
    .replace(/<textarea[\s>][\s\S]*?<\/textarea\s*>/gi, "")
    .replace(/<select[\s>][\s\S]*?<\/select\s*>/gi, "")
    .replace(/<button[\s>][\s\S]*?<\/button\s*>/gi, "")
    .replace(/<link[\s\S]*?\/?>/gi, "")
    .replace(/<meta[\s\S]*?\/?>/gi, "")
    .replace(/<base[\s\S]*?\/?>/gi, "")
    .replace(/<style[\s>][\s\S]*?<\/style\s*>/gi, "")
    .replace(/<svg[\s>][\s\S]*?<\/svg\s*>/gi, "")
    .replace(/<math[\s>][\s\S]*?<\/math\s*>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, "")
    .replace(/<(\w+)([^>]*)>/g, (match, tag: string, attrs: string) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";

      const cleanAttrs = attrs.replace(
        /\s+([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/g,
        (_m: string, name: string, dq: string, sq: string, uq: string) => {
          const attrName = name.toLowerCase();
          const value = dq ?? sq ?? uq ?? "";

          const tagAllowed = ALLOWED_ATTRS[lower];
          const globalAllowed = ALLOWED_ATTRS["*"];
          if (!tagAllowed?.has(attrName) && !globalAllowed?.has(attrName)) return "";

          if (attrName === "href" || attrName === "src") {
            if (!isSafeUrl(value)) return "";
          }
          if (attrName === "style" && DANGEROUS_STYLE_PATTERNS.test(value)) return "";

          return ` ${attrName}="${value.replace(/"/g, "&quot;")}"`;
        }
      );

      return `<${lower}${cleanAttrs}>`;
    })
    .replace(/<\/(\w+)\s*>/g, (_match, tag: string) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";
      return `</${lower}>`;
    });
}
