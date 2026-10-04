import { Calculator, ScanText } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { SegTabs } from '@/components/common/SegTabs';
import { DealCalculator } from '@/pages/tools/DealCalculator';
import { OcrExcel } from '@/pages/tools/OcrExcel';

type Tool = 'calculator' | 'ocr';

export function ToolsPage() {
  const { tool } = useParams();
  const nav = useNavigate();
  if (tool !== 'calculator' && tool !== 'ocr') return <Navigate to='/tools/calculator' replace />;
  return (
    <>
      <SegTabs<Tool>
        ariaLabel='Инструменты'
        value={tool}
        onChange={(v) => nav(`/tools/${v}`)}
        items={[
          { value: 'calculator', label: 'Калькулятор сделки', icon: <Calculator size={16} /> },
          { value: 'ocr', label: 'OCR → Excel', icon: <ScanText size={16} /> },
        ]}
      />
      {tool === 'calculator' ? <DealCalculator /> : <OcrExcel />}
    </>
  );
}
