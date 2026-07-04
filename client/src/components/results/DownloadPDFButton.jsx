// client/src/components/results/DownloadPDFButton.jsx

import { useState } from 'react';
import { generateTeamPDF } from '../../utils/pdfGenerator';
import Button from '../common/Button';

const DownloadIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M12 3v13M8 13l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 20h14" strokeLinecap="round" />
  </svg>
);

const DownloadPDFButton = ({ team }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    setIsGenerating(true);
    // Deferred one tick so the loading spinner actually paints before
    // jsPDF's synchronous work blocks the main thread.
    setTimeout(() => {
      try {
        generateTeamPDF(team);
      } finally {
        setIsGenerating(false);
      }
    }, 0);
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleDownload}
      isLoading={isGenerating}
      className="shrink-0"
    >
      {!isGenerating && <DownloadIcon />}
      PDF
    </Button>
  );
};

export default DownloadPDFButton;