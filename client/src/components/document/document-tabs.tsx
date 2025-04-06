import { Document, DocumentType, DOCUMENT_TYPE_ORDER } from "@shared/schema";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPE_INFO } from "@/lib/database";

interface DocumentTabsProps {
  documents: Document[];
  activeType: DocumentType;
  onSelect: (type: DocumentType) => void;
}

export default function DocumentTabs({ documents, activeType, onSelect }: DocumentTabsProps) {
  // Get document status
  const getDocumentStatus = (type: DocumentType) => {
    const doc = documents.find(d => d.type === type);
    return doc ? doc.status : "not-started";
  };

  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <nav className="flex -mb-px overflow-x-auto">
        {DOCUMENT_TYPE_ORDER.map((docType) => {
          const isActive = activeType === docType;
          const status = getDocumentStatus(docType);
          const displayName = DOCUMENT_TYPE_INFO[docType]?.name || docType.replace(/-/g, ' ');
          
          return (
            <button
              key={docType}
              onClick={() => onSelect(docType)}
              className={cn(
                "whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm",
                isActive
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {displayName}
              {status === "completed" && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
