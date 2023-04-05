import { useState } from "react";
import { useSelector } from "react-redux";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

import { selectCartTotal } from "../../store/cart/cart.selector";
import { selectCurrentUser } from "../../store/user/user.selector";
import * as t from "../button/button.types";
import { PaymentFormContainer, FormContainer, PaymentButton } from "./payment-form.styles";

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const amount = useSelector(selectCartTotal);
  const currentUser = useSelector(selectCurrentUser);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const paymentHandler = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return; // if no stripe or elements, go back

    setIsProcessingPayment(true); // set to true here because if returned above, this line never gets reached

    const response = await fetch('/.netlify/functions/create-payment-intent', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amount * 100 }), // amount must NOT be 0 or server throws error 400
    }).then((res) => {
      return res.json();
    });
    
    console.log(response);

    const clientSecret = response.paymentIntent.client_secret;

    const paymentResult = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: currentUser ? currentUser.displayName : 'Guest',
        },
      },
    });

    setIsProcessingPayment(false); // set back to false as payment is finished processing

    if (paymentResult.error) {
      alert(paymentResult.error);
    }

    else {
      if (paymentResult.paymentIntent.status === 'succeeded') {
        alert('Payment successful!');
      }
    }
  };
  
  return (
    <PaymentFormContainer>
      <FormContainer onSubmit={paymentHandler}>
        <h2>Credit Card Payment:</h2>
        <CardElement />
        <PaymentButton isLoading={isProcessingPayment} buttonType={t.INVERTED_BUTTON}>Pay now</PaymentButton>
      </FormContainer>
    </PaymentFormContainer>
  );
};

export default PaymentForm;
