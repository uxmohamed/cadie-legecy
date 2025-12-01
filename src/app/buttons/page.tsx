
import { CategoryButton } from '@/components/category-button';

export default function ButtonsPage() {
  return (
    <div className="min-h-screen bg-zinc-900 p-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Button Components</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column - Default Variant */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-zinc-400 mb-4">Container</h2>
            
            <div className="space-y-4">
              <CategoryButton label="Everything" color="white" />
              <CategoryButton label="Work" color="blue" />
              <CategoryButton label="Personal" color="pink" />
              <CategoryButton label="Health" color="green" />
              <CategoryButton label="Work" color="purple" />
              <CategoryButton label="All-Stars" color="purple" />
              <CategoryButton label="All-Stars" color="orange" />
            </div>
          </div>

          {/* Right Column - Compact Variant */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-zinc-400 mb-4">Container</h2>
            
            <div className="space-y-4">
              <CategoryButton label="Everything" color="white" variant="compact" />
              <CategoryButton label="Work" color="blue" variant="compact" />
              <CategoryButton label="Personal" color="pink" variant="compact" />
              <CategoryButton label="Health" color="green" variant="compact" />
              <CategoryButton label="Work" color="purple" variant="compact" />
              <CategoryButton label="All-Stars" color="purple" variant="compact" />
              <CategoryButton label="All-Stars" color="orange" variant="compact" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
