// Status steps differ based on payment method
export const getCODStatusSteps = () => ["placed", "confirmed", "shipped", "out_for_delivery", "delivered", "payment_collected"];
export const getCODStatusLabels = () => ({ 
  placed: "Order Placed", 
  confirmed: "Confirmed", 
  shipped: "Shipped", 
  out_for_delivery: "Out for Delivery", 
  delivered: "Delivered",
  payment_collected: "Payment Collected"
});

export const getOnlineStatusSteps = () => ["placed", "paid", "shipped", "out_for_delivery", "delivered"];
export const getOnlineStatusLabels = () => ({ 
  placed: "Order Placed", 
  paid: "Payment Confirmed", 
  shipped: "Shipped", 
  out_for_delivery: "Out for Delivery", 
  delivered: "Delivered"
});
