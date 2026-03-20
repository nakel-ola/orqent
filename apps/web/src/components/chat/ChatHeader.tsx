import {
  type EditorId,
  type ProjectScript,
  type ResolvedKeybindingsConfig,
  type ThreadId,
} from "@t3tools/contracts";
import { memo } from "react";
import { Badge } from "../ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { type NewProjectScriptInput } from "../ProjectScriptsControl";
import { ChatThreadActions } from "./ChatThreadActions";

interface ChatHeaderProps {
  activeThreadId: ThreadId;
  activeThreadTitle: string;
  activeProjectName: string | undefined;
  showThreadSidebarTrigger: boolean;
  isGitRepo: boolean;
  openInCwd: string | null;
  activeProjectScripts: ProjectScript[] | undefined;
  preferredScriptId: string | null;
  keybindings: ResolvedKeybindingsConfig;
  availableEditors: ReadonlyArray<EditorId>;
  diffToggleShortcutLabel: string | null;
  gitCwd: string | null;
  diffOpen: boolean;
  onRunProjectScript: (script: ProjectScript) => void;
  onAddProjectScript: (input: NewProjectScriptInput) => Promise<void>;
  onUpdateProjectScript: (scriptId: string, input: NewProjectScriptInput) => Promise<void>;
  onDeleteProjectScript: (scriptId: string) => Promise<void>;
  onToggleDiff: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  activeThreadId,
  activeThreadTitle,
  activeProjectName,
  showThreadSidebarTrigger,
  isGitRepo,
  openInCwd,
  activeProjectScripts,
  preferredScriptId,
  keybindings,
  availableEditors,
  diffToggleShortcutLabel,
  gitCwd,
  diffOpen,
  onRunProjectScript,
  onAddProjectScript,
  onUpdateProjectScript,
  onDeleteProjectScript,
  onToggleDiff,
}: ChatHeaderProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden sm:gap-3">
        {showThreadSidebarTrigger && <SidebarTrigger className="size-7 shrink-0 md:hidden" />}
        <h2
          className="min-w-0 shrink truncate text-sm font-medium text-foreground"
          title={activeThreadTitle}
        >
          {activeThreadTitle}
        </h2>
        {activeProjectName && (
          <Badge variant="outline" className="min-w-0 shrink truncate">
            {activeProjectName}
          </Badge>
        )}
        {activeProjectName && !isGitRepo && (
          <Badge variant="outline" className="shrink-0 text-[10px] text-amber-700">
            No Git
          </Badge>
        )}
      </div>
      <ChatThreadActions
        activeThreadId={activeThreadId}
        activeProjectName={activeProjectName}
        isGitRepo={isGitRepo}
        openInCwd={openInCwd}
        activeProjectScripts={activeProjectScripts}
        preferredScriptId={preferredScriptId}
        keybindings={keybindings}
        availableEditors={availableEditors}
        diffToggleShortcutLabel={diffToggleShortcutLabel}
        gitCwd={gitCwd}
        diffOpen={diffOpen}
        onRunProjectScript={onRunProjectScript}
        onAddProjectScript={onAddProjectScript}
        onUpdateProjectScript={onUpdateProjectScript}
        onDeleteProjectScript={onDeleteProjectScript}
        onToggleDiff={onToggleDiff}
        className="flex-1"
      />
    </div>
  );
});
