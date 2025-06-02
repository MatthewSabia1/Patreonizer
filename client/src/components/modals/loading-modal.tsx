import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

interface LoadingModalProps {
  isOpen?: boolean;
  title?: string;
  description?: string;
  progress?: number;
  onClose?: () => void;
}

export function LoadingModal({ 
  isOpen = false, 
  title = "Syncing Patreon Data",
  description = "Please wait while we fetch your latest patron and revenue data...",
  progress = 0,
  onClose 
}: LoadingModalProps) {
  const [internalProgress, setInternalProgress] = useState(0);

  // Simulate progress if no real progress is provided
  useEffect(() => {
    if (isOpen && progress === 0) {
      const interval = setInterval(() => {
        setInternalProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setInternalProgress(progress);
    }
  }, [isOpen, progress]);

  const displayProgress = Math.min(progress || internalProgress, 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-md mx-auto border-border glass relative">
              <CardContent className="pt-6">
                {/* Close Button */}
                {onClose && (
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <Progress value={displayProgress} className="w-full" />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {displayProgress < 25 && "Connecting to Patreon..."}
                        {displayProgress >= 25 && displayProgress < 50 && "Fetching campaigns..."}
                        {displayProgress >= 50 && displayProgress < 75 && "Processing patron data..."}
                        {displayProgress >= 75 && displayProgress < 100 && "Finalizing sync..."}
                        {displayProgress === 100 && "Complete!"}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {Math.round(displayProgress)}%
                      </span>
                    </div>
                  </div>

                  {/* Additional info */}
                  <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      This may take a few minutes for accounts with large amounts of data.
                      You can close this dialog and the sync will continue in the background.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to manage loading modal state
export function useLoadingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);

  const showModal = (options?: {
    title?: string;
    description?: string;
    progress?: number;
  }) => {
    if (options?.title) setTitle(options.title);
    if (options?.description) setDescription(options.description);
    if (options?.progress !== undefined) setProgress(options.progress);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setProgress(0);
  };

  const updateProgress = (newProgress: number) => {
    setProgress(newProgress);
  };

  return {
    isOpen,
    title,
    description,
    progress,
    showModal,
    hideModal,
    updateProgress,
    LoadingModal: () => (
      <LoadingModal
        isOpen={isOpen}
        title={title}
        description={description}
        progress={progress}
        onClose={hideModal}
      />
    ),
  };
}
