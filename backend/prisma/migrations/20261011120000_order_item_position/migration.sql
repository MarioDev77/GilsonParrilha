-- Etapa 4: ordem estável dos itens e adicionais dentro do pedido.
ALTER TABLE "order_items" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "order_item_extras" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_position_chk" CHECK ("position" >= 0);
ALTER TABLE "order_item_extras" ADD CONSTRAINT "order_item_extras_position_chk" CHECK ("position" >= 0);
