interface LemonSqueezyCustomer {
  data: {
    id: string;
    type: "customers";
    attributes: {
      name: string;
      email: string;
      status: string;
      city: string | null;
      region: string | null;
      country: string | null;
      total_revenue_currency: number;
      mrr_currency: number;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
}

interface CreateCheckoutSessionResponse {
  data: {
    id: string;
    url: string;
  };
}

export const createCustomer = async (params: {
  name: string;
  email: string;
  metadata?: Record<string, string>;
}): Promise<LemonSqueezyCustomer> => {
  const { name, email, metadata } = params;

  const response = await fetch(`https://api.lemonsqueezy.com/v1/customers`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "customers",
        attributes: {
          name,
          email,
          metadata,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create LemonSqueezy customer");
  }

  const data = (await response.json()) as LemonSqueezyCustomer;
  return data;
};

export const getCustomer = async (customerId: string): Promise<LemonSqueezyCustomer> => {
  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/customers/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get LemonSqueezy customer");
  }

  const data = (await response.json()) as LemonSqueezyCustomer;
  return data;
};

export const createCheckoutSession = async (params: {
  variantId: string;
  customerEmail: string;
  customerId?: string;
}): Promise<CreateCheckoutSessionResponse> => {
  const { variantId, customerEmail, customerId } = params;

  const response = await fetch(`https://api.lemonsqueezy.com/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          test_mode: process.env.LEMONSQUEEZY_TEST_MODE === "true",
          checkout_data: {
            email: customerEmail,
            custom: {
              customer_id: customerId,
            },
            variant_quantities: [
              {
                variant_id: variantId,
                quantity: 1,
              },
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create LemonSqueezy checkout session");
  }

  const data = (await response.json()) as CreateCheckoutSessionResponse;
  return data;
};
