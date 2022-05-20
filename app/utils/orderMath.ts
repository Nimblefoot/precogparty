import { PlaceOrderArgs } from "@/generated/syrup/instructions"
import { OrderFields } from "@/generated/syrup/types"
import { Resolution } from "config"

export type UIOrder = {
  odds: number
  collateralSize: number
  forResolution: Resolution
}

export const order2ui = (order: OrderFields): UIOrder => {}

export const ui2placeOrderFields = (uiOrder: UIOrder): OrderFields => {}
