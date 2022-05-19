const PRICE_DECIMALS: u64 = 9;
const BASE: u64 = 10;
const DECIMAL_MULTIPLIER: u64 = BASE.pow(PRICE_DECIMALS);


(order.size * order.price) / DECIMAL_MULTIPLIER
println!("")