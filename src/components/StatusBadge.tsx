type JobStatus = "red" | "yellow" | "green";

interface StatusBadgeProps {
  status: JobStatus;
  size?: "sm" | "lg";
}

const StatusBadge = ({ status, size = "sm" }: StatusBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "red":
        return {
          label: "Not Started",
          bgColor: "bg-status-red/10",
          textColor: "text-status-red",
          dotColor: "bg-status-red",
        };
      case "yellow":
        return {
          label: "In Progress",
          bgColor: "bg-status-yellow/10",
          textColor: "text-status-yellow",
          dotColor: "bg-status-yellow",
        };
      case "green":
        return {
          label: "Completed",
          bgColor: "bg-status-green/10",
          textColor: "text-status-green",
          dotColor: "bg-status-green",
        };
    }
  };

  const config = getStatusConfig();
  const padding = size === "lg" ? "px-4 py-2" : "px-3 py-1";
  const fontSize = size === "lg" ? "text-sm" : "text-xs";
  const dotSize = size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";

  return (
    <div
      className={`inline-flex items-center gap-2 ${padding} ${fontSize} font-medium rounded-full ${config.bgColor} ${config.textColor}`}
    >
      <div className={`${dotSize} rounded-full ${config.dotColor}`} />
      {config.label}
    </div>
  );
};

export default StatusBadge;
