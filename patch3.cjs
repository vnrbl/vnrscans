const fs = require("fs");
let content = fs.readFileSync("src/routes/_authenticated/admin/series.tsx", "utf8");

// Replace tag mapping for desktop
content = content.replace(
  /{visibleTags.map\(\(tag\) => {[\s\S]*?return \([\s\S]*?<button[\s\S]*?<\/button>\s*\);\s*}\)}/g,
  `{visibleTags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <div key={tag.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    updateWithAutoRating({
                      ...form,
                      tag_ids: toggleSelection(form.tag_ids, tag.id),
                    })
                  }
                  className={\`rounded-full border px-3 py-1 text-xs font-medium transition \${
                    selected
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-border/60 bg-secondary/40 hover:border-violet-500"
                  }\`}
                  style={
                    !selected && tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                  }
                >
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this tag from the database?')) {
                      deleteTag.mutate(tag.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 hidden h-4 w-4 rounded-full bg-red-500 text-white hover:bg-red-600 group-hover:flex items-center justify-center"
                  title="Delete Tag from Database"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}`
);

// Replace tag mapping for mobile
content = content.replace(
  /{visibleMobileTags.map\(\(tag\) => {[\s\S]*?return \([\s\S]*?<button[\s\S]*?<\/button>\s*\);\s*}\)}/g,
  `{visibleMobileTags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <div key={tag.id} className="group relative flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    updateWithAutoRating({
                      ...form,
                      tag_ids: toggleSelection(form.tag_ids, tag.id),
                    })
                  }
                  className={\`rounded-full border px-3 py-1 text-xs font-medium transition \${
                    selected
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-border/60 bg-secondary/40 hover:border-violet-500"
                  }\`}
                  style={
                    !selected && tag.color ? { borderColor: tag.color, color: tag.color } : undefined
                  }
                >
                  {tag.icon && <span className="mr-1">{tag.icon}</span>}
                  {tag.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this tag from the database?')) {
                      deleteTag.mutate(tag.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 hidden h-4 w-4 rounded-full bg-red-500 text-white hover:bg-red-600 group-hover:flex items-center justify-center"
                  title="Delete Tag from Database"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}`
);

fs.writeFileSync("src/routes/_authenticated/admin/series.tsx", content, "utf8");
console.log("Patched visible tags");
