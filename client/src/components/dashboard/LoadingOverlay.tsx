import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RotateCcw, X } from "lucide-react";

interface LoadingOverlayProps {
  isVisible: boolean;
  progress?: number;
  message?: string;
  details?: string;
  onClose?: () => void;
}

export function LoadingOverlay({ 
  isVisible, 
  progress = 0, 
  message = "Syncing Campaign Data",
  details = "Importing all your Patreon data for the first time. This may take a few minutes.",
  onClose
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <Card className="w-full max-w-md mx-4 bg-card border-border relative">
              <CardContent className="p-8">
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <RotateCcw className="h-8 w-8 text-primary" />
                  </motion.div>
                  
                  <h3 className="text-lg font-semibold mb-2">{message}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{details}</p>
                  
                  <div className="space-y-4">
                    <Progress value={progress} className="w-full" />
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Processing data...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-muted-foreground space-y-2"
                    >
                      <p>
                        Estimated time remaining: {Math.max(1, Math.ceil((100 - progress) / 20))} minutes
                      </p>
                      {onClose && (
                        <p className="bg-muted/50 p-2 rounded">
                          You can close this dialog and the sync will continue in the background.
                        </p>
                      )}
                    </motion.div>
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
