const fs = require("fs");
let content = fs.readFileSync("src/routes/_authenticated/admin/series.tsx", "utf8");

// Add deleteTag mutation
if (!content.includes("const deleteTag = useMutation")) {
  content = content.replace("  const del = useMutation({", `  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tag deleted');
      qc.invalidateQueries({ queryKey: ['admin', 'tags'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({`);
}

// Add AI Suggest feature state and function
if (!content.includes("const [isSuggestingTags, setIsSuggestingTags] = useState(false)")) {
  content = content.replace("  const [tagSearch, setTagSearch] = useState(\"\");", `  const [tagSearch, setTagSearch] = useState("");
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);

  const suggestTags = async () => {
    if (!form.title) {
      toast.error('Please enter a title first');
      return;
    }
    setIsSuggestingTags(true);
    try {
      const res = await fetch('https://api.jikan.moe/v4/manga?q=' + encodeURIComponent(form.title) + '&limit=1');
      if (!res.ok) throw new Error('Failed to fetch suggestions');
      const json = await res.json();
      const manga = json.data?.[0];
      if (!manga) {
        toast.error('No AI suggestions found for this title');
        return;
      }
      
      const suggestedNames = [
        ...(manga.genres?.map((g: any) => g.name) || []),
        ...(manga.themes?.map((t: any) => t.name) || [])
      ];
      
      if (suggestedNames.length === 0) {
        toast.info('No relevant tags found');
        return;
      }
      
      const newTagStr = suggestedNames.join(', ');
      updateWithAutoRating({ 
        ...form, 
        new_tags: form.new_tags ? form.new_tags + ', ' + newTagStr : newTagStr 
      });
      toast.success('AI suggested tags added!');
    } catch (err: any) {
      toast.error(err.message || 'Error suggesting tags');
    } finally {
      setIsSuggestingTags(false);
    }
  };`);
}

// Render the tags with X
if (!content.includes("deleteTag.mutate(tag.id)")) {
  const oldTagsMap = `          {visibleTags.map((tag) => {
            const selected = form.tag_ids.includes(tag.id);
            return (
              <button
                key={tag.id}
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
            );
          })}`;
          
  const newTagsMap = `          {visibleTags.map((tag) => {
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
          })}`;
          
  content = content.replace(oldTagsMap, newTagsMap);
}

if (!content.includes("AI Suggest")) {
  const oldSearchInput = `        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search existing tags..."
            className="pl-9"
          />
        </div>`;
        
  const newSearchInput = `        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search existing tags..."
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={suggestTags} disabled={isSuggestingTags} title="AI Suggest tags based on title">
            <Sparkles className="h-4 w-4 text-violet-500" />
          </Button>
        </div>`;
        
  content = content.replace(oldSearchInput, newSearchInput);
}

fs.writeFileSync("src/routes/_authenticated/admin/series.tsx", content, "utf8");
console.log("Patch applied successfully.");
