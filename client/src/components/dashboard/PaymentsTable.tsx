import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";

interface Payment {
  id: string;
  status: "Success" | "Failed" | "Processing" | "Pending";
  email: string;
  amount: string;
}

interface PaymentsTableProps {
  className?: string;
}

export function PaymentsTable({ className }: PaymentsTableProps) {
  const payments: Payment[] = [
    { id: "1", status: "Success", email: "ken99@example.com", amount: "$316.00" },
    { id: "2", status: "Success", email: "abe45@example.com", amount: "$242.00" },
    { id: "3", status: "Processing", email: "monserrat44@example.com", amount: "$837.00" },
    { id: "4", status: "Failed", email: "carmella@example.com", amount: "$721.00" },
    { id: "5", status: "Pending", email: "jason78@example.com", amount: "$450.00" },
    { id: "6", status: "Success", email: "emma32@example.com", amount: "$1,239.00" },
  ];

  const getStatusVariant = (status: Payment["status"]) => {
    switch (status) {
      case "Success":
        return "default";
      case "Failed":
        return "destructive";
      case "Processing":
        return "secondary";
      case "Pending":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className={className}
    >
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Payments</CardTitle>
            <Button variant="outline" size="sm">
              Add Payment
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your payments.
          </p>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground border-b border-border pb-2">
              <div>Status</div>
              <div>Email</div>
              <div>Amount</div>
              <div></div>
            </div>
            
            {/* Table Rows */}
            {payments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="grid grid-cols-4 gap-4 items-center py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <Badge variant={getStatusVariant(payment.status)} className="text-xs">
                    {payment.status}
                  </Badge>
                </div>
                <div className="text-sm text-foreground">
                  {payment.email}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {payment.amount}
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}