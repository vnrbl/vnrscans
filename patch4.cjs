const fs = require("fs");
let content = fs.readFileSync("src/routes/title.$slug.tsx", "utf8");

const oldCode = `function ExpandableSynopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;

  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {expanded || !isLong ? text : \`\${text.slice(0, 320).trim()}…\`}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1 font-medium text-violet-400 hover:text-violet-300 hover:underline"
        >
          [{expanded ? "view less" : "view more"}]
        </button>
      )}
    </p>
  );
}`;

const newCode = `function ExpandableSynopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;

  return (
    <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
      {expanded || !isLong ? text : \`\${text.slice(0, 320).trim()}…\`}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1 font-medium text-violet-400 hover:text-violet-300 hover:underline inline-block"
        >
          [{expanded ? "view less" : "view more"}]
        </button>
      )}
    </div>
  );
}`;

content = content.replace(oldCode, newCode);
fs.writeFileSync("src/routes/title.$slug.tsx", content, "utf8");
console.log("Patched ExpandableSynopsis");
