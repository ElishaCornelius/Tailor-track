import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QrScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the job code found in the QR code */
  onResult: (code: string) => void;
}

/** Pull a job code out of either a raw code or a tracking URL */
const extractCode = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const fromQuery = url.searchParams.get("code");
    if (fromQuery) return fromQuery.trim().toUpperCase();
  } catch {
    /* not a URL */
  }
  return value.toUpperCase();
};

const QrScanDialog = ({ open, onOpenChange, onResult }: QrScanDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !videoRef.current) return;
    setError(null);

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        const code = extractCode(result.data);
        if (!code) return;
        scanner.stop();
        onResult(code);
        onOpenChange(false);
      },
      { highlightScanRegion: true, highlightCodeOutline: true, preferredCamera: "environment" },
    );
    scannerRef.current = scanner;

    scanner.start().catch(() => {
      setError(
        "We could not open your camera. Allow camera access in your browser settings, or type the job code instead.",
      );
    });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [open, onOpenChange, onResult]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Scan your QR code</DialogTitle>
          <DialogDescription>
            Point your camera at the QR code your tailor gave you.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg bg-muted aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
};

export default QrScanDialog;
