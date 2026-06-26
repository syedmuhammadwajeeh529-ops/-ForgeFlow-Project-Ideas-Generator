import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Trash2, BookMarked, Loader2, CheckCircle2, Clock, Bookmark, GitBranch, Pencil } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ProjectCardVersions from '@/components/projects/ProjectCardVersions';

const statusConfig = {
  saved: { label: 'Saved', icon: Bookmark, color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-700' },
};

export default function SavedProjects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // openVersionsId state removed - versions now shown inline via ProjectCardVersions

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['saved-projects'],
    queryFn: () => base44.entities.SavedProject.list('-updated_date', 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SavedProject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-projects'] });
      toast({ title: 'Project removed' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookMarked className="w-8 h-8 text-primary" />
            My Projects
          </h1>
          <p className="text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-24">
          <BookMarked className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No saved projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">Go explore ideas and save ones you like!</p>
          <Button onClick={() => navigate('/')} className="mt-4 bg-primary hover:bg-primary/90">
            Explore Ideas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => {
            const status = statusConfig[project.status] || statusConfig.saved;
            const StatusIcon = status.icon;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
                    {project.title}
                  </h3>
                  <Badge className={`text-xs shrink-0 gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {project.category && (
                    <Badge variant="outline" className="text-xs text-primary border-primary/30">
                      {project.category}
                    </Badge>
                  )}
                  {project.difficulty && (
                    <Badge variant="outline" className="text-xs">
                      {project.difficulty}
                    </Badge>
                  )}
                  {project.language && (
                    <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                      {project.language}
                    </span>
                  )}
                </div>

                {project.tech_stack?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.tech_stack.slice(0, 3).map(t => (
                      <span key={t} className="text-[11px] font-mono bg-muted/60 text-muted-foreground px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Middle: latest version features */}
                <ProjectCardVersions projectId={project.id} />

                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Button
                    size="sm"
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 h-8 text-xs"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Open Editor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                    onClick={() => navigate(`/versions/${project.id}`)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Versions
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteMutation.mutate(project.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}