export const notebook = {
  item_id: "DEMO-NOTEBOOK",
  item_name: "Everyday Notebook",
  price: 18,
};
export const money = (value: number) => `£${value.toFixed(2)}`;
export const cartValue = (quantity: number) => quantity * notebook.price;
export function ecommerceItem(quantity: number) {
  return {
    currency: "GBP",
    value: cartValue(quantity),
    items: [{ ...notebook, quantity }],
  };
}
