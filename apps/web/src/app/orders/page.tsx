import { Suspense } from "react";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { OrdersView } from "./OrdersView";

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Заказы…" />}>
      <OrdersView />
    </Suspense>
  );
}
