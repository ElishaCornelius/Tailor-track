import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface JobQRCodeProps {
  code: string;
  size?: number;
}

export const jobTrackUrl = (code: string) =>
  `${window.location.origin}/customer/track?code=${encodeURIComponent(code)}`;

const JobQRCode = ({ code, size = 180 }: JobQRCodeProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${code}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={wrapperRef} className="rounded-lg bg-white p-3">
        <QRCodeCanvas value={jobTrackUrl(code)} size={size} level="M" includeMargin={false} />
      </div>
      <p className="font-mono font-bold tracking-wide">{code}</p>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Scan this code to track the order, or enter the job code manually.
      </p>
      <Button type="button" variant="outline" size="sm" onClick={download}>
        <Download className="w-4 h-4 mr-2" />
        Download QR
      </Button>
    </div>
  );
};

export default JobQRCode;
