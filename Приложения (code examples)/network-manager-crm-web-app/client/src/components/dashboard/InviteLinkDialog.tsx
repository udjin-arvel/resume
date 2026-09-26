import { useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildWorkerInviteUrl, isWorkerInviteRequired } from "@/lib/worker-invite";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { showError, showSuccess } from "@/lib/toast";

type InviteLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteLinkDialog({ open, onOpenChange }: InviteLinkDialogProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => (open ? buildWorkerInviteUrl() : ""), [open]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await copyToClipboard(inviteUrl);
      setCopied(true);
      showSuccess("Ссылка скопирована");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Не удалось скопировать ссылку");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ссылка на приглашение</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Отправьте эту ссылку рабочему — по ней он сможет зарегистрироваться и заполнить
            анкету.
          </p>
          {!isWorkerInviteRequired() ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Секрет приглашения не настроен (VITE_WORKER_INVITE_SECRET). Ссылка будет работать
              только если на сервере тоже отключена проверка invite.
            </p>
          ) : null}
          <div className="flex gap-2">
            <Input readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={!inviteUrl}
              aria-label="Копировать ссылку"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
