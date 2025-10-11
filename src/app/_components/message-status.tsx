import { Check, CheckCheck } from "lucide-react";

interface MessageStatusProps {
  status: "sent" | "delivered" | "read";
  isOwn: boolean;
  readAt?: Date | null;
}

export function MessageStatus({ status, isOwn, readAt }: MessageStatusProps) {
  if (!isOwn) return null;

  const getStatusText = () => {
    switch (status) {
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return readAt 
          ? `Read ${new Date(readAt).toLocaleString()}`
          : "Read";
      default:
        return "";
    }
  };

  return (
    <span 
      className="inline-flex items-center ml-1 group relative"
      title={getStatusText()}
    >
      {status === "sent" && (
        <Check className="h-3 w-3 text-white/60" />
      )}
      {status === "delivered" && (
        <CheckCheck className="h-3 w-3 text-white/60" />
      )}
      {status === "read" && (
        <CheckCheck className="h-3 w-3 text-cyan-400" />
      )}
      
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black/90 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {getStatusText()}
      </span>
    </span>
  );
}
