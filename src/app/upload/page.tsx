
import Upload from "~/app/_components/upload";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">Upload Video</h1>
        <Upload />
      </div>
    </main>
  );
}
