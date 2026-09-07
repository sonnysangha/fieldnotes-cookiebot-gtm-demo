import App from "../App";
import Storefront from "../components/Storefront";
import { demoConfig } from "../config/demo";

export default function Page() {
  return (
    <App config={demoConfig}>
      <Storefront />
    </App>
  );
}
