
import { GeneratingLoader } from "@/components/ui/generating-loader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <GeneratingLoader>
        Loading Page...
      </GeneratingLoader>
    </div>
  );
}
