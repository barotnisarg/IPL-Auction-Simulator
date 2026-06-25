// client/src/components/results/DownloadPDFButton.jsx

import { useState } from 'react';

import { generateTeamPDF } from '../../utils/pdfGenerator';
import Button from '../common/Button';

const DownloadPDFButton = ({ team }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = () => {
    setIsGenerating(true);

    // Deferred one tick so the button's own isLoading spinner actually
    // paints before the main thread picks up jsPDF's synchronous work —
    // see explanation.
    setTimeout(() => {
      try {
        generateTeamPDF(team);
      } finally {
        setIsGenerating(false);
      }
    }, 0);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} isLoading={isGenerating}>
      Download PDF
    </Button>
  );
};

export default DownloadPDFButton;