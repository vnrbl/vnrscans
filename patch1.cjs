const fs = require('fs'); let content = fs.readFileSync('src/routes/_authenticated/admin/series.tsx', 'utf8'); content = content.replace('  const del = useMutation({', \  const deleteTag = useMutation({
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

  const del = useMutation({\); fs.writeFileSync('src/routes/_authenticated/admin/series.tsx', content, 'utf8'); console.log('patched mutation');
