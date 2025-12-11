import { forwardRef, ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';

interface TableDownloadWrapperProps {
  children: ReactNode;
}

export const TableDownloadWrapper = forwardRef<HTMLDivElement, TableDownloadWrapperProps>(
  ({ children }, ref) => {
    return (
      <div
        ref={ref}
        className="relative bg-white p-8"
        style={{ minWidth: '800px' }}
      >
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="0,0 100,0 0,100" fill="hsl(199 89% 85%)" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-20 h-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="100,0 100,100 30,0" fill="hsl(199 89% 75%)" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-32">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <polygon points="100,0 100,140 20,140" fill="hsl(199 89% 80%)" />
            <polygon points="50,80 100,140 100,100" fill="hsl(199 89% 70%)" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-16 h-20">
          <svg viewBox="0 0 100 120" className="w-full h-full">
            <polygon points="0,40 60,120 0,120" fill="hsl(199 89% 75%)" />
          </svg>
        </div>

        {/* Header with logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">StudyHub</span>
        </div>

        {/* Table content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

TableDownloadWrapper.displayName = 'TableDownloadWrapper';
