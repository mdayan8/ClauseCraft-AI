import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, CheckCircle, XCircle, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";

type Risk = {
  type: 'high' | 'medium' | 'low';
  clause: string;
  category: string;
  explanation: string;
  recommendation: string;
};

type Analysis = {
  summary: string;
  overall_risk: 'high' | 'medium' | 'low';
  risks: Risk[];
  recommendations: string[];
};

function RiskBadge({ type }: { type: Risk['type'] }) {
  const colors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const icons = {
    high: <XCircle className="h-4 w-4" />,
    medium: <AlertTriangle className="h-4 w-4" />,
    low: <CheckCircle className="h-4 w-4" />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colors[type]}`}>
      {icons[type]}
      {type.charAt(0).toUpperCase() + type.slice(1)} Risk
    </span>
  );
}

export function ContractAnalyzer() {
  const [contractText, setContractText] = useState("");
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/contracts/analyze", { content: text });
      return res.json() as Promise<Analysis>;
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Contract analysis has been generated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!contractText.trim()) {
      toast({
        title: "Error",
        description: "Please provide contract text to analyze",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Analyzing Contract",
      description: "Please wait while we analyze your contract...",
    });

    analysisMutation.mutate(contractText);
  };

  const handleFileUploaded = (text: string) => {
    setContractText(text);
    handleAnalyze();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contract Analysis</h2>
        <Button 
          onClick={handleAnalyze}
          disabled={analysisMutation.isPending || !contractText.trim()}
        >
          {analysisMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Analyze Contract
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <FileUploader 
            onTextExtracted={handleFileUploaded}
            isLoading={analysisMutation.isPending}
          />

          {contractText && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Contract Text</h3>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">
                    {contractText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {analysisMutation.data ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">Overall Analysis</h3>
                    <RiskBadge type={analysisMutation.data.overall_risk} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {analysisMutation.data.summary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Risk Analysis</h3>
                  <div className="space-y-4">
                    {analysisMutation.data.risks.map((risk, index) => (
                      <div key={index} className="p-4 bg-card rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <RiskBadge type={risk.type} />
                          <span className="text-xs text-muted-foreground capitalize">{risk.category}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <h4 className="font-semibold mb-1">Clause:</h4>
                            <p className="whitespace-pre-wrap">{risk.clause}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <h4 className="font-semibold mb-1">Risk Analysis:</h4>
                            <p>{risk.explanation}</p>
                          </div>
                          <div className="text-sm text-primary">
                            <h4 className="font-semibold mb-1">Suggestion:</h4>
                            <p>{risk.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">General Recommendations</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {analysisMutation.data.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4" />
              {contractText ? 'Click "Analyze Contract" to see the analysis' : 'Upload a contract to begin analysis'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}