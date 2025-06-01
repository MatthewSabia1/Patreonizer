import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CalendarWidgetProps {
  className?: string;
}

export function CalendarWidget({ className }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = 
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate();
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday,
      });
    }
    
    // Next month's days to fill the grid
    const remainingSlots = 42 - days.length;
    for (let day = 1; day <= remainingSlots; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    
    return days;
  };
  
  const days = getDaysInMonth(currentDate);
  
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className={className}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            {/* Day headers */}
            <div className="calendar-grid">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="calendar-day text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="calendar-grid">
              {days.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    calendar-day cursor-pointer hover:bg-muted/50
                    ${day.isToday ? 'calendar-day today' : ''}
                    ${!day.isCurrentMonth ? 'calendar-day other-month' : ''}
                  `}
                >
                  {day.date}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}