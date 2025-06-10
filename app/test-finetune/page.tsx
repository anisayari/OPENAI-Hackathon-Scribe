import SimpleFineTuning from '@/components/SimpleFineTuning';

export default function TestFineTune() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Fine-tuning Test Page
        </h1>
        <SimpleFineTuning />
      </div>
    </div>
  );
}