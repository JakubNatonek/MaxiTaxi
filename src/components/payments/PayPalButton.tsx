import { useEffect } from "react";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
  ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import "./PayPalButton.css";

interface PayPalButtonProps {
  amount: number;
  rideId: number;
  currency?: string;
  onSuccess?: (details: any) => void;
  onError?: (error: any) => void;
  sendEncryptedData: (
    endpoint: string,
    data: Record<string, unknown>,
    method?: string
  ) => Promise<any>;
}

const PayPalButtonInner: React.FC<PayPalButtonProps> = ({
  amount,
  rideId,
  currency = "PLN",
  onSuccess,
  onError,
  sendEncryptedData,
}) => {
  const [{ isPending, isResolved, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return <div>Ładowanie PayPala...</div>;
  }

  if (isRejected) {
    return <div>Błąd ładowania PayPala. Spróbuj ponownie później.</div>;
  }


    // useEffect(() => {
    //     sendPay(rideId, amount);
    // }, [amount]);

  const sendPay = async (rideId: number, amount: number) => {
    try {
      // Prepare payment data to match server expectations
      const paymentData = {
        przejazd_id: rideId,
        kwota: amount,
      };

      // Send encrypted data to payment endpoint
      const response = await sendEncryptedData("platnosci", paymentData);

      console.log("Payment recorded in database:", response);
      return response;
    } catch (error) {
      console.error("Error recording payment in database:", error);
      throw error;
    }
  };

  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) => {
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                value: amount.toString(),
                currency_code: currency,
              },
            },
          ],
        });
      }}
      onApprove={async (data, actions) => {
        if (actions.order) {
          const details = await actions.order.capture();
          await sendPay(rideId, amount);
          onSuccess?.(details);
        }
      }}
      onError={(err) => {
        onError?.(err);
      }}
    />
  );
};

const PayPalButton: React.FC<PayPalButtonProps> = (props) => {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "";

  const initialOptions: ReactPayPalScriptOptions = {
    clientId,
    currency: props.currency || "PLN",
    intent: "capture",
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtonInner {...props} />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
