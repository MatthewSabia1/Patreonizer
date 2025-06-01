import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface GoalProgressProps {
  title: string;
  currentValue: number;
  goalValue: number;
  unit: string;
  subtitle?: string;
  className?: string;
}

export function GoalProgress({ 
  title, 
  currentValue, 
  goalValue, 
  unit, 
  subtitle,
  className 
}: GoalProgressProps) {
  const [value, setValue] = useState(currentValue);
  
  const percentage = Math.min((value / goalValue) * 100, 100);
  
  const increment = () => {
    setValue(Math.min(value + 10, goalValue));
  };
  
  const decrement = () => {
    setValue(Math.max(value - 10, 0));
  };
  
  // Generate bar chart data for visual representation
  const generateBars = () => {
    const bars = [];
    const numBars = 15;
    const baseHeight = 20;
    
    for (let i = 0; i < numBars; i++) {
      const isActive = (i / numBars) * 100 < percentage;
      const height = baseHeight + Math.random() * 40;
      
      bars.push(
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${height}px` }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className={`
            w-4 rounded-sm transition-colors duration-300
            ${isActive 
              ? 'bg-primary' 
              : 'bg-muted'
            }
          `}
        />
      );
    }
    
    return bars;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View More
            </Button>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Goal Value Display */}
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold text-foreground">
              {value}
            </div>
            <div className="text-sm font-medium text-primary uppercase tracking-wide">
              {unit}
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={decrement}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={increment}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar Chart */}
          <div className="goal-progress p-4 rounded-lg">
            <div className="flex items-end justify-center space-x-1 h-16">
              {generateBars()}
            </div>
          </div>
          
          {/* Set Goal Button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setValue(goalValue)}
          >
            Set Goal
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}