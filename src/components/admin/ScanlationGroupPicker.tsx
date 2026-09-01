import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCANLATION_GROUP_NEW,
  SCANLATION_GROUP_NONE,
} from "@/lib/chapter-utils";

type ScanlationGroupPickerProps = {
  groups: string[];
  selectValue: string;
  newGroupName: string;
  onSelectValueChange: (value: string) => void;
  onNewGroupNameChange: (value: string) => void;
  label?: string;
};

export function ScanlationGroupPicker({
  groups,
  selectValue,
  newGroupName,
  onSelectValueChange,
  onNewGroupNameChange,
  label = "Scanlation Group (Optional)",
}: ScanlationGroupPickerProps) {
  const showNewInput = selectValue === SCANLATION_GROUP_NEW;
  const hasExistingGroups = groups.length > 0;

  if (!hasExistingGroups) {
    return (
      <div>
        <Label>{label}</Label>
        <Input
          placeholder="Group/Team name"
          value={newGroupName}
          onChange={(e) => {
            onNewGroupNameChange(e.target.value);
            if (selectValue !== SCANLATION_GROUP_NEW) {
              onSelectValueChange(SCANLATION_GROUP_NEW);
            }
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Leave blank for no group. First group you add will appear in the list next time.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Label>{label}</Label>
      <Select value={selectValue} onValueChange={onSelectValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select or add new" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SCANLATION_GROUP_NONE}>No group</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group} value={group}>
              {group}
            </SelectItem>
          ))}
          <SelectItem value={SCANLATION_GROUP_NEW}>+ Add New Group</SelectItem>
        </SelectContent>
      </Select>
      {showNewInput && (
        <Input
          className="mt-2"
          placeholder="Enter new group name"
          value={newGroupName}
          onChange={(e) => onNewGroupNameChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
