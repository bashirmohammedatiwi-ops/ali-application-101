-- Keep only KILO, METER, PIECE, CARTON units
UPDATE "OrderItem" SET "unit" = 'PIECE' WHERE "unit" IN ('ROLL', 'BOX');
