import { useEffect, useState } from "react";
import {
  FormBottomSheet,
  FormBottomSheetCancel,
  FormBottomSheetPrimary,
} from "@/components/common/FormBottomSheet";
import { Input } from "@/components/ui/input";
import { useCreateClient } from "@/lib/api/hooks/useClients";
import { formInputClassName, formLabelClassName } from "@/lib/form-styles";
import { showError, showSuccess } from "@/lib/toast";

type CreateClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const [name, setName] = useState("");
  const createClient = useCreateClient();

  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      await createClient.mutateAsync({ name: name.trim() });
      showSuccess("Клиент создан");
      onOpenChange(false);
    } catch (e) {
      showError(e);
    }
  };

  return (
    <FormBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Новый клиент"
      description="Укажите название клиента."
      footer={
        <>
          <FormBottomSheetCancel
            onClick={() => onOpenChange(false)}
            disabled={createClient.isPending}
          />
          <FormBottomSheetPrimary
            onClick={() => void handleSubmit()}
            disabled={!name.trim() || createClient.isPending}
          >
            {createClient.isPending ? "Создание…" : "Создать"}
          </FormBottomSheetPrimary>
        </>
      }
    >
      <div className="space-y-1.5">
        <label htmlFor="client-name" className={formLabelClassName}>
          Название
        </label>
        <Input
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название компании"
          className={formInputClassName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>
    </FormBottomSheet>
  );
}
