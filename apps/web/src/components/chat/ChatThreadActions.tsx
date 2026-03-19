import {
  type EditorId,
  type ProjectScript,
  type ResolvedKeybindingsConfig,
  type ThreadId,
} from "@t3tools/contracts";
import { DiffIcon } from "lucide-react";

import { isVSCodeWebview } from "../../env";
import GitActionsControl from "../GitActionsControl";
import ProjectScriptsControl, { type NewProjectScriptInput } from "../ProjectScriptsControl";
import { Toggle } from "../ui/toggle";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { OpenInPicker } from "./OpenInPicker";

interface ChatThreadActionsProps {
  activeThreadId: ThreadId;
  activeProjectName: string | undefined;
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
  className?: string;
}

export function ChatThreadActions({
  activeThreadId,
  activeProjectName,
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
  className,
}: ChatThreadActionsProps) {
  return (
    <div
      className={`@container/header-actions flex min-w-0 items-center gap-2 @sm/header-actions:gap-3 ${className ?? ""} ${isVSCodeWebview ? "justify-center" : "justify-end"}`}
    >
      {activeProjectScripts && (
        <ProjectScriptsControl
          scripts={activeProjectScripts}
          keybindings={keybindings}
          preferredScriptId={preferredScriptId}
          onRunScript={onRunProjectScript}
          onAddScript={onAddProjectScript}
          onUpdateScript={onUpdateProjectScript}
          onDeleteScript={onDeleteProjectScript}
        />
      )}
      {activeProjectName && !isVSCodeWebview && (
        <OpenInPicker
          keybindings={keybindings}
          availableEditors={availableEditors}
          openInCwd={openInCwd}
        />
      )}
      {activeProjectName && <GitActionsControl gitCwd={gitCwd} activeThreadId={activeThreadId} />}
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              className="shrink-0"
              pressed={diffOpen}
              onPressedChange={onToggleDiff}
              aria-label="Toggle diff panel"
              variant="outline"
              size="xs"
              disabled={!isGitRepo}
            >
              <DiffIcon className="size-3" />
            </Toggle>
          }
        />
        <TooltipPopup side="bottom">
          {!isGitRepo
            ? "Diff panel is unavailable because this project is not a git repository."
            : diffToggleShortcutLabel
              ? `Toggle diff panel (${diffToggleShortcutLabel})`
              : "Toggle diff panel"}
        </TooltipPopup>
      </Tooltip>
    </div>
  );
}
